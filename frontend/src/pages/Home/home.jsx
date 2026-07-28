import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { FaFilm, FaGlasses, FaTicketAlt, FaVideo } from 'react-icons/fa';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import cinemaOne from '../../assets/cinema-1.jpg';
import cinemaTwo from '../../assets/cinema-2.jpg';
import './home.css';

const Hero = lazy(() => import('../../components/Hero_Section/HeroSection.jsx'));

const canPreloadHeroImage = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return !connection?.saveData && window.innerWidth > 1024;
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const featureItems = [
  {
    title: 'Premium Experience',
    body: 'State-of-the-art screens and sound systems',
  },
  {
    title: 'Easy Booking',
    body: 'Book tickets in seconds with our intuitive platform',
  },
  {
    title: 'Great Deals',
    body: 'Regular discounts and special offers',
  },
];

export default function Home() {
  const infoRef = useRef(null);
  const comingSoonRef = useRef(null);
  const isInfoInView = useInView(infoRef, { margin: '-20%' });
  const [shouldLoadComingSoon, setShouldLoadComingSoon] = useState(false);
  const [shouldPreloadHero, setShouldPreloadHero] = useState(canPreloadHeroImage);
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.key]);

  useEffect(() => {
    const target = comingSoonRef.current;
    if (!target || !('IntersectionObserver' in window)) {
      setShouldLoadComingSoon(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShouldLoadComingSoon(true);
        observer.disconnect();
      }
    }, { rootMargin: '400px 0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updatePreloadEligibility = () => setShouldPreloadHero(canPreloadHeroImage());
    window.addEventListener('resize', updatePreloadEligibility, { passive: true });

    return () => window.removeEventListener('resize', updatePreloadEligibility);
  }, []);

  return (
    <div className="app home-page">
      {shouldPreloadHero && (
        <img
          src={cinemaOne}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
      )}
      <main className="main-content">
        <section
          className="parallax-section now-showing home-hero-section"
          style={{ '--section-background': `url(${cinemaOne})` }}
        >
          <motion.div
            className="home-content home-hero-content"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.8, delay: 0.2 }}
          >
            <p className="home-kicker">CineReserve</p>
            <h1>Your Perfect Movie Night Starts With One Click</h1>
            <div className="movie-grid-homepage" aria-hidden="true">
              <FaFilm className="Icon" />
              <FaTicketAlt className="Icon" />
              <FaVideo className="Icon" />
              <FaGlasses className="Icon" />
            </div>
          </motion.div>
        </section>

        <section className="info-section" ref={infoRef}>
          <motion.div
            className="home-content info-content"
            variants={fadeUp}
            initial="hidden"
            animate={isInfoInView ? 'visible' : 'hidden'}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.7 }}
          >
            <h2>Experience Cinema Like Never Before</h2>
            <p>Book your tickets online and enjoy exclusive deals.</p>
          </motion.div>
        </section>

        <section
          ref={comingSoonRef}
          className="parallax-section coming-soon home-coming-section"
          style={shouldLoadComingSoon ? { '--section-background': `url(${cinemaTwo})` } : undefined}
          aria-label="Coming soon movies"
        >
          <div className="home-content home-coming-content">
            <h2>Coming Soon</h2>
            <div className="home-slider-wrap">
              {shouldLoadComingSoon ? (
                <Suspense fallback={<div className="home-slider-placeholder" aria-hidden="true" />}>
                  <Hero variant="1" />
                </Suspense>
              ) : (
                <div className="home-slider-placeholder" aria-hidden="true" />
              )}
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="home-content">
            <h2 className="features-title">Why Choose Us</h2>
            <div className="features-grid">
              {featureItems.map((feature) => (
                <div className="feature" key={feature.title}>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="home-cta-wrap">
            <Link to="/movie_list" className="home-cta-link">
              <span className="book-now">
                Book Now
                <span className="arrow">-&gt;</span>
              </span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
