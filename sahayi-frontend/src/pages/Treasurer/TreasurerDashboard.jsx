import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Landmark,
  PiggyBank,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  X,
  FileText,
  Download,
  Printer,
  TrendingUp,
  AlertCircle,
  ArrowDownToLine,
  RefreshCw,
  BarChart2,
  ShieldCheck,
  Filter,
  Search
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
  const [showOwnSavingsModal, setShowOwnSavingsModal] = useState(false);
  const [paymentMemberItem, setPaymentMemberItem] = useState(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);

  // Financial Reports Generation States
  const [selectedReportType, setSelectedReportType] = useState('weekly_collection');
  const [reportWeekFilter, setReportWeekFilter] = useState('all');
  const [reportSearchQuery, setReportSearchQuery] = useState('');

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
      } else if (showOwnSavingsModal) {
        setShowOwnSavingsModal(false);
      } else if (activeTab !== 'financials') {
        setActiveTab('financials');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [paymentMemberItem, showHistoryModal, showOwnSavingsModal, activeTab]);

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

  const cleanTitle = (t) => {
    if (!t) return '';
    return String(t)
      .replace(/^(?:Week\s*\d+|Current\s*Week|Week\s*Collection)\s*\((.*)\)$/i, '$1')
      .replace(/^Week\s*\d+\s*-?\s*/i, '')
      .trim();
  };

  const weeklyLogs = React.useMemo(() => {
    if (Array.isArray(savingsWeeks) && savingsWeeks.length > 0) {
      return savingsWeeks.map(w => ({
        weekKey: `week-${w.weekNumber || w.id}-${w.startDate}`,
        weekTitle: cleanTitle(w.weekTitle || `${w.startDate || ''} – ${w.endDate || ''}`),
        mondayStr: w.startDate,
        sundayStr: w.endDate,
        totalCollected: w.totalCollected || 0,
        paidCount: w.paidCount || 0,
        pendingCount: w.pendingCount || 0,
        items: (w.members || []).map(m => ({
          id: m.transactionId || `tx-${m.userId}-${w.id || w.weekNumber}`,
          userId: m.userId,
          name: m.name,
          memberId: m.memberId,
          amount: m.amount || '100.00',
          status: m.status || 'Pending',
          paymentMode: m.paymentMode || '-',
          paidDate: m.paidDate || '-',
          date: m.paidDate || w.startDate,
          savingsWeekId: w.id || w.savingsWeekId
        }))
      }));
    }
    return getWeeklyCollectionLogs(savingsLogs, membersList);
  }, [savingsWeeks, savingsLogs, membersList]);

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

  // All paid payments that are NOT yet deposited into the bank show in "Collections In Hand"
  const undepositedCashList = savingsLogs.filter(s =>
    s.status === 'Paid' &&
    !(s.paymentMode || '').toLowerCase().includes('bank deposited') &&
    !(s.paymentMode || '').toLowerCase().includes('in bank')
  );
  const undepositedTotal = undepositedCashList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const undepositedOnlineCount = undepositedCashList.filter(s => (s.paymentMode || '').toLowerCase().includes('online')).length;
  const undepositedCashCount = undepositedCashList.filter(s => !(s.paymentMode || '').toLowerCase().includes('online')).length;

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

  // ── Financial Reports Data Computations ───────────────────────
  const weeklyCollectionReportRows = useMemo(() => {
    const rows = [];
    if (Array.isArray(savingsWeeks) && savingsWeeks.length > 0) {
      savingsWeeks.forEach(w => {
        const weekKey = String(w.id || w.savingsWeekId || w.weekNumber);
        if (reportWeekFilter !== 'all' && reportWeekFilter !== weekKey) return;
        const weekTitle = cleanTitle(w.weekTitle || `${w.startDate} – ${w.endDate}`);
        (w.members || []).forEach(m => {
          rows.push({
            weekId: weekKey,
            weekTitle,
            userId: m.userId,
            name: m.name || 'Member',
            memberId: m.memberId || `M-${m.userId}`,
            amount: parseFloat(m.amount && parseFloat(m.amount) > 0 ? m.amount : (w.amount || 100)).toFixed(2),
            status: (m.status || 'Pending').toLowerCase() === 'paid' ? 'Paid' : 'Pending',
            paymentMode: m.paymentMode || (m.status === 'Paid' ? 'Cash' : '-'),
            paidDate: m.paidDate || '-'
          });
        });
      });
    } else {
      savingsLogs.forEach((s, idx) => {
        rows.push({
          weekId: 'all',
          weekTitle: cleanTitle(s.weekTitle || s.date || 'Weekly Collection'),
          userId: s.userId,
          name: s.name || 'Member',
          memberId: s.memberId || `M-${s.userId || idx + 1}`,
          amount: parseFloat(s.amount || 100).toFixed(2),
          status: s.status || 'Paid',
          paymentMode: s.paymentMode || 'Cash',
          paidDate: s.paidDate || s.date || '-'
        });
      });
    }
    return rows;
  }, [savingsWeeks, savingsLogs, reportWeekFilter]);

  const bankReconciliationRows = useMemo(() => {
    return savingsLogs
      .filter(s => s.status === 'Paid')
      .map((s, idx) => {
        const isOnline = (s.paymentMode || '').toLowerCase().includes('online');
        const isBankDeposited = (s.paymentMode || '').toLowerCase().includes('bank deposited') || (s.paymentMode || '').toLowerCase().includes('in bank');
        const bankStatus = isBankDeposited ? 'Deposited in Bank' : isOnline ? 'Online (Pending Transfer)' : 'Cash in Hand (Undeposited)';
        return {
          id: s.id || `TX-${idx + 1}`,
          name: s.name || 'Member',
          amount: parseFloat(s.amount || 100).toFixed(2),
          paymentMode: s.paymentMode || 'Cash',
          bankStatus,
          isBankDeposited,
          paidDate: s.paidDate || s.date || '-'
        };
      });
  }, [savingsLogs]);

  const memberLedgerRows = useMemo(() => {
    return membersList.map(mem => {
      const memUserId = mem.userId || mem.UserId;
      const memId = mem.memberId || `M-${memUserId}`;
      const memName = mem.name || mem.fullName || 'Member';

      const userLogs = savingsLogs.filter(s => (s.userId && memUserId && String(s.userId) === String(memUserId)) || s.name === memName);
      const paidLogs = userLogs.filter(s => s.status === 'Paid');
      const totalPaid = paidLogs.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 100), 0);

      const totalWeeks = savingsWeeks.length > 0 ? savingsWeeks.length : Math.max(1, userLogs.length);
      const paidWeeksCount = paidLogs.length;
      const pendingWeeksCount = Math.max(0, totalWeeks - paidWeeksCount);
      const complianceRate = totalWeeks > 0 ? Math.min(100, Math.round((paidWeeksCount / totalWeeks) * 100)) : 100;
      const lastPaid = paidLogs.length > 0 ? (paidLogs[paidLogs.length - 1].paidDate || paidLogs[paidLogs.length - 1].date) : '-';

      return {
        userId: memUserId,
        name: memName,
        memberId: memId,
        phone: mem.phone || mem.phoneNumber || '-',
        totalPaid: totalPaid.toFixed(2),
        totalWeeks,
        paidWeeks: paidWeeksCount,
        pendingWeeks: pendingWeeksCount,
        complianceRate,
        lastPaidDate: lastPaid
      };
    });
  }, [membersList, savingsLogs, savingsWeeks]);

  const loanPortfolioRows = useMemo(() => {
    return (dashboardData?.loans || []).map((l, idx) => ({
      id: l.id || `LN-${idx + 1}`,
      name: l.name || l.borrowerName || 'Member',
      memberId: l.memberId || `M-${l.userId || '001'}`,
      amount: parseFloat(l.amount || 0).toFixed(2),
      purpose: l.purpose || 'Personal / Micro Enterprise',
      tenureMonths: l.tenureMonths || 12,
      interestRate: l.interestRate || '4%',
      status: l.status || 'Active',
      applicationDate: l.applicationDate || l.date || '-'
    }));
  }, [dashboardData?.loans]);

  // Handler for downloading report as CSV
  const handleExportCsv = () => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (selectedReportType === 'weekly_collection') {
      filename = `weekly_collection_report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Week Period', 'Member Name', 'Member ID', 'Amount (INR)', 'Status', 'Payment Mode', 'Paid Date'];
      rows = weeklyCollectionReportRows
        .filter(r => !reportSearchQuery || r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || r.memberId.toLowerCase().includes(reportSearchQuery.toLowerCase()))
        .map(r => [
          `"${r.weekTitle}"`,
          `"${r.name}"`,
          `"${r.memberId}"`,
          r.amount,
          r.status,
          `"${r.paymentMode || '-'}"`,
          `"${r.paidDate || '-'}"`
        ]);
    } else if (selectedReportType === 'bank_reconciliation') {
      filename = `bank_reconciliation_report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Transaction ID', 'Member Name', 'Amount (INR)', 'Channel', 'Bank Status', 'Date'];
      rows = bankReconciliationRows
        .filter(r => !reportSearchQuery || r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()))
        .map(r => [
          `"${r.id}"`,
          `"${r.name}"`,
          r.amount,
          `"${r.paymentMode}"`,
          `"${r.bankStatus}"`,
          `"${r.paidDate}"`
        ]);
    } else if (selectedReportType === 'member_ledger') {
      filename = `member_savings_ledger_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Member Name', 'Member ID', 'Phone', 'Total Paid (INR)', 'Paid Weeks', 'Pending Dues (Weeks)', 'Compliance Rate', 'Last Paid Date'];
      rows = memberLedgerRows
        .filter(r => !reportSearchQuery || r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) || r.memberId.toLowerCase().includes(reportSearchQuery.toLowerCase()))
        .map(r => [
          `"${r.name}"`,
          `"${r.memberId}"`,
          `"${r.phone || '-'}"`,
          r.totalPaid,
          r.paidWeeks,
          r.pendingWeeks,
          `"${r.complianceRate}%"`,
          `"${r.lastPaidDate}"`
        ]);
    } else if (selectedReportType === 'loan_portfolio') {
      filename = `loan_portfolio_report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Loan ID', 'Borrower Name', 'Member ID', 'Amount (INR)', 'Purpose', 'Tenure (Months)', 'Interest Rate', 'Status', 'Date'];
      rows = loanPortfolioRows
        .filter(r => !reportSearchQuery || r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()))
        .map(l => [
          `"${l.id}"`,
          `"${l.name}"`,
          `"${l.memberId}"`,
          l.amount,
          `"${l.purpose}"`,
          l.tenureMonths,
          `"${l.interestRate}"`,
          `"${l.status}"`,
          `"${l.applicationDate}"`
        ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Financial report exported: ${filename}`);
  };

  const handlePrintReport = () => {
    window.print();
  };

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
              <Icon d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4.5 4.5 0 0 0 0-9H6" size={17} />
              <span>Financials</span>
            </div>

            <div
              className="tr-nav-item"
              onClick={() => setShowOwnSavingsModal(true)}
              title="View my own personal weekly savings history and dues"
            >
              <PiggyBank size={17} style={{ color: '#10b981' }} />
              <span>View Own Savings</span>
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="tr-header__title">
              {activeTab === 'dashboard' && 'Treasurer Dashboard'}
              {activeTab === 'financials' && 'Treasurer Dashboard'}
              {activeTab === 'members' && 'Treasurer Dashboard'}
              {activeTab === 'meetings' && 'Treasurer Dashboard'}
              {activeTab === 'reports' && 'Treasurer Dashboard'}
              {activeTab === 'settings' && 'Treasurer Dashboard'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <span>{currentUser?.fullName || currentUser?.name || 'Treasurer'}</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ color: '#059669' }}>{dashboardData?.unitName || currentUser?.unitName || 'Ayalkoottam Unit'}</span>
            </div>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"}
                alt="Treasurer Avatar"
                className="tr-user-avatar"
                title={`${currentUser?.fullName || currentUser?.name || 'Treasurer'} (${dashboardData?.unitName || currentUser?.unitName || 'Ayalkoottam Unit'})`}
              />
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0c382e' }}>
                  {currentUser?.fullName || currentUser?.name || 'Treasurer'}
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  {dashboardData?.unitName || currentUser?.unitName || 'Ayalkoottam Unit'}
                </span>
              </div>
            </div>
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
                    <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', textTransform: 'uppercase' }}>Collections In Hand</span>
                    <strong style={{ fontSize: '1rem', color: '#fbbf24' }}>₹{undepositedTotal.toFixed(2)}</strong>
                    {undepositedOnlineCount > 0 && (
                      <span style={{ fontSize: '0.65rem', color: '#fcd34d', display: 'block', marginTop: '2px' }}>
                        {undepositedCashCount > 0 ? `${undepositedCashCount} cash + ` : ''}{undepositedOnlineCount} online
                      </span>
                    )}
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
                          const rawWeek = log.weekTitle || log.week || (currentWeekGroup.mondayStr && currentWeekGroup.sundayStr ? `${currentWeekGroup.mondayStr} – ${currentWeekGroup.sundayStr}` : null);
                          const weekStr = String(rawWeek || `${validDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
                            .replace(/^(?:Week\s*\d+|Current\s*Week|Week\s*Collection)\s*\((.*)\)$/i, '$1')
                            .replace(/^Week\s*\d+\s*-?\s*/i, '')
                            .trim();
                          return { month: monthStr, week: weekStr };
                        };
                        const { month: logMonth, week: logWeek } = getDetails(item);
                        const mode = item.paymentMode || item.paymentMethod || (item.status === 'Paid' ? 'Cash' : '-');
                        const isOnline = mode.toLowerCase().includes('online');
                        const isBankDeposited = mode.toLowerCase().includes('bank deposited') || mode.toLowerCase().includes('in bank');
                        const isUndepositedCash = item.status === 'Paid' && !isBankDeposited && !isOnline;
                        const isUndepositedOnline = item.status === 'Paid' && isOnline && !isBankDeposited;
                        const canDeposit = isUndepositedCash || isUndepositedOnline;

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
                              {isOnline && !isBankDeposited ? (
                                <span style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={13} /> Online (In Hand)
                                </span>
                              ) : isBankDeposited ? (
                                <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={13} /> {isOnline ? 'Online' : 'Cash'} ✓ In Bank
                                </span>
                              ) : (
                                mode
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {item.status === 'Paid' && canDeposit ? (
                                <button
                                  type="button"
                                  onClick={() => handleDepositCashToBank(item)}
                                  style={{
                                    backgroundColor: isUndepositedOnline ? '#0284c7' : '#0f172a',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '5px 14px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  Deposit to Bank
                                </button>
                              ) : item.status === 'Paid' ? (
                                <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckCircle2 size={14} /> In Bank
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
              savingsWeeks={savingsWeeks}
              allMembers={membersList}
              onDepositCashToBank={handleDepositCashToBank}
              onDepositAllCashToBank={handleDepositAllCashToBank}
              onRecordSavings={handleRecordSavings}
              onPayNow={setPaymentMemberItem}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header & Quick Action Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0c382e 0%, #155e4b 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 8px 24px rgba(12, 56, 46, 0.15)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <BarChart2 size={22} style={{ color: '#34d399' }} />
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                      Financial Audit & Reports Center
                    </h2>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#a7f3d0' }}>
                    Generate, inspect, and export verified financial statements for {dashboardData?.unitName || 'Ayalkoottam Unit'}.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <Download size={15} />
                    <span>Download CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintReport}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <Printer size={15} />
                    <span>Print Statement</span>
                  </button>
                </div>
              </div>

              {/* 4 Financial Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Savings Mobilized</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0c382e', marginTop: '4px' }}>
                    ₹{totalCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <ShieldCheck size={13} /> Verified in SahayiDb
                  </span>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Unit Bank Balance</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                    ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    {unitBank?.bankName || 'South Indian Bank'}
                  </span>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cash Collected in Hand</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                    ₹{undepositedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                    {undepositedCashCount} cash + {undepositedOnlineCount} online pending deposit
                  </span>
                </div>

                <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Disbursed Loans</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                    ₹{disbursedLoans.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    {(dashboardData?.loans || []).length} active community loan accounts
                  </span>
                </div>
              </div>

              {/* 4 Clickable Report Selection Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div
                  onClick={() => setSelectedReportType('weekly_collection')}
                  style={{
                    backgroundColor: selectedReportType === 'weekly_collection' ? '#f0fdf4' : '#ffffff',
                    border: selectedReportType === 'weekly_collection' ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedReportType === 'weekly_collection' ? '0 4px 12px rgba(16,185,129,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={18} />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#10b981', color: '#ffffff', padding: '2px 8px', borderRadius: '10px' }}>
                      Audit Log
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Weekly Savings Collection
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Week-by-week audit showing paid collections, payment channels, and defaulter dues.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedReportType('bank_reconciliation')}
                  style={{
                    backgroundColor: selectedReportType === 'bank_reconciliation' ? '#eff6ff' : '#ffffff',
                    border: selectedReportType === 'bank_reconciliation' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedReportType === 'bank_reconciliation' ? '0 4px 12px rgba(2,132,199,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#dbeafe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Landmark size={18} />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '10px' }}>
                      Bank Passbook
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Bank Deposit Reconciliation
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Comparison of cash in hand vs verified deposits in the official unit bank account.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedReportType('member_ledger')}
                  style={{
                    backgroundColor: selectedReportType === 'member_ledger' ? '#fdf4ff' : '#ffffff',
                    border: selectedReportType === 'member_ledger' ? '2px solid #a855f7' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedReportType === 'member_ledger' ? '0 4px 12px rgba(168,85,247,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={18} />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#9333ea', color: '#ffffff', padding: '2px 8px', borderRadius: '10px' }}>
                      Member Ledger
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Member Savings & Dues Summary
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Individual cumulative savings, pending arrears count, and payment compliance index.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedReportType('loan_portfolio')}
                  style={{
                    backgroundColor: selectedReportType === 'loan_portfolio' ? '#fff7ed' : '#ffffff',
                    border: selectedReportType === 'loan_portfolio' ? '2px solid #f97316' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedReportType === 'loan_portfolio' ? '0 4px 12px rgba(249,115,22,0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CreditCard size={18} />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: '#ea580c', color: '#ffffff', padding: '2px 8px', borderRadius: '10px' }}>
                      Loans
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                    Loan Portfolio & Repayments
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    Audit of sanctioned loans, loan purposes, interest yields, and disbursement records.
                  </p>
                </div>
              </div>

              {/* ── Active Statement Data View & Filters ── */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                {/* Statement Title & Filters */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#0c382e', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedReportType === 'weekly_collection' && 'Weekly Savings Collection & Defaulters Audit Statement'}
                      {selectedReportType === 'bank_reconciliation' && 'Bank Account Passbook & Cash Reconciliation Statement'}
                      {selectedReportType === 'member_ledger' && 'Member Cumulative Savings Ledger & Compliance Summary'}
                      {selectedReportType === 'loan_portfolio' && 'Unit Micro-Loan Portfolio & Disbursement Audit'}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Generated for {dashboardData?.unitName || 'Ayalkoottam Unit'} on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedReportType === 'weekly_collection' && (
                      <select
                        value={reportWeekFilter}
                        onChange={e => setReportWeekFilter(e.target.value)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          fontWeight: 600
                        }}
                      >
                        <option value="all">All Weeks Combined</option>
                        {savingsWeeks.map((w, idx) => (
                          <option key={w.id || idx} value={String(w.id || w.savingsWeekId || w.weekNumber)}>
                            {w.weekTitle || `${w.startDate} – ${w.endDate}`}
                          </option>
                        ))}
                      </select>
                    )}

                    <div style={{ position: 'relative' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="Search member, ID..."
                        value={reportSearchQuery}
                        onChange={e => setReportSearchQuery(e.target.value)}
                        style={{
                          padding: '6px 10px 6px 28px',
                          fontSize: '0.8rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          outline: 'none',
                          width: '180px'
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCsv}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#0c382e',
                        color: '#ffffff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={14} />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* ── Table Container ── */}
                <div style={{ overflowX: 'auto' }}>
                  {/* Table 1: Weekly Savings Collection */}
                  {selectedReportType === 'weekly_collection' && (
                    <table className="tr-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Week Period</th>
                          <th>Member Name</th>
                          <th>Member ID</th>
                          <th>Amount</th>
                          <th>Payment Mode</th>
                          <th>Status</th>
                          <th>Paid Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyCollectionReportRows.filter(r =>
                          !reportSearchQuery ||
                          r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                          r.memberId.toLowerCase().includes(reportSearchQuery.toLowerCase())
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                              No collection records matching filters.
                            </td>
                          </tr>
                        ) : (
                          weeklyCollectionReportRows
                            .filter(r =>
                              !reportSearchQuery ||
                              r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                              r.memberId.toLowerCase().includes(reportSearchQuery.toLowerCase())
                            )
                            .map((row, idx) => (
                              <tr key={idx}>
                                <td style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{row.weekTitle}</td>
                                <td className="tr-td-name">{row.name}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.memberId}</td>
                                <td style={{ fontWeight: 700, color: '#0c382e' }}>₹{row.amount}</td>
                                <td>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: (row.paymentMode || '').toLowerCase().includes('online') ? '#e0f2fe' : '#fef3c7',
                                    color: (row.paymentMode || '').toLowerCase().includes('online') ? '#0369a1' : '#b45309'
                                  }}>
                                    {row.paymentMode || '-'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`tr-status-badge tr-status-badge--${row.status === 'Paid' ? 'success' : 'pending'}`}>
                                    {row.status}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.paidDate || '-'}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Table 2: Bank Reconciliation Statement */}
                  {selectedReportType === 'bank_reconciliation' && (
                    <table className="tr-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Tx ID</th>
                          <th>Member Name</th>
                          <th>Amount</th>
                          <th>Payment Channel</th>
                          <th>Reconciliation Status</th>
                          <th>Transaction Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bankReconciliationRows.filter(r =>
                          !reportSearchQuery ||
                          r.name.toLowerCase().includes(reportSearchQuery.toLowerCase())
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                              No transactions recorded for reconciliation.
                            </td>
                          </tr>
                        ) : (
                          bankReconciliationRows
                            .filter(r =>
                              !reportSearchQuery ||
                              r.name.toLowerCase().includes(reportSearchQuery.toLowerCase())
                            )
                            .map((row, idx) => (
                              <tr key={idx}>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{row.id}</td>
                                <td className="tr-td-name">{row.name}</td>
                                <td style={{ fontWeight: 700, color: '#0c382e' }}>₹{row.amount}</td>
                                <td>{row.paymentMode}</td>
                                <td>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    backgroundColor: row.isBankDeposited ? '#dcfce7' : '#fef3c7',
                                    color: row.isBankDeposited ? '#15803d' : '#b45309',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    {row.isBankDeposited ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                    {row.bankStatus}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.paidDate}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Table 3: Member Cumulative Savings Ledger */}
                  {selectedReportType === 'member_ledger' && (
                    <table className="tr-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Member Name</th>
                          <th>Member ID</th>
                          <th>Phone</th>
                          <th>Total Savings Paid</th>
                          <th>Weeks Paid</th>
                          <th>Pending Weeks</th>
                          <th>Compliance Rate</th>
                          <th>Last Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {memberLedgerRows.filter(r =>
                          !reportSearchQuery ||
                          r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                          r.memberId.toLowerCase().includes(reportSearchQuery.toLowerCase())
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                              No member records found.
                            </td>
                          </tr>
                        ) : (
                          memberLedgerRows
                            .filter(r =>
                              !reportSearchQuery ||
                              r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                              r.memberId.toLowerCase().includes(reportSearchQuery.toLowerCase())
                            )
                            .map((mem, idx) => (
                              <tr key={idx}>
                                <td className="tr-td-name">{mem.name}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{mem.memberId}</td>
                                <td style={{ fontSize: '0.8rem' }}>{mem.phone}</td>
                                <td style={{ fontWeight: 800, color: '#0c382e' }}>₹{mem.totalPaid}</td>
                                <td style={{ color: '#16a34a', fontWeight: 600 }}>{mem.paidWeeks} Weeks</td>
                                <td>
                                  <span style={{
                                    fontWeight: 700,
                                    color: mem.pendingWeeks > 0 ? '#dc2626' : '#16a34a',
                                    backgroundColor: mem.pendingWeeks > 0 ? '#fee2e2' : '#dcfce7',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                  }}>
                                    {mem.pendingWeeks > 0 ? `${mem.pendingWeeks} Due` : 'Nil'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', minWidth: '50px' }}>
                                      <div style={{ width: `${mem.complianceRate}%`, height: '100%', backgroundColor: mem.complianceRate >= 80 ? '#10b981' : mem.complianceRate >= 50 ? '#f59e0b' : '#ef4444' }} />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>{mem.complianceRate}%</span>
                                  </div>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{mem.lastPaidDate}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {/* Table 4: Loan Portfolio & Repayments */}
                  {selectedReportType === 'loan_portfolio' && (
                    <table className="tr-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Loan ID</th>
                          <th>Borrower Name</th>
                          <th>Member ID</th>
                          <th>Principal Amount</th>
                          <th>Purpose</th>
                          <th>Tenure</th>
                          <th>Interest Rate</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loanPortfolioRows.filter(r =>
                          !reportSearchQuery ||
                          r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                          r.memberId.toLowerCase().includes(reportSearchQuery.toLowerCase())
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '1.5rem' }}>
                              No loan accounts found for this unit.
                            </td>
                          </tr>
                        ) : (
                          loanPortfolioRows
                            .filter(r =>
                              !reportSearchQuery ||
                              r.name.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
                              r.memberId.toLowerCase().includes(reportSearchQuery.toLowerCase())
                            )
                            .map((l, idx) => (
                              <tr key={idx}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{l.id}</td>
                                <td className="tr-td-name">{l.name}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{l.memberId}</td>
                                <td style={{ fontWeight: 800, color: '#0c382e' }}>₹{l.amount}</td>
                                <td style={{ fontSize: '0.825rem' }}>{l.purpose}</td>
                                <td>{l.tenureMonths} Months</td>
                                <td style={{ fontWeight: 600, color: '#16a34a' }}>{l.interestRate}</td>
                                <td>
                                  <span className={`tr-status-badge tr-status-badge--${(l.status || '').toLowerCase() === 'approved' || (l.status || '').toLowerCase() === 'active' ? 'success' : 'pending'}`}>
                                    {l.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
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

      {/* ── My Own Savings History Modal ── */}
      {showOwnSavingsModal && (
        <WeeklySavingsHistoryModal
          savingsWeeks={savingsWeeks}
          savingsLogs={savingsLogs}
          currentUserId={currentUser?.userId}
          onClose={() => setShowOwnSavingsModal(false)}
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
