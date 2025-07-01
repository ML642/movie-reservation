import React, { useState } from "react";
import Header from "../components/HEADER1/header"; 
import Footer from "../components/Foter/Footer"; 
import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import './Login.css';
import { useEffect, useRef } from "react";

const Login = () => {

  const vantaRef = useRef(null);
  const [vantaEffect, setVantaEffect] = useState(null);

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
  }, [vantaEffect]);

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");

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
        // TODO: Add authentication logic here
        alert("Logged in!");
    };

    return (
        <div>  
        <Header></Header>
        <div ref={vantaRef} style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.form}>
                <h2>Login</h2>
                {error && <div style={styles.error}>{error}</div>}
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    style={styles.input}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                    style={styles.input}
                />
                <button type="submit" style={styles.button}>
                    Log In
                </button>
            </form>
        </div>
        <Footer></Footer>
        
        </div>
    );
};

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
    },
    form: {
    background: "rgba(255, 255, 255, 0.2)", // semi-transparent white
    backdropFilter: "blur(1px)",          // blur background behind the form
    borderRadius: "8px",
    padding: "2rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    width: "100%",
    maxWidth: "400px",
    },
    input: {
        padding: "0.75rem",
        borderRadius: "4px",
        border: "1px solid #ccc",
        fontSize: "1rem",
    },
    button: {
        padding: "0.75rem",
        borderRadius: "4px",
        border: "none",
        background: "#1976d2",
        color: "#fff",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "1rem",
    },
    error: {
        color: "red",
        fontSize: "0.9rem",
    },
};

export default Login;