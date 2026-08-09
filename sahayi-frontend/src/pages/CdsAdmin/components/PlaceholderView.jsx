import React from 'react';
import { useNavigate } from 'react-router-dom';
import { handleDynamicBack } from '../../../utils/navigation';

function PlaceholderView({ activeNav, setActiveNav }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (activeNav && activeNav !== 'dashboard' && setActiveNav) {
      setActiveNav('dashboard');
    } else {
      handleDynamicBack(navigate, '/cds-admin/dashboard');
    }
  };

  return (
    <div className="cds-placeholder-view">
      <div className="cds-placeholder-card">
        <h2>{activeNav ? activeNav.charAt(0).toUpperCase() + activeNav.slice(1) : ''} Module</h2>
        <p>This module is currently being optimized. Real-time data and analytics will be available shortly.</p>
        <button className="cds-action-btn cds-action-btn--primary" style={{ marginTop: 16 }} onClick={handleBack}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default PlaceholderView;

