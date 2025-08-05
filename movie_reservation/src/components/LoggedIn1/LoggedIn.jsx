import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LoggedIn.css";

// Custom hook to detect clicks outside of a component
const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};

const LoggedIn = (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useOutsideClick(dropdownRef, () => setIsMenuOpen(false));

  const getInitial = (name) => {
    return name ? name.charAt(0) : '';
  };

  const handleProfileClick = () => {
    // You can navigate to a profile page here if you have one
    // navigate('/profile');
    setIsMenuOpen(false);
  };

  return (
    <div className="LoggedIn" ref={dropdownRef}>
      <div 
        className="user-icon"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {getInitial(props.username)}
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="dropdown-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
          >
            <button className="dropdown-item" onClick={handleProfileClick}>
              Profile
            </button>
            <div className="dropdown-separator" />
            <button className="dropdown-item" onClick={props.onLogout}>
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoggedIn;