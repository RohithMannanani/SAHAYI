import React from 'react';
import { X } from 'lucide-react';

function SavingsHistoryModal({ savingsLogs, onClose }) {
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
                <th>ID</th>
                <th>Amount</th>
                <th>Status</th>
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

                return (
                  <tr key={item.id}>
                    <td>{item.date || new Date().toISOString().split('T')[0]}</td>
                    <td>{logMonth}</td>
                    <td><span className="sec-week-pill">{logWeek}</span></td>
                    <td className="sec-font-medium">{item.name}</td>
                    <td>{item.memberId}</td>
                    <td>₹{item.amount}</td>
                    <td>
                      <span className={`sec-status-badge sec-status-badge--${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
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
