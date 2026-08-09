import React from 'react';
import { X } from 'lucide-react';

function ScheduleMeetingModal({
  newMeeting,
  setNewMeeting,
  onSubmit,
  onClose
}) {
  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Parse current time string like "10:00 AM" into parts
  const parseTimeParts = (timeStr) => {
    const str = String(timeStr || '10:00 AM').trim();
    const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (match) {
      return {
        hour: match[1].padStart(2, '0'),
        minute: match[2].padStart(2, '0'),
        period: match[3].toUpperCase()
      };
    }
    return { hour: '10', minute: '00', period: 'AM' };
  };

  const { hour, minute, period } = parseTimeParts(newMeeting.time);

  const handleTimeChange = (h, m, p) => {
    setNewMeeting({ ...newMeeting, time: `${h}:${m} ${p}` });
  };

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <h3>Schedule New Meeting</h3>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="sec-modal__form">
          <div className="sec-form-group">
            <label>Meeting Title / Agenda *</label>
            <input
              type="text"
              required
              placeholder="e.g. Special Budget Planning"
              value={newMeeting.title}
              onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
            />
          </div>

          <div className="sec-form-row">
            <div className="sec-form-group">
              <label>Meeting Date *</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={newMeeting.date || new Date().toISOString().split('T')[0]}
                onChange={e => setNewMeeting({ ...newMeeting, date: e.target.value })}
              />
            </div>
            <div className="sec-form-group">
              <label>Time (HH : MM AM/PM) *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select
                  value={hour}
                  onChange={e => handleTimeChange(e.target.value, minute, period)}
                  style={{ flex: 1 }}
                  title="Select Hour"
                >
                  {hoursList.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <span style={{ fontWeight: 'bold', padding: '0 2px' }}>:</span>
                <select
                  value={minute}
                  onChange={e => handleTimeChange(hour, e.target.value, period)}
                  style={{ flex: 1 }}
                  title="Select Minute"
                >
                  {minutesList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={period}
                  onChange={e => handleTimeChange(hour, minute, e.target.value)}
                  style={{ flex: 1 }}
                  title="Select AM/PM"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="sec-form-row">
            <div className="sec-form-group">
              <label>Location *</label>
              <input
                type="text"
                required
                placeholder="e.g. Community Hall, Block B"
                value={newMeeting.location}
                onChange={e => setNewMeeting({ ...newMeeting, location: e.target.value })}
              />
            </div>
            <div className="sec-form-group">
              <label>Badge Tag</label>
              <select
                value={newMeeting.tag}
                onChange={e => setNewMeeting({ ...newMeeting, tag: e.target.value })}
              >
                <option value="NEXT WEEK">NEXT WEEK</option>
                <option value="FINANCIAL REVIEW">FINANCIAL REVIEW</option>
                <option value="SPECIAL ASSEMBLY">SPECIAL ASSEMBLY</option>
                <option value="MONTHLY MEETING">MONTHLY MEETING</option>
              </select>
            </div>
          </div>

          <div className="sec-modal__actions">
            <button
              type="button"
              className="sec-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="sec-btn-submit">
              Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ScheduleMeetingModal;
