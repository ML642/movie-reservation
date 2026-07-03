import  { useState } from "react";
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import './registration.css' ;
import { useEffect, useRef } from "react";
import  { Link } from "react-router-dom";
import MorphingSpinner from "../../components/spinner/spinner";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import AuthNotice from "../../components/notification/AuthNotice";

const Signin = () => {
  
  const vantaRef = useRef(null);
  const vantaEffectRef = useRef(null);
  
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

    const [form, setForm] = useState({ username: "" ,  email: "", password: "" });
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
        setNotice(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setNotice(null);
        if (!form.username || !form.email || !form.password) {
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
            const response = await fetch(`${API_BASE_URL}/api/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: form.username,
                    email: form.email,
                    password: form.password
                })
            });
            const data = await response.json();
            if (response.ok) {
                navigate('/login', {
                    state: {
                        notice: {
                            type: "success",
                            title: "Account created",
                            message: "Your account is ready. Sign in to continue.",
                        },
                    },
                });
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
                />
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
                    
                />
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
