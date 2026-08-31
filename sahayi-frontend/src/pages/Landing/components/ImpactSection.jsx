import React, { useEffect, useRef, useState } from 'react';
import { Quote } from 'lucide-react';
import './ImpactSection.css';

function useCountUp(target, duration = 2000, suffix = '') {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const observed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !observed.current) {
          observed.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
            else setCount(target);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function ImpactSection({ metrics }) {
  const targetMembers = metrics && metrics.totalMembers > 0 ? metrics.totalMembers : 42;
  const targetSavings = metrics && metrics.totalSavings > 0 ? metrics.totalSavings : 4200;

  const members = useCountUp(targetMembers);
  const assets = useCountUp(Math.max(1, Math.round(targetSavings / 1000)));

  return (
    <section className="impact-section" id="community">
      <div className="container">
        <div className="impact-grid">
          {/* Left */}
          <div className="impact-left" ref={members.ref}>
            <span style={{ color: 'rgba(255, 255, 255, 1)', fontSize: '18px' }} className="section-tag impact-tag">OUR IMPACT</span>
            <h2 className="section-heading" style={{ color: '#ffffff' }}>
              Empowering Communities Across Panchayath Wards.
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem', lineHeight: 1.75, marginTop: 12 }}>
              Connecting Ayalkoottam units and members into a unified digital ecosystem.
              Real-time transparent weekly savings, automated bank deposits, and instant decision support.
            </p>
            <div className="impact-stats">
              <div className="impact-stat">
                <div className="impact-stat__val">{members.count}+</div>
                <div className="impact-stat__label">Active Registered Members</div>
              </div>
              <div className="impact-divider" />
              <div className="impact-stat" ref={assets.ref}>
                <div className="impact-stat__val">₹{targetSavings.toLocaleString('en-IN')}</div>
                <div className="impact-stat__label">Total Community Savings</div>
              </div>
            </div>
          </div>

          {/* Right testimonial */}
          <div className="impact-right">
            <div className="testimonial-card">
              <Quote size={28} className="testimonial-quote-icon" />
              <p className="testimonial-text">
                "Sahayi has been transforming the way we manage our finances. 
                The transparency it provides has built a level of trust we never thought possible."
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">LS</div>
                <div>
                  <div className="author-name">Lekshmi S.</div>
                  <div className="author-role">President, Nalini SHG</div>
                </div>
              </div>

              {/* mini rating stars */}
              <div className="testimonial-stars">
                {'★'.repeat(5)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ImpactSection;
