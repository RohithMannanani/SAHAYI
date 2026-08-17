import React from 'react';
import { X, Calendar, MapPin, Clock, CheckCircle2, UserCheck, Users, UserX, AlertCircle, PiggyBank } from 'lucide-react';
import { formatTimeTo12Hr, formatDateToDDMMYYYY } from '../../utils/formatTime';

import { sortMembersByRoleOrIndex } from '../../utils/weeklyCollectionUtils';

function RecordAttendanceModal({
  unitInfo,
  attendanceList = [],
  meetings = [],
  nextMeeting,
  onToggleAttendance,
  onSaveAttendance,
  onUpdateLateAttendance,
  onClose
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Find active target meeting
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

  const rawMeetingDate = activeMeeting?.date || todayStr;
  const meetingDateFormatted = formatDateToDDMMYYYY(rawMeetingDate);
  const meetingVenueFormatted = activeMeeting?.location || activeMeeting?.venue || 'Unit Meeting Hall';
  const meetingTimeFormatted = activeMeeting?.time ? formatTimeTo12Hr(activeMeeting.time) : '10:00 AM';

  const isAttendanceRecorded = Boolean(activeMeeting?.attendanceRecorded);
  const isCompleted = Boolean(activeMeeting?.isCompleted || activeMeeting?.tag === 'COMPLETED');

  // Check if meeting date is today
  const meetingDateStr = rawMeetingDate ? String(rawMeetingDate).split('T')[0] : todayStr;
  const isToday = meetingDateStr === todayStr;

  // Compute Week / Duration matching the Week / Duration column
  const getWeekDurationForDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const validDate = isNaN(d.getTime()) ? new Date() : d;
      const dayOfWeek = validDate.getDay();
      const diffToMonday = validDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(validDate);
      monday.setDate(diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const mStr = formatDateToDDMMYYYY(monday.toISOString().split('T')[0]);
      const sStr = formatDateToDDMMYYYY(sunday.toISOString().split('T')[0]);
      return `${mStr} to ${sStr}`;
    } catch {
      return '';
    }
  };

  const weekDurationStr = getWeekDurationForDate(rawMeetingDate);

  // Helper to determine whether a member is Present for the active meeting
  const checkMemberIsPresent = (mem) => {
    const attList = activeMeeting?.attendances || activeMeeting?.Attendances || [];
    if (!isAttendanceRecorded || attList.length === 0) {
      return mem.status === 'present';
    }

    const memUserId = String(mem.userId || mem.UserId || mem.id || '');
    const savedRecord = attList.find(a => {
      const aUserId = String(a.userId || a.UserId || '');
      return aUserId && memUserId && aUserId === memUserId;
    });

    if (savedRecord !== undefined) {
      return (
        savedRecord.isPresent === true ||
        savedRecord.IsPresent === true ||
        savedRecord.isPresent === 1 ||
        savedRecord.IsPresent === 1 ||
        String(savedRecord.isPresent) === 'true'
      );
    }

    return mem.status === 'present';
  };

  // Calculate Summary Statistics
  const totalMembers = attendanceList.length;
  const presentCount = attendanceList.filter(mem => checkMemberIsPresent(mem)).length;
  const absentCount = totalMembers - presentCount;

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal sec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0c382e', fontWeight: 700 }}>
              {isAttendanceRecorded ? 'Meeting Attendance Details' : 'Record Session Attendance'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
              Unit: <strong>{unitInfo?.unitName || 'Ambika Vilas'}</strong> &bull; Meeting: <strong>{activeMeeting?.title || 'Weekly Unit Meeting'}</strong>
            </p>
          </div>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Meeting & Week Duration Card */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '14px 16px',
          marginBottom: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#0c382e',
              backgroundColor: '#e6f4f1',
              padding: '4px 10px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Calendar size={13} /> {activeMeeting?.title || 'Upcoming Weekly Meeting'}
            </span>

            {weekDurationStr && (
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#155e4b',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '4px 10px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <PiggyBank size={13} /> Week Duration: {weekDurationStr}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '4px' }}>
            <div>
              <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', fontWeight: 500 }}>Meeting Date</span>
              <strong style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <Calendar size={14} color="#0c382e" />
                {meetingDateFormatted}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', fontWeight: 500 }}>Meeting Time</span>
              <strong style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <Clock size={14} color="#0c382e" />
                {meetingTimeFormatted}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', fontWeight: 500 }}>Venue / Location</span>
              <strong style={{ fontSize: '0.875rem', color: '#0f172a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <MapPin size={14} color="#0c382e" />
                {meetingVenueFormatted}
              </strong>
            </div>
          </div>
        </div>

        {/* Summary Statistics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '14px'
        }}>
          <div style={{ backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Total Members</span>
            <strong style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 700 }}>{totalMembers}</strong>
          </div>
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Present</span>
            <strong style={{ fontSize: '1.1rem', color: '#16a34a', fontWeight: 700 }}>{presentCount}</strong>
          </div>
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#991b1b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Absent</span>
            <strong style={{ fontSize: '1.1rem', color: '#dc2626', fontWeight: 700 }}>{absentCount}</strong>
          </div>
        </div>

        {/* Notice Banner */}
        {isAttendanceRecorded && (
          <div style={{
            backgroundColor: isToday && !isCompleted ? '#eff6ff' : '#f8fafc',
            border: `1px solid ${isToday && !isCompleted ? '#bfdbfe' : '#e2e8f0'}`,
            color: isToday && !isCompleted ? '#1e40af' : '#475569',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 500,
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isToday && !isCompleted ? (
              <>
                <CheckCircle2 size={16} color="#2563eb" />
                <span>
                  Attendance recorded for today. You can update absent members who arrive late today by clicking <strong>Mark Late Arrival</strong>.
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={16} color="#64748b" />
                <span>
                  Attendance details locked. Late attendance updates are permitted only on the meeting date.
                </span>
              </>
            )}
          </div>
        )}

        {/* Attendance List */}
        <div className="sec-attendance-list">
          {attendanceList.length === 0 ? (
            <p style={{ padding: '1rem', color: '#666' }}>No members registered yet.</p>
          ) : (
            sortMembersByRoleOrIndex(attendanceList).map(mem => {
              const isPresent = checkMemberIsPresent(mem);

              return (
                <div className="sec-attendance-item" key={mem.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong className="sec-attendance-name">{mem.name}</strong>
                    <span className="sec-attendance-id"> ({mem.memberId})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Status Pill */}
                    {!isAttendanceRecorded ? (
                      <button
                        type="button"
                        className={`sec-attendance-pill ${
                          isPresent ? 'sec-attendance-pill--present' : 'sec-attendance-pill--absent'
                        }`}
                        onClick={() => onToggleAttendance && onToggleAttendance(mem.id)}
                      >
                        {isPresent ? 'Present' : 'Absent'}
                      </button>
                    ) : (
                      <span
                        className={`sec-attendance-pill ${
                          isPresent ? 'sec-attendance-pill--present' : 'sec-attendance-pill--absent'
                        }`}
                        style={{ cursor: 'default' }}
                      >
                        {isPresent ? 'Present' : 'Absent'}
                      </span>
                    )}

                    {/* Action button for late arrival on meeting day */}
                    {isAttendanceRecorded && isToday && !isCompleted && !isPresent && onUpdateLateAttendance && (
                      <button
                        type="button"
                        onClick={() => onUpdateLateAttendance(activeMeeting?.id, mem.userId || mem.id)}
                        style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <UserCheck size={13} />
                        <span>Mark Late Arrival</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
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

          {!isAttendanceRecorded && (
            <button
              type="button"
              className="sec-btn-submit"
              onClick={() => onSaveAttendance && onSaveAttendance(activeMeeting?.id)}
            >
              Save Attendance Sheet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecordAttendanceModal;
