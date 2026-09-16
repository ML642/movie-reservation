import React, { useState, useEffect, useRef, useCallback } from "react";
import './Login.css';
import  { Link, useNavigate , useLocation  } from "react-router-dom";
import MorphingSpinner from "../../components/spinner/spinner";
import { API_BASE_URL, refreshAccessToken } from "../../config/api";
import AuthNotice from "../../components/notification/AuthNotice";
import OAuthButtons from '../../components/auth/OAuthButtons';

const canRunVanta = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const lowPowerDevice =
    connection?.saveData ||
    (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) ||
    (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4);

  return (
    !reducedMotion &&
    !lowPowerDevice &&
    window.innerWidth > 1024 &&
    (typeof document === 'undefined' || document.visibilityState === 'visible')
  );
};

const useVantaEnabled = () => {
  const [enabled, setEnabled] = useState(canRunVanta);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const updateEnabledState = () => setEnabled(canRunVanta());

    window.addEventListener('resize', updateEnabledState, { passive: true });
    document.addEventListener('visibilitychange', updateEnabledState);
    motionQuery?.addEventListener?.('change', updateEnabledState);

    return () => {
      window.removeEventListener('resize', updateEnabledState);
      document.removeEventListener('visibilitychange', updateEnabledState);
      motionQuery?.removeEventListener?.('change', updateEnabledState);
    };
  }, []);

  return enabled;
};

const POST_LOGIN_RETURN_TO_KEY = 'postLoginReturnTo';

const isInternalPath = (value) => typeof value === 'string'
  && value.startsWith('/')
  && !value.startsWith('//');

const Login = () => {
  const vantaRef = useRef(null);
  const vantaEffectRef = useRef(null);
   const navigate = useNavigate();
  const [isLoading , setIsLoading] =  useState(false)
  const vantaEnabled = useVantaEnabled();
  

    const Location =  useLocation() ;
    const returnTo = Location.state?.returnTo;
    useEffect(() => {
        window.scrollTo({top:0, left:0, behavior: "auto"});
    }, [Location.key] );

  useEffect(() => {
    if (!vantaEnabled || !vantaRef.current) return undefined;

    let disposed = false;
    let effect;

    const createVantaEffect = async () => {
      try {
        const [wavesModule, threeModule] = await Promise.all([
          import('vanta/dist/vanta.waves.min'),
          import('three'),
        ]);

        if (disposed || !vantaRef.current) return;

        const WAVES = wavesModule.default ?? wavesModule;
        effect = WAVES({
          el: vantaRef.current,
          THREE: threeModule,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 0.85,
          scaleMobile: 0.85,
          color: 0x1a1a2e,
          shininess: 6,
          waveHeight: 10,
          waveSpeed: 0.25,
          zoom: 1,
        });
        vantaEffectRef.current = effect;
      } catch {
        // Keep the lightweight CSS fallback if WebGL or the chunk is unavailable.
      }
    };

    createVantaEffect();

    return () => {
      disposed = true;
      if (effect) {
        effect.destroy();
      }
      if (vantaEffectRef.current === effect) {
        vantaEffectRef.current = null;
      }
    };
  }, [vantaEnabled]);

    const [form, setForm] = useState({ email: "user@gmail.com", password: "user" });
    const [notice, setNotice] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);

    const getPostLoginDestination = useCallback(() => {
      const locationDestination = returnTo;
      const storedDestination = window.sessionStorage.getItem(POST_LOGIN_RETURN_TO_KEY);
      const destination = isInternalPath(locationDestination)
        ? locationDestination
        : (isInternalPath(storedDestination) ? storedDestination : '/');
      window.sessionStorage.removeItem(POST_LOGIN_RETURN_TO_KEY);
      return destination;
    }, [returnTo]);

    useEffect(() => {
      if (Location.state?.notice) {
        setNotice(Location.state.notice);
        navigate(Location.pathname, { replace: true, state: {} });
      }
    }, [Location.pathname, Location.state, navigate]);

    useEffect(() => {
      const oauthStatus = new URLSearchParams(Location.search).get('oauth');
      if (!oauthStatus) return;

      const finishOAuth = async () => {
        if (oauthStatus !== 'success') {
          const reason = new URLSearchParams(Location.search).get('reason');
          setNotice({ type: 'error', title: 'OAuth sign in failed', message: reason || 'Please try again.' });
          navigate('/login', { replace: true });
          return;
        }
        setIsLoading(true);
        try {
          // Header also restores authentication on mount. Reuse the shared
          // promise so the one-time refresh token is never rotated twice.
          if (!(await refreshAccessToken())) {
            throw new Error('Could not finish OAuth sign in.');
          }
          navigate(getPostLoginDestination(), { replace: true });
        } catch (error) {
          setNotice({ type: 'error', title: 'OAuth sign in failed', message: error.message || 'Please try again.' });
          navigate('/login', { replace: true });
        } finally { setIsLoading(false); }
      };
      finishOAuth();
    }, [Location.search, navigate, getPostLoginDestination]);

    useEffect(() => {
        const remembered = localStorage.getItem("rememberedEmail");
        if (remembered) {
            setForm(f => ({ ...f, email: remembered }));
            setRememberMe(true);
        }
    }, []);
    
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setNotice(null);
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setNotice(null);
        if (!form.email || !form.password) {
            const message = "Please fill in all fields.";
            setNotice({ type: "error", title: "Missing details", message });
            return;
        }

        setIsLoading(true);
        if (rememberMe) {
            localStorage.setItem("rememberedEmail", form.email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }

        try {
          const result  =  await fetch (`${API_BASE_URL}/api/login`,{
            method : "POST" , 
            headers : { "Content-type":"application/json"},
            credentials: 'include',
            body: JSON.stringify({
              email: form.email,
              password: form.password
            })
          })
          const data = await result.json();
          if (result.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('userEmail', data.user.email || form.email);
            navigate(getPostLoginDestination());
          } else {
            const message = result.status === 401
              ? "Wrong email, username, or password."
              : data.message || "Login failed. Please try again.";
            setNotice({ type: "error", title: "Sign in failed", message });
          }
        } catch (err) {
          const message = err.message || "Could not reach the server. Please try again.";
          setNotice({ type: "error", title: "Network error", message });
        } finally {
          setIsLoading(false);
        }
        
    };

    const startOAuth = (provider) => {
      const returnTo = Location.state?.returnTo;
      if (isInternalPath(returnTo)) {
        window.sessionStorage.setItem(POST_LOGIN_RETURN_TO_KEY, returnTo);
      }
      window.location.assign(`${API_BASE_URL}/api/oauth/${provider}`);
    };

    return (
        <div>  
        <AuthNotice notice={notice} onClose={() => setNotice(null)} />
        
        <div ref={vantaRef} className="container" >
            <form onSubmit={handleSubmit} className="form" >
                <h1 style={{color:"white", textAlign:"center" , }}> Login</h1>
                <div style={{display:"block" , width : "80%"}}>   
                <label htmlFor="email" className = "label">Email or Username</label>  
                <input
                    
                    className="input"
                    type="text"
                    id = "email"
                    name="email"
                    placeholder="user@gmail.com or user"
                    value={form.email}
                    onChange={handleChange}
                    
                />
                </div>
                <div style={{display:"block" , width : "80%"}}> 
                <label htmlFor="password" className= "label">Password      </label>
                <input
                    className="input"
                    type="password"
                    id = "password"
                    name="password"
                    placeholder="user"
                    value={form.password}
                    onChange={handleChange}
                />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.55rem" , color:"white",width:"80%"}}>
                  <div className="liquid-checkbox">
                        <input type="checkbox" id="remember" name="remember" checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style ={ { width: "20px", height: "20px" } }/>
                        <div className="liquid-container">
                            <div className="liquid-fill"></div>
                            <div className="checkmark-float">✓</div>
                        </div>
                    </div>
                   Remember Me
                </label>
                <button type="submit" disabled = {isLoading}  className="gradient-border login-submit" style={{width:"80%"}}>
                    {isLoading ? <span className="login-submit-text">Signing in...</span>  : "Sign in"} 
                    {isLoading ? <MorphingSpinner glow={false} className="login-spinner" /> : null }
                </button>
                <OAuthButtons onSelect={startOAuth} />
                <div className="login-switch">
                  Don't have an account yet?{' '}
                  <Link to ="/register" className="login-switch-link" >
                    Register
                  </Link>
                </div>
            </form>
        </div>
      </div>

    );
};




export default Login;
