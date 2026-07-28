import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaCrown, FaFilm, FaStar, FaTicketAlt, FaUser, FaVideo } from "react-icons/fa";
import { getStoredUserIcon, USER_ICON_CHANGE_EVENT } from "../../utils/userIcon";
import "./LoggedIn.css";

const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) callback();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
};

const LoggedIn = ({ onLogout }) => {
  const [username, setUsername] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(getStoredUserIcon);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);

  useOutsideClick(dropdownRef, () => setIsMenuOpen(false));

  useEffect(() => {
    setUsername(window.localStorage.getItem("username") || "");
  }, []);

  useEffect(() => {
    const handleIconChange = () => setSelectedIcon(getStoredUserIcon());
    window.addEventListener("storage", handleIconChange);
    window.addEventListener(USER_ICON_CHANGE_EVENT, handleIconChange);
    return () => {
      window.removeEventListener("storage", handleIconChange);
      window.removeEventListener(USER_ICON_CHANGE_EVENT, handleIconChange);
    };
  }, []);

  const renderIcon = () => {
    if (selectedIcon === "film") return <FaFilm />;
    if (selectedIcon === "ticket") return <FaTicketAlt />;
    if (selectedIcon === "star") return <FaStar />;
    if (selectedIcon === "video") return <FaVideo />;
    if (selectedIcon === "crown") return <FaCrown />;
    return username ? username.charAt(0).toUpperCase() : <FaUser />;
  };

  const toggleMenu = () => {
    if (profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setIsMenuOpen((isOpen) => !isOpen);
  };

  return (
    <div ref={dropdownRef} className="logged-in">
      <button
        type="button"
        className="user-profile-container"
        ref={profileRef}
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
      >
        <span className="user-icon">{renderIcon()}</span>
        <span className="header-username">{username || "Account"}</span>
      </button>

      {isMenuOpen && (
        <div className="dropdown-menu" style={{ top: dropdownPosition.top, right: dropdownPosition.right }} role="menu">
          <div className="dropdown-header">
            <span className="dropdown-user-icon">{renderIcon()}</span>
            <span className="dropdown-username">{username || "Account"}</span>
          </div>
          <div className="dropdown-separator" />
          <Link to="/profile" className="dropdown-item" role="menuitem" onClick={() => setIsMenuOpen(false)}>Profile</Link>
          <Link to="/my-reservations" className="dropdown-item" role="menuitem" onClick={() => setIsMenuOpen(false)}>My Reservations</Link>
          <Link to="/favorites" className="dropdown-item" role="menuitem" onClick={() => setIsMenuOpen(false)}>Favorites</Link>
          <div className="dropdown-separator" />
          <button type="button" className="dropdown-item" role="menuitem" onClick={onLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default LoggedIn;
