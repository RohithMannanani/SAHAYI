import React from 'react';
import { BarChart3, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';
import './FeaturesSection.css';

const features = [
  {
    id: 'finance',
    icon: <BarChart3 size={22} />,
    label: 'Total Financial Transparency',
    desc: 'Real-time ledger access for all members. Every penny tracked, every loan monitored, every dividend calculated automatically.',
    accent: '#2d5a27',
    wide: true,
  },
  {
    id: 'meetings',
    icon: <Calendar size={22} />,
    label: 'Smart Meetings',
    desc: 'Automated scheduling, digital attendance tracking, and instant minute generation.',
    accent: '#8b5cf6',
    wide: false,
  },
  {
    id: 'loans',
    icon: <ShieldCheck size={22} />,
    label: 'Loan Integrity',
    desc: 'Standardize loan applications with community voting and a complete repayment term data.',
    accent: '#1c3b18',
    wide: false,
    dark: true,
  },
];

function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="features-header">
          <span className="section-tag">FEATURES</span>
          <h2 className="section-heading">Everything your community needs.</h2>
        </div>

        <div className="features-grid">
          {/* Left large card */}
          <div className="feature-card feature-card--large" style={{ '--card-accent': features[0].accent }}>
            <div className="feature-card__content">
              <div className="feature-card__icon" style={{ background: `${features[0].accent}18`, color: features[0].accent }}>
                {features[0].icon}
              </div>
              <h3 className="feature-card__title">{features[0].label}</h3>
              <p className="feature-card__desc">{features[0].desc}</p>
              <a href="#" className="feature-link">
                Learn more <ArrowRight size={14} />
              </a>
            </div>
            <div className="feature-card__mock">
              <div className="mock-chart">
                <div className="mock-chart__bar" style={{ height: '40%', background: '#4a8a40' }} />
                <div className="mock-chart__bar" style={{ height: '65%', background: '#2d5a27' }} />
                <div className="mock-chart__bar" style={{ height: '55%', background: '#4a8a40' }} />
                <div className="mock-chart__bar" style={{ height: '80%', background: '#2d5a27' }} />
                <div className="mock-chart__bar" style={{ height: '60%', background: '#6ab04c' }} />
                <div className="mock-chart__bar" style={{ height: '90%', background: '#2d5a27' }} />
              </div>
              <div className="mock-stats-row">
                <div className="mock-stat">
                  <div className="mock-stat__val">₹1.2Cr</div>
                  <div className="mock-stat__label">Total Pool</div>
                </div>
                <div className="mock-stat">
                  <div className="mock-stat__val">342</div>
                  <div className="mock-stat__label">Members</div>
                </div>
                <div className="mock-stat">
                  <div className="mock-stat__val">98.4%</div>
                  <div className="mock-stat__label">Recovery</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column cards */}
          <div className="features-right">
            <div className="feature-card feature-card--sm" style={{ '--card-accent': features[1].accent }}>
              <div className="feature-card__icon" style={{ background: '#8b5cf618', color: '#8b5cf6' }}>
                {features[1].icon}
              </div>
              <h3 className="feature-card__title">{features[1].label}</h3>
              <p className="feature-card__desc">{features[1].desc}</p>
              <div className="mock-meeting-pill">
                <span className="meeting-dot" /> Next Meeting: Thu 7 PM
              </div>
            </div>

            <div className="feature-card feature-card--sm feature-card--dark" style={{ '--card-accent': features[2].accent }}>
              <div className="feature-card__icon" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                {features[2].icon}
              </div>
              <h3 className="feature-card__title" style={{ color: '#fff' }}>{features[2].label}</h3>
              <p className="feature-card__desc" style={{ color: 'rgba(255,255,255,0.7)' }}>{features[2].desc}</p>
              <div className="mock-loan-progress">
                <div className="loan-bar">
                  <div className="loan-bar__fill" style={{ width: '72%' }} />
                </div>
                <span className="loan-pct">72% repaid</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
