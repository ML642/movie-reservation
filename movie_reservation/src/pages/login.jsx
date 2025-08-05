import React, { useState, useEffect, useRef } from "react";
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import './Login.css';
import  { Link, useNavigate } from "react-router-dom";


const Login = () => {
  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);
  const navigate = useNavigate();

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

    const [form, setForm] = useState({ email: "", password: "" });
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

    const handleSubmit = (e) => {
        e.preventDefault();
        // Dummy validation
        if (!form.email || !form.password) {
            setError("Please fill in all fields.");
            return;
        }
        const Login = async () => { 
          try {
            const result  =  await fetch ("http://localhost:5000/api/login",{
              method : "POST" , 
              headers : { "Content-type":"application/json"},
              body: JSON.stringify({
                email: form.email,
                password: form.password
              })
            })
            const data = await result.json();
            if (result.ok) {
              // Store the token in localStorage
              localStorage.setItem('token', data.token);
              alert("Login successful!");
              // Redirect to home page
              navigate('/');
            } else {
              setError(data.message || "Login failed");
            }
          } catch (err) {
            setError("Network error");
          }
        }
        Login();
        if (rememberMe) {
            localStorage.setItem("rememberedEmail", form.email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }
 
    };

    return (
        <div>  
        
        <div ref={vantaRef} class ="container" >
            <form onSubmit={handleSubmit} class = "form" >
                <h1 style={{color:"#234", textAlign:"center" , }}> Login</h1>
                
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                />
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.55rem" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style ={ { width: "20px", height: "20px" } }
                  />
                  Remember Me
                </label>
                <button type="submit"  className="gradient-border">
                    Log In
                </button>
                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '1rem' }}>
                  Don't have an account yet?{' '}
                  <Link to ="/register"  >
                    Register
                  </Link>
                </div>
            </form>
        </div>
        
        </div>
    );
};




export default Login;