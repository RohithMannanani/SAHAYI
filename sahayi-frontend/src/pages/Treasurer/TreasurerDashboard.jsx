import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TreasurerDashboard.css';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const transactions = [
  { id: 1, name: 'Meera Krishnan', date: 'Oct 24, 2023', type: 'Repayment',   typeColor: 'repayment', amount: '₹5,200', status: 'Success' },
  { id: 2, name: 'Suresh Nair',    date: 'Oct 23, 2023', type: 'New Loan',    typeColor: 'loan',      amount: '₹2500',  status: 'Success' },
  { id: 3, name: 'Anita Philip',   date: 'Oct 23, 2023', type: 'Monthly Fee', typeColor: 'fee',       amount: '₹1,500', status: 'Pending' },
  { id: 4, name: 'Rajesh Kumar',   date: 'Oct 22, 2023', type: 'Repayment',   typeColor: 'repayment', amount: '₹3,400', status: 'Success' },
];

function TreasurerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('treasurer_active_tab') || 'financials';
  });

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('treasurer_active_tab', activeTab);
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login', { replace: true });
    window.location.replace('/login');
  };

  return (
    <div className="tr-container">
      {/* ── Left Sidebar ── */}
      <aside className="tr-sidebar">
        <div>
          {/* Brand */}
          <div className="tr-sidebar__brand">
            <div className="tr-brand-title">CSD</div>
            <div className="tr-brand-title">Admin</div>
            <div className="tr-brand-sub">Community Growth</div>
          </div>

          {/* Nav Links */}
          <nav className="tr-sidebar__nav">
            <div
              className={`tr-nav-item ${activeTab === 'dashboard' ? 'tr-nav-item--active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Icon d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" size={17} />
              <span>Dashboard</span>
            </div>

            <div
              className={`tr-nav-item ${activeTab === 'members' ? 'tr-nav-item--active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={17} />
              <span>Members</span>
            </div>

            <div
              className={`tr-nav-item ${activeTab === 'financials' ? 'tr-nav-item--active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" size={17} />
              <span>Financials</span>
            </div>

            <div
              className={`tr-nav-item ${activeTab === 'meetings' ? 'tr-nav-item--active' : ''}`}
              onClick={() => setActiveTab('meetings')}
            >
              <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" size={17} />
              <span>Meetings</span>
            </div>

            <div
              className={`tr-nav-item ${activeTab === 'reports' ? 'tr-nav-item--active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <Icon d="M18 20V10M12 20V4M6 20v-6" size={17} />
              <span>Reports</span>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="tr-sidebar__footer">
          <button className="tr-btn-new-record">
            <Icon d="M12 5v14M5 12h14" size={16} stroke="#ffffff" />
            <span>New Record</span>
          </button>

          <div className="tr-sidebar__divider" />

          <div className="tr-nav-item" onClick={() => setActiveTab('settings')}>
            <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={17} />
            <span>Settings</span>
          </div>

          <div className="tr-nav-item" onClick={handleLogout}>
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={17} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="tr-main">
        {/* Header */}
        <header className="tr-header">
          <div className="tr-header__title">Financial Dashboard</div>

          <div className="tr-header__right">
            <div className="tr-search-bar">
              <Icon d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" size={15} stroke="#809986" />
              <input type="text" placeholder="Search transactions..." />
            </div>

            <button className="tr-header__icon-btn">
              <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={17} />
              <span className="tr-header__badge" />
            </button>

            <button className="tr-header__icon-btn">
              <Icon d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" size={17} />
            </button>

            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"
              alt="Treasurer Avatar"
              className="tr-user-avatar"
            />
          </div>
        </header>

        {/* ── Page Content ── */}
        <div className="tr-content">

          {/* ── Top Cards Row ── */}
          <div className="tr-top-cards">
            {/* Card 1: Total Fund / Available Balance */}
            <div className="tr-fin-card tr-fin-card--balance">
              <div className="tr-fin-card__head">
                <div className="tr-fin-icon">
                  <Icon d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" size={20} />
                </div>
                <span className="tr-total-fund-badge">Total Fund</span>
              </div>
              <div className="tr-fin-card__label">Available Balance</div>
              <div className="tr-fin-card__value">₹4,82,450</div>
              <div className="tr-fin-card__trend">
                <Icon d="M23 6l-9.5 9.5-5-5L1 18" size={12} stroke="#2e8b46" />
                <span>+12.5% from last month</span>
              </div>
            </div>

            {/* Card 2: Active Loans */}
            <div className="tr-fin-card tr-fin-card--loans">
              <div className="tr-fin-card__head">
                <div className="tr-fin-icon tr-fin-icon--loan">
                  <Icon d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z" size={20} />
                </div>
                <span className="tr-fin-card__label-sm">Active Loans</span>
              </div>
              <div className="tr-loans-amounts">
                <span className="tr-loans-out">₹2,15,000 Out</span>
                <span className="tr-loans-target">Target: ₹3,00,000</span>
              </div>
              <div className="tr-loans-progress-wrap">
                <div className="tr-loans-progress-bar">
                  <div className="tr-loans-progress-fill" style={{ width: '72%' }} />
                </div>
              </div>
              <div className="tr-loans-members">42 Active Members</div>
              <button className="tr-loans-link">View Details →</button>
            </div>

            {/* Card 3: Record Repayment (Dark CTA) */}
            <div className="tr-fin-card tr-fin-card--cta tr-fin-card--dark">
              <div className="tr-cta-icon">
                <Icon d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z" size={28} stroke="#ffffff" />
              </div>
              <div className="tr-cta-label">Record Repayment</div>
            </div>

            {/* Card 4: Generate Receipt */}
            <div className="tr-fin-card tr-fin-card--cta">
              <div className="tr-cta-icon tr-cta-icon--light">
                <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6" size={28} stroke="#1b432c" />
              </div>
              <div className="tr-cta-label tr-cta-label--light">Generate Receipt</div>
            </div>
          </div>

          {/* ── Middle Section: Transactions + Right Panel ── */}
          <div className="tr-middle-row">
            {/* Transactions Table Card */}
            <div className="tr-table-card">
              <div className="tr-table-head">
                <h2 className="tr-table-title">Latest Financial Transactions</h2>
                <div className="tr-table-actions">
                  <button className="tr-icon-btn">
                    <Icon d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" size={15} />
                  </button>
                  <button className="tr-icon-btn">
                    <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={15} />
                  </button>
                </div>
              </div>

              <table className="tr-table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td className="tr-td-name">{tx.name}</td>
                      <td className="tr-td-date">{tx.date}</td>
                      <td>
                        <span className={`tr-type-badge tr-type-badge--${tx.typeColor}`}>{tx.type}</span>
                      </td>
                      <td className={`tr-td-amount ${tx.typeColor === 'loan' ? 'tr-td-amount--loan' : ''}`}>
                        {tx.amount}
                      </td>
                      <td>
                        <span className={`tr-status-badge tr-status-badge--${tx.status.toLowerCase()}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="tr-table-footer">
                <button className="tr-view-all">View All Transactions</button>
              </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="tr-right-panel">
              {/* Report Center */}
              <div className="tr-report-center">
                <div className="tr-report-center__head">
                  <div className="tr-report-icon">
                    <Icon d="M18 20V10M12 20V4M6 20v-6" size={16} />
                  </div>
                  <span className="tr-report-title">Report Center</span>
                </div>
                <p className="tr-report-desc">
                  Generate comprehensive financial audits and growth statements for the community council.
                </p>

                {/* Report Items */}
                <div className="tr-report-items">
                  <div className="tr-report-item">
                    <div className="tr-report-item__left">
                      <div className="tr-report-item__icon">
                        <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6" size={15} />
                      </div>
                      <div>
                        <div className="tr-report-item__name">Monthly Statement</div>
                        <div className="tr-report-item__sub">Last updated: 2 days ago</div>
                      </div>
                    </div>
                    <Icon d="M9 18l6-6-6-6" size={15} stroke="#828a85" />
                  </div>

                  <div className="tr-report-item">
                    <div className="tr-report-item__left">
                      <div className="tr-report-item__icon">
                        <Icon d="M23 6l-9.5 9.5-5-5L1 18" size={15} />
                      </div>
                      <div>
                        <div className="tr-report-item__name">Loan Performance</div>
                        <div className="tr-report-item__sub">Portfolio health report</div>
                      </div>
                    </div>
                    <Icon d="M9 18l6-6-6-6" size={15} stroke="#828a85" />
                  </div>

                  <div className="tr-report-item">
                    <div className="tr-report-item__left">
                      <div className="tr-report-item__icon">
                        <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6" size={15} />
                      </div>
                      <div>
                        <div className="tr-report-item__name">Annual Audit</div>
                        <div className="tr-report-item__sub">FY 2023-24 Draft</div>
                      </div>
                    </div>
                    <Icon d="M9 18l6-6-6-6" size={15} stroke="#828a85" />
                  </div>
                </div>

                <button className="tr-btn-generate-report">
                  <Icon d="M18 20V10M12 20V4M6 20v-6" size={16} stroke="#ffffff" />
                  Generate Custom Report
                </button>
              </div>

              {/* Collective Progress Card */}
              <div className="tr-collective-card">
                <div className="tr-collective-label">Collective Progress</div>
                <p className="tr-collective-desc">
                  Empowering 12 new families this quarter through micro-loans.
                </p>
                <div className="tr-collective-avatars">
                  <div className="tr-avatar-circle" style={{ background: '#c5cfc6' }}>SM</div>
                  <div className="tr-avatar-circle" style={{ background: '#b0bbb1', marginLeft: '-10px' }}>RK</div>
                  <div className="tr-avatar-circle" style={{ background: '#9aaa9b', marginLeft: '-10px' }}>AP</div>
                  <div className="tr-avatar-more">+15 others</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="tr-footer">
          <div>
            <div className="tr-footer-brand">Ayalkoottam Connect</div>
            <div>&#169; 2024 Ayalkoottam Management System. Empowering local communities.</div>
          </div>
          <div className="tr-footer__links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default TreasurerDashboard;
