import React from 'react';
import { PlusCircle, MapPin, Trash2, Edit, CheckCircle2 } from 'lucide-react';
import { formatTimeTo12Hr } from '../../utils/formatTime';

function MeetingsView({
  meetings,
  onShowMeetingModal,
  onEditMeeting,
  onMarkMeetingCompleted,
  onDeleteMeeting
}) {
  return (
    <div className="sec-subview">
      <div className="sec-subview-header">
        <h2>Meetings & Minutes Recorder</h2>
        <button
          className="sec-action-btn sec-action-btn--primary"
          onClick={onShowMeetingModal}
        >
          <PlusCircle size={18} />
          <span>Schedule Meeting</span>
        </button>
      </div>

      <div className="sec-card">
        <h3 className="sec-card__title" style={{ marginBottom: '1rem' }}>
          Scheduled Sessions
        </h3>
        {meetings.length === 0 ? (
          <p style={{ color: '#666' }}>No scheduled sessions found.</p>
        ) : (
          meetings.map(m => {
            const isDone = m.isCompleted || m.tag === 'COMPLETED';

            return (
              <div className="sec-meeting-item" style={{ marginBottom: '1rem' }} key={m.id}>
                <div className="sec-meeting-item__top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`sec-tag ${isDone ? 'sec-tag--peach' : (m.tagType ? `sec-tag--${m.tagType}` : 'sec-tag--dark')}`}>
                      {isDone ? 'COMPLETED' : m.tag}
                    </span>
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

                    {!isDone && onMarkMeetingCompleted && (
                      <button
                        type="button"
                        className="sec-icon-action-btn"
                        title="Mark as Completed"
                        onClick={() => onMarkMeetingCompleted(m.id)}
                        style={{ color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
                  <div className="sec-meeting-item__location" style={{ marginTop: 0 }}>
                    <MapPin size={14} />
                    <span>{m.location || m.venue}</span>
                  </div>
                  {isDone && (
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Completed {m.completedDate ? `on ${m.completedDate}` : ''}
                    </span>
                  )}
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
