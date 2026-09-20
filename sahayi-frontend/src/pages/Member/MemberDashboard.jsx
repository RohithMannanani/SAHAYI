import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemberDashboard.css';
import { fetchMemberDashboard, applyMemberLoan, fetchSavingsWeeks } from '../../services/api';
import { formatDateToDDMMYYYY } from '../Secretary/utils/formatTime';
import PaymentMethodModal from '../Secretary/components/modals/PaymentMethodModal';
import WeeklySavingsHistoryModal from '../../components/common/WeeklySavingsHistoryModal';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function MemberDashboard() {
  const navigate = useNavigate();

  // Modal States & Data States
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('member_active_tab');
    return (saved && saved !== 'financials') ? saved : 'dashboard';
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedWeekItem, setSelectedWeekItem] = useState(null);
  const [showApplyLoanModal, setShowApplyLoanModal] = useState(false);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);
  const [loanForm, setLoanForm] = useState({
    amount: 15000,
    purpose: 'Small Enterprise / Agriculture',
    tenureMonths: 12
  });

  // State for Dynamic Data from SahayiDb
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [savingsWeeks, setSavingsWeeks] = useState([]);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('member_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (showHistoryModal) {
        setShowHistoryModal(false);
      } else if (showApplyLoanModal) {
        setShowApplyLoanModal(false);
      } else if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, showHistoryModal, showApplyLoanModal]);

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
      const [memRes, weeksRes] = await Promise.allSettled([
        fetchMemberDashboard(userObj?.userId, userObj?.unitId),
        fetchSavingsWeeks(userObj?.unitId || 1)
      ]);

      if (memRes.status === 'fulfilled' && memRes.value?.data) {
        setDashboardData(memRes.value.data);
      }

      if (weeksRes.status === 'fulfilled' && weeksRes.value?.data) {
        setSavingsWeeks(weeksRes.value.data || []);
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
  const memberIdStr = dashboardData?.memberIdStr || `AK-${currentUser?.userId || '001'}`;
  const totalSavings = dashboardData?.savings?.totalSavings || 0;
  const savingsThisMonth = dashboardData?.savings?.savingsThisMonth || 0;
  const savingsGoal = dashboardData?.savings?.savingsGoal || 100000;
  const progressPct = dashboardData?.savings?.progressPct || 0;

  const isWeeklyPaid = Boolean(dashboardData?.savings?.isWeeklyPaid);
  const lastPaymentDate = dashboardData?.savings?.lastPaymentDate || '';
  const pendingWeeksCount = dashboardData?.savings?.pendingWeeksCount || 0;
  const weeklyHistoryRows = dashboardData?.savings?.weeklyHistory || [];

  const activeLoan = dashboardData?.activeLoan || {
    hasLoan: false,
    status: 'No Active Loan',
    loanAmount: 0,
    remainingBalance: 0,
    nextPayment: 0,
    dueDate: '-'
  };

  const repaymentRows = dashboardData?.repaymentSchedule || [];

  const attendanceData = dashboardData?.attendance?.calendar || {};
  const annualPct = dashboardData?.attendance?.annualPct || 94;
  const missedCount = dashboardData?.attendance?.missedCount || 0;

  const notifications = dashboardData?.notifications || [];

  // Compute current week Monday–Sunday for the date range pill
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekStartStr = formatDateToDDMMYYYY(monday.toISOString().split('T')[0]);
  const weekEndStr = formatDateToDDMMYYYY(sunday.toISOString().split('T')[0]);

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
              className="mem-nav-item"
              onClick={() => setShowHistoryModal(true)}
              title="View my own weekly savings history and dues"
            >
              <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 1 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={17} />
              <span>View Own Savings</span>
            </div>

            <div
              className={`mem-nav-item ${activeTab === 'members' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={17} />
              <span>Members</span>
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
            <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" size={17} />
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
            <span
              className={`mem-header__nav-link ${activeTab === 'dashboard' ? 'mem-header__nav-link--active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </span>
          </nav>

          <div className="mem-header__right">
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
            /* ── MAIN DASHBOARD VIEW ── */
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
                        <Icon d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4.5 4.5 0 0 0 0-9H6" size={15} stroke="#ffffff" />
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

              {/* ── Section: Weekly Savings Deposit Payment (hidden when paid) ── */}
              {!isWeeklyPaid && (
                <div className="mem-savings-pay-banner">
                  <div className="mem-savings-pay-info">
                    <div className="mem-savings-pay-tag">WEEKLY SAVINGS DEPOSIT</div>

                    {/* Week date range pill */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(255,255,255,0.12)',
                      borderRadius: '6px',
                      padding: '3px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#a7f3d0',
                      marginBottom: '4px'
                    }}>
                      <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" size={12} stroke="#a7f3d0" />
                      {weekStartStr} → {weekEndStr}
                    </div>

                    <h3 className="mem-savings-pay-title">Deposit Your Weekly Savings</h3>
                    <p className="mem-savings-pay-desc">
                      Keep your community unit active and build your future. Pay your weekly ₹100 deposit securely online via Razorpay or log cash deposit.
                    </p>
                  </div>
                  <div className="mem-savings-pay-action">
                    <div className="mem-savings-pay-amount-box">
                      <span className="mem-savings-pay-amount-label">Weekly Dues</span>
                      <span className="mem-savings-pay-amount-val">₹100.00</span>
                    </div>
                    <button
                      className="mem-btn-pay-now"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      <Icon d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4.5 4.5 0 0 0 0-9H6" size={16} stroke="#0C382E" />
                      <span>Pay ₹100 Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── Top Row: Savings + Loan Status ── */}
              <div className="mem-top-row">
                {/* Savings Card */}
                <div className="mem-savings-card" onClick={() => setShowHistoryModal(true)} style={{ cursor: 'pointer' }}>
                  <div className="mem-savings-card__header">
                    <div className="mem-savings-card__label">
                      <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={16} stroke="#1b432c" />
                      <span>Total Savings Balance</span>
                    </div>
                    <div className="mem-savings-card__badge">
                      <span>Inspect History &rarr;</span>
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
                </div>
              </div>

              {/* ── Section: Weekly Savings Ledger & Dues (Clickable Card) ── */}
              <div
                className="mem-card"
                onClick={() => setShowHistoryModal(true)}
                style={{ marginTop: '24px', marginBottom: '24px', cursor: 'pointer', borderLeft: '4px solid #10b981' }}
              >
                <div className="mem-card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 className="mem-card__title" style={{ margin: 0, fontSize: '1.15rem', color: '#0c382e' }}>
                      Weekly Savings History Card
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                      Click to inspect detailed <strong>Paid</strong> and <strong>Pending</strong> payments breakdown.
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
                    Inspect Paid & Pending &rarr;
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Page Footer ── */}
        <footer className="mem-footer">
          <div className="mem-footer__left">
            <div className="mem-footer__brand">SHAYI</div>
            <div className="mem-footer__copy">© 2026 Ayalkoottam Management System. Empowering local communities.</div>
          </div>
          <div className="mem-footer__links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
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

      {/* ── Weekly Savings Payment Modal ── */}
      {showPaymentModal && (
        <PaymentMethodModal
          item={selectedWeekItem || {
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
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedWeekItem(null);
          }}
          onSuccess={(item, method, paymentId) => {
            setShowPaymentModal(false);
            setSelectedWeekItem(null);
            if (method === 'Online') {
              showToast(`Weekly savings deposit of ₹100 paid online!`);
            } else {
              showToast(`Weekly cash payment of ₹100 recorded!`);
            }
            loadDashboardData();
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
          currentUserId={currentUser?.userId || dashboardData?.userId}
          onClose={() => setShowHistoryModal(false)}
          onRecordPayment={(targetItem) => {
            setSelectedWeekItem(targetItem);
            setShowHistoryModal(false);
            setShowPaymentModal(true);
          }}
        />
      )}
    </div>
  );
}

export default MemberDashboard;
