import React from 'react';

function CdsAdminHeader({ searchQuery, setSearchQuery, initials, user }) {
  return (
    <header className="cds-header">
      <span className="cds-header__logo">SAHAYI</span>

      <div className="cds-header__search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ab3a0" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search systems..."
        />
      </div>

      <div className="cds-header__spacer" />

      <div className="cds-header__actions">
        <button className="cds-header__icon-btn" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </button>
        <button className="cds-header__icon-btn" title="Help">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
          </svg>
        </button>
        <div className="cds-header__user">
          <div className="cds-header__avatar">{initials}</div>
          <span className="cds-header__username">{user.fullName || 'CDS Admin'}</span>
        </div>
      </div>
    </header>
  );
}

export default CdsAdminHeader;
