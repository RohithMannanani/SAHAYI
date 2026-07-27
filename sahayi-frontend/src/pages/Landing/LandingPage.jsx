import React, { useState, useEffect } from 'react';
import Navbar from './components/LandingNavbar';
import HeroSection from './components/HeroSection';
import TrustSection from './components/TrustSection';
import FeaturesSection from './components/FeaturesSection';
import ImpactSection from './components/ImpactSection';
import Footer from './components/LandingFooter';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-root">
      <Navbar />
      <HeroSection />
      <TrustSection />
      <FeaturesSection />
      <ImpactSection />
      <Footer />
    </div>
  );
}

export default LandingPage;
