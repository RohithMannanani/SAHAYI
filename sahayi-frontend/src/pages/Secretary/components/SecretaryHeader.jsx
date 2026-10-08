import React from 'react';
import ProfileDropdown from '../../../components/common/ProfileDropdown';

import GlobalSearchDropdown from '../../../components/common/GlobalSearchDropdown';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function SecretaryHeader({
  unitInfo,
  currentUser,
  members,
  loans,
  meetings,
  onNavigate,
  searchQuery,
  setSearchQuery,
  onShowToast,
  onNavigateSettings,
  onLogout,
  onMenuClick
}) {
  // Retrieve member name and avatar loaded from database via unitInfo or fallback to logged in user details
  const getStoredUser = () => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) return JSON.parse(rawUser);
    } catch (e) {
      console.error('Error reading logged in user:', e);
    }
    return null;
  };

  const storedUser = getStoredUser();
  const effectiveUser = currentUser || storedUser;

  const getMemberName = () => {
    if (effectiveUser?.fullName) return effectiveUser.fullName;
    if (effectiveUser?.name) return effectiveUser.name;
    if (unitInfo?.secretaryName && unitInfo.secretaryName !== 'Unit Secretary') {
      return unitInfo.secretaryName;
    }
    return 'Secretary';
  };

  const memberName = getMemberName();
  const unitName = unitInfo?.unitName || effectiveUser?.unitName || 'Ayalkoottam Unit';
  const avatarUrl = effectiveUser?.avatarUrl || unitInfo?.secretaryAvatarUrl || null;

  return (
    <header className="sec-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          className="sec-header__hamburger"
          onClick={onMenuClick}
          title="Open Navigation"
        >
          <Icon d="M3 12h18M3 6h18M3 18h18" size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sec-header__title">Secretary Dashboard</div>
          <div
            className="sec-header__subtitle"
            style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', cursor: 'pointer' }}
            onClick={onNavigateSettings}
            title="Go to Settings"
          >
            <span>{memberName}</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span style={{ color: '#059669' }}>{unitName}</span>
          </div>
        </div>
      </div>

      <div className="sec-header__right">
        <GlobalSearchDropdown 
          className="sec-search-bar"
          members={members}
          loans={loans}
          meetings={meetings}
          onSelectResult={(type, item) => {
            if (type === 'member' && onNavigate) onNavigate('members');
            else if (type === 'loan' && onNavigate) onNavigate('loans');
            else if (type === 'meeting' && onNavigate) onNavigate('meetings');
          }}
        />


        <ProfileDropdown
          user={{
            fullName: memberName,
            avatarUrl: avatarUrl
          }}
          role="Secretary"
          unitName={unitName}
          onNavigateSettings={onNavigateSettings}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

export default SecretaryHeader;

