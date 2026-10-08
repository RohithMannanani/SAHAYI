import React, { useState, useMemo } from 'react';
import { Landmark, CheckCircle2, Calendar, ChevronDown, ChevronUp, ArrowDownCircle, Search, CreditCard } from 'lucide-react';
import { getWeeklyCollectionLogs } from '../../utils/weeklyCollectionUtils';
import { formatDateToDDMMYYYY } from '../../utils/formatTime';
import WeeklySavingsHistoryModal from '../../../../components/common/WeeklySavingsHistoryModal';

function FinancialsView({
  financials,
  unitBankAccount,
  savingsLogs = [],
  savingsWeeks = [],
  loanRepayments = [],
  allMembers = [],
  onDepositCashToBank,
  onDepositAllCashToBank,
  onRecordSavings,
  onPayNow,
  showCollectionsInHand = false,
  showActionColumn = true
}) {
  const [showWeeklyLog, setShowWeeklyLog] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showOwnModal, setShowOwnModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.userId; }
    catch { return null; }
  })();

  const undepositedCashList = useMemo(() => {
    return (savingsLogs || []).filter(s =>
      s.status === 'Paid' &&
      !(s.paymentMode || '').toLowerCase().includes('bank deposited') &&
      !(s.paymentMode || '').toLowerCase().includes('in bank')
    );
  }, [savingsLogs]);

  const undepositedRepaymentsList = useMemo(() => {
    return (loanRepayments || []).filter(r =>
      !r.isBankDeposited &&
      !(r.paymentMode || '').toLowerCase().includes('bank deposited') &&
      !(r.paymentMode || '').toLowerCase().includes('in bank')
    ).map(r => ({
      id: `repay-${r.repaymentId}`,
      repaymentId: r.repaymentId,
      loanId: r.loanId,
      userId: r.userId,
      name: r.borrowerName || 'Member',
      memberName: r.borrowerName || 'Member',
      memberId: r.receiptNumber || `Loan #${r.loanId || r.repaymentId}`,
      amount: r.amountPaid,
      amountPaid: r.amountPaid,
      status: 'Paid',
      paymentMode: r.paymentMode || 'Online',
      paymentMethod: r.paymentMode || 'Online',
      date: r.repaymentDate ? r.repaymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paidDate: r.repaymentDate ? r.repaymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      receiptNumber: r.receiptNumber,
      isRepayment: true,
      type: 'Loan Repayment'
    }));
  }, [loanRepayments]);

  const allUndepositedList = useMemo(() => {
    return [...undepositedCashList, ...undepositedRepaymentsList];
  }, [undepositedCashList, undepositedRepaymentsList]);

  const undepositedSavingsTotal = useMemo(() => {
    return undepositedCashList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  }, [undepositedCashList]);

  const undepositedRepaymentsTotal = useMemo(() => {
    return undepositedRepaymentsList.reduce((acc, curr) => acc + (parseFloat(curr.amount || curr.amountPaid) || 0), 0);
  }, [undepositedRepaymentsList]);

  const undepositedTotal = undepositedSavingsTotal + undepositedRepaymentsTotal;
  const undepositedOnlineCount = allUndepositedList.filter(s => (s.paymentMode || '').toLowerCase().includes('online')).length;
  const undepositedCashCount = allUndepositedList.filter(s => !(s.paymentMode || '').toLowerCase().includes('online')).length;

  const depositedTotalFromLogs = savingsLogs
    .filter(s => s.status === 'Paid' && (
      (s.paymentMode || '').toLowerCase().includes('bank deposited') ||
      (s.paymentMode || '').toLowerCase().includes('in bank')
    ))
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const effectiveBankBalance = unitBankAccount?.balance !== undefined && unitBankAccount?.balance !== null
    ? parseFloat(unitBankAccount.balance)
    : depositedTotalFromLogs;

  const cleanTitle = (t) => {
    if (!t) return '';
    return String(t)
      .replace(/^(?:Week\s*\d+|Current\s*Week|Week\s*Collection)\s*\((.*)\)$/i, '$1')
      .replace(/^Week\s*\d+\s*-?\s*/i, '')
      .trim();
  };

  // Get weekly collection logs grouped and sorted in DESCENDING order of dates & weeks
  // If server-side savingsWeeks exists, build full history for every created week
  const weeklyLogs = useMemo(() => {
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
    return getWeeklyCollectionLogs(savingsLogs, allMembers);
  }, [savingsWeeks, savingsLogs, allMembers]);

  const toggleWeekCollapse = (weekKey) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekKey]: !prev[weekKey]
    }));
  };

  const handleCardClick = () => {
    setShowModal(true);
  };

  return (
    <div className="sec-subview">
      <div className="sec-subview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2>Financial Ledger & Dues Summary</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowOwnModal(true)}
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
              gap: '6px'
            }}
          >
            <CreditCard size={15} />
            <span>View My Own Savings</span>
          </button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#0c382e',
              color: '#ffffff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Inspect Paid & Pending Payments &rarr;
          </button>
        </div>
      </div>

      <div className="sec-stats-row">
        <div className="sec-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="sec-stat-label">Unit Bank Account Balance</span>
          <h3 className="sec-stat-value" style={{ color: '#0C382E' }}>
            ₹{effectiveBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="sec-stat-sub">
            {unitBankAccount?.bankName || 'Sahayi Co-operative Bank'} &bull; {unitBankAccount?.accountNumber || 'A/C Active'}
          </span>
        </div>


        {showCollectionsInHand && (
          <div className="sec-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <span className="sec-stat-label">Collections In Hand (Not Yet in Bank)</span>
            <h3 className="sec-stat-value" style={{ color: '#d97706' }}>
              ₹{undepositedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <span className="sec-stat-sub">
              {undepositedCashCount > 0 && `${undepositedCashCount} cash`}
              {undepositedCashCount > 0 && undepositedOnlineCount > 0 && ' + '}
              {undepositedOnlineCount > 0 && `${undepositedOnlineCount} online`}
              {allUndepositedList.length > 0 ? ' payment(s) pending bank deposit' : 'No pending deposits'}
            </span>
            {undepositedRepaymentsList.length > 0 && (
              <span style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 600, display: 'block', marginTop: '3px' }}>
                • ₹{undepositedRepaymentsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} from {undepositedRepaymentsList.length} Loan Repayment{undepositedRepaymentsList.length > 1 ? 's' : ''}
              </span>
            )}
            {allUndepositedList.length > 0 && onDepositAllCashToBank && (
              <button
                type="button"
                onClick={() => onDepositAllCashToBank(allUndepositedList)}
                style={{
                  marginTop: '0.5rem',
                  backgroundColor: '#0C382E',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Landmark size={13} />
                <span>Deposit All In-Hand Collections to Bank</span>
              </button>
            )}
          </div>
        )}
        <div
          className="sec-stat-card"
          onClick={handleCardClick}
          style={{
            borderLeft: '4px solid #0284c7',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)',
            position: 'relative'
          }}
          title="Click to view weekly savings history, paid & pending payments"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="sec-stat-label">Weekly Savings History</span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: '#0284c7',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              View Paid & Pending &rarr;
            </span>
          </div>
          <h3 className="sec-stat-value" style={{ color: '#0369a1' }}>
            ₹{financials.totalCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="sec-stat-trend" style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} /> Click to show paid & pending breakdown
          </span>
        </div>

        <div className="sec-stat-card">
          <span className="sec-stat-label">Loans Disbursed</span>
          <h3 className="sec-stat-value">
            ₹{financials.disbursedLoans.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="sec-stat-sub">Active Unit Accounts</span>
        </div>
      </div>

      {/* In-Hand Collections Pending Deposit Panel */}
      {showCollectionsInHand && allUndepositedList.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          border: '1.5px solid #f59e0b',
          boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={18} style={{ color: '#d97706' }} />
                Collections In-Hand Pending Bank Deposit ({allUndepositedList.length})
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                These cash and online collections are currently held in Treasurer custody. Deposit them into the Unit Bank Account once verified or physically deposited.
              </p>
            </div>
            {onDepositAllCashToBank && (
              <button
                type="button"
                onClick={() => onDepositAllCashToBank(allUndepositedList)}
                style={{
                  backgroundColor: '#0c382e',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Landmark size={14} />
                <span>Deposit All to Bank (₹{undepositedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })})</span>
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', color: '#92400e', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Date</th>
                  <th style={{ padding: '8px 10px' }}>Type</th>
                  <th style={{ padding: '8px 10px' }}>Member / Borrower</th>
                  <th style={{ padding: '8px 10px' }}>Reference / Receipt</th>
                  <th style={{ padding: '8px 10px' }}>Amount</th>
                  <th style={{ padding: '8px 10px' }}>Custody Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {allUndepositedList.map(item => {
                  const isRepay = item.isRepayment;
                  const isOnline = (item.paymentMode || '').toLowerCase().includes('online');
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>
                        {formatDateToDDMMYYYY(item.date || item.paidDate)}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: isRepay ? '#eff6ff' : '#ecfdf5',
                          color: isRepay ? '#1d4ed8' : '#047857',
                          border: isRepay ? '1px solid #bfdbfe' : '1px solid #a7f3d0'
                        }}>
                          {isRepay ? 'Loan Repayment' : 'Weekly Savings'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>
                        {item.name || item.memberName || 'Member'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {item.receiptNumber || item.memberId || '-'}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>
                        ₹{parseFloat(item.amount || item.amountPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          color: isOnline ? '#0284c7' : '#d97706',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isOnline ? 'Online (In Hand)' : 'Cash (In Hand)'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                        {onDepositCashToBank && (
                          <button
                            type="button"
                            onClick={() => onDepositCashToBank(item)}
                            style={{
                              backgroundColor: isOnline ? '#0284c7' : '#0c382e',
                              color: '#ffffff',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: '5px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Landmark size={12} />
                            <span>Deposit to Bank</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per Week Collection Log View */}
      <div style={{
        marginTop: '1.75rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '1.5rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.05)'
      }}>
        {/* Header & Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          paddingBottom: '0.85rem',
          borderBottom: '1px solid #f1f5f9',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Per-Week Savings History
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
              <ArrowDownCircle size={13} /> Click any week below or use the Weekly Savings History Card above to inspect detailed payments.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Filter member..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem 0.45rem 2.1rem',
                  fontSize: '0.825rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  outline: 'none',
                  width: '180px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Grouped Weekly Logs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {weeklyLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              No weekly collection logs found.
            </div>
          ) : (
            weeklyLogs.map((weekGroup, index) => {
              const isCollapsed = searchQuery.trim() ? false : !expandedWeeks[weekGroup.weekKey];

              const filteredItems = weekGroup.items.filter(item =>
                !searchQuery ||
                (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.memberId || '').toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (searchQuery && filteredItems.length === 0) return null;

              return (
                <div
                  key={weekGroup.weekKey}
                  style={{
                    borderRadius: '8px',
                    border: index === 0 ? '1.5px solid #0c382e' : '1px solid #e2e8f0',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Week Header Banner */}
                  <div
                    onClick={() => toggleWeekCollapse(weekGroup.weekKey)}
                    style={{
                      backgroundColor: index === 0 ? '#0c382e' : '#1e293b',
                      color: '#ffffff',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Calendar size={16} style={{ color: '#6ee7b7' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {weekGroup.weekTitle}
                      </span>
                      {index === 0 && (
                        <span style={{
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          marginLeft: '6px'
                        }}>
                          Latest Week
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontSize: '0.825rem' }}>
                        <span>Total: </span>
                        <strong style={{ color: '#6ee7b7', fontSize: '0.95rem' }}>
                          ₹{weekGroup.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.75rem', opacity: 0.85, backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                        {weekGroup.paidCount} Paid
                      </span>
                      {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </div>
                  </div>

                  {/* Week Content Table */}
                  {!isCollapsed && (
                    <div style={{ padding: '0.5rem', overflowX: 'auto' }}>
                      <table className="sec-savings-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Member Name</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Member ID</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Payment Mode</th>
                            {showActionColumn && (
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map(item => {
                            const mode = item.paymentMode || item.paymentMethod || (item.status === 'Paid' ? 'Cash' : '-');
                            const isOnline = mode.toLowerCase().includes('online');
                            const isBankDeposited = mode.toLowerCase().includes('bank deposited') || mode.toLowerCase().includes('in bank');
                            const isUndepositedCash = item.status === 'Paid' && !isBankDeposited && !isOnline && (mode === 'Cash' || mode === 'cash' || mode === '-');
                            const isUndepositedOnline = item.status === 'Paid' && isOnline && !isBankDeposited;
                            const canDeposit = isUndepositedCash || isUndepositedOnline;

                            return (
                              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.825rem' }}>
                                <td style={{ padding: '8px 10px', color: '#475569', fontWeight: 500 }}>
                                  {formatDateToDDMMYYYY(item.date)}
                                </td>
                                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#1e293b' }}>
                                  {item.name}
                                </td>
                                <td style={{ padding: '8px 10px', color: '#64748b', fontSize: '0.78rem' }}>
                                  {item.memberId}
                                </td>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>
                                  ₹{item.amount}
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  <span className={`sec-status-badge sec-status-badge--${item.status.toLowerCase()}`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px' }}>
                                  {isOnline && !isBankDeposited ? (
                                    <span style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle2 size={12} /> Online (In Hand)
                                    </span>
                                  ) : isBankDeposited ? (
                                    <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle2 size={12} /> {isOnline ? 'Online' : 'Cash'} ✓ In Bank
                                    </span>
                                  ) : isUndepositedCash ? (
                                    <span style={{ color: '#d97706', fontWeight: 600 }}>
                                      Cash (In Hand)
                                    </span>
                                  ) : (
                                    mode
                                  )}
                                </td>
                                {showActionColumn && (
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    {canDeposit && onDepositCashToBank ? (
                                      <button
                                        type="button"
                                        onClick={() => onDepositCashToBank(item)}
                                        style={{
                                          backgroundColor: isUndepositedOnline ? '#0284c7' : '#0c382e',
                                          color: '#ffffff',
                                          border: 'none',
                                          padding: '3px 8px',
                                          borderRadius: '5px',
                                          fontSize: '0.725rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Landmark size={11} />
                                        <span>Deposit to Bank</span>
                                      </button>
                                    ) : item.status === 'Paid' ? (
                                      <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={12} /> Recorded
                                      </span>
                                    ) : onPayNow ? (
                                      <button
                                        type="button"
                                        onClick={() => onPayNow(item)}
                                        style={{
                                          backgroundColor: '#0284c7',
                                          color: '#ffffff',
                                          border: 'none',
                                          padding: '3px 8px',
                                          borderRadius: '5px',
                                          fontSize: '0.725rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <CreditCard size={11} />
                                        <span>Record Payment</span>
                                      </button>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>-</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Weekly Savings History Modal */}
      {showModal && (
        <WeeklySavingsHistoryModal
          savingsWeeks={savingsWeeks}
          savingsLogs={savingsLogs}
          onClose={() => setShowModal(false)}
          onRecordPayment={onPayNow}
          onDepositCash={onDepositCashToBank}
        />
      )}

      {showOwnModal && (
        <WeeklySavingsHistoryModal
          savingsWeeks={savingsWeeks}
          savingsLogs={savingsLogs}
          currentUserId={currentUserId}
          bankAccount={unitBankAccount}
          onClose={() => setShowOwnModal(false)}
          onRecordPayment={onPayNow}
          onDepositCash={onDepositCashToBank}
        />
      )}
    </div>
  );
}

export default FinancialsView;
