import React from 'react';
import { PlusCircle, MapPin, Trash2 } from 'lucide-react';
import { formatTimeTo12Hr } from '../../utils/formatTime';

function MeetingsView({ meetings, onShowMeetingModal, onDeleteMeeting }) {
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
          meetings.map(m => (
            <div className="sec-meeting-item" style={{ marginBottom: '1rem' }} key={m.id}>
              <div className="sec-meeting-item__top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`sec-tag sec-tag--${m.tagType || 'dark'}`}>{m.tag}</span>
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
    </div>
  );
}

export default MeetingsView;
