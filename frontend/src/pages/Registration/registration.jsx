import { useEffect, useRef, useState } from "react";
import './registration.css' ;
import  { Link } from "react-router-dom";
import MorphingSpinner from "../../components/spinner/spinner";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import AuthNotice from "../../components/notification/AuthNotice";
import { z } from "zod";

const registrationSchema = z.object({
  username: z.string().trim().min(3, "Username must contain at least 3 characters.").max(50, "Username is too long."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must contain at least 8 characters."),
});

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

const Signin = () => {
  
  const vantaRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const vantaEnabled = useVantaEnabled();
  
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

    const [form, setForm] = useState({ username: "" ,  email: "", password: "" });
    const [fieldErrors, setFieldErrors] = useState({});
    const [notice, setNotice] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading ] =  useState(false) ; 
    const navigate =  useNavigate() ;

    useEffect(() => {
        const remembered = localStorage.getItem("rememberedEmail");
        if (remembered) {
            setForm(f => ({ ...f, email: remembered }));
            setRememberMe(true);
        }
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setFieldErrors((errors) => ({ ...errors, [e.target.name]: undefined }));
        setNotice(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setNotice(null);
        const validation = registrationSchema.safeParse(form);
        if (!validation.success) {
            const errors = Object.fromEntries(
                validation.error.issues.map((issue) => [issue.path[0], issue.message])
            );
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});

        setIsLoading(true);
        if (rememberMe) {
            localStorage.setItem("rememberedEmail", form.email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: validation.data.username,
                    email: validation.data.email,
                    password: validation.data.password
                })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('userEmail', data.user.email || form.email);
                navigate('/movie_list');
            } else {
              const message = data.message || "Registration failed. Please try again.";
              setNotice({
                type: "error",
                title: response.status === 400 ? "Registration blocked" : "Registration failed",
                message,
              });
            }
        } catch (err) {
            const message = err.message || "Could not reach the server. Please try again.";
            setNotice({ type: "error", title: "Network error", message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>  
        <AuthNotice notice={notice} onClose={() => setNotice(null)} />
       
        <div ref={vantaRef} className="container" >
            <form onSubmit={handleSubmit} className="form" >
                <h1 style={{color:"white", textAlign:"center" , }}> Registration </h1>
                <div style={{display:"block" , width : "80%"}}>   
                <label htmlFor="username" className = "label">Username   </label>  
                <input
                    className="input"
                    type="text"
                    id = "username"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.username)}
                    aria-describedby={fieldErrors.username ? "username-error" : undefined}
                />
                {fieldErrors.username && <p id="username-error" className="field-error">{fieldErrors.username}</p>}
                </div>


                <div style={{display:"block" , width : "80%"}}>   
                <label htmlFor="email" className = "label">Email Address   </label>  
                <input
                    
                    className="input"
                    type="email"
                    id = "email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "email-error" : undefined}
                    
                />
                {fieldErrors.email && <p id="email-error" className="field-error">{fieldErrors.email}</p>}
                </div>
                <div style={{display:"block" , width : "80%"}}> 
                <label htmlFor="password" className= "label">Password     </label>
                <input
                    className="input"
                    type="password"
                    id = "password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? "password-error" : undefined}
                />
                {fieldErrors.password && <p id="password-error" className="field-error">{fieldErrors.password}</p>}
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
                <button type="submit" disabled={isLoading} className="gradient-border register-submit" style={{width:"80%"}}>
                   {isLoading ? <span className="register-submit-text">Creating...</span>  : "Create account"} 
                    {isLoading ? <MorphingSpinner /> : null }
                </button>
                <div className="register-switch">
                  Already have an account?{' '}
                  <Link to ="/login" className="register-switch-link" >
                    Login
                  </Link>
                </div>
            </form>
        </div>
      
        
        </div>
    );
};




export default Signin;
