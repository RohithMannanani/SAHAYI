import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  PiggyBank,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Banknote,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function SecretarySidebar({ activeTab, setActiveTab, unitInfo, onLogout, onOpenOwnSavings, sidebarCollapsed, setSidebarCollapsed }) {
  const toggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    sessionStorage.setItem('sec_sidebar_collapsed', String(next));
  };

  return (
    <aside className={`sec-sidebar ${sidebarCollapsed ? 'sec-sidebar--collapsed' : ''}`}>
      <div className="sec-sidebar__top">
        <div className="sec-sidebar__header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h2 className="sec-sidebar__title">{!sidebarCollapsed ? 'SAHAYI' : 'S'}</h2>
            <div 
               style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
               onClick={toggleCollapse}
               title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={19} color="#aaa" /> : <ChevronLeft size={19} color="#aaa" />}
            </div>
          </div>
          {!sidebarCollapsed && (
            <p
              className="sec-sidebar__subtitle"
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveTab('settings')}
              title="Go to Settings"
            >
              {unitInfo.secretaryName}
            </p>
          )}
        </div>

        <nav className="sec-sidebar__nav">
          <button
            className={`sec-nav-item ${activeTab === 'dashboard' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            title={sidebarCollapsed ? "Dashboard" : ""}
          >
            <div className="sec-nav-item__left">
              <LayoutDashboard size={19} />
              <span>Dashboard</span>
            </div>
          </button>

          <button
            className={`sec-nav-item ${activeTab === 'members' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('members')}
            title={sidebarCollapsed ? "Members" : ""}
          >
            <div className="sec-nav-item__left">
              <Users size={19} />
              <span>Members</span>
            </div>
          </button>

          <button
            className={`sec-nav-item ${activeTab === 'financials' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('financials')}
            title={sidebarCollapsed ? "Financials" : ""}
          >
            <div className="sec-nav-item__left">
              <CreditCard size={19} />
              <span>Financials</span>
            </div>
          </button>

          {onOpenOwnSavings && (
            <button
              className="sec-nav-item"
              onClick={onOpenOwnSavings}
              title={sidebarCollapsed ? "View Own Savings" : "View my own personal weekly savings history"}
            >
              <div className="sec-nav-item__left">
                <PiggyBank size={19} style={{ color: '#10b981' }} />
                <span>View Own Savings</span>
              </div>
            </button>
          )}

          <button
            className={`sec-nav-item ${activeTab === 'meetings' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('meetings')}
            title={sidebarCollapsed ? "Meetings" : ""}
          >
            <div className="sec-nav-item__left">
              <Calendar size={19} />
              <span>Meetings</span>
            </div>
          </button>

          <button
            className={`sec-nav-item ${activeTab === 'loans' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('loans')}
            title={sidebarCollapsed ? "Loans" : ""}
          >
            <div className="sec-nav-item__left">
              <Banknote size={19} />
              <span>Loans</span>
            </div>
          </button>

          <button
            className={`sec-nav-item ${activeTab === 'reports' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('reports')}
            title={sidebarCollapsed ? "Reports" : ""}
          >
            <div className="sec-nav-item__left">
              <BarChart3 size={19} />
              <span>Reports</span>
            </div>
          </button>

          <button
            className={`sec-nav-item ${activeTab === 'chat' ? 'sec-nav-item--active' : ''}`}
            onClick={() => setActiveTab('chat')}
            title={sidebarCollapsed ? "Chats" : ""}
          >
            <div className="sec-nav-item__left">
              <MessageSquare size={19} />
              <span>Chats</span>
            </div>
          </button>
        </nav>
      </div>

      <div className="sec-sidebar__bottom">
        <div className="sec-sidebar__divider" />
        <button
          className={`sec-nav-item ${activeTab === 'settings' ? 'sec-nav-item--active' : ''}`}
          onClick={() => setActiveTab('settings')}
          title={sidebarCollapsed ? "Settings" : ""}
        >
          <div className="sec-nav-item__left">
            <Settings size={19} />
            <span>Settings</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default SecretarySidebar;
