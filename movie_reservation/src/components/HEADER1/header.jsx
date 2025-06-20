import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaBars, FaTimes, FaTicketAlt } from "react-icons/fa";
import { useState, useEffect } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Track scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Now Playing", href: "#now-playing", icon: <FaTicketAlt /> },
    { name: "Coming Soon", href: "#coming-soon", icon: <FaTicketAlt /> },
    { name: "Theaters", href: "#theaters", icon: <FaTicketAlt /> },
    { name: "Special Offers", href: "#offers", icon: <FaTicketAlt /> },
  ];

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 1.5 }
    },
    scrolled: {
      backgroundColor: "rgba(17, 24, 39, 0.95)",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, height: 0 }
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.header
      initial="hidden"
      animate={["visible", isScrolled ? "scrolled" : ""]}
      variants={headerVariants}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 1000,
        backgroundColor: "#111827",
        color: "white",
      }}
    >
      {/* Logo */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <FaTicketAlt style={{ color: "#ef4444", fontSize: "1.5rem" }} />
        <span style={{ 
          fontSize: "1.5rem",
          fontWeight: "bold",
          background: "linear-gradient(to right, #ef4444, #f59e0b)",
          WebkitBackgroundClip: "text",
          color: "transparent"
        }}>
          CineReserve
        </span>
      </motion.div>

      {/* Desktop Navigation */}
      <nav style={{ display: "none", gap: "2rem", alignItems: "center" }}>
        {navLinks.map((link) => (
          <motion.a
            key={link.name}
            href={link.href}
            whileHover={{ 
              color: "#ef4444",
              y: -2
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 500,
              textDecoration: "none",
              color: "white",
            }}
          >
            {link.icon}
            {link.name}
          </motion.a>
        ))}
      </nav>

      {/* Search Bar - Desktop */}
      <motion.div
        whileFocus={{ scale: 1.02 }}
        style={{
          display: "none",
          alignItems: "center",
          background: "#1f2937",
          borderRadius: "2rem",
          padding: "0.5rem 1rem",
          width: "300px",
        }}
      >
        <FaSearch style={{ color: "#9ca3af", marginRight: "0.5rem" }} />
        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "white",
            width: "100%",
          }}
        />
      </motion.div>

      {/* User Section */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.5rem 1rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Sign In
        </motion.button>
        
        {/* Mobile Menu Toggle */}
        <motion.button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#1f2937",
              overflow: "hidden",
              zIndex: 999,
            }}
          >
            <div style={{ padding: "1rem 2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Mobile Search */}
              <motion.div
                variants={navItemVariants}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#374151",
                  borderRadius: "2rem",
                  padding: "0.5rem 1rem",
                }}
              >
                <FaSearch style={{ color: "#9ca3af", marginRight: "0.5rem" }} />
                <input
                  type="text"
                  placeholder="Search movies..."
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "white",
                    width: "100%",
                  }}
                />
              </motion.div>

              {/* Mobile Nav Links */}
              {navLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  variants={navItemVariants}
                  whileHover={{ color: "#ef4444" }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "white",
                    textDecoration: "none",
                    padding: "0.5rem 0",
                    fontWeight: 500,
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  {link.name}
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;