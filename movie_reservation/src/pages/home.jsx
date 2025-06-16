import Header from '../components/Header/Header';
import Hero from '../components/HeroSection/HeroSection.jsx';
//import MovieShowcase from '../components/MovieShowcase/MovieShowcase';
import Footer from '../components/Foter/Footer.jsx';

export default function Home() {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        {/*  <MovieShowcase />  }
        {/* Add TheaterHighlights later */}
      </main>
      <Footer />
    </div>
  );
}