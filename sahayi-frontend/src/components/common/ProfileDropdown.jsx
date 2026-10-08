import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, LogOut, Shield } from 'lucide-react';
import './ProfileDropdown.css';

function ProfileDropdown({
  user,
  role = '',
  unitName = '',
  avatarUrl = null,
  initials = '',
  onNavigateSettings,
  onLogout
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);

  const displayName = user?.fullName || user?.name || 'User';
  const displayUnit = unitName || user?.unitName || '';
  const displayRole = role || user?.role || user?.roleName || 'Member';

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0C382E&color=fff`;
  const effectiveAvatar = avatarUrl || user?.avatarUrl || defaultAvatar;

  // Mouse enter: immediately open & cancel any pending close timer
  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsOpen(true);
  };

  // Mouse leave: give a 200ms grace period so user can move mouse into popup
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSettingsClick = () => {
    setIsOpen(false);
    if (onNavigateSettings) onNavigateSettings();
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <div
      className="profile-dropdown-wrapper"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger Button */}
      <div
        className={`profile-trigger-btn ${isOpen ? 'is-active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title="Account Profile & Settings"
      >
        <img
          src={effectiveAvatar}
          alt={displayName}
          className="profile-trigger-avatar"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultAvatar;
          }}
        />
        <div className="profile-trigger-info">
          <span className="profile-trigger-name">{displayName}</span>
          <span className="profile-trigger-sub">{displayUnit || displayRole}</span>
        </div>
        <ChevronDown size={14} className="profile-trigger-chevron" />
      </div>

      {/* Pop-up Dropdown Menu */}
      {isOpen && (
        <div className="profile-popup-menu">
          <div className="profile-popup-header">
            <img
              src={effectiveAvatar}
              alt={displayName}
              className="profile-popup-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultAvatar;
              }}
            />
            <div className="profile-popup-user-details">
              <span className="profile-popup-fullname">{displayName}</span>
              {displayUnit && <span className="profile-popup-unit">{displayUnit}</span>}
              <span className="profile-popup-role-badge">
                <Shield size={10} />
                {displayRole}
              </span>
            </div>
          </div>

          <div className="profile-popup-menu-list">
            {onNavigateSettings && (
              <button
                type="button"
                className="profile-popup-item"
                onClick={handleSettingsClick}
              >
                <User size={15} style={{ color: '#059669' }} />
                <span>Profile & Settings</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                className="profile-popup-item profile-popup-item--logout"
                onClick={handleLogoutClick}
              >
                <LogOut size={15} style={{ color: '#dc2626' }} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;
