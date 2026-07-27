import React, { useState, useEffect } from 'react';
import { Bell, Settings, Menu, X } from 'lucide-react';
import './LandingNavbar.css';

function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
      <div className="landing-nav__inner container">
        {/* Logo */}
        <a href="#home" className="landing-nav__logo">
          <span className="logo-mark">S</span>
          <span className="logo-text">SAHAYI</span>
        </a>

        {/* Desktop links */}
        <nav className="landing-nav__links">
          <a href="#about">About Us</a>
          <a href="#features">Features</a>
          <a href="#community">Community</a>
        </nav>

        {/* Actions */}
        <div className="landing-nav__actions">
          <button className="icon-btn" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <button className="icon-btn" aria-label="Settings">
            <Settings size={18} />
          </button>
          <a href="/login" className="btn-login">Login →</a>
        </div>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <a href="#about" onClick={() => setMenuOpen(false)}>About Us</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#community" onClick={() => setMenuOpen(false)}>Community</a>
          <a href="/login" className="btn-login">Login →</a>
        </div>
      )}
    </header>
  );
}

export default LandingNavbar;
