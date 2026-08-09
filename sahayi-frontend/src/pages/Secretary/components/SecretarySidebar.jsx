import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';

function SecretarySidebar({ activeTab, setActiveTab, unitInfo, onLogout }) {
  return (
    <aside className="sec-sidebar">
      <div className="sec-sidebar__top">
        <div className="sec-sidebar__header">
          <h2 className="sec-sidebar__title">Dashboard</h2>
          <p className="sec-sidebar__subtitle">{unitInfo.secretaryName}</p>
        </div>

        <nav className="sec-sidebar__nav">
          <button
            className={`sec-nav-item ${activeTab === 'dashboard' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="sec-nav-item__left">
              <LayoutDashboard size={19} />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            className={`sec-nav-item ${activeTab === 'members' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            <div className="sec-nav-item__left">
              <Users size={19} />
              <span>Members</span>
            </div>
          </button>

          <button
            className={`sec-nav-item ${activeTab === 'financials' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('financials')}
          >
            <div className="sec-nav-item__left">
              <CreditCard size={19} />
              <span>Financials</span>
            </div>
          </button>

          <button
            className={`sec-nav-item ${activeTab === 'meetings' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('meetings')}
          >
            <div className="sec-nav-item__left">
              <Calendar size={19} />
              <span>Meetings</span>
            </div>
          </button>

          <button
            className={`sec-nav-item ${activeTab === 'reports' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <div className="sec-nav-item__left">
              <BarChart3 size={19} />
              <span>Reports</span>
            </div>
          </button>
        </nav>
      </div>

      <div className="sec-sidebar__bottom">
        <div className="sec-sidebar__divider" />
        <button
          className={`sec-nav-item ${activeTab === 'settings' ? 'sec-nav-item--active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <div className="sec-nav-item__left">
            <Settings size={19} />
            <span>Settings</span>
          </div>
        </button>

        <button className="sec-nav-item sec-nav-item--logout" onClick={onLogout}>
          <div className="sec-nav-item__left">
            <LogOut size={19} />
            <span>Logout</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default SecretarySidebar;
