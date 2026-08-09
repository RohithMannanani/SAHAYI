import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

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
      }
    } catch (e) {
      console.error('Error reading logged in user:', e);
    }
    return unitInfo?.secretaryName || 'Unit Secretary';
  };

  const memberName = getMemberName();

  return (
    <header className="sec-navbar">
      <div className="sec-navbar__brand">
        SAHAYI <span style={{ fontSize: '13px', opacity: 0.8, fontWeight: 'normal' }}>| {unitInfo?.unitName || 'Ayalkoottam Unit'}</span>
      </div>

      <div className="sec-navbar__search-container">
        <Search size={18} className="sec-navbar__search-icon" />
        <input
          type="text"
          className="sec-navbar__search-input"
          placeholder="Search members or loan requests..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="sec-navbar__actions">
        <button
          className="sec-navbar__icon-btn"
          title="Notifications"
          onClick={() => onShowToast('No new notifications')}
        >
          <Bell size={20} />
          <span className="sec-navbar__badge-dot" />
        </button>
        <button
          className="sec-navbar__icon-btn"
          title="Help & Support"
          onClick={() => onShowToast('Help Center: Contact CDS Admin for assistance.')}
        >
          <HelpCircle size={20} />
        </button>

        <div
          className="sec-navbar__user-profile"
          onClick={onNavigateSettings}
          title={`${memberName} (Secretary)`}
        >
          <div className="sec-navbar__user-info">
            <span className="sec-navbar__user-name">{memberName}</span>
            <span className="sec-navbar__user-role">Secretary</span>
          </div>
          <div className="sec-navbar__avatar">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
              alt={memberName}
              onError={e => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=0C382E&color=fff`;
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default SecretaryHeader;

