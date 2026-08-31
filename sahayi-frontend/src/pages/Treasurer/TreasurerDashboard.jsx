import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TreasurerDashboard.css';
import { fetchSecretaryDashboard, fetchSavingsWeeks, fetchUnitBankAccount, depositCashToBank } from '../../services/api';
import WeeklySavingsHistoryModal from '../../components/common/WeeklySavingsHistoryModal';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function TreasurerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('treasurer_active_tab') || 'financials';
  });

  // Dynamic States for SahayiDb data
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [unitBank, setUnitBank] = useState(null);
  const [savingsWeeks, setSavingsWeeks] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentUser = React.useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('treasurer_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (showHistoryModal) {
        setShowHistoryModal(false);
      } else if (activeTab !== 'financials') {
        setActiveTab('financials');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showHistoryModal, activeTab]);

  // Load real financial data from SahayiDb backend
  const loadTreasurerData = async () => {
    setIsLoading(true);
    const unitId = currentUser?.unitId || 1;
    const userId = currentUser?.userId || 0;

    try {
      const [dashRes, weeksRes, bankRes] = await Promise.allSettled([
        fetchSecretaryDashboard(unitId, userId),
        fetchSavingsWeeks(unitId),
        fetchUnitBankAccount(unitId)
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setDashboardData(dashRes.value.data);
      }

      if (weeksRes.status === 'fulfilled' && weeksRes.value?.data) {
        setSavingsWeeks(weeksRes.value.data || []);
      }

      if (bankRes.status === 'fulfilled' && bankRes.value?.data) {
        setUnitBank(bankRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load treasurer financial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTreasurerData();
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

  // Extract live transactions from database logs
  const liveTransactions = React.useMemo(() => {
    const logs = dashboardData?.savingsLogs || [];
    return logs.map((item, idx) => ({
      id: item.id || idx + 1,
      name: item.name || 'Member',
      date: item.date || item.paidDate || new Date().toISOString().split('T')[0],
      type: item.paymentMode === 'Cash' ? 'Cash Savings' : 'Online Savings',
      typeColor: item.paymentMode === 'Cash' ? 'fee' : 'repayment',
      amount: `₹${parseFloat(item.amount || 100).toFixed(2)}`,
      status: item.status || 'Paid'
    }));
  }, [dashboardData]);

  // Filter transactions by search query
  const filteredTransactions = liveTransactions.filter(tx =>
    tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const availableBalance = unitBank?.balance || dashboardData?.totalWeeklyCollection || 0;
  const disbursedLoans = dashboardData?.disbursedLoansTotal || 0;
  const totalMembersCount = dashboardData?.members?.length || 15;

  return (
    <div className="tr-container">
      {/* ── Left Sidebar ── */}
      <aside className="tr-sidebar">
        <div>
          {/* Brand */}
          <div className="tr-sidebar__brand">
            <div className="tr-brand-title">SAHAYI</div>
            <div className="tr-brand-title">Treasurer</div>
            <div className="tr-brand-sub">Financial Control</div>
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
          <button className="tr-btn-new-record" onClick={() => setShowHistoryModal(true)}>
            <Icon d="M12 5v14M5 12h14" size={16} stroke="#ffffff" />
            <span>Savings Log</span>
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
          <div className="tr-header__title">Financial & Treasury Portal</div>

          <div className="tr-header__right">
            <div className="tr-search-bar">
              <Icon d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" size={15} stroke="#809986" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <button className="tr-header__icon-btn" onClick={() => setShowHistoryModal(true)}>
              <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={17} />
              <span className="tr-header__badge" />
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
                <span className="tr-total-fund-badge">Unit Bank Fund</span>
              </div>
              <div className="tr-fin-card__label">Available Balance</div>
              <div className="tr-fin-card__value">
                ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="tr-fin-card__trend">
                <Icon d="M23 6l-9.5 9.5-5-5L1 18" size={12} stroke="#2e8b46" />
                <span>{unitBank?.bankName || 'Sahayi Co-operative Bank'}</span>
              </div>
            </div>

            {/* Card 2: Active Loans Disbursed */}
            <div className="tr-fin-card tr-fin-card--loans">
              <div className="tr-fin-card__head">
                <div className="tr-fin-icon tr-fin-icon--loan">
                  <Icon d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9z" size={20} />
                </div>
                <span className="tr-fin-card__label-sm">Active Loans</span>
              </div>
              <div className="tr-loans-amounts">
                <span className="tr-loans-out">₹{disbursedLoans.toLocaleString('en-IN')} Disbursed</span>
              </div>
              <div className="tr-loans-progress-wrap">
                <div className="tr-loans-progress-bar">
                  <div className="tr-loans-progress-fill" style={{ width: '65%' }} />
                </div>
              </div>
              <div className="tr-loans-members">{totalMembersCount} Active Unit Members</div>
            </div>

            {/* Card 3: WEEKLY SAVINGS HISTORY CARD (PROMINENT CLICKABLE CTA) */}
            <div
              className="tr-fin-card tr-fin-card--cta tr-fin-card--dark"
              onClick={() => setShowHistoryModal(true)}
              style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #0c382e 0%, #175244 100%)' }}
            >
              <div className="tr-cta-icon">
                <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={28} stroke="#ffffff" />
              </div>
              <div className="tr-cta-label" style={{ fontSize: '1rem', fontWeight: 700 }}>
                Weekly Savings History
              </div>
              <span style={{ color: '#a7f3d0', fontSize: '0.75rem', marginTop: '4px' }}>
                View Paid & Pending Payments &rarr;
              </span>
            </div>

            {/* Card 4: Inspect Paid & Pending Dues */}
            <div
              className="tr-fin-card tr-fin-card--cta"
              onClick={() => setShowHistoryModal(true)}
              style={{ cursor: 'pointer' }}
            >
              <div className="tr-cta-icon tr-cta-icon--light">
                <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6" size={28} stroke="#1b432c" />
              </div>
              <div className="tr-cta-label tr-cta-label--light">Audit Weekly Dues</div>
            </div>
          </div>

          {/* ── WEEKLY SAVINGS HISTORY SUMMARY CARD ── */}
          <div
            onClick={() => setShowHistoryModal(true)}
            style={{
              marginTop: '1.25rem',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '1.25rem 1.5rem',
              border: '1.5px solid #10b981',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0c382e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={18} stroke="#10b981" />
                Weekly Savings History Card
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
                Inspect complete weekly collection records, filter by week, and manage <strong>Paid</strong> vs <strong>Pending</strong> member payments.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.825rem',
                fontWeight: 700
              }}>
                Open Paid & Pending Payments &rarr;
              </span>
            </div>
          </div>

          {/* ── Middle Section: Transactions + Right Panel ── */}
          <div className="tr-middle-row">
            {/* Transactions Table Card */}
            <div className="tr-table-card">
              <div className="tr-table-head">
                <h2 className="tr-table-title">Latest Financial Transactions</h2>
                <div className="tr-table-actions">
                  <button className="tr-icon-btn" onClick={() => setShowHistoryModal(true)}>
                    <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={15} />
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
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td className="tr-td-name">{tx.name}</td>
                        <td className="tr-td-date">{tx.date}</td>
                        <td>
                          <span className={`tr-type-badge tr-type-badge--${tx.typeColor}`}>{tx.type}</span>
                        </td>
                        <td className="tr-td-amount">
                          {tx.amount}
                        </td>
                        <td>
                          <span className={`tr-status-badge tr-status-badge--${tx.status.toLowerCase()}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="tr-table-footer">
                <button className="tr-view-all" onClick={() => setShowHistoryModal(true)}>
                  View All Savings & Paid/Pending Details &rarr;
                </button>
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
                  <span className="tr-report-title">Audit Center</span>
                </div>
                <p className="tr-report-desc">
                  Generate comprehensive financial audits and growth statements for the community council.
                </p>

                <button className="tr-btn-generate-report" onClick={() => setShowHistoryModal(true)}>
                  <Icon d="M18 20V10M12 20V4M6 20v-6" size={16} stroke="#ffffff" />
                  View Weekly Savings Audit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="tr-footer">
          <div>
            <div className="tr-footer-brand">Ayalkoottam Connect</div>
            <div>&#169; 2026 Ayalkoottam Management System. Empowering local communities.</div>
          </div>
          <div className="tr-footer__links">
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

export default TreasurerDashboard;
