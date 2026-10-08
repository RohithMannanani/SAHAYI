import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, TrendingUp, ChevronDown, Sparkles } from 'lucide-react';
import heroCommunityImage from '../../../assets/images/images.jpg';
import sahayiLogo from '../../../assets/images/sahayi_logo.jpg';
import './HeroSection.css';

// Atmospheric organic mist clusters
const MIST_PUFFS = [
  { size: '16rem', top: '24%', left: '30%', radius: '48% 52% 60% 40% / 42% 48% 52% 58%', rotate: -8 },
  { size: '14rem', top: '34%', left: '24%', radius: '50% 50% 38% 62% / 60% 45% 55% 40%', rotate: 12 },
  { size: '18rem', top: '28%', left: '48%', radius: '44% 56% 54% 46% / 48% 56% 44% 52%', rotate: -4 },
  { size: '15rem', top: '36%', left: '58%', radius: '58% 42% 46% 54% / 44% 50% 50% 56%', rotate: 14 },
  { size: '16rem', top: '38%', left: '68%', radius: '42% 58% 52% 48% / 50% 58% 42% 50%', rotate: -12 },
  { size: '14rem', top: '50%', left: '42%', radius: '52% 48% 56% 44% / 50% 50% 50% 50%', rotate: 8 }
];

function HeroSection({ metrics }) {
  const containerRef = useRef(null);
  const introStageRef = useRef(null);
  const realStageRef = useRef(null);
  const bgIntroRef = useRef(null);
  const bgFinalRef = useRef(null);
  const bloomRef = useRef(null);
  const cloudRef = useRef(null);
  const sunRef = useRef(null);
  const puffsRef = useRef(null);

  const savingsDisplay = metrics && metrics.totalSavings > 0
    ? (metrics.savingsLakhs > 0 ? `₹${metrics.savingsLakhs}L` : `₹${metrics.totalSavings.toLocaleString('en-IN')}`)
    : '₹4,200';

  useEffect(() => {
    let rafId = null;

    const updateScrollAnimation = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const p = Math.min(Math.max(-rect.top / totalScrollable, 0), 1);

      // Intro stage: cleanly fades out and floats upward within first 35% of scroll
      const introP = Math.min(Math.max(p / 0.35, 0), 1);
      const introOpacity = Math.max(0, 1 - introP * 1.15);
      const introY = -introP * 32;
      const introScale = 1 + introP * 0.03;

      if (introStageRef.current) {
        introStageRef.current.style.opacity = introOpacity;
        introStageRef.current.style.transform = `translate3d(0, ${introY}px, 0) scale(${introScale})`;
        introStageRef.current.style.visibility = p > 0.45 ? 'hidden' : 'visible';
        introStageRef.current.style.pointerEvents = p > 0.25 ? 'none' : 'auto';
      }

      // Real hero content stage: emerges between 12% and 48%, then rock-solid
      const contentP = Math.min(Math.max((p - 0.12) / 0.36, 0), 1);
      const contentOpacity = contentP;
      const contentY = (1 - contentP) * 26;
      const contentScale = 0.95 + contentP * 0.05;

      if (realStageRef.current) {
        realStageRef.current.style.opacity = contentOpacity;
        realStageRef.current.style.transform = `translate3d(0, ${contentY}px, 0) scale(${contentScale})`;
        realStageRef.current.style.visibility = p < 0.05 ? 'hidden' : 'visible';
        realStageRef.current.style.pointerEvents = p > 0.30 ? 'auto' : 'none';
      }

      // Smooth background canvas crossfade
      if (bgIntroRef.current) {
        bgIntroRef.current.style.opacity = Math.max(0, 1 - p * 2.8);
      }
      if (bgFinalRef.current) {
        bgFinalRef.current.style.opacity = Math.min(1, Math.max(0, (p - 0.08) * 2.5));
      }

      // Ambient solar bloom & sun
      if (bloomRef.current) {
        const bloom = Math.sin(Math.min(p / 0.55, 1) * Math.PI) * 0.40;
        bloomRef.current.style.opacity = bloom;
      }
      if (sunRef.current) {
        sunRef.current.style.opacity = Math.max(0, 1 - p * 2.5);
      }

      // Atmospheric cloud veil & mist puffs (smooth GPU-accelerated scaling and fade)
      const cloudFactor = Math.min(Math.max((p - 0.03) / 0.45, 0), 1);
      const cloudOp = Math.sin(cloudFactor * Math.PI) * 0.85;
      const cloudScale = 1 + cloudFactor * 0.25;

      if (cloudRef.current) {
        cloudRef.current.style.opacity = cloudOp;
        cloudRef.current.style.transform = `translate3d(0, 0, 0) scale(${cloudScale})`;
      }
      if (puffsRef.current) {
        puffsRef.current.style.opacity = cloudOp;
        puffsRef.current.style.transform = `translate3d(0, 0, 0) scale(${cloudScale})`;
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          updateScrollAnimation();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollAnimation();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToContent = (e) => {
    if (e) e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const totalScrollable = rect.height - window.innerHeight;
    const targetY = window.scrollY + rect.top + totalScrollable * 0.85;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  return (
    <section className="hero-scroll-wrapper" ref={containerRef} id="home">
      <div className="hero-sticky-frame">
        {/* Color changing background layers */}
        <div ref={bgIntroRef} className="hero-bg-layer hero-bg-layer--intro" />
        <div ref={bgFinalRef} className="hero-bg-layer hero-bg-layer--final" style={{ opacity: 0 }} />

        {/* Luminous Camera Bloom */}
        <div ref={bloomRef} className="hero-bloom-veil" style={{ opacity: 0 }} />

        {/* Ambient floating sun & color blobs */}
        <div ref={sunRef} className="hero__blob hero__blob--sun" />
        <div className="hero__blob hero__blob--1" />
        <div className="hero__blob hero__blob--2" />
        <div className="hero__blob hero__blob--center" />

        {/* Organic Cloud Mist Dissolve Veil */}
        <div ref={cloudRef} className="hero-cloud-veil" style={{ opacity: 0 }} />

        {/* Floating Mist Puffs Layer */}
        <div ref={puffsRef} className="hero-puffs-layer" style={{ opacity: 0 }}>
          {MIST_PUFFS.map((puff, i) => (
            <div
              key={i}
              className="hero-mist-puff"
              style={{
                width: puff.size,
                height: puff.size,
                top: puff.top,
                left: puff.left,
                borderRadius: puff.radius,
                transform: `translate(-50%, -50%) rotate(${puff.rotate}deg)`,
              }}
            />
          ))}
        </div>

        {/* STAGE 1: Initial Intro Stage (Logo + Heading SAHAYI + Title Tags) */}
        <div ref={introStageRef} className="hero-intro-stage">
          <div className="container intro-container">
            {/* Logo Badge */}
            <div className="intro__logo-badge">
              <img src={sahayiLogo} alt="SAHAYI Emblem" className="intro__logo-img" />
              <div className="intro__logo-glow" />
            </div>

            {/* Pill Tag */}
            <div className="intro__pill-tag">
              <Sparkles size={14} className="intro__sparkle-icon" />
              <span>Kerala Kudumbashree Ayalkoottam Digital Ecosystem</span>
            </div>

            {/* Main Big Headline */}
            <h1 className="intro__headline">
              Get ready for modern community empowerment —{' '}
              <span className="intro__headline--accent">SAHAYI</span>
            </h1>

            {/* Title Tags Strip */}
            <div className="intro__tag-strip">
              <span className="intro__tag-badge">🌱 Smart Micro-Savings</span>
              <span className="intro__tag-badge">⚖️ Transparent Ledgers</span>
              <span className="intro__tag-badge">🤝 Neighborhood Unity</span>
              <span className="intro__tag-badge">📊 Real-Time Analytics</span>
            </div>

            {/* Tagline / Subtitle */}
            <p className="intro__lead">
              A unified platform to streamline neighborhood self-help group governance, automated monthly meetings,
              and transparent financial accounting for collective growth.
            </p>

            {/* Scroll Indicator */}
            <div className="intro__scroll-prompt" onClick={scrollToContent} role="button" tabIndex={0}>
              <span className="scroll-prompt-text">Scroll down to explore</span>
              <div className="scroll-mouse-pill">
                <div className="scroll-mouse-wheel" />
              </div>
              <ChevronDown size={18} className="scroll-chevron-bounce" />
            </div>
          </div>
        </div>

        {/* STAGE 2: Real Content Stage (Hero Content) */}
        <div ref={realStageRef} className="hero-real-stage" style={{ opacity: 0, visibility: 'hidden' }}>
          <div className="container hero__grid">
            {/* Left Content */}
            <div className="hero__content">
              <div className="hero__tag">
                <span className="tag-dot" />
                Kudumbashree Ayalkoottam Management
              </div>

              <h2 className="hero__title">
                Modern Governance for{' '}
                <span className="hero__title--accent">Stronger Communities.</span>
              </h2>

              <p className="hero__desc">
                Streamline your neighborhood self-help group with transparent financial tracking,
                automated reporting, and secure member communications. Built for collective prosperity.
              </p>

              <div className="hero__cta">
                <Link to="/login" className="btn-primary">
                  Get Started Today
                  <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="btn-outline">
                  <span className="play-icon">
                    <Play size={13} fill="currentColor" />
                  </span>
                  Portal Login
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="hero__image-wrap">
              <div className="hero__image-frame">
                <img
                  src={heroCommunityImage}
                  alt="Kudumbashree Community Collaboration"
                  className="hero__img"
                />
                {/* Floating stats card */}
                <div className="hero__stats-card">
                  <div className="stats-card__icon">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <div className="stats-card__label">Active Total Savings</div>
                    <div className="stats-card__value">{savingsDisplay}</div>
                  </div>
                  <div className="stats-card__badge">Live DB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
