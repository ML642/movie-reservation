import { useState, useEffect } from 'react';
import { FaPlay, FaInfoCircle } from 'react-icons/fa';
import './HeroSection.css';

const featuredMovies = [
  [{
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
  }],
  [{
    id: 4,
    title: "Spider-Man: Across the Spider-Verse",
    backdrop: "/assets/spiderman-banner.jpg",
    desc: "Miles Morales returns for an epic multiverse adventure."
  },
  {
    id: 5,
    title: "Wonka",
    backdrop: "/assets/wonka-banner.jpg",
    desc: "Discover the origin story of Willy Wonka and his chocolate factory."
  },
  {
    id: 6,
    title: "The Marvels",
    backdrop: "/assets/marvels-banner.jpg",
    desc: "Captain Marvel teams up with new heroes to save the universe."
  }],
  [{
    id: 7,
    title: "Mission: Impossible ",
    backdrop: "/assets/mi7-banner.jpg",
    desc: "Ethan Hunt faces his most dangerous mission yet."
  },
  {
    id: 8,
    title: "Elemental",
    backdrop: "/assets/elemental-banner.jpg",
    desc: "A Pixar adventure where fire, water, land, and air live together."
  },
  {
    id: 9,
    title: "Indiana Jones and the Dial of Destiny",
    backdrop: "/assets/indiana-jones-banner.jpg",
    desc: "Indiana Jones returns for one last globe-trotting adventure."
  }]
];

export default function HeroSection({variant}) {
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
        {featuredMovies[variant-1].map((movie, idx) => (
          <div
            key={movie.id}
            className={`hero-slide${idx === currentSlide ? ' active' : ''}`}
            style={{ backgroundImage: `url(${movie.backdrop})` }}
            aria-hidden={idx !== currentSlide}
          >
            <div className="hero-content">
              <h1>{movie?.title}</h1>
              <p>{movie?.desc}</p>
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