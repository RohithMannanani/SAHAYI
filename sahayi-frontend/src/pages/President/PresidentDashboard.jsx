import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PresidentDashboard.css';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function PresidentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login', { replace: true });
    window.location.replace('/login');
  };
  const [pendingLoans, setPendingLoans] = useState([
    {
      id: 1,
      initials: 'MK',
      name: 'Meera Krishnan',
      sub: 'Member since 2021',
      amount: '₹25,000',
      purpose: "Education (Son's Semester)",
      trustScore: 9.2,
      trustColor: '#0c2c1a',
      status: 'pending'
    },
    {
      id: 2,
      initials: 'BJ',
      name: 'Biju Jacob',
      sub: 'Member since 2023',
      amount: '₹15,000',
      purpose: 'Small Business Inventory',
      trustScore: 6.8,
      trustColor: '#734e2c',
      status: 'pending'
    }
  ]);

  const handleApprove = (id) => {
    setPendingLoans(prev => prev.filter(item => item.id !== id));
  };

  const handleReject = (id) => {
    setPendingLoans(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="pres-container">
      {/* ── Left Sidebar Navigation ── */}
      <aside className="pres-sidebar">
        <div>
          <div className="pres-sidebar__brand">SAHAYI</div>
          <nav className="pres-sidebar__nav">
            <div 
              className={`pres-nav-item ${activeTab === 'dashboard' ? 'pres-nav-item--active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Icon d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" size={17} />
              <span>Dashboard</span>
            </div>

            <div 
              className={`pres-nav-item ${activeTab === 'members' ? 'pres-nav-item--active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={17} />
              <span>Members</span>
            </div>

            <div 
              className={`pres-nav-item ${activeTab === 'financials' ? 'pres-nav-item--active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" size={17} />
              <span>Financials</span>
            </div>

            <div 
              className={`pres-nav-item ${activeTab === 'meetings' ? 'pres-nav-item--active' : ''}`}
              onClick={() => setActiveTab('meetings')}
            >
              <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" size={17} />
              <span>Meetings</span>
            </div>

            <div 
              className={`pres-nav-item ${activeTab === 'reports' ? 'pres-nav-item--active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <Icon d="M18 20V10M12 20V4M6 20v-6" size={17} />
              <span>Reports</span>
            </div>
          </nav>
        </div>

        <div className="pres-sidebar__footer">
          <button className="pres-btn-new-record">
            <Icon d="M12 5v14M5 12h14" size={16} stroke="#ffffff" />
            <span>New Record</span>
          </button>

          <div className="pres-sidebar__divider" />

          <div className="pres-nav-item" onClick={() => setActiveTab('settings')}>
            <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={17} />
            <span>Settings</span>
          </div>

          <div className="pres-nav-item" onClick={handleLogout}>
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={17} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* ── Main Layout Content ── */}
      <div className="pres-main">
        {/* Header Navbar */}
        <header className="pres-header">
          <div className="pres-header__title">Ayalkoottam Connect</div>

          <div className="pres-header__right">
            <div className="pres-search-bar">
              <Icon d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" size={15} stroke="#809986" />
              <input type="text" placeholder="Search members, loans..." />
            </div>

            <button className="pres-header__icon-btn">
              <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={17} />
              <span className="pres-header__badge" />
            </button>

            <button className="pres-header__icon-btn">
              <Icon d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-18a8 8 0 100 16 8 8 0 000-16zm-1 5h2v2h-2V9zm0 4h2v5h-2v-5z" size={17} />
            </button>

            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" 
              alt="President Avatar" 
              className="pres-user-avatar"
            />
          </div>
        </header>

        {/* Content View */}
        <div className="pres-content">
          {/* Top Banner */}
          <div className="pres-banner">
            <div>
              <h1 className="pres-banner__title">President’s Dashboard</h1>
              <p className="pres-banner__subtitle">Overseeing community growth and financial stability for October 2023.</p>
            </div>

            <div className="pres-banner__actions">
              <button className="pres-btn-outline">
                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" size={15} />
                <span>This Month</span>
              </button>

              <button className="pres-btn-export">
                <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={15} stroke="#ffffff" />
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* ── Top Metric Cards Grid ── */}
          <div className="pres-metrics-grid">
            {/* Card 1: Group Savings */}
            <div className="pres-metric-card">
              <div className="pres-metric-card__head">
                <div className="pres-metric-icon">
                  <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={18} />
                </div>
                <span className="pres-metric-label">Group Savings</span>
              </div>
              <div className="pres-metric-val">₹4,25,000</div>
              <div className="pres-metric-sub pres-metric-sub--green">
                <Icon d="M23 6l-9.5 9.5-5-5L1 18" size={12} stroke="#2e8b46" />
                <span>+12.5% vs last month</span>
              </div>
            </div>

            {/* Card 2: Active Loans */}
            <div className="pres-metric-card">
              <div className="pres-metric-card__head">
                <div className="pres-metric-icon">
                  <Icon d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9zm2-4h16M12 12v4" size={18} />
                </div>
                <span className="pres-metric-label">Active Loans</span>
              </div>
              <div className="pres-metric-val">₹1,82,400</div>
              <div className="pres-metric-sub">24 Pending Repayments</div>
            </div>

            {/* Card 3: Meeting Attendance */}
            <div className="pres-metric-card">
              <div className="pres-metric-card__head">
                <div className="pres-metric-icon">
                  <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" size={18} />
                </div>
                <span className="pres-metric-label">Meeting Attendance</span>
              </div>
              <div className="pres-metric-val">94%</div>
              <div className="pres-progress-bar">
                <div className="pres-progress-fill" style={{ width: '94%' }} />
              </div>
            </div>

            {/* Card 4: Pending Approvals */}
            <div className="pres-metric-card pres-metric-card--alert">
              <div className="pres-metric-card__head">
                <div className="pres-metric-icon pres-metric-icon--alert">
                  <Icon d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={18} stroke="#d93838" />
                </div>
                <span className="pres-metric-label">Pending Approvals</span>
              </div>
              <div className="pres-metric-val" style={{ color: '#d93838' }}>06</div>
              <div className="pres-metric-sub pres-metric-sub--red">Requires immediate review</div>
            </div>
          </div>

          {/* ── Middle Row: Chart & Key Members ── */}
          <div className="pres-middle-row">
            {/* Left: Financial Growth Bar Chart */}
            <div className="pres-card">
              <div className="pres-card__head">
                <h2 className="pres-card__title">Financial Growth</h2>
                <div className="pres-chart-legend">
                  <div><span className="pres-legend-dot pres-legend-dot--savings" /> Savings</div>
                  <div><span className="pres-legend-dot pres-legend-dot--loans" /> Loans</div>
                </div>
              </div>

              {/* Custom Dual Bar Chart */}
              <div className="pres-chart-container">
                <div className="pres-chart-grid">
                  <div className="pres-chart-y-axis">
                    <span>5L</span>
                    <span>4L</span>
                    <span>3L</span>
                    <span>2L</span>
                    <span>1L</span>
                    <span>0</span>
                  </div>

                  {/* Jun */}
                  <div className="pres-bar-group">
                    <div className="pres-bar pres-bar--savings" style={{ height: '48%' }} />
                    <div className="pres-bar pres-bar--loans" style={{ height: '25%' }} />
                  </div>

                  {/* Jul */}
                  <div className="pres-bar-group">
                    <div className="pres-bar pres-bar--savings" style={{ height: '68%' }} />
                    <div className="pres-bar pres-bar--loans" style={{ height: '40%' }} />
                  </div>

                  {/* Aug */}
                  <div className="pres-bar-group">
                    <div className="pres-bar pres-bar--savings" style={{ height: '84%' }} />
                    <div className="pres-bar pres-bar--loans" style={{ height: '55%' }} />
                  </div>

                  {/* Sep */}
                  <div className="pres-bar-group">
                    <div className="pres-bar pres-bar--savings" style={{ height: '98%' }} />
                    <div className="pres-bar pres-bar--loans" style={{ height: '60%' }} />
                  </div>

                  {/* Oct */}
                  <div className="pres-bar-group">
                    <div className="pres-bar pres-bar--savings" style={{ height: '98%' }} />
                    <div className="pres-bar pres-bar--loans" style={{ height: '72%' }} />
                  </div>
                </div>

                <div className="pres-chart-x-axis">
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                </div>
              </div>
            </div>

            {/* Right: Key Members Widget */}
            <div className="pres-card">
              <div className="pres-card__head">
                <h2 className="pres-card__title">Key Members</h2>
                <a className="pres-card__link">View All</a>
              </div>

              <div className="pres-members-list">
                {/* Member 1 */}
                <div className="pres-member-item">
                  <div className="pres-member-left">
                    <div className="pres-member-avatar">SM</div>
                    <div className="pres-member-info">
                      <span className="pres-member-name">Sunita Menon</span>
                      <span className="pres-member-role">Joint Secretary</span>
                    </div>
                  </div>
                  <span className="pres-badge pres-badge--active">Active</span>
                </div>

                {/* Member 2 */}
                <div className="pres-member-item">
                  <div className="pres-member-left">
                    <div className="pres-member-avatar" style={{ background: '#eaf4ee', color: '#1b432c' }}>RP</div>
                    <div className="pres-member-info">
                      <span className="pres-member-name">Rajesh Pillai</span>
                      <span className="pres-member-role">Treasurer</span>
                    </div>
                  </div>
                  <span className="pres-badge pres-badge--active">Active</span>
                </div>

                {/* Member 3 */}
                <div className="pres-member-item">
                  <div className="pres-member-left">
                    <div className="pres-member-avatar" style={{ background: '#fdf3e7', color: '#734e2c' }}>AK</div>
                    <div className="pres-member-info">
                      <span className="pres-member-name">Anitha Kumar</span>
                      <span className="pres-member-role">Member</span>
                    </div>
                  </div>
                  <span className="pres-badge pres-badge--pending">Pending</span>
                </div>

                {/* Member 4 */}
                <div className="pres-member-item">
                  <div className="pres-member-left">
                    <div className="pres-member-avatar" style={{ background: '#f0f3f6', color: '#4a6273' }}>DV</div>
                    <div className="pres-member-info">
                      <span className="pres-member-name">Deepak Varma</span>
                      <span className="pres-member-role">Member</span>
                    </div>
                  </div>
                  <span className="pres-badge pres-badge--active">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Section: Pending Loan Applications Table ── */}
          <div className="pres-table-card">
            <div className="pres-table-head">
              <div>
                <h2 className="pres-table-head__title">Pending Loan Applications</h2>
                <div className="pres-table-head__sub">Items requiring your presidential sign-off</div>
              </div>

              <button className="pres-btn-outline" style={{ padding: '6px 10px' }}>
                <Icon d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" size={14} />
              </button>
            </div>

            <table className="pres-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Amount Requested</th>
                  <th>Purpose</th>
                  <th>Trust Score</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#647d6b', padding: 24 }}>
                      All pending loan applications have been reviewed.
                    </td>
                  </tr>
                ) : (
                  pendingLoans.map(loan => (
                    <tr key={loan.id}>
                      <td>
                        <div className="pres-applicant-col">
                          <div className="pres-applicant-avatar">{loan.initials}</div>
                          <div>
                            <div className="pres-applicant-name">{loan.name}</div>
                            <div className="pres-applicant-sub">{loan.sub}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="pres-amount-val">{loan.amount}</span>
                      </td>
                      <td>{loan.purpose}</td>
                      <td>
                        <div className="pres-trust-score">
                          <div className="pres-trust-bar">
                            <div 
                              className="pres-trust-fill" 
                              style={{ width: `${(loan.trustScore / 10) * 100}%`, background: loan.trustColor }} 
                            />
                          </div>
                          <span className="pres-trust-score-val">{loan.trustScore}</span>
                        </div>
                      </td>
                      <td>
                        <div className="pres-action-btns" style={{ justifyContent: 'flex-end' }}>
                          <button className="pres-btn-reject" onClick={() => handleReject(loan.id)}>Reject</button>
                          <button className="pres-btn-approve" onClick={() => handleApprove(loan.id)}>Approve</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="pres-table-footer">
              <a className="pres-table-footer-link">View all 6 pending applications &rarr;</a>
            </div>
          </div>
        </div>

        {/* ── Page Footer ── */}
        <footer className="pres-footer">
          <div>© 2024 Ayalkoottam Management System. Empowering local communities.</div>
          <div className="pres-footer__links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </footer>

        {/* Floating Action Button */}
        <button className="pres-fab" title="Quick Add">
          <Icon d="M12 5v14M5 12h14" size={22} stroke="#ffffff" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default PresidentDashboard;
