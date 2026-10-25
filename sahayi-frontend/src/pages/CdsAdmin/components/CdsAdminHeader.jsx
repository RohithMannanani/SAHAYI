import React from 'react';

function CdsAdminHeader({ searchQuery, setSearchQuery, initials, user, onOpenSettings, onLogout }) {
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
        <div className="cds-header__user" onClick={onOpenSettings} title="Go to Settings" style={{ cursor: 'pointer' }}>
          <div className="cds-header__avatar">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.fullName || 'CDS Admin'}
                onError={e => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentNode.textContent = initials;
                }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <span className="cds-header__username">{user?.fullName || 'CDS Admin'}</span>
        </div>

        {onLogout && (
          <button
            className="cds-header__logout-btn"
            onClick={onLogout}
            title="Logout"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #fee2e2',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginLeft: '8px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.borderColor = '#fca5a5';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.borderColor = '#fee2e2';
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default CdsAdminHeader;
