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
  currentUser,
  unitInfo,
  unitBankAccount,
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
  onDepositCashToBank,
  onDepositAllCashToBank,
  onPayNow,
  onEditSavings,
  onVerifyAndForward,
  onSelectLoanDetail,
  onDeleteMeeting
}) {
  const onlineAndDepositedTotalFromLogs = filteredSavings
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

      {/* Unit Bank Account & Cash Collection Overview Banner */}
      <div className="sec-bank-card" style={{
        background: 'linear-gradient(135deg, #0C382E 0%, #155e4b 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
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
              ₹{effectiveBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.85 }}>
              {unitBankAccount?.bankName || 'Sahayi Co-operative Bank'} &bull; A/C: {unitBankAccount?.accountNumber || `SB-UNIT-${unitInfo?.unitId || '0001'}`}
            </p>
          </div>
        </div>

        {/* Pending Cash Collection Summary & Bulk Deposit Button */}
        {(() => {
          const undepositedCashList = filteredSavings.filter(s =>
            s.status === 'Paid' && (s.paymentMode === 'Cash' || (!s.paymentMode || s.paymentMode === '-'))
          );
          const undepositedTotal = undepositedCashList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.6rem 1rem', borderRadius: '12px', backdropFilter: 'blur(4px)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', textTransform: 'uppercase' }}>Cash Collected In Hand</span>
                <strong style={{ fontSize: '1rem', color: '#fbbf24' }}>₹{undepositedTotal.toFixed(2)}</strong>
              </div>
              {undepositedCashList.length > 0 && onDepositAllCashToBank && (
                <button
                  type="button"
                  onClick={() => onDepositAllCashToBank(undepositedCashList)}
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
          );
        })()}
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
                  <th>Month</th>
                  <th>Week</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Mode</th>
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

                    // Check if row belongs to current logged in member
                    const isCurrentMember = () => {
                      if (!item) return false;
                      if (currentUser?.userId && item.userId && String(currentUser.userId).toLowerCase() === String(item.userId).toLowerCase()) {
                        return true;
                      }
                      if (currentUser?.memberId && item.memberId && String(currentUser.memberId).toLowerCase() === String(item.memberId).toLowerCase()) {
                        return true;
                      }
                      const itemName = (item.name || '').trim().toLowerCase();
                      const userName = (currentUser?.fullName || currentUser?.name || unitInfo?.secretaryName || '').trim().toLowerCase();
                      if (itemName && userName && (itemName === userName || itemName.includes(userName) || userName.includes(itemName))) {
                        return true;
                      }
                      return false;
                    };

                    const isSelf = isCurrentMember();
                    const mode = item.paymentMode || item.paymentMethod || (item.status === 'Paid' ? 'Cash' : '-');
                    const isOnline = mode.toLowerCase().includes('online');
                    const isBankDeposited = mode.toLowerCase().includes('bank deposited') || mode.toLowerCase().includes('in bank');
                    const isUndepositedCash = item.status === 'Paid' && (mode === 'Cash' || mode === 'cash' || mode === '-');

                    return (
                      <tr key={item.id}>
                        <td className="sec-font-medium">{item.name}</td>
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
                        <td className="sec-font-medium">
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
                        <td className="sec-text-right">
                          {item.status === 'Paid' ? (
                            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={14} /> Paid
                            </span>
                          ) : isSelf ? (
                            <button
                              className="sec-table-btn-pay"
                              onClick={() => (onPayNow ? onPayNow(item) : onRecordSavings(item))}
                            >
                              Pay Now
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
