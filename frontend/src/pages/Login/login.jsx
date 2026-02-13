import React, { useState, useEffect, useRef } from "react";
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import './Login.css';
import  { Link, useNavigate , useLocation  } from "react-router-dom";
import MorphingSpinner from "../../components/spinner/spinner";

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

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    
    let errorMessage = error ? <p className="error-message">{error}</p> : null;
    if (error) {
      console.log(errorMessage)
    }
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
        setIsLoading(true);
        if (!form.email || !form.password) {
            alert("Please fill in all fields.");
            setIsLoading(false);
            setError("Please fill in all fields.");
            return;
        }
        const Login = async () => { 
          try {
            const result  =  await fetch (`${process.env.REACT_APP_API_URL}/api/login`,{
              method : "POST" , 
              headers : { "Content-type":"application/json"},
              body: JSON.stringify({
                email: form.email,
                password: form.password
              })
            })
            const data = await result.json();
            if (result.ok) {
              setIsLoading(false);
              localStorage.setItem('token', data.token);
              localStorage.setItem('username', data.user.username);
              localStorage.setItem('userEmail', data.user.email || form.email);
              alert("Login successful!");
              // Redirect to home page
              navigate('/');
            } else {
              setIsLoading(false);
              if(result.status === 401) alert("wrong email or password");
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
                <h1 style={{color:"white", textAlign:"center" , }}> Login</h1>
                <div style={{display:"block" , width : "80%"}}>   
                <label for="email" className = "label">Email Address   </label>  
                <input
                    
                    className="input"
                    type="email"
                    id = "email"
                    name="email"
                    placeholder="user@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    
                />
                </div>
                <div style={{display:"block" , width : "80%"}}> 
                <label for="password" className= "label">Password      </label>
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
                <button type="submit" disabled = {isLoading}  className="gradient-border" style={{width:"80%"}}>
                    {isLoading ? <h1 style={{fontSize: "1.5rem", paddingRight: "1rem"}}> Logging in...  </h1>  : "Login"} 
                    {isLoading ? <MorphingSpinner /> : null }
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
