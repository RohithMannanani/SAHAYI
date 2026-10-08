import React from 'react';
import ProfileDropdown from '../../../components/common/ProfileDropdown';
import GlobalSearchDropdown from '../../../components/common/GlobalSearchDropdown';

function CdsAdminHeader({ searchQuery, setSearchQuery, initials, user, units, onSelectResult, onOpenSettings, onLogout, onMenuClick }) {
  return (
    <header className="cds-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          className="cds-header__hamburger"
          onClick={onMenuClick}
          title="Open Navigation"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <span className="cds-header__logo">SAHAYI</span>
      </div>

      <GlobalSearchDropdown
        className="cds-header__search"
        placeholder="Search systems, units..."
        units={units}
        onSelectResult={onSelectResult}
      />

      <div className="cds-header__spacer" />

      <div className="cds-header__actions">

        <ProfileDropdown
          user={{
            fullName: user?.fullName || 'CDS Admin',
            avatarUrl: user?.avatarUrl
          }}
          role="CDS Admin"
          unitName="Kudumbashree CDS"
          initials={initials}
          onNavigateSettings={onOpenSettings}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

export default CdsAdminHeader;
