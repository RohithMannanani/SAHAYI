import React from 'react';
import { X, Calendar, MapPin, Clock } from 'lucide-react';
import { formatTimeTo12Hr } from '../../utils/formatTime';

function RecordAttendanceModal({
  unitInfo,
  attendanceList,
  meetings = [],
  nextMeeting,
  onToggleAttendance,
  onSaveAttendance,
  onClose
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to format date nicely
  const formatNiceDate = (dateStr) => {
    if (!dateStr) return 'Not Scheduled';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Find next scheduled upcoming meeting if not explicitly passed
  const sortedMeetings = [...(meetings || [])].sort((a, b) => {
    const da = new Date(a.date || todayStr);
    const db = new Date(b.date || todayStr);
    return da - db;
  });

  const activeMeeting = nextMeeting || sortedMeetings.find(m => {
    const mDate = new Date(m.date || todayStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return mDate >= today && !m.isCompleted && m.tag !== 'COMPLETED';
  }) || sortedMeetings.find(m => !m.isCompleted && m.tag !== 'COMPLETED') || sortedMeetings[0];

  const meetingDateFormatted = activeMeeting?.date ? formatNiceDate(activeMeeting.date) : 'Aug 20, 2026';
  const meetingVenueFormatted = activeMeeting?.location || activeMeeting?.venue || 'Kunnel House';
  const meetingTimeFormatted = activeMeeting?.time ? formatTimeTo12Hr(activeMeeting.time) : '10:00 AM';

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal sec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <div>
            <h3>Record Session Attendance</h3>
            <p style={{ fontSize: '13px', color: '#666', margin: '2px 0 0 0' }}>
              Current Unit: {unitInfo?.unitName || 'Ambika Vilas'}
            </p>
          </div>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Next Meeting Date & Venue Card */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#0c382e',
              backgroundColor: '#e6f4f1',
              padding: '3px 10px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Calendar size={13} /> Meeting Details
            </span>
            {meetingTimeFormatted && (
              <span style={{ fontSize: '0.785rem', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {meetingTimeFormatted}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '2px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 500 }}>Next Meeting Date</span>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <Calendar size={14} color="#0c382e" />
                {meetingDateFormatted}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 500 }}>Venue</span>
              <strong style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <MapPin size={14} color="#0c382e" />
                {meetingVenueFormatted}
              </strong>
            </div>
          </div>
        </div>

        <div className="sec-attendance-list">
          {attendanceList.length === 0 ? (
            <p style={{ padding: '1rem', color: '#666' }}>No members registered yet.</p>
          ) : (
            attendanceList.map(mem => (
              <div className="sec-attendance-item" key={mem.id}>
                <div>
                  <strong className="sec-attendance-name">{mem.name}</strong>
                  <span className="sec-attendance-id"> ({mem.memberId})</span>
                </div>
                <button
                  className={`sec-attendance-pill ${
                    mem.status === 'present' ? 'sec-attendance-pill--present' : 'sec-attendance-pill--absent'
                  }`}
                  onClick={() => onToggleAttendance(mem.id)}
                >
                  {mem.status === 'present' ? 'Present' : 'Absent'}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sec-modal__actions">
          <button
            type="button"
            className="sec-btn-cancel"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="sec-btn-submit"
            onClick={onSaveAttendance}
          >
            Save Attendance Sheet
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecordAttendanceModal;
