import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './PresidentDashboard.css';
import { fetchSecretaryDashboard, fetchSavingsWeeks, applyMemberLoan } from '../../services/api';
import WeeklySavingsHistoryModal from '../../components/common/WeeklySavingsHistoryModal';
import PaymentMethodModal from '../Secretary/components/modals/PaymentMethodModal';

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
  const [meetings, setMeetings] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showOwnSavingsModal, setShowOwnSavingsModal] = useState(false);

  // Personal Loan & Payment States
  const [showApplyLoanModal, setShowApplyLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedWeekItem, setSelectedWeekItem] = useState(null);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [loanForm, setLoanForm] = useState({
    amount: 15000,
    purpose: 'Small Enterprise / Agriculture',
    tenureMonths: 12
  });

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // User details
  const [currentUser] = useState(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });

  // Current week date range calculation
  const { mondayDate, sundayDate, startDurationStr, endDurationStr } = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return {
      mondayDate: monday,
      sundayDate: sunday,
      startDurationStr: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      endDurationStr: sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  }, []);

  // Check if President has paid for current week
  const isPresidentPaidCurrentWeek = useMemo(() => {
    if (!currentUser?.userId) return false;
    const logs = dashboardData?.savingsLogs || [];
    return logs.some(s => {
      const isUser = String(s.userId || s.UserId || s.id) === String(currentUser.userId);
      if (!isUser) return false;
      const dateVal = s.paidDate || s.date;
      if (!dateVal || dateVal === '-') return false;
      const pDate = new Date(dateVal);
      return !isNaN(pDate.getTime()) && pDate >= mondayDate && pDate <= sundayDate;
    });
  }, [dashboardData, currentUser, mondayDate, sundayDate]);

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('president_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (showHistoryModal) {
        setShowHistoryModal(false);
      } else if (showOwnSavingsModal) {
        setShowOwnSavingsModal(false);
      } else if (showApplyLoanModal) {
        setShowApplyLoanModal(false);
      } else if (showPaymentModal) {
        setShowPaymentModal(false);
      } else if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showHistoryModal, showOwnSavingsModal, showApplyLoanModal, showPaymentModal, activeTab]);

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
        setMeetings(d.meetings || []);
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
    showToast('Loan application approved successfully!');
  };

  const handleReject = (id) => {
    setPendingLoans(prev => prev.filter(item => item.id !== id));
    showToast('Loan application rejected.', 'info');
  };

  // Submit President Personal Loan Application
  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    if (!loanForm.amount || parseFloat(loanForm.amount) <= 0) {
      showToast('Please enter a valid loan amount.', 'error');
      return;
    }

    setIsSubmittingLoan(true);
    try {
      const payload = {
        userId: currentUser?.userId || 0,
        unitId: currentUser?.unitId || 1,
        amount: parseFloat(loanForm.amount),
        purpose: loanForm.purpose,
        tenureMonths: parseInt(loanForm.tenureMonths || 12)
      };

      const res = await applyMemberLoan(payload);
      showToast(res.data?.message || 'Loan application submitted successfully to SahayiDb!');
      setShowApplyLoanModal(false);
      setLoanForm({ amount: 15000, purpose: 'Small Enterprise / Agriculture', tenureMonths: 12 });
      await loadPresidentData();
    } catch (err) {
      console.error('Error applying for loan:', err);
      showToast(err.response?.data?.message || 'Failed to submit loan application.', 'error');
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  // Metric values calculated dynamically from database
  const groupSavingsTotal = dashboardData?.totalWeeklyCollection || (savingsWeeks || []).reduce((acc, w) => acc + (w.totalCollected || 0), 0);
  const activeLoansVal = dashboardData?.disbursedLoansTotal || 0;
  const pendingApprovalsCount = pendingLoans.length;

  const totalPendingWeeklyPayments = useMemo(() => {
    if (Array.isArray(savingsWeeks) && savingsWeeks.length > 0) {
      return savingsWeeks.reduce((sum, week) => sum + (week.pendingCount || 0), 0);
    }
    return dashboardData?.pendingDuesCount || 0;
  }, [savingsWeeks, dashboardData]);

  const currentWeekPendingMembers = savingsWeeks[0]?.pendingCount || 0;

  return (
    <div className="pres-container">
      {/* Toast Banner */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#0284c7' : '#16a34a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toast.message}</span>
        </div>
      )}

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
              <Icon d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4.5 4.5 0 0 0 0-9H6" size={17} />
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

            <div
              className="pres-nav-item"
              onClick={() => setShowApplyLoanModal(true)}
              title="Apply for a personal loan application"
            >
              <Icon d="M12 5v14M5 12h14" size={17} stroke="#3b82f6" />
              <span>Apply for Personal Loan</span>
            </div>

            <div
              className="pres-nav-item"
              onClick={() => setShowOwnSavingsModal(true)}
              title="View my own personal weekly savings history and dues"
            >
              <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 1 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={17} stroke="#10b981" />
              <span>View Own Savings</span>
            </div>
          </nav>
        </div>

        <div className="pres-sidebar__footer">
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="pres-header__title">SAHAYI - President Dashboard</div>
            <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span>{currentUser?.fullName || currentUser?.name || 'President'}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ color: '#059669' }}>{dashboardData?.unitName || currentUser?.unitName || 'Ayalkoottam Unit'}</span>
            </div>
          </div>

          <div className="pres-header__right">
            <div className="pres-search-bar">
              <Icon d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" size={15} stroke="#809986" />
              <input type="text" placeholder="Search members, loans..." />
            </div>

            <button className="pres-header__icon-btn">
              <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={17} />
              <span className="pres-header__badge" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"}
                alt="President Avatar"
                className="pres-user-avatar"
                title={`${currentUser?.fullName || currentUser?.name || 'President'} (${dashboardData?.unitName || currentUser?.unitName || 'Ayalkoottam Unit'})`}
              />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0c382e' }}>
                  {currentUser?.fullName || currentUser?.name || 'President'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  {dashboardData?.unitName || currentUser?.unitName || 'Ayalkoottam Unit'}
                </span>
              </div>
            </div>
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
              <button className="pres-btn-outline" onClick={() => setShowApplyLoanModal(true)} style={{ color: '#2563eb', borderColor: '#bfdbfe' }}>
                <Icon d="M12 5v14M5 12h14" size={15} stroke="#2563eb" />
                <span>Apply Personal Loan</span>
              </button>

              <button className="pres-btn-outline" onClick={() => setShowOwnSavingsModal(true)}>
                <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 1 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={15} stroke="#10b981" />
                <span>View My Own Savings</span>
              </button>

              <button className="pres-btn-export" onClick={() => setShowHistoryModal(true)}>
                <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={15} stroke="#ffffff" />
                <span>Weekly Savings Log</span>
              </button>
            </div>
          </div>

          {/* Render Views Based on Active Tab */}
          {activeTab === 'members' ? (
            /* ── MEMBERS TAB VIEW ── */
            <div className="pres-card">
              <div className="pres-card__head" style={{ marginBottom: '16px' }}>
                <div>
                  <h2 className="pres-card__title">Unit Members Registry</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Active registered members in <strong>{dashboardData?.unitName || 'Ayalkoottam Unit'}</strong>
                  </p>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="pres-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Phone Number</th>
                      <th>House Name</th>
                      <th>Role / Member ID</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                          No registered members found.
                        </td>
                      </tr>
                    ) : (
                      members.map((m, idx) => (
                        <tr key={m.id || m.userId || idx}>
                          <td>
                            <div className="pres-applicant-col">
                              <div className="pres-applicant-avatar">
                                {(m.name || m.fullName || 'M').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="pres-applicant-name">{m.name || m.fullName}</div>
                            </div>
                          </td>
                          <td>{m.phoneNumber || m.phone || '-'}</td>
                          <td>{m.houseName || '-'}</td>
                          <td>{m.memberId || m.role || 'Member'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="pres-badge pres-badge--active">Active</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'meetings' ? (
            /* ── MEETINGS TAB VIEW ── */
            <div className="pres-card">
              <div className="pres-card__head" style={{ marginBottom: '16px' }}>
                <div>
                  <h2 className="pres-card__title">Unit Meetings Schedule</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    Monitor upcoming and completed weekly unit meetings.
                  </p>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="pres-table">
                  <thead>
                    <tr>
                      <th>Meeting Title</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Venue</th>
                      <th style={{ textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetings.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                          No scheduled meetings recorded yet.
                        </td>
                      </tr>
                    ) : (
                      meetings.map((mtg, idx) => (
                        <tr key={mtg.id || idx}>
                          <td style={{ fontWeight: 600, color: '#0c382e' }}>{mtg.title}</td>
                          <td>{mtg.date || '-'}</td>
                          <td>{mtg.time || '-'}</td>
                          <td>{mtg.venue || mtg.location || '-'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`pres-badge ${mtg.isCompleted || mtg.tag === 'COMPLETED' ? 'pres-badge--active' : ''}`}>
                              {mtg.isCompleted || mtg.tag === 'COMPLETED' ? 'Completed' : 'Upcoming'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'reports' || activeTab === 'financials' ? (
            /* ── FINANCIALS & REPORTS TAB VIEW ── */
            <div className="pres-financials-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
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
                    {totalPendingWeeklyPayments} Weekly Payments
                  </div>
                  <div className="pres-metric-sub">
                    {currentWeekPendingMembers > 0 ? `${currentWeekPendingMembers} members pending this week` : 'Weekly deposits pending'}
                  </div>
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
                      <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 1 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={20} stroke="#10b981" />
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
                  {savingsWeeks.slice(0, 4).map((week, idx) => {
                    const displayTitle = (week.weekTitle || (week.startDate && week.endDate ? `${week.startDate} – ${week.endDate}` : ''))
                      .replace(/^(?:Week\s*\d+|Current\s*Week|Week\s*Collection)\s*\((.*)\)$/i, '$1')
                      .replace(/^Week\s*\d+\s*-?\s*/i, '')
                      .trim();
                    return (
                      <div key={week.id || idx} style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                          {displayTitle || `Period (${week.startDate || ''})`}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0c382e', marginTop: '4px' }}>
                          ₹{(week.totalCollected || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>{week.paidCount || 0} Paid</span>
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>{week.pendingCount || 0} Pending</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ── MAIN DASHBOARD VIEW ── */
            <>
              {/* ── WEEKLY SAVINGS DEPOSIT BANNER FOR PRESIDENT ── */}
              <div style={{
                background: 'linear-gradient(145deg, #0C382E 0%, #155e4b 60%, #1a7a60 100%)',
                borderRadius: '16px',
                padding: '1.25rem 1.6rem',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                boxShadow: '0 8px 24px rgba(12, 56, 46, 0.22)',
                flexWrap: 'wrap',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.18)',
                      borderRadius: '20px',
                      padding: '3px 12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#fde68a'
                    }}>
                      Weekly Savings Deposit
                    </span>
                    {isPresidentPaidCurrentWeek ? (
                      <span style={{ background: 'rgba(52, 211, 153, 0.25)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#34d399' }}>
                        ✓ Paid
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(245, 158, 11, 0.25)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#fbbf24' }}>
                        • Due
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 600 }}>
                      {startDurationStr} – {endDurationStr}
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                    Deposit Your Personal Weekly Savings
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', opacity: 0.85 }}>
                    Pay your weekly ₹100 deposit securely online via Razorpay or record cash collection.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.75, textTransform: 'uppercase' }}>Weekly Dues</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fde68a' }}>₹100.00</div>
                  </div>

                  {isPresidentPaidCurrentWeek ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.2)', borderRadius: '10px', padding: '9px 16px', fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                      Already Paid
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWeekItem({
                          id: currentUser?.userId || 0,
                          userId: currentUser?.userId || 0,
                          name: currentUser?.fullName || currentUser?.name || 'President',
                          memberId: `AK-${currentUser?.userId || '001'}`,
                          amount: 100,
                          week: 'Current Week',
                          month: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        });
                        setShowPaymentModal(true);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        color: '#0C382E',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 20px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(251,191,36,0.4)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Pay ₹100 Now
                    </button>
                  )}
                </div>
              </div>

              {/* ── Top Metric Cards Grid ── */}
              <div className="pres-metrics-grid">
                {/* Card 1: Group Savings */}
                <div className="pres-metric-card" onClick={() => setActiveTab('financials')} style={{ cursor: 'pointer' }}>
                  <div className="pres-metric-card__head">
                    <div className="pres-metric-icon">
                      <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 1 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={18} />
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
                <div className="pres-metric-card" onClick={() => setActiveTab('members')} style={{ cursor: 'pointer' }}>
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

      {/* ── Apply for Loan Modal ── */}
      {showApplyLoanModal && (
        <div className="mem-modal-overlay" onClick={() => setShowApplyLoanModal(false)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="mem-modal" onClick={e => e.stopPropagation()} style={{
            backgroundColor: '#ffffff', borderRadius: '14px', width: '90%', maxWidth: '480px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0c382e' }}>Apply for Personal Loan</h3>
              <button onClick={() => setShowApplyLoanModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>

            <form onSubmit={handleLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Loan Amount Requested (₹)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="200000"
                  step="500"
                  value={loanForm.amount}
                  onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Purpose of Loan
                </label>
                <select
                  value={loanForm.purpose}
                  onChange={e => setLoanForm({ ...loanForm, purpose: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', backgroundColor: '#fff' }}
                >
                  <option value="Small Enterprise / Agriculture">Small Enterprise / Agriculture</option>
                  <option value="Children Education & Fees">Children Education & Fees</option>
                  <option value="House Maintenance & Repair">House Maintenance & Repair</option>
                  <option value="Medical Emergency / Health">Medical Emergency / Health</option>
                  <option value="Dairy & Livestock Purchase">Dairy & Livestock Purchase</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowApplyLoanModal(false)}
                  disabled={isSubmittingLoan}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLoan}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                >
                  {isSubmittingLoan ? 'Submitting to SahayiDb...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Weekly Savings Payment Modal ── */}
      {showPaymentModal && (
        <PaymentMethodModal
          item={selectedWeekItem || {
            id: currentUser?.userId || 0,
            userId: currentUser?.userId || 0,
            name: currentUser?.fullName || currentUser?.name || 'President',
            memberId: `AK-${currentUser?.userId || '001'}`,
            amount: 100,
            week: 'Current Week',
            month: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          }}
          unitInfo={{
            unitId: currentUser?.unitId || 1,
            unitName: dashboardData?.unitName || 'Ayalkoottam Unit'
          }}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedWeekItem(null);
          }}
          onSuccess={(item, method, paymentId) => {
            setShowPaymentModal(false);
            setSelectedWeekItem(null);
            showToast(`Weekly savings deposit of ₹100 recorded!`);
            loadPresidentData();
          }}
          onError={(msg) => {
            showToast(msg || 'Failed to process payment.', 'error');
          }}
        />
      )}

      {/* ── Weekly Savings History Modal ── */}
      {showHistoryModal && (
        <WeeklySavingsHistoryModal
          savingsWeeks={savingsWeeks}
          savingsLogs={dashboardData?.savingsLogs || []}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* ── My Own Savings History Modal ── */}
      {showOwnSavingsModal && (
        <WeeklySavingsHistoryModal
          savingsWeeks={savingsWeeks}
          savingsLogs={dashboardData?.savingsLogs || []}
          currentUserId={currentUser?.userId}
          onClose={() => setShowOwnSavingsModal(false)}
          onRecordPayment={(targetItem) => {
            setSelectedWeekItem(targetItem);
            setShowOwnSavingsModal(false);
            setShowPaymentModal(true);
          }}
        />
      )}
    </div>
  );
}

export default PresidentDashboard;
