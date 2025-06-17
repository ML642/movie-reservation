import { useEffect } from 'react';
import Header from '../components/HEADER1/header.jsx';

import Hero from '../components/HeroSection/HeroSection.jsx';
import Footer from '../components/Foter/Footer.jsx';
import './home.css';

export default function Home() {
  useEffect(() => {
    const handleScroll = () => {
      const parallaxElements = document.querySelectorAll('.parallax-section');
      parallaxElements.forEach((element) => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.3;
        element.style.backgroundPositionY = `${rate}px`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Hero />
        
        <section className="parallax-section now-showing">
          <div className="content">
            <h2>Now Showing</h2>
            <div className="movie-grid">
              {/* Movie cards will go here */}
            </div>
          </div>
        </section>

        <section className="info-section">
          <div className="content">
            <h2>Experience Cinema Like Never Before</h2>
            <p>Book your tickets online and enjoy exclusive deals</p>
          </div>
        </section>

        <section className="parallax-section coming-soon">
          <div className="content">
            <h2>Coming Soon</h2>
            <div className="movie-grid">
              {/* Upcoming movie cards will go here */}
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="content">
            <h2>Why Choose Us</h2>
            <div className="features-grid">
              <div className="feature">
                <h3>Premium Experience</h3>
                <p>State-of-the-art screens and sound systems</p>
              </div>
              <div className="feature">
                <h3>Easy Booking</h3>
                <p>Book tickets in seconds with our intuitive platform</p>
              </div>
              <div className="feature">
                <h3>Great Deals</h3>
                <p>Regular discounts and special offers</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}