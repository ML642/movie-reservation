import React, { useState, useEffect, useRef } from "react";
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import './Login.css';
import  { Link, useNavigate , useLocation  } from "react-router-dom";
import MorphingSpinner from "../../components/spinner/spinner";
import { API_BASE_URL } from "../../config/api";
import AuthNotice from "../../components/notification/AuthNotice";

const Login = () => {
  const vantaRef = useRef(null);
  const vantaEffectRef = useRef(null);
  const navigate = useNavigate();
  const [isLoading , setIsLoading] =  useState(false)
  

   const Location =  useLocation() ;
    useEffect(() => {
        window.scrollTo({top:0, left:0, behavior: "smooth"});
    }, [Location.key] );

  useEffect(() => {
    if (!vantaRef.current || vantaEffectRef.current) return;

    vantaEffectRef.current = WAVES({
      el: vantaRef.current,
      THREE,
      mouseControls: true,
      touchControls: true,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0x1a1a2e,
      shininess: 10,
      waveHeight: 20,
      waveSpeed: 0.5,
      zoom: 1,
    });

    return () => {
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy();
        vantaEffectRef.current = null;
      }
    };
  }, []);

    const [form, setForm] = useState({ email: "user@gmail.com", password: "user" });
    const [notice, setNotice] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
      if (Location.state?.notice) {
        setNotice(Location.state.notice);
        navigate(Location.pathname, { replace: true, state: {} });
      }
    }, [Location.pathname, Location.state, navigate]);

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
            navigate('/');
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
                    {isLoading ? <MorphingSpinner /> : null }
                </button>
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
