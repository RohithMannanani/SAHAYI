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

  const undepositedCashList = filteredSavings.filter(s =>
    s.status === 'Paid' &&
    !(s.paymentMode || '').toLowerCase().includes('bank deposited') &&
    !(s.paymentMode || '').toLowerCase().includes('in bank')
  );
  const undepositedTotal = undepositedCashList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const depositedTotalFromLogs = filteredSavings
    .filter(s => s.status === 'Paid' && (
      (s.paymentMode || '').toLowerCase().includes('bank deposited') ||
      (s.paymentMode || '').toLowerCase().includes('in bank')
    ))
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const effectiveBankBalance = Math.max(
    parseFloat(unitBankAccount?.balance || 0),
    depositedTotalFromLogs
  );

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



      {/* Middle Grid: Upcoming Meetings (Left) & Weekly Payment (Right) */}
      <div className="sec-middle-grid">
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

        {/* Weekly Payment Card */}
        {(() => {
          // Find the current secretary member's savings entry for this week
          const myEntry = currentWeekItems.find(item => {
            if (!item) return false;
            if (currentUser?.userId && item.userId && String(currentUser.userId) === String(item.userId)) return true;
            if (currentUser?.memberId && item.memberId && String(currentUser.memberId) === String(item.memberId)) return true;
            const itemName = (item.name || '').trim().toLowerCase();
            const userName = (currentUser?.fullName || currentUser?.name || unitInfo?.secretaryName || '').trim().toLowerCase();
            return itemName && userName && (itemName === userName || itemName.includes(userName) || userName.includes(itemName));
          });

          const isPaid = myEntry?.status === 'Paid';
          const dueAmount = myEntry ? parseFloat(myEntry.amount) || 100 : 100;

          return (
            <div style={{
              background: 'linear-gradient(145deg, #0C382E 0%, #155e4b 60%, #1a7a60 100%)',
              borderRadius: '16px',
              padding: '1.25rem 1.4rem',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              boxShadow: '0 8px 24px rgba(12, 56, 46, 0.22)',
              alignSelf: 'flex-start'
            }}>
              {/* Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: '20px',
                  padding: '3px 10px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#fde68a'
                }}>
                  Weekly Savings Deposit
                </span>
                {isPaid && (
                  <span style={{
                    background: 'rgba(52, 211, 153, 0.25)',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: '#34d399'
                  }}>
                    ✓ Paid
                  </span>
                )}
              </div>

              {/* Week Date Range */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                color: '#a7f3d0',
                fontWeight: 600
              }}>
                <Calendar size={13} />
                <span>{startDurationStr}</span>
                <ChevronRight size={12} style={{ opacity: 0.7 }} />
                <span>{endDurationStr}</span>
              </div>

              {/* Title & Description */}
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                  Deposit Your Weekly Savings
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, lineHeight: 1.5 }}>
                  Pay your weekly ₹{dueAmount.toFixed(0)} deposit securely online via Razorpay or log cash deposit.
                </p>
              </div>

              {/* Amount & Pay Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '10px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Weekly Dues</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fde68a', letterSpacing: '-0.02em' }}>₹{dueAmount.toFixed(2)}</div>
                </div>

                {isPaid ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(52,211,153,0.2)', borderRadius: '10px', padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>
                    <CheckCircle2 size={16} />
                    Already Paid
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => myEntry && (onPayNow ? onPayNow(myEntry) : onRecordSavings(myEntry))}
                    disabled={!myEntry}
                    style={{
                      background: myEntry ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.2)',
                      color: myEntry ? '#0C382E' : 'rgba(255,255,255,0.5)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 18px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: myEntry ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: myEntry ? '0 4px 12px rgba(251,191,36,0.4)' : 'none',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <PiggyBank size={15} />
                    Pay ₹{dueAmount.toFixed(0)} Now
                  </button>
                )}
              </div>
            </div>
          );
        })()}
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
