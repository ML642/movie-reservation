import React, { useEffect } from "react";
import "../../index.css";
import "./terms.css";
import { useLocation } from "react-router-dom";

const Terms = () => {
    const Location =  useLocation() ;
    useEffect(() => {
        window.scrollTo({top:0, left:0, behavior: "smooth"});
    }, [Location.key] );
  return(
  <div className="terms-container">
    <h1>Terms of Service</h1>
    <p>Last updated: August 6, 2025</p>
    <h2>1. Introduction</h2>
    <p>Welcome to our Movie Reservation System. By using our service, you agree to these Terms of Service. Please read them carefully.</p>
    <h2>2. User Responsibilities</h2>
    <ul>
      <li>You must provide accurate information during registration.</li>
      <li>Do not share your account credentials with others.</li>
      <li>Use the service in compliance with all applicable laws.</li>
    </ul>
    <h2>3. Reservations</h2>
    <ul>
      <li>Reservations are subject to availability.</li>
      <li>We reserve the right to cancel reservations under certain circumstances.</li>
    </ul>
    <h2>4. Privacy Policy</h2>
    <h3>4.1 Introduction</h3>
    <p>Your privacy is important to us. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our Movie Reservation System.</p>
    <h3>4.2 Information We Collect</h3>
    <ul>
      <li><strong>Personal Information:</strong> Name, email address, and other information you provide during registration or while using our services.</li>
      <li><strong>Usage Data:</strong> Details of your reservations, interactions with the site, and preferences.</li>
      <li><strong>Technical Data:</strong> Browser type, IP address, device information, and cookies.</li>
    </ul>
    <h3>4.3 How We Use Information</h3>
    <ul>
      <li>To create and manage your account</li>
      <li>To process your reservations and provide customer support</li>
      <li>To improve and personalize your experience</li>
      <li>To communicate with you about your account, reservations, or updates</li>
      <li>To comply with legal obligations</li>
    </ul>
    <h3>4.4 Data Sharing and Disclosure</h3>
    <p>We do not sell or rent your personal information. We may share your data only with service providers who help us operate our service, or if required by law.</p>
    <h3>4.5 Data Security</h3>
    <p>We use appropriate security measures to protect your data from unauthorized access, alteration, disclosure, or destruction.</p>
    <h3>4.6 Cookies and Tracking Technologies</h3>
    <p>We use cookies and similar technologies to enhance your experience. You can control cookies through your browser settings, but disabling them may affect site functionality.</p>
    <h3>4.7 Your Rights</h3>
    <ul>
      <li>You may access, update, or delete your personal information by contacting us.</li>
      <li>You may opt out of certain communications at any time.</li>
    </ul>
    <h3>4.8 Changes to This Policy</h3>
    <p>We may update this Privacy Policy from time to time. We will notify you of significant changes, and your continued use of the service means you accept the updated policy.</p>
    <h3>4.9 Contact Us</h3>
    <p>If you have questions about this Privacy Policy, please contact us via the support page.</p>
    <h2>5. Changes to Terms</h2>
    <p>We may update these Terms from time to time. Continued use of the service means you accept the changes.</p>
    <h2>6. Contact</h2>
    <p>If you have any questions about these Terms, please contact us via the support page.</p>
  </div>
    );
}
export default Terms;
