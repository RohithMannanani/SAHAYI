import React, { useState, useEffect } from 'react';
import loanService from '../services/loanService';

const RepaymentScheduleModal = ({ loanId, isOpen, onClose }) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && loanId) {
      fetchSchedule();
    }
  }, [isOpen, loanId]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await loanService.getRepaymentSchedule(loanId);
      setScheduleData(res);
    } catch (err) {
      setError(err.message || 'Failed to load repayment schedule.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0c382e 0%, #166534 100%)',
          padding: '20px 28px',
          color: 'white',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
              Kudumbashree Reducing Balance Repayment Schedule
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#a7f3d0' }}>
              Fixed Monthly Principal + 1% Dynamic Monthly Interest Model (12% p.a.)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b' }}>
              Loading repayment schedule...
            </div>
          ) : error ? (
            <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
              {error}
            </div>
          ) : scheduleData ? (
            <div>
              {/* Summary Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Borrower</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>
                    {scheduleData.borrowerName}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Loan Amount</span>
                  <div style={{ fontWeight: 800, color: '#059669', fontSize: '1rem', marginTop: '2px' }}>
                    ₹{scheduleData.amountRequested?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Interest Rate</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>
                    {scheduleData.interestRate}% p.a. (1% / mo)
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Tenure</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>
                    {scheduleData.tenureMonths} Months
                  </div>
                </div>
              </div>

              {/* 6-Column Schedule Table */}
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <tr style={{ textAlign: 'left', color: '#334155' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Month</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Opening Balance</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Fixed Principal</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>1% Interest</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Total Due</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Closing Balance</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(scheduleData.schedule || []).map((row) => (
                      <tr key={row.month} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: row.status === 'Paid' ? '#f0fdf4' : 'transparent' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                          Month {row.month}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155' }}>
                          ₹{row.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#059669' }}>
                          ₹{row.principalComponent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#d97706', fontWeight: 600 }}>
                          ₹{row.interestComponent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0f172a' }}>
                          ₹{row.totalPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569' }}>
                          ₹{row.closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor: row.status === 'Paid' ? '#dcfce7' : '#f1f5f9',
                            color: row.status === 'Paid' ? '#15803d' : '#64748b'
                          }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justify: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#0c382e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepaymentScheduleModal;
