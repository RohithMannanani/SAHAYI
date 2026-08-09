import React from 'react';
import {
  UserPlus,
  PlusCircle,
  UserCheck,
  PiggyBank,
  Pencil,
  Calendar,
  MapPin,
  Shield,
  Landmark,
  Store,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { formatTimeTo12Hr } from '../../utils/formatTime';

function OperationalOverview({
  unitInfo,
  isLoading,
  filteredSavings,
  meetings,
  loans,
  filteredLoans,
  onShowRegisterModal,
  onShowMeetingModal,
  onShowAttendanceModal,
  onShowHistoryModal,
  onShowCalendarModal,
  onRecordSavings,
  onEditSavings,
  onVerifyAndForward,
  onSelectLoanDetail,
  onDeleteMeeting
}) {
  return (
    <div className="sec-dashboard-view">
      {/* Operational Overview Header */}
      <div className="sec-overview-header">
        <div>
          <h1 className="sec-overview-title">Operational Overview</h1>
          <p className="sec-overview-subtitle">
            Manage daily administrative tasks, weekly collection, and unit records for <strong>{unitInfo.unitName}</strong>.
          </p>
        </div>
        <div className="sec-session-badge">
          <span className="sec-session-label">SAHAYIDB CONNECTED</span>
          <span className="sec-session-date">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* 3 Action Pill Buttons Row */}
      <div className="sec-actions-row">
        <button
          className="sec-action-btn sec-action-btn--primary"
          onClick={onShowRegisterModal}
        >
          <UserPlus size={18} />
          <span>Register Member</span>
        </button>

        <button
          className="sec-action-btn sec-action-btn--secondary"
          onClick={onShowMeetingModal}
        >
          <PlusCircle size={18} />
          <span>New Meeting</span>
        </button>

        <button
          className="sec-action-btn sec-action-btn--tertiary"
          onClick={onShowAttendanceModal}
        >
          <UserCheck size={18} />
          <span>Record Attendance</span>
        </button>
      </div>

      {/* Middle Grid: Savings Log (Left) & Upcoming Meetings (Right) */}
      <div className="sec-middle-grid">
        {/* Weekly Savings Log */}
        <div className="sec-card sec-card--savings">
          <div className="sec-card__header">
            <div className="sec-card__title-group">
              <div className="sec-card__icon-wrapper sec-card__icon-wrapper--bronze">
                <PiggyBank size={20} />
              </div>
              <h3 className="sec-card__title">Weekly Savings Log</h3>
            </div>
            <button
              className="sec-card__link-btn"
              onClick={onShowHistoryModal}
            >
              View History
            </button>
          </div>

          <div className="sec-table-container">
            <table className="sec-savings-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>ID</th>
                  <th>Month</th>
                  <th>Week</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="sec-text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="sec-table-empty">
                      Loading weekly savings logs from SahayiDb...
                    </td>
                  </tr>
                ) : filteredSavings.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="sec-table-empty">
                      No member savings logs found.
                    </td>
                  </tr>
                ) : (
                  filteredSavings.map(item => {
                    // Helper to get month and week details
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
                        <td className="sec-font-medium">{item.name}</td>
                        <td className="sec-text-muted">{item.memberId}</td>
                        <td>{logMonth}</td>
                        <td>
                          <span className="sec-week-pill">{logWeek}</span>
                        </td>
                        <td className="sec-font-semibold">₹{item.amount}</td>
                        <td>
                          <span className={`sec-status-badge sec-status-badge--${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="sec-text-right">
                          {item.status === 'Paid' ? (
                            <button
                              className="sec-icon-action-btn"
                              title="Edit record"
                              onClick={() => onEditSavings(item)}
                            >
                              <Pencil size={16} />
                            </button>
                          ) : (
                            <button
                              className="sec-table-btn-record"
                              onClick={() => onRecordSavings(item)}
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

        {/* Upcoming Meetings */}
        <div className="sec-card sec-card--meetings">
          <div className="sec-card__header">
            <div className="sec-card__title-group">
              <div className="sec-card__icon-wrapper sec-card__icon-wrapper--bronze">
                <Calendar size={20} />
              </div>
              <h3 className="sec-card__title">Upcoming Meetings</h3>
            </div>
          </div>

          <div className="sec-meetings-list">
            {meetings.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '0.75rem 0.25rem', fontSize: '0.85rem' }}>
                No meetings scheduled.
              </p>
            ) : (
              meetings.map(m => (
                <div className="sec-meeting-item" key={m.id}>
                  <div className="sec-meeting-item__top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`sec-tag sec-tag--${m.tagType || 'dark'}`}>
                        {m.tag}
                      </span>
                      <span className="sec-meeting-item__time">{formatTimeTo12Hr(m.time)}</span>
                    </div>
                    {onDeleteMeeting && (
                      <button
                        type="button"
                        className="sec-icon-action-btn"
                        title="Delete meeting"
                        onClick={() => onDeleteMeeting(m.id)}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <h4 className="sec-meeting-item__title">{m.title}</h4>
                  <div className="sec-meeting-item__location">
                    <MapPin size={14} />
                    <span>{m.location}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            className="sec-calendar-view-btn"
            onClick={onShowCalendarModal}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Bottom Card: Loan Application Review */}
      <div className="sec-card sec-card--loans">
        <div className="sec-card__header sec-card__header--loans">
          <div>
            <h3 className="sec-card__title">Loan Application Review</h3>
            <p className="sec-card__subtitle">
              Pending Secretary endorsement for Presidential approval.
            </p>
          </div>
          <div className="sec-watermark-badge">
            <Shield size={36} className="sec-watermark-icon" />
            <div className="sec-watermark-text">
              <span className="sec-watermark-label">PENDING</span>
              <span className="sec-watermark-count">
                {loans.length < 10 ? `0${loans.length}` : loans.length} Requests
              </span>
            </div>
          </div>
        </div>

        <div className="sec-loans-grid">
          {filteredLoans.length === 0 ? (
            <div className="sec-empty-loans">
              <CheckCircle2 size={32} color="#0C382E" />
              <p>All loan applications reviewed & endorsed!</p>
            </div>
          ) : (
            filteredLoans.map(loan => (
              <div className="sec-loan-card" key={loan.id}>
                <div className="sec-loan-card__header">
                  <div className="sec-loan-card__icon-wrap">
                    {loan.iconType === 'bank' ? (
                      <Landmark size={22} />
                    ) : (
                      <Store size={22} />
                    )}
                  </div>
                  <div className="sec-loan-card__info">
                    <h4 className="sec-loan-card__name">{loan.name}</h4>
                    <p className="sec-loan-card__purpose">
                      Purpose: {loan.purpose}
                    </p>
                  </div>
                  <div className="sec-loan-card__amount">{loan.amount}</div>
                </div>

                <div className="sec-loan-card__actions">
                  <button
                    className="sec-btn-verify"
                    onClick={() => onVerifyAndForward(loan)}
                  >
                    Verify & Forward
                  </button>
                  <button
                    className="sec-btn-detail"
                    onClick={() => onSelectLoanDetail(loan)}
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default OperationalOverview;
