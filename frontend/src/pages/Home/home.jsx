import { useEffect, useRef } from 'react';
import { FaFilm, FaGlasses, FaTicketAlt, FaVideo } from 'react-icons/fa';
import { motion, useInView } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import Hero from '../../components/Hero_Section/HeroSection.jsx';
import cinemaOne from '../../assets/cinema-1.jpg';
import cinemaTwo from '../../assets/cinema-2.jpg';
import './home.css';

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
  const isInfoInView = useInView(infoRef, { margin: '-20%' });
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [location.key]);

  useEffect(() => {
    const isMobileOrTablet = () =>
      window.innerWidth <= 1024 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobileOrTablet()) return;

    const parallaxElements = document.querySelectorAll('.parallax-section');
    let rafId = null;
    let latestScrollY = window.pageYOffset;

    const updateParallax = () => {
      const rate = latestScrollY * -0.2;
      parallaxElements.forEach((element) => {
        element.style.backgroundPosition = `center ${rate}px`;
      });
      rafId = null;
    };

    const handleScroll = () => {
      latestScrollY = window.pageYOffset;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateParallax);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  useEffect(() => {
    [cinemaOne, cinemaTwo].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  return (
    <div className="app home-page">
      <img
        src={cinemaOne}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        loading="eager"
        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
      />
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
            transition={{ duration: 0.8, delay: 0.2 }}
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
            transition={{ duration: 0.7 }}
          >
            <h2>Experience Cinema Like Never Before</h2>
            <p>Book your tickets online and enjoy exclusive deals.</p>
          </motion.div>
        </section>

        <section
          className="parallax-section coming-soon home-coming-section"
          style={{ '--section-background': `url(${cinemaTwo})` }}
        >
          <div className="home-content home-coming-content">
            <h2>Coming Soon</h2>
            <div className="home-slider-wrap">
              <Hero variant="1" />
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
