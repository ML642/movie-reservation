import './Footer.css';
import { Link } from "react-router-dom"
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>CineReserve</h3>
          <p>Your ultimate movie experience</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to = "/movie_list">Movies</Link></li>
            <li><Link to = "/theaters">Theaters</Link></li>
            <li><Link to = "/pricing">Pricing</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li> <Link to = "/terms">Terms</Link></li>
            <li><Link to = "/terms">Privacy</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Project</h4>
          <ul className="footer-links">
            <li>
              <a href="https://github.com/ML642/movie-reservation" target="_blank" rel="noopener noreferrer">
                Source code
              </a>
            </li>
          </ul>
        </div>
      </div>
    
    </footer>
  );
}
