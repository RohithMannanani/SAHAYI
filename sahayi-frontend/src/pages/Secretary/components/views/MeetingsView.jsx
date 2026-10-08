import React from 'react';
import { PlusCircle, MapPin, Trash2, Edit, CheckCircle2, UserCheck, History, Calendar, FileText, Clock } from 'lucide-react';
import { formatTimeTo12Hr, formatDateToDDMMYYYY, isMeetingDatePassed } from '../../utils/formatTime';

function MeetingsView({
  meetings,
  onShowMeetingModal,
  onEditMeeting,
  onMarkMeetingCompleted,
  onDeleteMeeting,
  onShowAttendanceModal,
  onShowMinutesModal,
  readOnly = false
}) {
  const isMeetingDoneOrPassed = (m) => Boolean(m.isCompleted || m.tag === 'COMPLETED' || isMeetingDatePassed(m.date, m.time));

  const upcomingMeetings = (meetings || []).filter(m => !isMeetingDoneOrPassed(m));
  const completedMeetings = (meetings || []).filter(m => isMeetingDoneOrPassed(m));

  return (
    <div className="sec-subview">
      <div className="sec-subview-header">
        <h2>Meetings & Minutes Recorder</h2>
        {!readOnly && (
          <button
            className="sec-action-btn sec-action-btn--primary"
            onClick={onShowMeetingModal}
          >
            <PlusCircle size={18} />
            <span>Schedule Meeting</span>
          </button>
        )}
      </div>

      {/* Upcoming / Scheduled Sessions Section */}
      <div className="sec-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <Calendar size={20} style={{ color: '#0c382e' }} />
          <h3 className="sec-card__title" style={{ margin: 0 }}>
            Scheduled Sessions ({upcomingMeetings.length})
          </h3>
        </div>

        {upcomingMeetings.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No upcoming sessions scheduled.</p>
        ) : (
          upcomingMeetings.map(m => (
            <div className="sec-meeting-item" style={{ marginBottom: '1rem' }} key={m.id}>
              <div className="sec-meeting-item__top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`sec-tag ${m.tagType ? `sec-tag--${m.tagType}` : 'sec-tag--dark'}`}>
                    {m.tag || 'UPCOMING'}
                  </span>
                  {m.date && <span className="sec-meeting-item__date">{formatDateToDDMMYYYY(m.date)}</span>}
                  <span className="sec-meeting-item__time">{formatTimeTo12Hr(m.time)}</span>
                </div>

                {/* Action Buttons: Edit, Mark Completed, Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {onEditMeeting && (
                    <button
                      type="button"
                      className="sec-icon-action-btn"
                      title="Edit meeting"
                      onClick={() => onEditMeeting(m)}
                      style={{ color: '#2563eb' }}
                    >
                      <Edit size={15} />
                    </button>
                  )}

                  {onMarkMeetingCompleted && (
                    <button
                      type="button"
                      className="sec-icon-action-btn"
                      title="Mark as Completed"
                      onClick={() => onMarkMeetingCompleted(m.id)}
                      style={{
                        color: '#16a34a',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#dcfce7',
                        padding: '3px 9px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Mark Completed</span>
                    </button>
                  )}

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
              </div>

              <h4 className="sec-meeting-item__title">{m.title}</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div className="sec-meeting-item__location" style={{ marginTop: 0 }}>
                  <MapPin size={14} />
                  <span>{m.location || m.venue}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {onShowMinutesModal && (
                    <button
                      type="button"
                      className="sec-btn-view-minutes"
                      onClick={() => onShowMinutesModal(m)}
                      style={{
                        backgroundColor: '#f8fafc',
                        color: '#0c382e',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.785rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease'
                      }}
                      title="View & Record Minutes of the Meeting"
                    >
                      <FileText size={14} color="#0c382e" />
                      <span>Minutes of Meeting</span>
                    </button>
                  )}
                  {onShowAttendanceModal && (
                    <button
                      type="button"
                      className="sec-btn-view-attendance"
                      onClick={() => onShowAttendanceModal(m)}
                      style={{
                        backgroundColor: '#0c382e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.785rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(12, 56, 46, 0.15)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <UserCheck size={14} />
                      <span>View Attendance</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Previous Meetings / History Section */}
      <div className="sec-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <History size={20} style={{ color: '#0c382e' }} />
          <h3 className="sec-card__title" style={{ margin: 0 }}>
            Meeting History ({completedMeetings.length})
          </h3>
        </div>

        {completedMeetings.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No previous meeting history found.</p>
        ) : (
          completedMeetings.map(m => {
            const isAutoExpired = Boolean(m.isExpired || (!m.isCompleted && isMeetingDatePassed(m.date, m.time)));
            return (
            <div className="sec-meeting-item" style={{ marginBottom: '1rem', backgroundColor: '#fafbf9', border: '1px solid #e2e8f0' }} key={m.id}>
              <div className="sec-meeting-item__top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="sec-tag sec-tag--peach">
                    COMPLETED
                  </span>
                  {isAutoExpired && (
                    <span
                      className="sec-tag"
                      style={{
                        backgroundColor: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Meeting date passed without being marked complete; expired and automatically completed."
                    >
                      <Clock size={12} />
                      Expired (Auto-Completed)
                    </span>
                  )}
                  {m.date && <span className="sec-meeting-item__date">{formatDateToDDMMYYYY(m.date)}</span>}
                  <span className="sec-meeting-item__time">{formatTimeTo12Hr(m.time)}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {onDeleteMeeting && !(m.isCompleted || m.tag === 'COMPLETED' || isAutoExpired) && (
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
              </div>

              <h4 className="sec-meeting-item__title">{m.title}</h4>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap', gap: '8px' }}>
                <div className="sec-meeting-item__location" style={{ marginTop: 0 }}>
                  <MapPin size={14} />
                  <span>{m.location || m.venue}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Completed {m.completedDate ? `on ${formatDateToDDMMYYYY(m.completedDate)}` : (m.date ? `on ${formatDateToDDMMYYYY(m.date)}` : '')}
                  </span>
                  {onShowMinutesModal && (
                    <button
                      type="button"
                      className="sec-btn-view-minutes"
                      onClick={() => onShowMinutesModal(m)}
                      style={{
                        backgroundColor: '#f8fafc',
                        color: '#0c382e',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.785rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        transition: 'all 0.2s ease'
                      }}
                      title="View & Edit Minutes of the Meeting"
                    >
                      <FileText size={14} color="#0c382e" />
                      <span>Minutes of Meeting</span>
                    </button>
                  )}
                  {onShowAttendanceModal && (
                    <button
                      type="button"
                      className="sec-btn-view-attendance"
                      onClick={() => onShowAttendanceModal(m)}
                      style={{
                        backgroundColor: '#0c382e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.785rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(12, 56, 46, 0.15)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <UserCheck size={14} />
                      <span>View Attendance</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}

export default MeetingsView;
