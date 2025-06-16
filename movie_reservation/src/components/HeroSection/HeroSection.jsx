import { useState, useEffect } from 'react';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';
import './HeroSection.css';

const featuredMovies = [
  {
    id: 1,
    title: "Dune: Part Two",
    backdrop: "/assets/dune-banner.jpg",
    desc: "The epic continuation of Paul Atreides' journey"
  },
  {
    id: 2,
    title: "Oppenheimer",
    backdrop: "/assets/oppenheimer-banner.jpg",
    desc: "A dramatic look at the father of the atomic bomb"
  },
  {
    id: 3,
    title: "Barbie",
    backdrop: "/assets/barbie-banner.jpg",
    desc: "A fun and colorful adventure in Barbie Land"
  }
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-slider">
        {featuredMovies.map((movie, idx) => (
          <div
            key={movie.id}
            className={`hero-slide${idx === currentSlide ? ' active' : ''}`}
            style={{ backgroundImage: `url(${movie.backdrop})` }}
            aria-hidden={idx !== currentSlide}
          >
            <div className="hero-content">
              <h1>{movie.title}</h1>
              <p>{movie.desc}</p>
              <div className="hero-actions">
                <button className="hero-btn play">
                  <FaPlay /> Play Trailer
                </button>
                <button className="hero-btn info">
                  <FaInfoCircle /> More Info
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hero-indicators">
        {featuredMovies.map((_, idx) => (
          <button
            key={idx}
            className={idx === currentSlide ? 'active' : ''}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}