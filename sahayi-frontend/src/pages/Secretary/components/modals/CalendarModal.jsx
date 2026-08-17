import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Trash2 } from 'lucide-react';
import { formatTimeTo12Hr, formatDateToDDMMYYYY } from '../../utils/formatTime';

function CalendarModal({ meetings = [], onDeleteMeeting, onClose }) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate days in month and starting day index
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // Helper to format date string as YYYY-MM-DD
  const formatDateStr = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Map meetings to their date key
  const meetingsByDate = (meetings || []).reduce((acc, m) => {
    const dStr = m.date ? m.date.split('T')[0] : todayStr;
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(m);
    return acc;
  }, {});

  // Find next upcoming meeting date
  const sortedMeetings = [...(meetings || [])].sort((a, b) => {
    const da = new Date(a.date || todayStr);
    const db = new Date(b.date || todayStr);
    return da - db;
  });

  const nextMeeting = sortedMeetings.find(m => {
    if (m.isCompleted || m.tag === 'COMPLETED') return false;
    const mDate = new Date(m.date || todayStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return mDate >= today;
  }) || sortedMeetings.find(m => !m.isCompleted && m.tag !== 'COMPLETED');

  // Format date nicely
  const formatNiceDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const selectedDateStr = selectedDay ? formatDateStr(year, month, selectedDay) : null;
  const activeDayMeetings = selectedDateStr ? (meetingsByDate[selectedDateStr] || []) : [];

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal sec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={22} color="#1a1a1a" />
            <h3>Ayalkoottam Calendar Schedule</h3>
          </div>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Next Scheduled Meeting Banner */}
        <div className="sec-next-meeting-banner">
          <div className="sec-next-meeting-badge">
            <Clock size={15} />
            <span>NEXT SCHEDULED MEETING</span>
          </div>
          {nextMeeting ? (
            <div className="sec-next-meeting-content">
              <div className="sec-next-meeting-date">
                {formatNiceDate(nextMeeting.date)}
              </div>
              <div className="sec-next-meeting-details">
                <div className="sec-next-meeting-title">{nextMeeting.title}</div>
                <div className="sec-next-meeting-meta">
                  <span><Clock size={13} /> {formatTimeTo12Hr(nextMeeting.time)}</span>
                  <span><MapPin size={13} /> {nextMeeting.location || 'Community Hall'}</span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '0.9rem' }}>
              No upcoming meetings currently scheduled.
            </p>
          )}
        </div>

        {/* Calendar Navigation & Grid */}
        <div className="sec-calendar-preview" style={{ marginTop: '16px' }}>
          <div className="sec-calendar-month-nav">
            <button type="button" className="sec-cal-nav-btn" onClick={prevMonth} title="Previous Month">
              <ChevronLeft size={18} />
            </button>
            <div className="sec-calendar-month-header">
              {monthNames[month]} {year}
            </div>
            <button type="button" className="sec-cal-nav-btn" onClick={nextMonth} title="Next Month">
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="sec-calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <span className="sec-cal-day-head" key={i}>{d}</span>
            ))}

            {/* Empty slots for leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span className="sec-cal-day sec-cal-day--empty" key={`empty-${i}`} />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = formatDateStr(year, month, day);
              const isToday = dateStr === todayStr;
              const hasEvents = !!meetingsByDate[dateStr];
              const isSelected = selectedDay === day;

              let className = 'sec-cal-day';
              if (isToday) className += ' sec-cal-day--active';
              if (hasEvents) className += ' sec-cal-day--event';
              if (isSelected) className += ' sec-cal-day--selected';

              return (
                <span
                  key={day}
                  className={className}
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  title={hasEvents ? `${meetingsByDate[dateStr].length} Meeting(s) scheduled` : ''}
                >
                  {day}
                  {hasEvents && <span className="sec-cal-event-dot" />}
                </span>
              );
            })}
          </div>
        </div>

        {/* Selected Day / Scheduled Meetings List */}
        {selectedDay && (
          <div className="sec-cal-selected-details" style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#1a1a1a' }}>
              Meetings on {formatNiceDate(selectedDateStr)}:
            </h4>
            {activeDayMeetings.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#888' }}>No meetings scheduled for this date.</p>
            ) : (
              activeDayMeetings.map((m, idx) => (
                <div className="sec-meeting-item" key={m.id || idx} style={{ marginBottom: '8px' }}>
                  <div className="sec-meeting-item__top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`sec-tag sec-tag--${m.tagType || 'dark'}`}>{m.tag || 'MEETING'}</span>
                      {m.date && <span className="sec-meeting-item__date">{formatDateToDDMMYYYY(m.date)}</span>}
                      <span className="sec-meeting-item__time">{formatTimeTo12Hr(m.time)}</span>
                    </div>
                    {onDeleteMeeting && !(m.isCompleted || m.tag === 'COMPLETED') && (
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
                    <MapPin size={13} />
                    <span>{m.location}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="sec-modal__actions">
          <button
            type="button"
            className="sec-btn-cancel"
            onClick={onClose}
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalendarModal;
