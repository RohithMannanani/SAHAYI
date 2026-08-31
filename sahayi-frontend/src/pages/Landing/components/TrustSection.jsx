import React from 'react';
import { Shield, TrendingUp, Users } from 'lucide-react';
import './TrustSection.css';

const pillars = [
  {
    icon: <Shield size={24} />,
    title: 'Stewardship',
    desc: 'Maintaining the careful management of community resources with absolute transparency and integrity.',
  },
  {
    icon: <TrendingUp size={24} />,
    title: 'Growth',
    desc: 'Empowering groups to see their financial trajectory, apply filters, and measure impact.',
  },
  {
    icon: <Users size={24} />,
    title: 'Collective',
    desc: 'Creating community where every member actively contributes and is accountable to all.',
  },
];

function TrustSection() {
  return (
    <section className="trust-section" id="about">
      <div className="container trust-inner">
        <div className="trust-header">
          <h2 className="section-heading">
            Rooted in Trust, Driven by Data
          </h2>
          <p className="section-subheading">
            SAHAYI was born from the need to modernize the traditional Kudumbashree Ayalkoottam neighborhood group structure.
            We provide the tools that allow leaders to focus on growth while our system handles the complexity of financial transparency.
          </p>
        </div>

        <div className="trust-pillars">
          {pillars.map((p, i) => (
            <div className="trust-pillar" key={i}>
              <div className="trust-pillar__icon">{p.icon}</div>
              <h3 className="trust-pillar__title">{p.title}</h3>
              <p className="trust-pillar__desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustSection;
