import React, { useState } from "react";
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import './registration.css' ;
import { useEffect, useRef } from "react";
import  { Link } from "react-router-dom";


const Signin = () => {
  
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);
  if (vantaEffect){vantaEffect.destroy()}
  useEffect(() => {
    if (!vantaEffect && vantaRef.current) {
      setVantaEffect(
        WAVES({
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
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
        // Only run once on mount/unmount
    // eslint-disable-next-line
  }, []);

    const [form, setForm] = useState({ username: "" ,  email: "", password: "" });
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const remembered = localStorage.getItem("rememberedEmail");
        if (remembered) {
            setForm(f => ({ ...f, email: remembered }));
            setRememberMe(true);
        }
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.username || !form.email || !form.password) {
            setError("Please fill in all fields.");
            return;
        }
        if (rememberMe) {
            localStorage.setItem("rememberedEmail", form.email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }
        try {
            const response = await fetch("http://localhost:5000/api/register", {
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
                alert("Registration successful! You can now log in.");
                // Optionally redirect to login page here
            } else {
                setError(data.message || "Registration failed");
            }
        } catch (err) {
            setError("Network error");
        }
    };

    return (
        <div>  
       
        <div ref={vantaRef} class = "container" >
            <form onSubmit={handleSubmit} class = "form" >
                <h1 style={{color:"white", textAlign:"center" , }}> Registration </h1>
                <div style={{display:"block" , width : "80%"}}>   
                <label for="username" className = "label">Username   </label>  
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
                <label for="email" className = "label">Email Address   </label>  
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
                <label for="password" className= "label">Password     </label>
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
                  <div class="liquid-checkbox">
                        <input type="checkbox" id="remember" name="remember" checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style ={ { width: "20px", height: "20px" } }/>
                        <div class="liquid-container">
                            <div class="liquid-fill"></div>
                            <div class="checkmark-float">✓</div>
                        </div>
                    </div>
                  Remember Me
                </label>
                <button type="submit"  className="gradient-border" style={{width:"80%"}}>
                   Reg IN
                </button>
                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '1rem' }}>
                  Already have an account ?{' '}
                  <Link to ="/login"  >
                    Login
                  </Link>
                </div>
            </form>
        </div>
      
        
        </div>
    );
};




export default Signin;