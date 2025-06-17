// components/Header/Header.jsx
import { FaTicketAlt, FaSearch, FaUserCircle } from 'react-icons/fa';
import './header.css'; // Assuming you have a CSS file for styling

export default function Header() {
  return (
    <header className="header">
      <div className="logo">CineVerse</div>
      
      <nav className="nav-links">
        <a href="#" className="active">Home</a>
        <a href="#">Movies</a>
        <a href="#">Theaters</a>
        <a href="#">Offers</a>
      </nav>

      <div className="header-actions">
        <button className="search-btn">
          <FaSearch />
        </button>
        <button className="book-btn">
          <FaTicketAlt /> Book Now
        </button>
        <div className="user-icon">
          <FaUserCircle />
        </div>
      </div>
    </header>
  );
}