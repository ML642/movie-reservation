import React from 'react';
import {useState ,useRef ,  useEffect} from "react"
import Footer from "../components/Foter/Footer";
import Header from "../components/HEADER1/header";

import * as THREE from 'three';
import WAVES from 'vanta/dist/vanta.waves.min';
import FOG from 'vanta/dist/vanta.fog.min';



const MovieList = () => { 
    const vantaRef = useRef(null);
    const [vanta_effect, setVantaEffect] = useState(null);
    
   useEffect(() =>{
    if(!vanta_effect && vantaRef.current){
        setVantaEffect(
            FOG({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            highlightColor: 0x0,
            midtoneColor: 0x655755,
            lowlightColor: 0x31198b,
            baseColor: 0x383434, 
            THREE: THREE,
            speed: 1.00,
            })
            )
    }
    

return ()=> {
        if(vanta_effect) vanta_effect.destroy();
    }

   }, [])

   return (
    <div> 
   <Header/>
   <div style = {{ height : " 1000px" }} ref={vantaRef}>
   
  
     </div>
  <Footer/>   
</div>
   )
}

export default MovieList ;