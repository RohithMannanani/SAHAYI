import React from 'react';
import { X } from 'lucide-react';

function RecordAttendanceModal({
  unitInfo,
  attendanceList,
  onToggleAttendance,
  onSaveAttendance,
  onClose
}) {
  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal sec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <div>
            <h3>Record Session Attendance</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>Current Unit: {unitInfo.unitName}</p>
          </div>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
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
