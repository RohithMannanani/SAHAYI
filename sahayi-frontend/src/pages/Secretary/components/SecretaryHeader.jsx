import React from 'react';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function SecretaryHeader({
  unitInfo,
  searchQuery,
  setSearchQuery,
  onShowToast,
  onNavigateSettings
}) {
  // Retrieve member name loaded from database via unitInfo or fallback to logged in user details
  const getMemberName = () => {
    if (unitInfo?.secretaryName && unitInfo.secretaryName !== 'Unit Secretary') {
      return unitInfo.secretaryName;
    }
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed?.fullName) return parsed.fullName;
        if (parsed?.name) return parsed.name;
      }
    } catch (e) {
      console.error('Error reading logged in user:', e);
    }
    return unitInfo?.secretaryName || 'Secretary';
  };

  const memberName = getMemberName();
  const unitName = unitInfo?.unitName || 'Ayalkoottam Unit';

  return (
    <header className="sec-header">
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="sec-header__title">Secretary Dashboard</div>
        <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
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
          title={`${memberName} (${unitName})`}
        >
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
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
      </div>
    </header>
  );
}

export default SecretaryHeader;

