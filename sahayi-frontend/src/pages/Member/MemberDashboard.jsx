import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemberDashboard.css';
import { fetchMemberDashboard, applyMemberLoan } from '../../services/api';
import PaymentMethodModal from '../Secretary/components/modals/PaymentMethodModal';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function MemberDashboard() {
  const navigate = useNavigate();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('member_active_tab') || 'dashboard';
  });

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('member_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (showApplyLoanModal) {
        setShowApplyLoanModal(false);
      } else if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  // Current Logged In User
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) return JSON.parse(rawUser);
    } catch (e) {
      console.error('Error parsing stored user data:', e);
    }
    return null;
  });

  // State for Dynamic Data from SahayiDb
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showApplyLoanModal, setShowApplyLoanModal] = useState(false);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [loanForm, setLoanForm] = useState({
    amount: 15000,
    purpose: 'Small Enterprise / Agriculture',
    tenureMonths: 12
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch Member Dashboard Data from SahayiDb Database
  const loadDashboardData = async () => {
    setIsLoading(true);
    let userObj = currentUser;
    if (!userObj) {
      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) userObj = JSON.parse(rawUser);
      } catch (e) {
        console.error('Error loading stored user:', e);
      }
    }

    try {
      const res = await fetchMemberDashboard(userObj?.userId, userObj?.unitId);
      if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load member dashboard from database:', err);
      showToast('Could not load latest member data from SahayiDb', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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

  // Submit Loan Application to Backend
  const handleLoanSubmit = async (e) => {
    e.preventDefault();
    if (!loanForm.amount || parseFloat(loanForm.amount) <= 0) {
      showToast('Please enter a valid loan amount.', 'error');
      return;
    }

    setIsSubmittingLoan(true);
    try {
      const payload = {
        userId: currentUser?.userId || dashboardData?.userId || 0,
        unitId: currentUser?.unitId || dashboardData?.unitId || 0,
        amount: parseFloat(loanForm.amount),
        purpose: loanForm.purpose,
        tenureMonths: parseInt(loanForm.tenureMonths || 12)
      };

      const res = await applyMemberLoan(payload);
      showToast(res.data?.message || 'Loan application submitted successfully to SahayiDb!');
      setShowApplyLoanModal(false);
      setLoanForm({ amount: 15000, purpose: 'Small Enterprise / Agriculture', tenureMonths: 12 });
      
      // Reload dashboard data to reflect pending loan application
      await loadDashboardData();
    } catch (err) {
      console.error('Error applying for loan:', err);
      showToast(err.response?.data?.message || 'Failed to submit loan application.', 'error');
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  // Download Passbook Receipt Summary
  const handleDownloadPassbook = () => {
    const totalSavingsVal = dashboardData?.savings?.totalSavings || 0;
    const memberName = dashboardData?.fullName || currentUser?.fullName || 'Member';
    const unitName = dashboardData?.unitName || 'Sahayi Ayalkoottam';
    const memberIdStr = dashboardData?.memberIdStr || `AK-${currentUser?.userId || '001'}`;
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const receiptContent = `
======================================================
               SAHAYI AYALKOOTTAM CONNECT
               OFFICIAL SAVINGS PASSBOOK
======================================================
Member Name   : ${memberName}
Member ID     : ${memberIdStr}
Unit Name     : ${unitName}
Generated On  : ${dateStr}

------------------------------------------------------
FINANCIAL SUMMARY:
------------------------------------------------------
Total Savings Balance : ₹${totalSavingsVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Savings Goal          : ₹1,00,000.00
Goal Achievement      : ${dashboardData?.savings?.progressPct || 0}%

Active Loan Status    : ${dashboardData?.activeLoan?.status || 'No Active Loan'}
Remaining Balance     : ₹${(dashboardData?.activeLoan?.remainingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Annual Attendance     : ${dashboardData?.attendance?.annualPct || 94}%
------------------------------------------------------
This is a computer generated digital passbook statement
verified from SahayiDb Database.
======================================================
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Passbook_${memberName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Digital Passbook downloaded for ${memberName}!`);
  };

  // Destructure Data for Clean Rendering
  const memberName = dashboardData?.fullName || currentUser?.fullName || 'Member';
  const unitName = dashboardData?.unitName || 'Akshaya Ayalkoottam';
  const totalSavings = dashboardData?.savings?.totalSavings || 0;
  const savingsThisMonth = dashboardData?.savings?.savingsThisMonth || 0;
  const savingsGoal = dashboardData?.savings?.savingsGoal || 100000;
  const progressPct = dashboardData?.savings?.progressPct || 0;

  const isWeeklyPaid = Boolean(dashboardData?.savings?.isWeeklyPaid);
  const weeklyStatus = dashboardData?.savings?.weeklyStatus || (isWeeklyPaid ? 'Paid' : 'Pending');
  const lastPaymentDate = dashboardData?.savings?.lastPaymentDate || '';

  const activeLoan = dashboardData?.activeLoan || {
    hasLoan: false,
    status: 'No Active Loan',
    loanAmount: 0,
    remainingBalance: 0,
    nextPayment: 0,
    dueDate: '-'
  };

  const repaymentRows = dashboardData?.repaymentSchedule || [
    { month: 'Nov 2024', principal: '₹1,000', interest: '₹200', total: '₹1,200', status: 'paid' },
    { month: 'Dec 2024', principal: '₹1,000', interest: '₹200', total: '₹1,200', status: 'pending' },
    { month: 'Jan 2025', principal: '₹1,000', interest: '₹200', total: '₹1,200', status: 'pending' }
  ];

  const attendanceData = dashboardData?.attendance?.calendar || {
    1: 'present', 2: 'present', 3: 'present', 4: 'absent', 5: 'present',
    6: 'present', 7: 'present', 8: 'present', 9: 'present', 10: 'present',
    11: 'present', 12: 'present'
  };

  const annualPct = dashboardData?.attendance?.annualPct || 94;
  const missedCount = dashboardData?.attendance?.missedCount || 1;

  const notifications = dashboardData?.notifications || [
    {
      id: 1,
      icon: 'meeting',
      title: 'Monthly Meeting Alert',
      time: 'Scheduled',
      body: `Our next group meeting for ${unitName} is scheduled for Saturday at 10:00 AM. Please bring your passbooks.`,
      actions: ['Confirm Attendance', 'Remind Me']
    },
    {
      id: 2,
      icon: 'loan',
      title: 'New Loan Policy Update',
      time: 'Yesterday',
      body: 'The group has approved a lower interest rate for education loans. Members can now apply at 6% per annum directly from the dashboard.',
      actions: ['Read Full Policy']
    }
  ];

  return (
    <div className="mem-container">
      {/* Toast Bar */}
      {toast && (
        <div className={`mem-toast ${toast.type === 'error' ? 'mem-toast--error' : ''}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Left Sidebar Navigation ── */}
      <aside className="mem-sidebar">
        <div>
          <div className="mem-sidebar__brand">SAHAYI</div>
          <nav className="mem-sidebar__nav">
            <div
              className={`mem-nav-item ${activeTab === 'dashboard' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Icon d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" size={17} />
              <span>Dashboard</span>
            </div>

            <div
              className={`mem-nav-item ${activeTab === 'members' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={17} />
              <span>Members</span>
            </div>

            <div
              className={`mem-nav-item ${activeTab === 'financials' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" size={17} />
              <span>Financials</span>
            </div>

            <div
              className={`mem-nav-item ${activeTab === 'meetings' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('meetings')}
            >
              <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" size={17} />
              <span>Meetings</span>
            </div>

            <div
              className={`mem-nav-item ${activeTab === 'reports' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <Icon d="M18 20V10M12 20V4M6 20v-6" size={17} />
              <span>Reports</span>
            </div>
          </nav>
        </div>

        <div className="mem-sidebar__footer">
          <div className="mem-sidebar__divider" />

          <div
            className={`mem-nav-item ${activeTab === 'settings' ? 'mem-nav-item--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" size={17} />
            <span>Settings</span>
          </div>

          <div className="mem-nav-item" onClick={handleLogout}>
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={17} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* ── Main Layout ── */}
      <div className="mem-main">
        {/* ── Top Navbar ── */}
        <header className="mem-header">
          <div className="mem-header__brand">SAHAYI</div>

          <nav className="mem-header__nav">
            <span className="mem-header__nav-link mem-header__nav-link--active">Dashboard</span>
            <span className="mem-header__nav-link" onClick={() => setActiveTab('members')}>My Group</span>
            <span className="mem-header__nav-link" onClick={() => setActiveTab('reports')}>Resources</span>
          </nav>

          <div className="mem-header__right">
            <div className="mem-header__divider" />
            <button className="mem-header__icon-btn" id="notification-btn" onClick={() => showToast(`You have ${notifications.length} active notifications.`)}>
              <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={17} />
              <span className="mem-header__badge" />
            </button>

            <button className="mem-header__icon-btn" id="help-btn" onClick={() => showToast('Help & Support: Call Sahayi Helpline 1800-425-1001')}>
              <Icon d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-10.5V13m0-4a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1z" size={17} />
            </button>

            <img
              src={dashboardData?.avatarUrl || "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=120"}
              alt="Member Avatar"
              className="mem-user-avatar"
              title={`${memberName} (${unitName})`}
            />
          </div>
        </header>

        {/* ── Content ── */}
        <div className="mem-content">
          {isLoading ? (
            <div className="mem-loading-container">
              <div className="mem-spinner" />
              <span>Loading member financial summary from SahayiDb...</span>
            </div>
          ) : (
            <>
              {/* ── Welcome Banner ── */}
              <div className="mem-banner">
                <div>
                  <h1 className="mem-banner__title">Namaste, {memberName}</h1>
                  <p className="mem-banner__subtitle">
                    Here is your community financial summary for <strong>{unitName}</strong>.
                  </p>
                </div>
                <div className="mem-banner__actions">
                  <button className="mem-btn-outline" id="download-passbook-btn" onClick={handleDownloadPassbook}>
                    <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={15} />
                    <span>Download Passbook</span>
                  </button>
                  <button
                    className={isWeeklyPaid ? "mem-btn-pay-savings mem-btn-pay-savings--paid" : "mem-btn-pay-savings"}
                    id="pay-savings-btn"
                    disabled={isWeeklyPaid}
                    onClick={() => {
                      if (isWeeklyPaid) {
                        showToast('Weekly savings deposit for this week is already paid!', 'success');
                      } else {
                        setShowPaymentModal(true);
                      }
                    }}
                  >
                    {isWeeklyPaid ? (
                      <>
                        <Icon d="M20 6L9 17l-5-5" size={15} stroke="#ffffff" strokeWidth={2.5} />
                        <span>✓ Deposit Paid</span>
                      </>
                    ) : (
                      <>
                        <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" size={15} stroke="#ffffff" />
                        <span>Pay Weekly Savings</span>
                      </>
                    )}
                  </button>
                  <button className="mem-btn-primary" id="apply-loan-btn" onClick={() => setShowApplyLoanModal(true)}>
                    <Icon d="M12 5v14M5 12h14" size={15} stroke="#ffffff" />
                    <span>Apply for Loan</span>
                  </button>
                </div>
              </div>

              {/* ── Section: Weekly Savings Deposit Payment ── */}
              <div className="mem-savings-pay-banner">
                <div className="mem-savings-pay-info">
                  <div className={`mem-savings-pay-tag ${isWeeklyPaid ? 'mem-savings-pay-tag--paid' : ''}`}>
                    {isWeeklyPaid ? '✓ PAID FOR THIS WEEK' : 'WEEKLY SAVINGS DEPOSIT'}
                  </div>
                  <h3 className="mem-savings-pay-title">
                    {isWeeklyPaid ? 'Weekly Savings Paid' : 'Deposit Your Weekly Savings'}
                  </h3>
                  <p className="mem-savings-pay-desc">
                    {isWeeklyPaid
                      ? `Great job! Your weekly ₹100 deposit is recorded as Paid${lastPaymentDate ? ` on ${lastPaymentDate}` : ''}. Next deposit will open next week.`
                      : 'Keep your community unit active and build your future. Pay your weekly ₹100 deposit securely online via Razorpay (UPI, Cards, NetBanking) or log cash deposit.'}
                  </p>
                </div>
                <div className="mem-savings-pay-action">
                  <div className="mem-savings-pay-amount-box">
                    <span className="mem-savings-pay-amount-label">
                      {isWeeklyPaid ? 'Status' : 'Weekly Dues'}
                    </span>
                    <span className={`mem-savings-pay-amount-val ${isWeeklyPaid ? 'mem-savings-pay-amount-val--paid' : ''}`}>
                      {isWeeklyPaid ? 'Paid' : '₹100.00'}
                    </span>
                  </div>
                  <button
                    className={`mem-btn-pay-now ${isWeeklyPaid ? 'mem-btn-pay-now--paid' : ''}`}
                    disabled={isWeeklyPaid}
                    onClick={() => {
                      if (isWeeklyPaid) {
                        showToast('Weekly savings deposit for this week is already paid!', 'success');
                      } else {
                        setShowPaymentModal(true);
                      }
                    }}
                  >
                    {isWeeklyPaid ? (
                      <>
                        <Icon d="M20 6L9 17l-5-5" size={16} stroke="#047857" strokeWidth={2.5} />
                        <span>✓ Deposit Paid</span>
                      </>
                    ) : (
                      <>
                        <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" size={16} stroke="#0C382E" />
                        <span>Pay ₹100 Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ── Top Row: Savings + Loan Status ── */}
              <div className="mem-top-row">
                {/* Savings Card */}
                <div className="mem-savings-card">
                  <div className="mem-savings-card__header">
                    <div className="mem-savings-card__label">
                      <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={16} stroke="#1b432c" />
                      <span>Total Savings Balance</span>
                    </div>
                    <div className="mem-savings-card__badge">
                      <Icon d="M23 6l-9.5 9.5-5-5L1 18" size={12} stroke="#2e8b46" />
                      <span>+ ₹{savingsThisMonth.toLocaleString('en-IN')} this month</span>
                    </div>
                  </div>

                  <div className="mem-savings-card__amount">
                    ₹{totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>

                  <div className="mem-savings-card__progress-section">
                    <div className="mem-savings-card__progress-labels">
                      <span>Savings Goal: ₹{savingsGoal.toLocaleString('en-IN')}</span>
                      <span className="mem-savings-card__progress-pct">{progressPct}% Achieved</span>
                    </div>
                    <div className="mem-progress-bar">
                      <div className="mem-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Active Loan Status */}
                <div className="mem-loan-card">
                  <div className="mem-loan-card__header">
                    <div className="mem-loan-card__label">
                      <Icon d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9zm2-4h16M12 12v4" size={16} stroke="#1b432c" />
                      <span>Active Loan Status</span>
                    </div>
                    <span className="mem-badge mem-badge--repayment">
                      {activeLoan.status}
                    </span>
                  </div>

                  <div className="mem-loan-card__amount">
                    ₹{activeLoan.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </div>
                  <div className="mem-loan-card__sublabel">
                    {activeLoan.hasLoan ? 'Remaining Balance' : 'No Active Balance'}
                  </div>

                  <div className="mem-loan-card__divider" />

                  <div className="mem-loan-card__detail-row">
                    <span className="mem-loan-card__detail-key">Next Payment</span>
                    <span className="mem-loan-card__detail-val">
                      ₹{activeLoan.nextPayment.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="mem-loan-card__detail-row">
                    <span className="mem-loan-card__detail-key">Due Date</span>
                    <span className="mem-loan-card__detail-val">{activeLoan.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* ── Middle Row: Repayment Schedule + Attendance ── */}
              <div className="mem-middle-row">
                {/* Repayment Schedule */}
                <div className="mem-card">
                  <div className="mem-card__head">
                    <h2 className="mem-card__title">Repayment Schedule</h2>
                    <a className="mem-card__link" id="view-history-link" onClick={() => showToast('Full repayment audit log loaded.')}>View History</a>
                  </div>

                  <table className="mem-repay-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repaymentRows.map((row, i) => (
                        <tr key={row.id || i}>
                          <td>{row.month}</td>
                          <td>{row.principal}</td>
                          <td>{row.interest}</td>
                          <td className="mem-repay-total">{row.total}</td>
                          <td>
                            {row.status === 'paid' ? (
                              <span className="mem-status mem-status--paid">
                                <Icon d="M20 6L9 17l-5-5" size={12} stroke="#1b6b3a" strokeWidth={2.5} />
                                Paid
                              </span>
                            ) : (
                              <span className="mem-status mem-status--pending">
                                <Icon d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={12} stroke="#b5681c" strokeWidth={2} />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Attendance Calendar */}
                <div className="mem-card">
                  <div className="mem-card__head">
                    <h2 className="mem-card__title">Attendance</h2>
                    <div className="mem-attendance-legend">
                      <span className="mem-legend-dot mem-legend-dot--present" />Present
                      <span className="mem-legend-dot mem-legend-dot--absent" style={{ marginLeft: 10 }} />Absent
                    </div>
                  </div>

                  {/* Day-of-week headers */}
                  <div className="mem-calendar-dow">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="mem-calendar-grid">
                    <div className="mem-cal-cell mem-cal-cell--empty" />
                    <div className="mem-cal-cell mem-cal-cell--empty" />
                    <div className="mem-cal-cell mem-cal-cell--empty" />
                    <div className="mem-cal-cell mem-cal-cell--empty" />

                    {Array.from({ length: 12 }, (_, i) => i + 1).map(day => (
                      <div
                        key={day}
                        className={`mem-cal-cell ${
                          attendanceData[day] === 'present'
                            ? 'mem-cal-cell--present'
                            : attendanceData[day] === 'absent'
                            ? 'mem-cal-cell--absent'
                            : ''
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Attendance summary */}
                  <div className="mem-attendance-summary">
                    <div className="mem-attendance-pct">
                      <span className="mem-attendance-pct__val">{annualPct}%</span>
                      <span className="mem-attendance-pct__label">Annual</span>
                    </div>
                    <div className="mem-attendance-record">
                      <div className="mem-attendance-record__title">Exemplary Record</div>
                      <div className="mem-attendance-record__sub">
                        {missedCount === 0 ? "You've attended all meetings this year!" : `You've missed only ${missedCount} meeting(s) this year.`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Notification Center ── */}
              <div className="mem-notif-card">
                <div className="mem-notif-card__head">
                  <Icon d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-5 10H7m4-4H7m10 0h-3m3-4H7" size={16} stroke="#1b432c" />
                  <h2 className="mem-notif-card__title">Notification Center</h2>
                </div>

                <div className="mem-notif-list">
                  {notifications.map(n => (
                    <div className="mem-notif-item" key={n.id}>
                      <div className={`mem-notif-icon ${n.icon === 'meeting' ? 'mem-notif-icon--meeting' : 'mem-notif-icon--loan'}`}>
                        {n.icon === 'meeting' ? (
                          <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={20} stroke="#647d6b" />
                        ) : (
                          <Icon d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={20} stroke="#b5681c" />
                        )}
                      </div>
                      <div className="mem-notif-body">
                        <div className="mem-notif-body__top">
                          <span className="mem-notif-body__title">{n.title}</span>
                          <span className="mem-notif-body__time">{n.time}</span>
                        </div>
                        <p className="mem-notif-body__text">{n.body}</p>
                        <div className="mem-notif-body__actions">
                          {(n.actions || []).map((a, i) => (
                            <button key={i} className="mem-notif-action-btn" onClick={() => showToast(`Action '${a}' acknowledged.`)}>{a}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mem-notif-footer">
                  <button className="mem-notif-view-all" id="view-all-notifications-btn" onClick={() => showToast('All notifications read.')}>View All Notifications</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Page Footer ── */}
        <footer className="mem-footer">
          <div className="mem-footer__left">
            <div className="mem-footer__brand">Ayalkoottam Connect</div>
            <div className="mem-footer__copy">© 2026 Ayalkoottam Management System. Empowering local communities.</div>
          </div>
          <div className="mem-footer__links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </footer>
      </div>

      {/* ── Apply for Loan Modal ── */}
      {showApplyLoanModal && (
        <div className="mem-modal-overlay" onClick={() => setShowApplyLoanModal(false)}>
          <div className="mem-modal" onClick={e => e.stopPropagation()}>
            <div className="mem-modal__header">
              <h3 className="mem-modal__title">Apply for Member Loan</h3>
              <button className="mem-modal__close" onClick={() => setShowApplyLoanModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleLoanSubmit}>
              <div className="mem-form-group">
                <label>Loan Amount Requested (₹)</label>
                <input
                  type="number"
                  className="mem-form-input"
                  min="1000"
                  max="200000"
                  step="500"
                  value={loanForm.amount}
                  onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="mem-form-group">
                <label>Purpose of Loan</label>
                <select
                  className="mem-form-select"
                  value={loanForm.purpose}
                  onChange={e => setLoanForm({ ...loanForm, purpose: e.target.value })}
                >
                  <option value="Small Enterprise / Agriculture">Small Enterprise / Agriculture</option>
                  <option value="Children Education & Fees">Children Education & Fees</option>
                  <option value="House Maintenance & Repair">House Maintenance & Repair</option>
                  <option value="Medical Emergency / Health">Medical Emergency / Health</option>
                  <option value="Dairy & Livestock Purchase">Dairy & Livestock Purchase</option>
                </select>
              </div>

              <div className="mem-form-group">
                <label>Tenure (Months)</label>
                <select
                  className="mem-form-select"
                  value={loanForm.tenureMonths}
                  onChange={e => setLoanForm({ ...loanForm, tenureMonths: e.target.value })}
                >
                  <option value={6}>6 Months (Fast Repayment)</option>
                  <option value={12}>12 Months (Standard 1 Year)</option>
                  <option value={24}>24 Months (Extended 2 Years)</option>
                </select>
              </div>

              <div className="mem-modal__actions">
                <button
                  type="button"
                  className="mem-btn-outline"
                  onClick={() => setShowApplyLoanModal(false)}
                  disabled={isSubmittingLoan}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mem-btn-primary"
                  disabled={isSubmittingLoan}
                >
                  {isSubmittingLoan ? 'Submitting to SahayiDb...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Weekly Savings Payment Modal (Razorpay / Cash) ── */}
      {showPaymentModal && (
        <PaymentMethodModal
          item={{
            id: currentUser?.userId || dashboardData?.userId || 0,
            userId: currentUser?.userId || dashboardData?.userId || 0,
            name: memberName,
            memberId: dashboardData?.memberIdStr || `AK-${currentUser?.userId || '001'}`,
            amount: 100,
            week: 'Current Week',
            month: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          }}
          unitInfo={{
            unitId: currentUser?.unitId || dashboardData?.unitId || 0,
            unitName: unitName
          }}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(item, method, paymentId) => {
            setShowPaymentModal(false);
            if (method === 'Online') {
              showToast(`Weekly savings deposit of ₹100 paid online and added directly to Unit Bank Account!`);
            } else {
              showToast(`Weekly cash payment of ₹100 recorded! Listed on Secretary Dashboard for bank deposit.`);
            }
            loadDashboardData();
          }}
          onError={(msg) => {
            showToast(msg || 'Failed to process payment.', 'error');
          }}
        />
      )}
    </div>
  );
}

export default MemberDashboard;
