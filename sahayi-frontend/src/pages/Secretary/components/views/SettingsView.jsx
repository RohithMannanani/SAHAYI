import React from 'react';

function SettingsView({ unitInfo }) {
  return (
    <div className="sec-subview">
      <div className="sec-subview-header">
        <h2>Secretary Workspace Settings</h2>
      </div>
      <div className="sec-card">
        <div className="sec-profile-box">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
            alt="Profile"
            className="sec-profile-img"
            onError={e => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(unitInfo.secretaryName)}&background=0C382E&color=fff`;
            }}
          />
          <div>
            <h3>{unitInfo.secretaryName}</h3>
            <p style={{ color: '#666' }}>Role: Unit Secretary ({unitInfo.unitName})</p>
            <p style={{ color: '#666', fontSize: '13px' }}>
              Phone: {unitInfo.secretaryPhone || 'Not provided'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
