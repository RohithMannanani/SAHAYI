import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PresidentDashboard.css';
import { fetchSecretaryDashboard, fetchSavingsWeeks } from '../../services/api';
import WeeklySavingsHistoryModal from '../../components/common/WeeklySavingsHistoryModal';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function PresidentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('president_active_tab') || 'dashboard';
  });

  // Dynamic Data States
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [savingsWeeks, setSavingsWeeks] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // User details
  const [currentUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('president_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (showHistoryModal) {
        setShowHistoryModal(false);
      } else if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showHistoryModal, activeTab]);

  // Load live data from SahayiDb backend
  const loadPresidentData = async () => {
    setIsLoading(true);
    const unitId = currentUser?.unitId || 1;
    const userId = currentUser?.userId || 0;

    try {
      const [dashRes, weeksRes] = await Promise.allSettled([
        fetchSecretaryDashboard(unitId, userId),
        fetchSavingsWeeks(unitId)
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        const d = dashRes.value.data;
        setDashboardData(d);
        setPendingLoans(d.pendingLoans || []);
        setMembers(d.members || []);
      }

      if (weeksRes.status === 'fulfilled' && weeksRes.value?.data) {
        setSavingsWeeks(weeksRes.value.data || []);
      }
    } catch (err) {
      console.error('Error loading president dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPresidentData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login', { replace: true });
    window.location.replace('/login');
  };

  const handleApprove = (id) => {
    setPendingLoans(prev => prev.filter(item => item.id !== id));
  };

  const handleReject = (id) => {
    setPendingLoans(prev => prev.filter(item => item.id !== id));
  };

  // Metric values calculated dynamically from database
  const groupSavingsTotal = dashboardData?.totalWeeklyCollection || (savingsWeeks || []).reduce((acc, w) => acc + (w.totalCollected || 0), 0);
  const activeLoansVal = dashboardData?.disbursedLoansTotal || 0;
  const pendingApprovalsCount = pendingLoans.length;

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
          <button className="pres-btn-new-record" onClick={() => setActiveTab('financials')}>
            <Icon d="M12 5v14M5 12h14" size={16} stroke="#ffffff" />
            <span>Financials</span>
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
          <div className="pres-header__title">SHAYI - Presidential Portal</div>

          <div className="pres-header__right">
            <div className="pres-search-bar">
              <Icon d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" size={15} stroke="#809986" />
              <input type="text" placeholder="Search members, loans..." />
            </div>

            <button className="pres-header__icon-btn">
              <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={17} />
              <span className="pres-header__badge" />
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
              <p className="pres-banner__subtitle">
                Overseeing community growth and financial stability for {dashboardData?.unitName || 'Ayalkoottam Unit'}.
              </p>
            </div>

            <div className="pres-banner__actions">
              <button className="pres-btn-outline" onClick={() => setActiveTab('financials')}>
                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" size={15} />
                <span>Financial Ledger</span>
              </button>

              <button className="pres-btn-export" onClick={() => setShowHistoryModal(true)}>
                <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={15} stroke="#ffffff" />
                <span>Weekly Savings Log</span>
              </button>
            </div>
          </div>

          {/* Render Views Based on Active Tab */}
          {activeTab === 'financials' ? (
            /* ── DEDICATED FINANCIALS TAB ── */
            <div className="pres-financials-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0c382e', margin: 0 }}>
                  Unit Financial Overview & Weekly Savings History
                </h2>
                <button
                  type="button"
                  className="pres-btn-export"
                  onClick={() => setShowHistoryModal(true)}
                  style={{ cursor: 'pointer' }}
                >
                  Inspect Paid & Pending Payments &rarr;
                </button>
              </div>

              {/* Top Financial Stats Row */}
              <div className="pres-metrics-grid">
                <div className="pres-metric-card" style={{ borderLeft: '4px solid #10b981' }}>
                  <span className="pres-metric-label">Unit Total Collection</span>
                  <div className="pres-metric-val" style={{ color: '#0c382e' }}>
                    ₹{groupSavingsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="pres-metric-sub">Verified from SahayiDb</div>
                </div>

                <div className="pres-metric-card" style={{ borderLeft: '4px solid #0284c7' }}>
                  <span className="pres-metric-label">Disbursed Loans</span>
                  <div className="pres-metric-val" style={{ color: '#0284c7' }}>
                    ₹{activeLoansVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="pres-metric-sub">Active community portfolio</div>
                </div>

                <div className="pres-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <span className="pres-metric-label">Pending Dues</span>
                  <div className="pres-metric-val" style={{ color: '#b45309' }}>
                    {dashboardData?.pendingDuesCount || 0} Member Dues
                  </div>
                  <div className="pres-metric-sub">Weekly deposits pending</div>
                </div>
              </div>

              {/* ── WEEKLY SAVINGS HISTORY CARD (CLICKABLE) ── */}
              <div
                className="pres-card"
                onClick={() => setShowHistoryModal(true)}
                style={{
                  cursor: 'pointer',
                  borderLeft: '5px solid #10b981',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}
              >
                <div className="pres-card__head" style={{ marginBottom: '12px' }}>
                  <div>
                    <h2 className="pres-card__title" style={{ color: '#0c382e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={20} stroke="#10b981" />
                      Weekly Savings History & Ledger
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                      Click to view detailed breakdown of all <strong>Paid Payments</strong> and <strong>Pending Dues</strong> week by week.
                    </p>
                  </div>
                  <span style={{
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '6px 14px',
                    borderRadius: '20px'
                  }}>
                    View Paid & Pending &rarr;
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '16px' }}>
                  {savingsWeeks.slice(0, 4).map((week, idx) => (
                    <div key={week.id || idx} style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                        {week.weekTitle || `Week ${week.weekNumber}`}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0c382e', marginTop: '4px' }}>
                        ₹{(week.totalCollected || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>{week.paidCount || 0} Paid</span>
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>{week.pendingCount || 0} Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── MAIN DASHBOARD VIEW ── */
            <>
              {/* ── Top Metric Cards Grid ── */}
              <div className="pres-metrics-grid">
                {/* Card 1: Group Savings */}
                <div className="pres-metric-card" onClick={() => setActiveTab('financials')} style={{ cursor: 'pointer' }}>
                  <div className="pres-metric-card__head">
                    <div className="pres-metric-icon">
                      <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={18} />
                    </div>
                    <span className="pres-metric-label">Group Savings</span>
                  </div>
                  <div className="pres-metric-val">₹{groupSavingsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="pres-metric-sub pres-metric-sub--green">
                    <Icon d="M23 6l-9.5 9.5-5-5L1 18" size={12} stroke="#2e8b46" />
                    <span>Click to view Weekly History</span>
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
                  <div className="pres-metric-val">₹{activeLoansVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="pres-metric-sub">Active community portfolio</div>
                </div>

                {/* Card 3: Meeting Attendance */}
                <div className="pres-metric-card">
                  <div className="pres-metric-card__head">
                    <div className="pres-metric-icon">
                      <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" size={18} />
                    </div>
                    <span className="pres-metric-label">Unit Members</span>
                  </div>
                  <div className="pres-metric-val">{members.length || 15} Members</div>
                  <div className="pres-progress-bar">
                    <div className="pres-progress-fill" style={{ width: '92%' }} />
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
                  <div className="pres-metric-val" style={{ color: '#d93838' }}>{pendingApprovalsCount}</div>
                  <div className="pres-metric-sub pres-metric-sub--red">Requires presidential sign-off</div>
                </div>
              </div>

              {/* ── Middle Row: Chart & Key Members ── */}
              <div className="pres-middle-row">
                {/* Left: Financial Growth Bar Chart */}
                <div className="pres-card">
                  <div className="pres-card__head">
                    <h2 className="pres-card__title">Financial Growth & Weekly Collections</h2>
                    <div className="pres-chart-legend">
                      <div><span className="pres-legend-dot pres-legend-dot--savings" /> Collections</div>
                      <div><span className="pres-legend-dot pres-legend-dot--loans" /> Loans</div>
                    </div>
                  </div>

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

                      <div className="pres-bar-group">
                        <div className="pres-bar pres-bar--savings" style={{ height: '48%' }} />
                        <div className="pres-bar pres-bar--loans" style={{ height: '25%' }} />
                      </div>
                      <div className="pres-bar-group">
                        <div className="pres-bar pres-bar--savings" style={{ height: '68%' }} />
                        <div className="pres-bar pres-bar--loans" style={{ height: '40%' }} />
                      </div>
                      <div className="pres-bar-group">
                        <div className="pres-bar pres-bar--savings" style={{ height: '84%' }} />
                        <div className="pres-bar pres-bar--loans" style={{ height: '55%' }} />
                      </div>
                      <div className="pres-bar-group">
                        <div className="pres-bar pres-bar--savings" style={{ height: '98%' }} />
                        <div className="pres-bar pres-bar--loans" style={{ height: '60%' }} />
                      </div>
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
                    <h2 className="pres-card__title">Ayalkoottam Members</h2>
                    <a className="pres-card__link" onClick={() => setActiveTab('members')}>View All</a>
                  </div>

                  <div className="pres-members-list">
                    {members.length === 0 ? (
                      <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem' }}>
                        Loading unit members...
                      </div>
                    ) : (
                      members.slice(0, 4).map((m, idx) => (
                        <div className="pres-member-item" key={m.id || m.userId || idx}>
                          <div className="pres-member-left">
                            <div className="pres-member-avatar">
                              {(m.name || 'M').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="pres-member-info">
                              <span className="pres-member-name">{m.name}</span>
                              <span className="pres-member-role">{m.memberId || 'Active Member'}</span>
                            </div>
                          </div>
                          <span className="pres-badge pres-badge--active">Active</span>
                        </div>
                      ))
                    )}
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
                              <div className="pres-applicant-avatar">
                                {(loan.name || 'L').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="pres-applicant-name">{loan.name}</div>
                                <div className="pres-applicant-sub">{loan.memberId || 'Member'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="pres-amount-val">₹{loan.amount}</span>
                          </td>
                          <td>{loan.purpose}</td>
                          <td>
                            <div className="pres-trust-score">
                              <div className="pres-trust-bar">
                                <div
                                  className="pres-trust-fill"
                                  style={{ width: `${((loan.trustScore || 8.5) / 10) * 100}%`, background: '#0c2c1a' }}
                                />
                              </div>
                              <span className="pres-trust-score-val">{loan.trustScore || 8.5}</span>
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
              </div>
            </>
          )}
        </div>

        {/* ── Page Footer ── */}
        <footer className="pres-footer">
          <div>© 2026 Ayalkoottam Management System. Empowering local communities.</div>
          <div className="pres-footer__links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </footer>
      </div>

      {/* ── Weekly Savings History Modal ── */}
      {showHistoryModal && (
        <WeeklySavingsHistoryModal
          savingsWeeks={savingsWeeks}
          savingsLogs={dashboardData?.savingsLogs || []}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}

export default PresidentDashboard;
