import React, { useState } from 'react';
import { X, Calendar, Landmark, CheckCircle2, ChevronDown, ChevronUp, ArrowDownCircle, Search } from 'lucide-react';
import { getWeeklyCollectionLogs } from '../../utils/weeklyCollectionUtils';

function WeeklyCollectionModal({ savingsLogs = [], onDepositCashToBank, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const weeklyLogs = getWeeklyCollectionLogs(savingsLogs);

  // Toggle collapse/expand for a specific week
  const toggleWeekExpand = (weekKey) => {
    setExpandedWeeks(prev => ({
      ...prev,
      [weekKey]: !prev[weekKey]
    }));
  };

  // Grand total calculation
  const grandTotal = weeklyLogs.reduce((acc, w) => acc + w.totalCollected, 0);

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal sec-modal--wide" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
        {/* Modal Header */}
        <div className="sec-modal__header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                backgroundColor: '#0c382e',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
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
                <ArrowDownCircle size={13} /> Descending (Newest Week First)
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
              Detailed weekly breakdown of member savings collections sorted chronologically from latest to oldest week.
            </p>
          </div>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Controls & Stats */}
        <div style={{ padding: '1rem 0' }}>
          {/* Top Info Banner & Search */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: '#f8fafc',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              flex: 1
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Recorded Collections
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0c382e' }}>
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ width: '1px', height: '36px', backgroundColor: '#cbd5e1' }} />
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                  Weeks Tracked
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>
                  {weeklyLogs.length} Weeks
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search member in logs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Weekly Groups (Descending Order) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
            {weeklyLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No weekly collection logs available.
              </div>
            ) : (
              weeklyLogs.map((weekGroup, index) => {
                const isCollapsed = expandedWeeks[weekGroup.weekKey] === true;

                // Filter items by search query if present
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
                      borderRadius: '10px',
                      border: index === 0 ? '2px solid #0c382e' : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Week Header Bar */}
                    <div
                      onClick={() => toggleWeekExpand(weekGroup.weekKey)}
                      style={{
                        backgroundColor: index === 0 ? '#0c382e' : '#1e293b',
                        color: '#ffffff',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={18} style={{ color: '#6ee7b7' }} />
                        <div>
                          <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                            {weekGroup.weekTitle}
                          </span>
                          {index === 0 && (
                            <span style={{
                              marginLeft: '10px',
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase'
                            }}>
                              Current Week
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>Weekly Total:</span>
                          <span style={{ marginLeft: '6px', fontSize: '1.05rem', fontWeight: 800, color: '#6ee7b7' }}>
                            ₹{weekGroup.totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          {weekGroup.paidCount} Paid
                        </div>
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                      </div>
                    </div>

                    {/* Week Content Table */}
                    {!isCollapsed && (
                      <div style={{ padding: '0.75rem' }}>
                        <table className="sec-savings-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Date</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Member Name</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Member ID</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Amount</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                              <th style={{ padding: '8px 12px', textAlign: 'left' }}>Payment Mode</th>
                              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredItems.map(item => {
                              const mode = item.paymentMode || item.paymentMethod || (item.status === 'Paid' ? 'Cash' : '-');
                              const isOnline = mode.toLowerCase().includes('online');
                              const isBankDeposited = mode.toLowerCase().includes('bank deposited') || mode.toLowerCase().includes('in bank');
                              const isUndepositedCash = item.status === 'Paid' && (mode === 'Cash' || mode === 'cash' || mode === '-');

                              return (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                                  <td style={{ padding: '10px 12px', color: '#475569', fontWeight: 500 }}>
                                    {item.date || new Date().toISOString().split('T')[0]}
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>
                                    {item.name}
                                  </td>
                                  <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '0.8rem' }}>
                                    {item.memberId}
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                                    ₹{item.amount}
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    <span className={`sec-status-badge sec-status-badge--${item.status.toLowerCase()}`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>
                                    {isOnline ? (
                                      <span style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={13} /> Online 
                                      </span>
                                    ) : isBankDeposited ? (
                                      <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={13} /> Cash 
                                      </span>
                                    ) : isUndepositedCash ? (
                                      <span style={{ color: '#d97706', fontWeight: 600 }}>
                                        Cash
                                      </span>
                                    ) : (
                                      mode
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    {isUndepositedCash && onDepositCashToBank ? (
                                      <button
                                        type="button"
                                        onClick={() => onDepositCashToBank(item)}
                                        style={{
                                          backgroundColor: '#0c382e',
                                          color: '#ffffff',
                                          border: 'none',
                                          padding: '4px 10px',
                                          borderRadius: '6px',
                                          fontSize: '0.75rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Landmark size={12} />
                                        <span>Deposit</span>
                                      </button>
                                    ) : item.status === 'Paid' ? (
                                      <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={13} /> Recorded
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

        {/* Modal Actions */}
        <div className="sec-modal__actions" style={{ borderTop: '1px solid #e2e8f0', pt: '1rem' }}>
          <button type="button" className="sec-btn-cancel" onClick={onClose}>
            Close Per-Week Log
          </button>
        </div>
      </div>
    </div>
  );
}

export default WeeklyCollectionModal;
