import React, { useState, useMemo } from 'react';
import { X, CheckCircle2, Clock, Search, Filter, Calendar, CreditCard, Landmark } from 'lucide-react';
import './WeeklySavingsHistoryModal.css';

function WeeklySavingsHistoryModal({
  savingsWeeks = [],
  savingsLogs = [],
  currentUserId = null,
  onClose,
  onRecordPayment,
  onDepositCash
}) {
  const [activeTab, setActiveTab] = useState('paid'); // 'paid' | 'pending'
  const [selectedWeekId, setSelectedWeekId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Process data into a flattened list of payments with week context
  const processedPayments = useMemo(() => {
    const list = [];

    if (Array.isArray(savingsWeeks) && savingsWeeks.length > 0) {
      savingsWeeks.forEach(w => {
        const weekTitle = w.weekTitle || `Week ${w.weekNumber || ''}`;
        const weekId = w.id || w.savingsWeekId || w.weekNumber;
        const weekAmount = w.amount || 100;

        if (Array.isArray(w.members)) {
          w.members.forEach(m => {
            list.push({
              id: `${weekId}-${m.userId || m.memberId || m.name}`,
              userId: m.userId,
              memberId: m.memberId || `M-${m.userId || '00' + Math.floor(Math.random()*10)}`,
              name: m.name || m.fullName || 'Member',
              weekId: String(weekId),
              weekTitle,
              amount: m.amount && parseFloat(m.amount) > 0 ? m.amount : weekAmount,
              status: (m.status || 'Pending').toLowerCase() === 'paid' ? 'Paid' : 'Pending',
              paidDate: m.paidDate || m.date || '-',
              paymentMode: m.paymentMode || m.paymentMethod || '-',
              receiptNumber: m.receiptNumber || '-',
              savingsWeekId: weekId
            });
          });
        }
      });
    }

    // Fallback or augment with savingsLogs if savingsWeeks was empty
    if (list.length === 0 && Array.isArray(savingsLogs) && savingsLogs.length > 0) {
      savingsLogs.forEach(s => {
        list.push({
          id: s.id || `${s.userId}-${s.date || Math.random()}`,
          userId: s.userId || s.id,
          memberId: s.memberId || `M-${s.userId || '001'}`,
          name: s.name || 'Member',
          weekId: 'all',
          weekTitle: s.weekTitle || `Week Collection (${s.date || 'Recorded'})`,
          amount: s.amount || 100,
          status: (s.status || 'Pending').toLowerCase() === 'paid' ? 'Paid' : 'Pending',
          paidDate: s.paidDate || s.date || '-',
          paymentMode: s.paymentMode || s.paymentMethod || '-',
          receiptNumber: s.receiptNumber || s.receiptNo || '-',
          savingsWeekId: s.savingsWeekId
        });
      });
    }

    // If currentUserId is specified, filter ONLY payments belonging to the logged-in user
    if (currentUserId && !isNaN(Number(currentUserId)) && Number(currentUserId) > 0) {
      const targetIdStr = String(currentUserId);
      return list.filter(p => String(p.userId) === targetIdStr);
    }

    return list;
  }, [savingsWeeks, savingsLogs, currentUserId]);

  // Extract distinct weeks for filter dropdown
  const weekOptions = useMemo(() => {
    const map = new Map();
    processedPayments.forEach(p => {
      if (p.weekId && !map.has(p.weekId)) {
        map.set(p.weekId, p.weekTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [processedPayments]);

  // Filter payments by selected week, tab (Paid vs Pending), and search query
  const filteredPayments = useMemo(() => {
    return processedPayments.filter(p => {
      // Filter by status tab
      const isPaidMatch = activeTab === 'paid' ? p.status === 'Paid' : p.status === 'Pending';
      if (!isPaidMatch) return false;

      // Filter by selected week
      if (selectedWeekId !== 'all' && String(p.weekId) !== String(selectedWeekId)) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (p.name || '').toLowerCase().includes(q);
        const idMatch = (p.memberId || '').toLowerCase().includes(q);
        const weekMatch = (p.weekTitle || '').toLowerCase().includes(q);
        if (!nameMatch && !idMatch && !weekMatch) return false;
      }

      return true;
    });
  }, [processedPayments, activeTab, selectedWeekId, searchQuery]);

  // Calculate summary metrics
  const paidCount = useMemo(() => processedPayments.filter(p => p.status === 'Paid').length, [processedPayments]);
  const pendingCount = useMemo(() => processedPayments.filter(p => p.status === 'Pending').length, [processedPayments]);
  const totalPaidAmount = useMemo(() => processedPayments.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0), [processedPayments]);
  const totalPendingAmount = useMemo(() => processedPayments.filter(p => p.status === 'Pending').reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0), [processedPayments]);

  return (
    <div className="wsh-modal-overlay" onClick={onClose}>
      <div className="wsh-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="wsh-modal-header">
          <div>
            <h2 className="wsh-header-title">
              <Calendar size={22} style={{ color: '#6ee7b7' }} />
              {currentUserId ? 'My Weekly Savings History & Dues' : 'Weekly Savings History & Dues'}
            </h2>
            <p className="wsh-header-sub">
              {currentUserId
                ? 'Personal record of your weekly savings deposits, paid receipts, and pending dues.'
                : 'Comprehensive log of community weekly savings deposits, paid records, and pending dues.'}
            </p>
          </div>
          <button className="wsh-close-btn" onClick={onClose} title="Close Modal">
            <X size={18} />
          </button>
        </div>

        {/* Summary Metrics Bar */}
        <div className="wsh-summary-bar">
          <div className="wsh-summary-card" style={{ borderLeft: '4px solid #10b981' }}>
            <span className="wsh-summary-label">{currentUserId ? 'My Total Saved' : 'Total Collected'}</span>
            <span className="wsh-summary-value" style={{ color: '#047857' }}>
              ₹{totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="wsh-summary-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <span className="wsh-summary-label">{currentUserId ? 'My Pending Dues' : 'Total Pending Dues'}</span>
            <span className="wsh-summary-value" style={{ color: '#b45309' }}>
              ₹{totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="wsh-summary-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <span className="wsh-summary-label">Paid Records</span>
            <span className="wsh-summary-value" style={{ color: '#0369a1' }}>
              {paidCount} Payments
            </span>
          </div>

          <div className="wsh-summary-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <span className="wsh-summary-label">Pending Payments</span>
            <span className="wsh-summary-value" style={{ color: '#b91c1c' }}>
              {pendingCount} Pending
            </span>
          </div>
        </div>

        {/* Controls & Filter Bar */}
        <div className="wsh-controls">
          <div className="wsh-tabs">
            <button
              type="button"
              className={`wsh-tab-btn ${activeTab === 'paid' ? 'wsh-tab-btn--active-paid' : ''}`}
              onClick={() => setActiveTab('paid')}
            >
              <CheckCircle2 size={15} />
              <span>Paid Payments</span>
              <span className="wsh-tab-badge">{paidCount}</span>
            </button>

            <button
              type="button"
              className={`wsh-tab-btn ${activeTab === 'pending' ? 'wsh-tab-btn--active-pending' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <Clock size={15} />
              <span>Pending Payments</span>
              <span className="wsh-tab-badge">{pendingCount}</span>
            </button>
          </div>

          <div className="wsh-filters">
            {/* Filter by Week */}
            {weekOptions.length > 0 && (
              <select
                className="wsh-select"
                value={selectedWeekId}
                onChange={e => setSelectedWeekId(e.target.value)}
              >
                <option value="all">All Savings Weeks</option>
                {weekOptions.map(w => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            {!currentUserId && (
              <div className="wsh-search-wrapper">
                <Search size={14} className="wsh-search-icon" />
                <input
                  type="text"
                  className="wsh-search-input"
                  placeholder="Search member..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Body Data Table */}
        <div className="wsh-modal-body">
          {filteredPayments.length === 0 ? (
            <div className="wsh-empty-state">
              No {activeTab} payment records found for your account.
            </div>
          ) : (
            <table className="wsh-table">
              <thead>
                <tr>
                  <th>Member Name & ID</th>
                  <th>Week Title</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Mode</th>
                  <th>{activeTab === 'paid' ? 'Paid Date' : 'Due Status'}</th>
                  <th>Receipt / Ref No.</th>
                  {(onRecordPayment || onDepositCash) && <th style={{ textAlign: 'right' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="wsh-member-name">{item.name}</div>
                      <div className="wsh-member-id">{item.memberId}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>
                      {item.weekTitle}
                    </td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      ₹{parseFloat(item.amount).toFixed(2)}
                    </td>
                    <td>
                      {item.status === 'Paid' ? (
                        <span className="wsh-badge wsh-badge--paid">
                          <CheckCircle2 size={12} /> Paid
                        </span>
                      ) : (
                        <span className="wsh-badge wsh-badge--pending">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="wsh-mode-pill">{item.paymentMode || '-'}</span>
                    </td>
                    <td style={{ color: '#475569', fontSize: '0.825rem' }}>
                      {item.status === 'Paid' ? item.paidDate : 'Overdue Deposit'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>
                      {item.receiptNumber || '-'}
                    </td>
                    {(onRecordPayment || onDepositCash) && (
                      <td style={{ textAlign: 'right' }}>
                        {item.status === 'Pending' && onRecordPayment ? (
                          <button
                            type="button"
                            className="wsh-action-btn"
                            onClick={() => onRecordPayment(item)}
                          >
                            <CreditCard size={13} />
                            Pay / Record
                          </button>
                        ) : item.status === 'Paid' && item.paymentMode === 'Cash' && onDepositCash ? (
                          <button
                            type="button"
                            className="wsh-action-btn"
                            style={{ backgroundColor: '#10b981' }}
                            onClick={() => onDepositCash(item)}
                          >
                            <Landmark size={13} />
                            Deposit Bank
                          </button>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.78rem' }}>
                            ✓ Verified
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeeklySavingsHistoryModal;
