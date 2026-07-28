import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaSearch, FaBars, FaTimes, FaTicketAlt } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import LoggedIn from "../LoggedIn/LoggedIn.jsx"
import ResponsiveLogo from "./cineReserve.jsx";
import "./header.css"

const MotionLink = motion(Link);
const HEADER_TEXT_COLOR = "rgb(255, 255, 255)";
const HEADER_ACCENT_COLOR = "rgb(239, 68, 68)";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const prefersReducedMotion = useReducedMotion();
  
  const [isLoggedIn , SetIsLoggedIn] = useState( false );
  const location  = useLocation() ;


  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const isScrolledRef = useRef(false);

  useEffect(() => {
    let rafId = null;
    const handleResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        setIsMobile(window.innerWidth < 768);
        rafId = null;
      });
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    SetIsLoggedIn(false);
   
  };
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    SetIsLoggedIn(Boolean(token));
    setIsMenuOpen(false);
  }, [location.key]);
  useEffect(() => {
    const closeMenuOnEscape = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", closeMenuOnEscape);
    return () => window.removeEventListener("keydown", closeMenuOnEscape);
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      const nextScrolled = window.scrollY > 10;
      if (nextScrolled !== isScrolledRef.current) {
        isScrolledRef.current = nextScrolled;
        setIsScrolled(nextScrolled);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home page ", href: "/", icon: <FaTicketAlt /> },
    { name: "Now playing", href: "/movie_list", icon: <FaTicketAlt /> },
    { name: "Theaters", href: "/theaters", icon: <FaTicketAlt /> },
    { name: "Special Offers", href: "/pricing", icon: <FaTicketAlt /> },
  ];

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.25 }
    },
    scrolled: {
      opacity: 1,
      y: 0,
      backgroundColor: "rgba(17, 24, 39, 0.95)",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transition: { duration: prefersReducedMotion ? 0 : 0.18 },
    }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.18 }
    },
    exit: { opacity: 0, y: -8, transition: { duration: prefersReducedMotion ? 0 : 0.12 } }
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0, transition: { duration: prefersReducedMotion ? 0 : 0.16 } }
  };

  return (
    <motion.header
      initial={prefersReducedMotion ? false : "hidden"}
      animate={isScrolled ? "scrolled" : "visible"}
      variants={headerVariants}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1000,
        backgroundColor: "#111827",
        color: HEADER_TEXT_COLOR,
      }}
    >
      {/* Logo */}
      <motion.div 
        whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <ResponsiveLogo />    
      </motion.div>

      {/* Desktop Navigation */}
      <nav style={{ display: "none", gap: "2rem", alignItems: "center" }}>
        {navLinks.map((link) => (
          <MotionLink
            key={link.name}
            to={link.href}
            whileHover={prefersReducedMotion ? undefined : {
              color: HEADER_ACCENT_COLOR,
              y: -2
            }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 500,
              textDecoration: "none",
              color: HEADER_TEXT_COLOR,
            }}
          >
            {link.icon}
            {link.name}
          </MotionLink>
        ))}
      </nav>

      {/* Search Bar - Desktop */}
      <div
        style={{
          display: "none",
          alignItems: "center",
          background: "#1f2937",
          borderRadius: "2rem",
          padding: "0.5rem 1rem",
          width: "300px",
        }}
      >
        <FaSearch style={{ color: "#9ca3af", marginRight: "0.5rem" }} />
        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "white",
            width: "100%",
          }}
        />
      </div>

     
      <div style={{ display: "flex", alignItems: "center" , gap: "0.75rem" }}>
        {isLoggedIn  ? (<LoggedIn onLogout={handleLogout}/>) : 
        <MotionLink
          to="/login"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          style={{
            background: "#ef4444",
            color: HEADER_TEXT_COLOR,
            borderRadius: "999px",
            padding: "0 0.15rem",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: isMobile ? "0.9rem" : "1.05rem",
            minWidth: isMobile ? "4.25rem" : "5rem",
            height: "2.1rem",
            cursor: "pointer",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Sign In
        </MotionLink>
          }
        {/* Mobile Menu Toggle */}
        <motion.button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          style={{
            background: "none",
            border: "none",
            color: HEADER_TEXT_COLOR,
            fontSize: "1.5rem",
            cursor: "pointer",
            width: "2.4rem",
            height: "2.4rem",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            id="mobile-navigation"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#1f2937",
              zIndex: 999,
            }}
          >
            <div style={{ padding: "1rem 2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Mobile Search */}
              

              {/* Mobile Nav Links */}
              {navLinks.map((link) => (
                <MotionLink
                  key={link.name}
                  to={link.href}
                  variants={navItemVariants}
                  whileHover={prefersReducedMotion ? undefined : { color: HEADER_ACCENT_COLOR }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: HEADER_TEXT_COLOR,
                    textDecoration: "none",
                    padding: "0.5rem 0",
                    fontWeight: 500,
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  {link.name}
                </MotionLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
