import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import './Footer.css';
import { Link } from "react-router-dom"
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>CINEPLEX</h3>
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
          <h4>Connect</h4>
          <div className="footer-social">
            <a href="/"><FaFacebook /></a>
            <a href="/"><FaTwitter /></a>
            <a href="/"><FaInstagram /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2023 Cineplex. All rights reserved.</p>
      </div>
    </footer>
  );
}