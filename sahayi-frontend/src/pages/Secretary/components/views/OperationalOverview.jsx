import React, { useState } from 'react';
import {
  UserPlus,
  PlusCircle,
  UserCheck,
  PiggyBank,
  Pencil,
  Edit,
  Calendar,
  MapPin,
  Shield,
  Landmark,
  Store,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatTimeTo12Hr, formatDateToDDMMYYYY } from '../../utils/formatTime';
import { getWeeklyCollectionLogs } from '../../utils/weeklyCollectionUtils';

function OperationalOverview({
  currentUser,
  unitInfo,
  unitBankAccount,
  isLoading,
  filteredSavings = [],
  attendanceList = [],
  meetings = [],
  loans = [],
  filteredLoans = [],
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
  onEditMeeting,
  onMarkMeetingCompleted,
  onDeleteMeeting,
  onNavigateMeetings
}) {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

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

  const undepositedCashList = filteredSavings.filter(s =>
    s.status === 'Paid' && (s.paymentMode === 'Cash' || (!s.paymentMode || s.paymentMode === '-'))
  );
  const undepositedTotal = undepositedCashList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const weeklyLogs = getWeeklyCollectionLogs(filteredSavings, attendanceList || []);
  const currentWeekGroup = weeklyLogs[selectedWeekIndex] || weeklyLogs[0] || {
    weekTitle: 'Current Week',
    mondayStr: new Date().toISOString().split('T')[0],
    sundayStr: new Date().toISOString().split('T')[0],
    items: filteredSavings
  };

  const currentWeekItems = currentWeekGroup?.items || filteredSavings;
  const startDurationStr = formatDateToDDMMYYYY(currentWeekGroup.mondayStr || currentWeekGroup.weekKey);
  const endDurationStr = formatDateToDDMMYYYY(currentWeekGroup.sundayStr || currentWeekGroup.weekKey);
  const durationText = `${startDurationStr} to ${endDurationStr}`;

  const upcomingMeetings = (meetings || []).filter(m => !m.isCompleted && m.tag !== 'COMPLETED');

  return (
    <div className="sec-dashboard-view">
      {/* Operational Overview Header */}
      <div className="sec-overview-header">
        <div>
          <h1 className="sec-overview-title">Operational Overview</h1>
          <p className="sec-overview-subtitle">
            Manage daily administrative tasks, weekly collection, and unit records for <strong>{unitInfo?.unitName || 'Ambika Vilas'}</strong>.
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
          onClick={() => {
            const upcomingMeeting = (meetings || []).find(m => !m.isCompleted && m.tag !== 'COMPLETED');
            onShowAttendanceModal(upcomingMeeting);
          }}
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
      </div>

      {/* Middle Grid: Savings Log (Left) & Upcoming Meetings (Right) */}
      <div className="sec-middle-grid">
        {/* Weekly Savings Log */}
        <div className="sec-card sec-card--savings">
          <div className="sec-card__header" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className="sec-card__title-group">
              <div className="sec-card__icon-wrapper sec-card__icon-wrapper--bronze">
                <PiggyBank size={20} />
              </div>
              <div>
                <h3 className="sec-card__title" style={{ margin: 0 }}>Weekly Savings Log</h3>
                <span style={{ fontSize: '0.75rem', color: '#0c382e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Calendar size={13} /> Duration: {durationText}
                </span>
              </div>
            </div>

            {/* Week Navigation Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedWeekIndex(prev => Math.min(prev + 1, Math.max(0, weeklyLogs.length - 1)))}
                disabled={selectedWeekIndex >= weeklyLogs.length - 1}
                title="Previous Week Log"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  fontSize: '0.785rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: selectedWeekIndex >= weeklyLogs.length - 1 ? '#f8fafc' : '#ffffff',
                  color: selectedWeekIndex >= weeklyLogs.length - 1 ? '#94a3b8' : '#0c382e',
                  cursor: selectedWeekIndex >= weeklyLogs.length - 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeft size={15} />
                <span>Previous Week</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedWeekIndex(prev => Math.max(prev - 1, 0))}
                disabled={selectedWeekIndex <= 0}
                title="Upcoming Week Log"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  fontSize: '0.785rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: selectedWeekIndex <= 0 ? '#f8fafc' : '#ffffff',
                  color: selectedWeekIndex <= 0 ? '#94a3b8' : '#0c382e',
                  cursor: selectedWeekIndex <= 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>Upcoming Week</span>
                <ChevronRight size={15} />
              </button>

              <button
                className="sec-card__link-btn"
                onClick={onShowHistoryModal}
                style={{ marginLeft: '4px' }}
              >
                View History
              </button>
            </div>
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
                ) : currentWeekItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="sec-table-empty">
                      No member savings logs found for this week.
                    </td>
                  </tr>
                ) : (
                  currentWeekItems.map(item => {
                    // Helper to get month and week details
                    const getDetails = (log) => {
                      if (log.month && log.week) return { month: log.month, week: log.week };
                      const d = log.date ? new Date(log.date) : new Date();
                      const validDate = isNaN(d.getTime()) ? new Date() : d;
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      const monthStr = log.month || `${monthNames[validDate.getMonth()]} ${validDate.getFullYear()}`;
                      const weekNum = currentWeekGroup.weekNumber || Math.ceil(validDate.getDate() / 7);
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
            {upcomingMeetings.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '0.75rem 0.25rem', fontSize: '0.85rem' }}>
                No upcoming meetings scheduled.
              </p>
            ) : (
              upcomingMeetings.map(m => {
                const isDone = m.isCompleted || m.tag === 'COMPLETED';

                return (
                  <div
                    className="sec-meeting-item"
                    key={m.id}
                    onClick={() => onNavigateMeetings && onNavigateMeetings()}
                  >
                    <div className="sec-meeting-item__top">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`sec-tag ${isDone ? 'sec-tag--peach' : (m.tagType ? `sec-tag--${m.tagType}` : 'sec-tag--dark')}`}>
                          {isDone ? 'COMPLETED' : m.tag}
                        </span>
                        {m.date && <span className="sec-meeting-item__date">{formatDateToDDMMYYYY(m.date)}</span>}
                        <span className="sec-meeting-item__time">{formatTimeTo12Hr(m.time)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {onEditMeeting && (
                          <button
                            type="button"
                            className="sec-icon-action-btn"
                            title="Edit meeting"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditMeeting(m);
                            }}
                            style={{ color: '#2563eb' }}
                          >
                            <Edit size={14} />
                          </button>
                        )}

                        {!isDone && onMarkMeetingCompleted && (
                          <button
                            type="button"
                            className="sec-icon-action-btn"
                            title="Mark as Completed"
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkMeetingCompleted(m.id);
                            }}
                            style={{ color: '#16a34a' }}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        )}

                        {onDeleteMeeting && !isDone && (
                          <button
                            type="button"
                            className="sec-icon-action-btn"
                            title="Delete meeting"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMeeting(m.id);
                            }}
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <h4 className="sec-meeting-item__title">{m.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                      <div className="sec-meeting-item__location" style={{ marginTop: 0 }}>
                        <MapPin size={13} />
                        <span>{m.location || m.venue}</span>
                      </div>
                      {isDone && (
                        <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>
                          Completed {m.completedDate ? `on ${m.completedDate}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
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
                {(loans || []).length < 10 ? `0${(loans || []).length}` : (loans || []).length} Requests
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
