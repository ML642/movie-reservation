import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaCrown, FaFilm, FaStar, FaTicketAlt, FaUser, FaVideo } from "react-icons/fa";
import { getStoredUserIcon, USER_ICON_CHANGE_EVENT } from "../../utils/userIcon";

import "./LoggedIn.css";

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
  const [selectedIcon, setSelectedIcon] = useState(getStoredUserIcon);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  const dropdownRef = useRef(null); 
  const profileRef = useRef(null); 

  useOutsideClick(dropdownRef, () => setIsMenuOpen(false));

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    const handleIconChange = () => setSelectedIcon(getStoredUserIcon());
    window.addEventListener('storage', handleIconChange);
    window.addEventListener(USER_ICON_CHANGE_EVENT, handleIconChange);

    return () => {
      window.removeEventListener('storage', handleIconChange);
      window.removeEventListener(USER_ICON_CHANGE_EVENT, handleIconChange);
    };
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

  const renderIcon = () => {
    if (selectedIcon === 'film') return <FaFilm />;
    if (selectedIcon === 'ticket') return <FaTicketAlt />;
    if (selectedIcon === 'star') return <FaStar />;
    if (selectedIcon === 'video') return <FaVideo />;
    if (selectedIcon === 'crown') return <FaCrown />;
    return getInitial(username) || <FaUser />;
  };

  return (
    <div ref={dropdownRef}>
    
      <div 
        className="user-profile-container"
        ref={profileRef}
        onClick={handleToggleMenu}
      >
        <div className="user-icon">{renderIcon()}</div>
        <span className="header-username">{username}</span>
      </div>

      {/* This is the dropdown menu itself */}
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
              <div className="dropdown-user-icon">{renderIcon()}</div>
              <span className="dropdown-username">{username}</span>
            </div>
            <div className="dropdown-separator" />
            <Link to = "/profile" className="dropdown-item" >
              Profile 
            </Link>
            <Link to = "/my-reservations" className="dropdown-item" >
              My Reservations
            </Link>
            <Link to = "/favorites" className="dropdown-item" >
              Favorites
            </Link>
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
