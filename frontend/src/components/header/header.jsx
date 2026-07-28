import { FaBars, FaTicketAlt, FaTimes } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoggedIn from "../LoggedIn/LoggedIn.jsx";
import ResponsiveLogo from "./cineReserve.jsx";
import "./header.css";

const isAuthenticatedAtStartup = () =>
  typeof window !== "undefined" && Boolean(window.localStorage.getItem("token"));

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticatedAtStartup);
  const location = useLocation();
  const isScrolledRef = useRef(false);

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(Boolean(window.localStorage.getItem("token")));
      setIsMenuOpen(false);
    };

    syncAuthState();
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

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    setIsLoggedIn(false);
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: "Home page", href: "/", icon: <FaTicketAlt /> },
    { name: "Now playing", href: "/movie_list", icon: <FaTicketAlt /> },
    { name: "Theaters", href: "/theaters", icon: <FaTicketAlt /> },
    { name: "Special Offers", href: "/pricing", icon: <FaTicketAlt /> },
  ];

  return (
    <header className={`site-header${isScrolled ? " is-scrolled" : ""}`}>
      <div className="site-header-logo">
        <ResponsiveLogo />
      </div>

      <div className="site-header-actions">
        <div className="header-account-slot">
          {isLoggedIn ? (
            <LoggedIn onLogout={handleLogout} />
          ) : (
            <Link to="/login" className="header-sign-in-link">
              Sign In
            </Link>
          )}
        </div>
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <nav
        id="mobile-navigation"
        className={`mobile-navigation${isMenuOpen ? " is-open" : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-navigation-content">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="mobile-navigation-link"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
