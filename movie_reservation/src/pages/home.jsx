import { use, useEffect , useRef} from 'react';
import Header from '../components/HEADER1/header.jsx';

import { FaGlasses ,Md3dRotation , FaFilm , FaTicketAlt , FaPopcorn, FaVideo} from 'react-icons/fa'

import Hero from '../components/HeroSection/HeroSection.jsx';
import Footer from '../components/Foter/Footer.jsx';
import './home.css';

import {motion ,  useAnimation,  useInView} from 'framer-motion' ; 

export default function Home() {
  const ref = useRef(null);
  const isInView = useInView(ref,{ margin: "-50%"});

  const slideControls = useAnimation();
  const mainControls = useAnimation();
  useEffect(() => {
    if (isInView) {
      mainControls.start("visible");
        slideControls.start("visible");
    }
    else {mainControls.start("hidden");
      slideControls.start("hidden");}
  }, [isInView]);

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
        {/*<Hero />*/}
        
        <section className="parallax-section now-showing" ref={ref} style={{overflow: 'hidden'}}>
        
     
              <motion.div className="content"
  variants={{
    hidden : { opacity: 0, y: 40 },
    visible  :  { opacity: 1, y: 0 },}
  }
  initial="hidden"
  animate="visible"
  transition={{ duration: 1.5 , delay: 1.5 }}
  style={{position : "absolute",}}

>
            <h2>🍿 Your Perfect Movie Night Starts With One Click</h2>
            <div className="movie-grid">
         
             <FaFilm size={100} className="Icon" ></FaFilm>
             <FaTicketAlt size={100} className="Icon"></FaTicketAlt>
             <FaVideo size = {100} className="Icon"></FaVideo>
             <FaGlasses size = {100} className='Icon'></FaGlasses>  
            </div></motion.div>
        <motion.div
        variants={{
            hidden : { left  : 0   }, 
            visible :{ left : "100%"  }
        }}
        initial =  "hidden"
        animate = "visible"
        transition={{ duration: 1.5, ease: "easeInOut" , delay: 0.5 }}
        style = {{ position: 'absolute', top: '50', left: '0', left : '0'  , right: '0' , background: 'linear-gradient(to right,rgb(131, 56, 38),rgb(172, 157, 145))', padding: '10px', borderRadius: '50px', color: '#fff', textAlign: 'center', zIndex: 1, boxShadow: '0 4px 8px rgba(0,0,0,0.2)' , width: '80%', height: '30%' }}
        >
            <div style={{fontSize :"20px" , display : "flex" }}><h2 style={{justifyContent:"center", alignItems:"center" , color:"black" ,  paddingRight:"20px"}}> Get Started </h2> </div>
        </motion.div >
        </section> 

        <section className="info-section">
          <div className="content" ref = {ref} style={{ position: 'relative', overflow: 'hidden' , width : '100%', height : '100px' }}>
            <motion.div
  variants={{
    hidden : { opacity: 0, y: 40 },
    visible  :  { opacity: 1, y: 0 },}
  }
  initial="hidden"
  animate={mainControls}
  transition={{ duration: 1.5 , delay: 0.5 }}
  style={{position : "absolute",}}

>{<div> <h2>Experience Cinema Like Never Before </h2>

            <p>Book your tickets online and enjoy exclusive deals</p> </div>}
        </motion.div >    
        <motion.div
        variants={{
            hidden : { left  : 0   }, 
            visible :{ left : "100%"  }
        }}
        initial =  "hidden"
        animate = {slideControls}
        transition={{ duration: 1.5, ease: "easeInOut" , delay: 0.5 }}
        style = {{ position: 'absolute', top: '5', left: '0', left : '0'  , right: '0' , background: 'linear-gradient(to right, #ff7e5f,rgb(172, 157, 145))', padding: '10px', borderRadius: '20px', color: '#fff', textAlign: 'center', zIndex: 1, boxShadow: '0 4px 8px rgba(0,0,0,0.2)' , width: '60%', height: '100%' }}
        >
            <div style={{fontSize :"20px" , display : "flex" }}><h2 style={{justifyContent:"center", alignItems:"center", color:"black"}}> 🎥 Where Every Frame Comes to Life </h2> </div>
        </motion.div >
          </div>
        </section>

        <section className="parallax-section coming-soon" width="100%" height="100%" style={{overflow: 'hidden'}}>
          <motion.div  variants={{
    hidden : { opacity: 1, y: 0 },
    visible  :  { opacity: 0, y: 20 },}
  }
    initial="hidden"
    animate={mainControls}
    transition={{ duration: 1.5 , delay: 0.5 }}
    style={{position : "absolute",width: '100%', height: '100%', backgroundImage: 'url(/assets/coming-soon-banner.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', textAlign: 'center'}}
> 
          <div className="content">
            <h2>Coming Soon</h2>
            <div className="movie-grid">
              <Hero variant="1"></Hero>
              <Hero variant="2"></Hero>
              <Hero variant="3"></Hero>
             </div>
          </div>
          </motion.div>
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