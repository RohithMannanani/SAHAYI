import React from 'react';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function SecretaryHeader({
  unitInfo,
  currentUser,
  searchQuery,
  setSearchQuery,
  onShowToast,
  onNavigateSettings,
  onLogout
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
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="sec-header__title">Secretary Dashboard</div>
        <div
          style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', cursor: 'pointer' }}
          onClick={onNavigateSettings}
          title="Go to Settings"
        >
          <span>{memberName}</span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ color: '#059669' }}>{unitName}</span>
        </div>
      </div>

      <div className="sec-header__right">
        <div className="sec-search-bar">
          <Icon d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" size={15} stroke="#809986" />
          <input
            type="text"
            placeholder="Search members, loans..."
            value={searchQuery || ''}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="sec-header__icon-btn" onClick={() => onShowToast && onShowToast('No new notifications')}>
          <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={17} />
          <span className="sec-header__badge" />
        </button>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={onNavigateSettings}
          title="Go to Settings"
        >
          <img
            src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=0C382E&color=fff`}
            alt={memberName}
            className="sec-user-avatar"
            onError={e => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=0C382E&color=fff`;
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0c382e' }}>
              {memberName}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              {unitName}
            </span>
          </div>
        </div>

        {onLogout && (
          <button
            className="sec-header__logout-btn"
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
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={15} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default SecretaryHeader;

