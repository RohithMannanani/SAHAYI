import React from 'react';
import './LandingFooter.css';

const links = {
  Product: ['Features', 'Pricing', 'Changelog', 'Documentation'],
  Company: ['About Us', 'Blog', 'Careers', 'Press Kit'],
  Community: ['SHG Groups', 'Forums', 'Events', 'Support'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact'],
};

function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="container">
        <div className="footer-top">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-mark">S</span>
              <span className="logo-text">SAHAYI</span>
            </div>
            <p className="footer-tagline">
              Community Governance System. Empowering communities for a better tomorrow.
            </p>
            <div className="footer-social">
              {['X', 'in', 'fb', 'yt'].map((s, i) => (
                <a key={i} href="#" className="social-chip" aria-label={s}>{s}</a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([group, items]) => (
            <div className="footer-col" key={group}>
              <h4 className="footer-col__heading">{group}</h4>
              <ul>
                {items.map(item => (
                  <li key={item}>
                    <a href="#">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© 2025 Sahayi Community Management System. Empowering communities, one click at a time.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
