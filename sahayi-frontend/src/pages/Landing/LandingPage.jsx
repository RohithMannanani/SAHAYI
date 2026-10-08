import React, { useState, useEffect } from 'react';
import Navbar from './components/LandingNavbar';
import HeroSection from './components/HeroSection';
import TrustSection from './components/TrustSection';
import FeaturesSection from './components/FeaturesSection';
import ImpactSection from './components/ImpactSection';
import Footer from './components/LandingFooter';
import { fetchCdsAnalytics } from '../../services/api';
import './LandingPage.css';

function LandingPage() {
  const [dbMetrics, setDbMetrics] = useState({
    totalUnits: 0,
    activeUnits: 0,
    totalMembers: 0,
    totalSavings: 0,
    savingsLakhs: 0,
    loansDisbursed: 0,
    totalMeetings: 0,
    attendanceRate: 0
  });

  useEffect(() => {
    const loadRealData = async () => {
      try {
        const res = await fetchCdsAnalytics();
        if (res.data && res.data.overall) {
          const o = res.data.overall;
          setDbMetrics({
            totalUnits: o.totalUnits || 0,
            activeUnits: o.activeUnits || 0,
            totalMembers: o.totalMembers || 0,
            totalSavings: o.cdsTotalSavings || 0,
            savingsLakhs: o.cdsSavingsLakhs || 0,
            loansDisbursed: o.cdsLoansDisbursed || 0,
            totalMeetings: o.cdsTotalMeetings || 0,
            attendanceRate: o.cdsOverallAttendanceRate || 0
          });
        }
      } catch (err) {
        console.warn("Could not load real DB analytics for Landing Page, using fallback values:", err);
      }
    };
    loadRealData();
  }, []);

  useEffect(() => {
    // Smooth scrolling for internal anchor links (#home, #about, #features, #community)
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const targetEl = document.querySelector(href);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    };

    document.addEventListener('click', handleAnchorClick);

    // High performance IntersectionObserver for section scroll reveals
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing-root">
      <Navbar />
      <HeroSection metrics={dbMetrics} />
      <TrustSection />
      <FeaturesSection metrics={dbMetrics} />
      <ImpactSection metrics={dbMetrics} />
      <Footer />
    </div>
  );
}

export default LandingPage;
