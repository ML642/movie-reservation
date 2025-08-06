import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";


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
  const [username, setUsername] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  const dropdownRef = useRef(null); // For click outside and positioning
  const profileRef = useRef(null); // For measuring position

  useOutsideClick(dropdownRef, () => setIsMenuOpen(false));

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleToggleMenu = () => {
    if (profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // Position below the icon with a small gap
        right: window.innerWidth - rect.right, // Align to the right edge of the icon
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '';
  };

  const handleProfileClick = () => {
    // navigate('/profile');
    setIsMenuOpen(false);
  };

  const handleReservationsClick = () => {
    // navigate('/my-reservations');
    setIsMenuOpen(false);
  };

  return (
    <div ref={dropdownRef}>
      {/* This is the clickable element in the header */}
      <div 
        className="user-profile-container"
        ref={profileRef}
        onClick={handleToggleMenu}
      >
        <div className="user-icon">{getInitial(username)}</div>
        <span className="header-username">{username}</span>
      </div>

      {/* This is the dropdown menu itself, rendered with a portal if needed, but fixed position works */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="dropdown-menu"
            style={{ top: dropdownPosition.top, right: dropdownPosition.right }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
          >
            <div className="dropdown-header">
              <div className="dropdown-user-icon">{getInitial(username)}</div>
              <span className="dropdown-username">{username}</span>
            </div>
            <div className="dropdown-separator" />
            <button className="dropdown-item" onClick={handleProfileClick}>
              Profile
            </button>
            <button className="dropdown-item" onClick={handleReservationsClick}>
              My Reservations
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