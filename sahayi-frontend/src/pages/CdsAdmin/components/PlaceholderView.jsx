import React from 'react';

function PlaceholderView({ activeNav, setActiveNav }) {
  return (
    <div className="cds-placeholder-view">
      <div className="cds-placeholder-card">
        <h2>{activeNav.charAt(0).toUpperCase() + activeNav.slice(1)} Module</h2>
        <p>This module is currently being optimized. Real-time data and analytics will be available shortly.</p>
        <button className="cds-action-btn cds-action-btn--primary" style={{ marginTop: 16 }} onClick={() => setActiveNav('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default PlaceholderView;
