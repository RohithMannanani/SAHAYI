import React from 'react';
import Icon from './Icon';

function CdsAdminSidebar({ activeNav, setActiveNav, setSelectedUnit, setIsRecordModalOpen, handleLogout, navItems }) {
  return (
    <aside className="cds-sidebar">
      <div className="cds-sidebar__brand">
        <div className="cds-sidebar__logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="white" />
          </svg>
        </div>
        <div className="cds-sidebar__brand-text">
          <span className="cds-sidebar__role">CDS Admin</span>
          <span className="cds-sidebar__subrole">Community Growth</span>
        </div>
      </div>

      <nav className="cds-sidebar__nav">
        {navItems.map(item => (
          <button
            key={item.key}
            className={`cds-nav-item${activeNav === item.key ? ' active' : ''}`}
            onClick={() => {
              setActiveNav(item.key);
              setSelectedUnit(null);
            }}
          >
            <Icon d={item.icon} size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="cds-sidebar__new-btn" onClick={() => setIsRecordModalOpen(true)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        <span>New Record</span>
      </button>

      <div className="cds-sidebar__bottom">
        <button className="cds-nav-item" onClick={() => { }}>
          <Icon d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" size={16} />
          <span>Settings</span>
        </button>
        <button className="cds-nav-item" onClick={handleLogout}>
          <Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default CdsAdminSidebar;
