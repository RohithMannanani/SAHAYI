import React, { useState } from 'react';
import { Landmark, CheckCircle2, Calendar, ChevronDown, ChevronUp, ArrowDownCircle, Search } from 'lucide-react';
import { getWeeklyCollectionLogs } from '../../utils/weeklyCollectionUtils';

function FinancialsView({
  financials,
  unitBankAccount,
  savingsLogs = [],
  onDepositCashToBank,
  onDepositAllCashToBank
}) {
  const [showWeeklyLog, setShowWeeklyLog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedWeeks, setCollapsedWeeks] = useState({});

  const undepositedCashList = savingsLogs.filter(s =>
    s.status === 'Paid' && (s.paymentMode === 'Cash' || (!s.paymentMode || s.paymentMode === '-'))
  );
  const undepositedTotal = undepositedCashList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const onlineAndDepositedTotalFromLogs = savingsLogs
    .filter(s => s.status === 'Paid' && (
      (s.paymentMode || '').toLowerCase().includes('online') ||
      (s.paymentMode || '').toLowerCase().includes('bank deposited') ||
      (s.paymentMode || '').toLowerCase().includes('in bank')
    ))
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const effectiveBankBalance = Math.max(
    parseFloat(unitBankAccount?.balance || 0),
    onlineAndDepositedTotalFromLogs
  );

  // Get weekly collection logs grouped and sorted in DESCENDING order of dates & weeks
  const weeklyLogs = getWeeklyCollectionLogs(savingsLogs);

  const toggleWeekCollapse = (weekKey) => {
    setCollapsedWeeks(prev => ({
      ...prev,
      [weekKey]: !prev[weekKey]
    }));
  };

  const handleCardClick = () => {
    setShowWeeklyLog(prev => !prev);
  };

  return (
    <div className="sec-subview">
      <div className="sec-subview-header">
        <h2>Financial Ledger & Dues Summary</h2>
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

        <div className="sec-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="sec-stat-label">Cash Collected (In Hand)</span>
          <h3 className="sec-stat-value" style={{ color: '#d97706' }}>
            ₹{undepositedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="sec-stat-sub">
            {undepositedCashList.length} cash payments pending bank deposit
          </span>
          {undepositedCashList.length > 0 && onDepositAllCashToBank && (
            <button
              type="button"
              onClick={() => onDepositAllCashToBank(undepositedCashList)}
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
              <span>Deposit All Cash to Bank</span>
            </button>
          )}
        </div>

        {/* Total Weekly Collection Card (Interactive / Clickable) */}
        <div
          className={`sec-stat-card ${showWeeklyLog ? 'sec-stat-card--active' : ''}`}
          onClick={handleCardClick}
          style={{
            borderLeft: '4px solid #0284c7',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: showWeeklyLog ? '0 8px 20px rgba(2, 132, 199, 0.15)' : 'none',
            transform: showWeeklyLog ? 'translateY(-2px)' : 'none',
            position: 'relative'
          }}
          title="Click to view per-week collection log in descending order"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="sec-stat-label">Total Weekly Collection</span>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: showWeeklyLog ? '#0284c7' : '#e0f2fe',
              color: showWeeklyLog ? '#ffffff' : '#0369a1',
              padding: '2px 8px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {showWeeklyLog ? 'Hide Weekly Log ▲' : 'View Per-Week Log ▼'}
            </span>
          </div>
          <h3 className="sec-stat-value" style={{ color: '#0369a1' }}>
            ₹{financials.totalCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="sec-stat-trend" style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} /> Click to view per-week log (Descending) &rarr;
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

      {/* Per Week Collection Log (Rendered when toggled on or clicked) */}
      {showWeeklyLog && (
        <div style={{
          marginTop: '1.75rem',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
          animation: 'secToastSlide 0.3s ease'
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
                  Per-Week Collection Log
                </h3>
                <span style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                 
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: '#64748b' }}>
              <ArrowDownCircle size={13} />   Weekly savings collections.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Search Bar */}
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
                const isCollapsed = collapsedWeeks[weekGroup.weekKey] === true;

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
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredItems.map(item => {
                              const mode = item.paymentMode || item.paymentMethod || (item.status === 'Paid' ? 'Cash' : '-');
                              const isOnline = mode.toLowerCase().includes('online');
                              const isBankDeposited = mode.toLowerCase().includes('bank deposited') || mode.toLowerCase().includes('in bank');
                              const isUndepositedCash = item.status === 'Paid' && (mode === 'Cash' || mode === 'cash' || mode === '-');

                              return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.825rem' }}>
                                  <td style={{ padding: '8px 10px', color: '#475569', fontWeight: 500 }}>
                                    {item.date || new Date().toISOString().split('T')[0]}
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
                                    {isOnline ? (
                                      <span style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={12} /> Online 
                                      </span>
                                    ) : isBankDeposited ? (
                                      <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={12} /> Cash 
                                      </span>
                                    ) : isUndepositedCash ? (
                                      <span style={{ color: '#d97706', fontWeight: 600 }}>
                                        Cash (In Hand)
                                      </span>
                                    ) : (
                                      mode
                                    )}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    {isUndepositedCash && onDepositCashToBank ? (
                                      <button
                                        type="button"
                                        onClick={() => onDepositCashToBank(item)}
                                        style={{
                                          backgroundColor: '#0c382e',
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
                                        <span>Deposit</span>
                                      </button>
                                    ) : item.status === 'Paid' ? (
                                      <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={12} /> Recorded
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>-</span>
                                    )}
                                  </td>
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
      )}
    </div>
  );
}

export default FinancialsView;

