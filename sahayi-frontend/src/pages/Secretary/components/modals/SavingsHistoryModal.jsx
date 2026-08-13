import React from 'react';
import { X, Landmark, CheckCircle2 } from 'lucide-react';

function SavingsHistoryModal({ savingsLogs, onDepositCashToBank, onClose }) {
  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal sec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <h3>Weekly Savings Audit Log</h3>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sec-table-container">
          <table className="sec-savings-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Month</th>
                <th>Week</th>
                <th>Member</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Mode</th>
                <th className="sec-text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {savingsLogs.map(item => {
                const getDetails = (log) => {
                  if (log.month && log.week) return { month: log.month, week: log.week };
                  const d = log.date ? new Date(log.date) : new Date();
                  const validDate = isNaN(d.getTime()) ? new Date() : d;
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const monthStr = log.month || `${monthNames[validDate.getMonth()]} ${validDate.getFullYear()}`;
                  const weekNum = Math.ceil(validDate.getDate() / 7);
                  const weekStr = log.week || `Week ${weekNum}`;
                  return { month: monthStr, week: weekStr };
                };
                const { month: logMonth, week: logWeek } = getDetails(item);

                const mode = item.paymentMode || item.paymentMethod || (item.status === 'Paid' ? 'Cash' : '-');
                const isOnline = mode.toLowerCase().includes('online');
                const isBankDeposited = mode.toLowerCase().includes('bank deposited') || mode.toLowerCase().includes('in bank');
                const isUndepositedCash = item.status === 'Paid' && (mode === 'Cash' || mode === 'cash' || mode === '-');

                return (
                  <tr key={item.id}>
                    <td>{item.date || new Date().toISOString().split('T')[0]}</td>
                    <td>{logMonth}</td>
                    <td><span className="sec-week-pill">{logWeek}</span></td>
                    <td className="sec-font-medium">{item.name}</td>
                    <td className="sec-font-semibold">₹{item.amount}</td>
                    <td>
                      <span className={`sec-status-badge sec-status-badge--${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="sec-font-medium">
                      {isOnline ? (
                        <span style={{ color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> Online (In Bank)
                        </span>
                      ) : isBankDeposited ? (
                        <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> Cash (In Bank)
                        </span>
                      ) : isUndepositedCash ? (
                        <span style={{ color: '#d97706', fontWeight: 600 }}>
                          Cash (In Hand)
                        </span>
                      ) : (
                        mode
                      )}
                    </td>
                    <td className="sec-text-right">
                      {item.status === 'Paid' ? (
                        <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> Paid
                        </span>
                      ) : (
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="sec-modal__actions">
          <button
            type="button"
            className="sec-btn-cancel"
            onClick={onClose}
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
}

export default SavingsHistoryModal;
