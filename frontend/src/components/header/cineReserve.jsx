import { useState, useEffect } from "react";
import { FaTicketAlt } from "react-icons/fa";
const ResponsiveLogo = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const style = {
    fontWeight: "bold",
    fontSize: isMobile ? "1rem" : "1.5rem",
    background: "linear-gradient(to right, #ef4444, #f59e0b)",
    WebkitBackgroundClip: "text",
    color: "transparent",
  };

  return<div  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
    <FaTicketAlt style={{ fontSize: "2rem", color: "#ef4444" , display : isMobile? "none": "block"   }} />
    <span style={style}>CineReserve</span>
  </div> 
  
};
export default ResponsiveLogo;