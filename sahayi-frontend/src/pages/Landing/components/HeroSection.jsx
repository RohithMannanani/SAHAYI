import React from 'react';
import { ArrowRight, Play, TrendingUp } from 'lucide-react';
import './HeroSection.css';

function HeroSection() {
  return (
    <section className="hero" id="home">
      <div className="container hero__grid">
        {/* Left Content */}
        <div className="hero__content">
          <div className="hero__tag fade-up">
            <span className="tag-dot" />
            All-in-one Neighbourhood Tool
          </div>

          <h1 className="hero__title fade-up delay-1">
            Modern Governance for{' '}
            <span className="hero__title--accent">Stronger Communities.</span>
          </h1>

          <p className="hero__desc fade-up delay-2">
            Streamline your neighborhood self-help group with transparent financial tracking,
            automated reporting, and secure member communications. Built for collective prosperity.
          </p>

          <div className="hero__cta fade-up delay-3">
            <a href="/login" className="btn-primary">
              Get Started Today
              <ArrowRight size={16} />
            </a>
            <button className="btn-outline">
              <span className="play-icon">
                <Play size={13} fill="currentColor" />
              </span>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right Image */}
        <div className="hero__image-wrap fade-up delay-2">
          <div className="hero__image-frame">
            <img
              src="/community_hero.png"
              alt="Community members collaborating"
              className="hero__img"
            />
            {/* Floating stats card */}
            <div className="hero__stats-card">
              <div className="stats-card__icon">
                <TrendingUp size={16} />
              </div>
              <div>
                <div className="stats-card__label">Active Savings</div>
                <div className="stats-card__value">₹2.4L</div>
              </div>
              <div className="stats-card__badge">↑ 12%</div>
            </div>
          </div>

          {/* Decorative blobs */}
          <div className="hero__blob hero__blob--1" />
          <div className="hero__blob hero__blob--2" />
        </div>
      </div>

      {/* Bottom marquee / trust strip */}
      {/* <div className="hero__trust-strip">
        <div className="trust-inner">
          {['Self-Help Groups', 'Ayalkoottams', 'Housing Colonies', 'RWAs', 'Co-operatives', 'NGO Finance Cells', 'Women Collectives'].map((item, i) => (
            <React.Fragment key={i}>
              <span className="trust-item">{item}</span>
              <span className="trust-sep">·</span>
            </React.Fragment>
          ))}
        </div>
      </div> */}
    </section>
  );
}

export default HeroSection;
