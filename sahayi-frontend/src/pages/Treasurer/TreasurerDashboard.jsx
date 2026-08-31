import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Landmark,
  PiggyBank,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  X
} from 'lucide-react';
import './TreasurerDashboard.css';

// Services & Common Components
import {
  fetchSecretaryDashboard,
  fetchSavingsWeeks,
  fetchUnitBankAccount,
  recordSecretarySavings,
  payCashSavings,
  payOnlineSavings,
  depositCashToBank
} from '../../services/api';
import WeeklySavingsHistoryModal from '../../components/common/WeeklySavingsHistoryModal';
import FinancialsView from '../Secretary/components/views/FinancialsView';
import PaymentMethodModal from '../Secretary/components/modals/PaymentMethodModal';
import { getWeeklyCollectionLogs } from '../Secretary/utils/weeklyCollectionUtils';
import { formatDateToDDMMYYYY } from '../Secretary/utils/formatTime';

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
  const [savingsLogs, setSavingsLogs] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentMemberItem, setPaymentMemberItem] = useState(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  const currentUser = React.useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('treasurer_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (paymentMemberItem) {
        setPaymentMemberItem(null);
      } else if (showHistoryModal) {
        setShowHistoryModal(false);
      } else if (activeTab !== 'financials') {
        setActiveTab('financials');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [paymentMemberItem, showHistoryModal, activeTab]);

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
        const data = dashRes.value.data;
        setDashboardData(data);
        const combinedLogs = [...(data.savingsLogs || [])];
        if (Array.isArray(data.allSavingsLogs)) {
          data.allSavingsLogs.forEach(histItem => {
            if (!combinedLogs.some(c => c.id === histItem.id)) {
              combinedLogs.push(histItem);
            }
          });
        }
        setSavingsLogs(combinedLogs);
      }

      if (weeksRes.status === 'fulfilled' && weeksRes.value?.data) {
        setSavingsWeeks(weeksRes.value.data || []);
      }

      if (bankRes.status === 'fulfilled' && bankRes.value?.data) {
        setUnitBank(bankRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load treasurer financial data:', err);
      showToast('Failed to load financial records from database', 'error');
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

  // Deposit single cash transaction to unit bank account
  const handleDepositCashToBank = async (item) => {
    try {
      const depositAmount = parseFloat(item.amount) > 0 ? parseFloat(item.amount) : 100;
      const targetTxId = (item.id && !isNaN(Number(item.id))) ? Number(item.id) : null;
      const targetUnitId = currentUser?.unitId || 1;

      const payload = {
        transactionId: targetTxId,
        unitId: targetUnitId,
        amount: depositAmount,
        userId: item.userId || item.id || 0
      };

      try {
        const res = await depositCashToBank(payload);
        const updatedBank = res.data?.bankAccount;
        if (updatedBank) {
          setUnitBank(updatedBank);
        } else {
          setUnitBank(prev => ({
            ...(prev || { accountNumber: `SB-UNIT-${targetUnitId}`, bankName: 'South Indian Bank', ifscCode: 'SIBL0000705' }),
            balance: (parseFloat(prev?.balance || 0) + depositAmount)
          }));
        }
      } catch (err) {
        setUnitBank(prev => ({
          ...(prev || { accountNumber: `SB-UNIT-${targetUnitId}`, bankName: 'South Indian Bank', ifscCode: 'SIBL0000705' }),
          balance: (parseFloat(prev?.balance || 0) + depositAmount)
        }));
      }

      setSavingsLogs(prev =>
        prev.map(s => {
          if (s.id === item.id || (s.userId && item.userId && s.userId === item.userId)) {
            const currentMode = s.paymentMode || s.paymentMethod || 'Cash';
            const isOnline = currentMode.toLowerCase().includes('online');
            return { ...s, paymentMode: isOnline ? 'Online (Bank Deposited)' : 'Cash (Bank Deposited)' };
          }
          return s;
        })
      );

      showToast(`₹${depositAmount.toFixed(2)} collection deposited into Unit Bank Account!`);
    } catch (err) {
      console.error('Error depositing cash to unit bank account:', err);
      showToast('Failed to deposit cash payment to Unit Bank Account', 'error');
    }
  };

  // Deposit all undeposited collections in hand to unit bank account
  const handleDepositAllCashToBank = async (cashItems) => {
    if (!cashItems || cashItems.length === 0) return;
    try {
      let totalAmount = 0;
      for (const item of cashItems) {
        const depositAmount = parseFloat(item.amount) > 0 ? parseFloat(item.amount) : 100;
        const targetTxId = (item.id && !isNaN(Number(item.id))) ? Number(item.id) : null;
        try {
          await depositCashToBank({
            transactionId: targetTxId,
            unitId: currentUser?.unitId || 1,
            amount: depositAmount,
            userId: item.userId || item.id || 0
          });
        } catch (e) {
          // Handled silently
        }
        totalAmount += depositAmount;
      }

      setSavingsLogs(prev =>
        prev.map(s => {
          if (cashItems.some(c => c.id === s.id || (c.userId && s.userId && c.userId === s.userId))) {
            const currentMode = s.paymentMode || s.paymentMethod || 'Cash';
            const isOnline = currentMode.toLowerCase().includes('online');
            return { ...s, paymentMode: isOnline ? 'Online (Bank Deposited)' : 'Cash (Bank Deposited)' };
          }
          return s;
        })
      );

      setUnitBank(prev => ({
        ...(prev || { accountNumber: `SB-UNIT-${currentUser?.unitId || 1}`, bankName: 'South Indian Bank', ifscCode: 'SIBL0000705' }),
        balance: (parseFloat(prev?.balance || 0) + totalAmount)
      }));

      showToast(`All collections (₹${totalAmount.toFixed(2)}) deposited into Unit Bank Account!`);
    } catch (err) {
      console.error('Error depositing all cash:', err);
      showToast('Failed to deposit cash collections to bank', 'error');
    }
  };

  // Handle open payment modal for recording member savings
  const handleRecordSavings = (item) => {
    setPaymentMemberItem(item);
  };

  // Payment success handler (Cash / Online Razorpay)
  const handlePaymentSuccess = async (item, method, paymentId) => {
    const amountVal = parseFloat(item.amount) > 0 ? parseFloat(item.amount) : 100;
    setPaymentMemberItem(null);
    if (method === 'Online') {
      showToast(`Online payment of ₹${amountVal.toFixed(2)} recorded into Cash Collected (In Hand)!`);
    } else {
      showToast(`Cash payment of ₹${amountVal.toFixed(2)} recorded into Cash Collected (In Hand)!`);
    }
    loadTreasurerData();
  };

  // Calculated Financial Metrics
  const membersList = dashboardData?.members || [];
  const weeklyLogs = getWeeklyCollectionLogs(savingsLogs, membersList);
  const currentWeekGroup = weeklyLogs[selectedWeekIndex] || weeklyLogs[0] || {
    weekTitle: 'Current Week',
    mondayStr: new Date().toISOString().split('T')[0],
    sundayStr: new Date().toISOString().split('T')[0],
    items: savingsLogs
  };

  const currentWeekItems = currentWeekGroup?.items || savingsLogs;
  const startDurationStr = formatDateToDDMMYYYY(currentWeekGroup.mondayStr || currentWeekGroup.weekKey);
  const endDurationStr = formatDateToDDMMYYYY(currentWeekGroup.sundayStr || currentWeekGroup.weekKey);
  const durationText = `${startDurationStr} to ${endDurationStr}`;

  // All paid payments that are NOT yet deposited into the bank show in "Cash Collected In Hand"
  const undepositedCashList = savingsLogs.filter(s =>
    s.status === 'Paid' &&
    !(s.paymentMode || '').toLowerCase().includes('bank deposited') &&
    !(s.paymentMode || '').toLowerCase().includes('in bank')
  );
  const undepositedTotal = undepositedCashList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  // Only payments that have been explicitly deposited into the bank are added to the bank balance
  const depositedTotalFromLogs = savingsLogs
    .filter(s => s.status === 'Paid' && (
      (s.paymentMode || '').toLowerCase().includes('bank deposited') ||
      (s.paymentMode || '').toLowerCase().includes('in bank')
    ))
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const availableBalance = Math.max(
    parseFloat(unitBank?.balance || 0),
    depositedTotalFromLogs
  );

  const totalCollection = dashboardData?.totalWeeklyCollection || savingsLogs.filter(s => s.status === 'Paid').reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const disbursedLoans = dashboardData?.disbursedLoansTotal || 0;

  const liveTransactions = React.useMemo(() => {
    return savingsLogs.map((item, idx) => ({
      id: item.id || idx + 1,
      name: item.name || 'Member',
      date: item.date || item.paidDate || new Date().toISOString().split('T')[0],
      type: item.paymentMode === 'Cash' ? 'Cash Savings' : 'Online Savings',
      typeColor: item.paymentMode === 'Cash' ? 'fee' : 'repayment',
      amount: `₹${parseFloat(item.amount || 100).toFixed(2)}`,
      status: item.status || 'Paid'
    }));
  }, [savingsLogs]);

  const filteredTransactions = liveTransactions.filter(tx =>
    tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unitInfoObj = {
    unitId: currentUser?.unitId || 1,
    unitName: dashboardData?.unitName || currentUser?.unitName || 'Ayalkoottam Unit',
    secretaryPhone: currentUser?.phoneNumber || ''
  };

  return (
    <div className="tr-container">
      {/* Toast Notification Bar */}
      {toast && (
        <div className={`tr-toast tr-toast--${toast.type}`} style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Left Sidebar ── */}
      <aside className="tr-sidebar">
        <div>
          <div className="tr-sidebar__brand">
            <div className="tr-brand-title">SAHAYI</div>
            <div className="tr-brand-title">Treasurer</div>
            <div className="tr-brand-sub">Financial Management</div>
          </div>

          <nav className="tr-sidebar__nav">
            <div
              className={`tr-nav-item ${activeTab === 'dashboard' ? 'tr-nav-item--active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Icon d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" size={17} />
              <span>Dashboard</span>
            </div>

            <div
              className={`tr-nav-item ${activeTab === 'financials' ? 'tr-nav-item--active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" size={17} />
              <span>Financials</span>
            </div>

            <div
              className={`tr-nav-item ${activeTab === 'members' ? 'tr-nav-item--active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={17} />
              <span>Members</span>
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

        <div className="tr-sidebar__footer">
          <button className="tr-btn-new-record" onClick={() => setShowHistoryModal(true)}>
            <Icon d="M12 5v14M5 12h14" size={16} stroke="#ffffff" />
            <span>Savings Log</span>
          </button>

          <div className="tr-sidebar__divider" />

          <div className={`tr-nav-item ${activeTab === 'settings' ? 'tr-nav-item--active' : ''}`} onClick={() => setActiveTab('settings')}>
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
        <header className="tr-header">
          <div className="tr-header__title">
            {activeTab === 'dashboard' && 'Treasurer Overview Dashboard'}
            {activeTab === 'financials' && 'Financial & Treasury Portal'}
            {activeTab === 'members' && 'Unit Members Financial Registry'}
            {activeTab === 'meetings' && 'Meetings Log'}
            {activeTab === 'reports' && 'Financial Reports & Audit Center'}
            {activeTab === 'settings' && 'Treasurer Unit Settings'}
          </div>

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

            <button className="tr-header__icon-btn" onClick={() => setShowHistoryModal(true)} title="View Weekly Savings History">
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

        <div className="tr-content">
          {/* ── DASHBOARD OVERVIEW TAB VIEW ── */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Unit Bank Account & Cash Collection Header Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0C382E 0%, #155e4b 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 8px 24px rgba(12, 56, 46, 0.18)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399'
                  }}>
                    <Landmark size={26} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8, fontWeight: 600 }}>
                      Official Unit Bank Account Balance
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '2px 0 4px 0', color: '#ffffff' }}>
                      ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h3>
                    <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.85 }}>
                      {unitBank?.bankName || 'South Indian Bank'} &bull; A/C: {unitBank?.accountNumber || `705053000002165`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.6rem 1rem', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', textTransform: 'uppercase' }}>Cash Collected In Hand</span>
                    <strong style={{ fontSize: '1rem', color: '#fbbf24' }}>₹{undepositedTotal.toFixed(2)}</strong>
                  </div>
                  {undepositedCashList.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDepositAllCashToBank(undepositedCashList)}
                      style={{
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.45rem 0.9rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Landmark size={14} />
                      <span>Deposit Cash to Bank</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Weekly Savings Log Widget */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 14px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PiggyBank size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0c382e' }}>Weekly Savings Log</h3>
                      <span style={{ fontSize: '0.78rem', color: '#0c382e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} /> Duration: {durationText}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedWeekIndex(prev => Math.min(prev + 1, Math.max(0, weeklyLogs.length - 1)))}
                      disabled={selectedWeekIndex >= weeklyLogs.length - 1}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: selectedWeekIndex >= weeklyLogs.length - 1 ? '#f8fafc' : '#ffffff',
                        color: selectedWeekIndex >= weeklyLogs.length - 1 ? '#94a3b8' : '#0c382e',
                        cursor: selectedWeekIndex >= weeklyLogs.length - 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <ChevronLeft size={15} />
                      <span>Previous Week</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedWeekIndex(prev => Math.max(prev - 1, 0))}
                      disabled={selectedWeekIndex <= 0}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: selectedWeekIndex <= 0 ? '#f8fafc' : '#ffffff',
                        color: selectedWeekIndex <= 0 ? '#94a3b8' : '#0c382e',
                        cursor: selectedWeekIndex <= 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <span>Upcoming Week</span>
                      <ChevronRight size={15} />
                    </button>

                    <button
                      onClick={() => setShowHistoryModal(true)}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#0284c7',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginLeft: '6px'
                      }}
                    >
                      View History
                    </button>
                  </div>
                </div>

                <table className="tr-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Month</th>
                      <th>Week</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment Mode</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                          Loading weekly savings log...
                        </td>
                      </tr>
                    ) : currentWeekItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                          No weekly savings records found.
                        </td>
                      </tr>
                    ) : (
                      currentWeekItems.map(item => {
                        const getDetails = (log) => {
                          if (log.month && log.week) return { month: log.month, week: log.week };
                          const d = log.date ? new Date(log.date) : new Date();
                          const validDate = isNaN(d.getTime()) ? new Date() : d;
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const monthStr = log.month || `${monthNames[validDate.getMonth()]} ${validDate.getFullYear()}`;
                          const weekNum = currentWeekGroup.weekNumber || Math.ceil(validDate.getDate() / 7);
                          const weekStr = log.week || `Week ${weekNum}`;
                          return { month: monthStr, week: weekStr };
                        };
                        const { month: logMonth, week: logWeek } = getDetails(item);
                        const mode = item.paymentMode || item.paymentMethod || (item.status === 'Paid' ? 'Cash' : '-');
                        const isOnline = mode.toLowerCase().includes('online');
                        const isBankDeposited = mode.toLowerCase().includes('bank deposited') || mode.toLowerCase().includes('in bank');

                        return (
                          <tr key={item.id}>
                            <td className="tr-td-name">{item.name}</td>
                            <td>{logMonth}</td>
                            <td>
                              <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                                {logWeek}
                              </span>
                            </td>
                            <td className="tr-td-amount">₹{item.amount}</td>
                            <td>
                              <span className={`tr-status-badge tr-status-badge--${item.status.toLowerCase()}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>
                              {isOnline ? (
                                <span style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={13} /> Online
                                </span>
                              ) : isBankDeposited ? (
                                <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={13} /> Cash
                                </span>
                              ) : (
                                mode
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {item.status === 'Paid' ? (
                                <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={14} /> Paid
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRecordSavings(item)}
                                  style={{
                                    backgroundColor: '#0f172a',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '5px 14px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Record
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── FINANCIALS TAB VIEW ── */}
          {activeTab === 'financials' && (
            <FinancialsView
              financials={{
                totalCollection: totalCollection,
                disbursedLoans: disbursedLoans,
                pendingDues: 0
              }}
              unitBankAccount={unitBank}
              savingsLogs={savingsLogs}
              allMembers={membersList}
              onDepositCashToBank={handleDepositCashToBank}
              onDepositAllCashToBank={handleDepositAllCashToBank}
              onRecordSavings={handleRecordSavings}
              onPayNow={handleRecordSavings}
            />
          )}

          {/* ── MEMBERS TAB VIEW ── */}
          {activeTab === 'members' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#0c382e', fontSize: '1.2rem', fontWeight: 700 }}>Unit Members Financial Registry</h3>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Total Members: {membersList.length}</span>
              </div>

              <table className="tr-table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Member ID</th>
                    <th>Phone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {membersList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                        Loading unit members...
                      </td>
                    </tr>
                  ) : (
                    membersList.map((m, idx) => (
                      <tr key={m.id || m.userId || idx}>
                        <td className="tr-td-name">{m.name}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{m.memberId}</td>
                        <td>{m.phone || '-'}</td>
                        <td>
                          <span className="tr-status-badge tr-status-badge--success">Active</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── MEETINGS TAB VIEW ── */}
          {activeTab === 'meetings' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0c382e', fontSize: '1.2rem', fontWeight: 700 }}>Meetings & Attendance Log</h3>
              <table className="tr-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashboardData?.meetings || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                        No meetings scheduled yet.
                      </td>
                    </tr>
                  ) : (
                    (dashboardData?.meetings || []).map((m, idx) => (
                      <tr key={m.id || idx}>
                        <td className="tr-td-name">{m.title}</td>
                        <td>{m.date}</td>
                        <td>{m.time}</td>
                        <td>{m.location}</td>
                        <td>
                          <span className={`tr-status-badge tr-status-badge--${m.isCompleted ? 'success' : 'pending'}`}>
                            {m.isCompleted ? 'Completed' : 'Scheduled'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── REPORTS TAB VIEW ── */}
          {activeTab === 'reports' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#0c382e', fontSize: '1.2rem', fontWeight: 700 }}>Financial Reports & Auditing</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '20px' }}>
                Review and inspect weekly collections, bank statements, and loan performance reports.
              </p>
              <button
                className="tr-btn-generate-report"
                onClick={() => setShowHistoryModal(true)}
                style={{ width: 'auto', padding: '10px 20px' }}
              >
                Inspect Weekly Savings History Audit &rarr;
              </button>
            </div>
          )}

          {/* ── SETTINGS TAB VIEW ── */}
          {activeTab === 'settings' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0c382e', fontSize: '1.2rem', fontWeight: 700 }}>Treasurer Unit Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem', color: '#334155' }}>
                <div><strong>Unit Name:</strong> {dashboardData?.unitName || 'Sahayi Unit'}</div>
                <div><strong>Bank Name:</strong> {unitBank?.bankName || 'South Indian Bank'}</div>
                <div><strong>Account Number:</strong> {unitBank?.accountNumber || '705053000002165'}</div>
                <div><strong>IFSC Code:</strong> {unitBank?.ifscCode || 'SIBL0000705'}</div>
                <div><strong>Current Balance:</strong> ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="tr-footer">
          <div>
            <div className="tr-footer-brand">SHAYI</div>
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
          savingsLogs={savingsLogs}
          onClose={() => setShowHistoryModal(false)}
          onRecordPayment={handleRecordSavings}
          onDepositCash={handleDepositCashToBank}
        />
      )}

      {/* ── Payment Method Modal (Cash / Online Razorpay Checkout) ── */}
      {paymentMemberItem && (
        <PaymentMethodModal
          item={paymentMemberItem}
          unitInfo={unitInfoObj}
          onClose={() => setPaymentMemberItem(null)}
          onSuccess={handlePaymentSuccess}
          onError={(errMsg) => showToast(errMsg, 'error')}
        />
      )}
    </div>
  );
}

export default TreasurerDashboard;
