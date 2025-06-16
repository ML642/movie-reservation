import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
  import './footer.css';

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
            <li><a href="#">Movies</a></li>
            <li><a href="#">Theaters</a></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li><a href="#">Terms</a></li>
            <li><a href="#">Privacy</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Connect</h4>
          <div className="footer-social">
            <a href="#"><FaFacebook /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaInstagram /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2023 Cineplex. All rights reserved.</p>
      </div>
    </footer>
  );
}