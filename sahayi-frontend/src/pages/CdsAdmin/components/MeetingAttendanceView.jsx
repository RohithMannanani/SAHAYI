import React, { useState } from 'react';
import './MeetingAttendanceView.css';

function MeetingAttendanceView({
  cdsAnalytics,
  wardsList,
  selectedWardFilter,
  setSelectedWardFilter,
  isLoading
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('attendanceRate');
  const [sortOrder, setSortOrder] = useState('desc');

  const overall = cdsAnalytics?.overall || {};
  const units = cdsAnalytics?.units || [];
  const wards = cdsAnalytics?.wards || [];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.wardFormatted.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWard = selectedWardFilter === 'ALL' || String(unit.wardId) === String(selectedWardFilter);

    return matchesSearch && matchesWard;
  }).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getAttendanceBadgeClass = (rate) => {
    if (rate >= 80) return 'cds-att-badge--high';
    if (rate >= 60) return 'cds-att-badge--medium';
    return 'cds-att-badge--low';
  };

  return (
    <div className="cds-att-view">
      {/* Page Header */}
      <div className="cds-page-header">
        <div>
          <h1 className="cds-page-header__title">Attendance & Meeting Statistics</h1>
          <p className="cds-page-header__sub">
            Monitor weekly meeting logs, completion status, and member attendance rates for each unit and across the entire CDS.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="cds-att-stats-grid">
        <div className="cds-att-card cds-att-card--meetings">
          <div className="cds-att-card__header">
            <div className="cds-att-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </div>
            <span className="cds-att-card__tag">CDS Summary</span>
          </div>
          <div className="cds-att-card__label">Total Meetings</div>
          <div className="cds-att-card__value">{overall.cdsTotalMeetings || 0}</div>
          <div className="cds-att-card__sub">{overall.cdsCompletedMeetings || 0} completed across units</div>
        </div>

        <div className="cds-att-card cds-att-card--rate">
          <div className="cds-att-card__header">
            <div className="cds-att-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="cds-att-card__tag">CDS Overall</span>
          </div>
          <div className="cds-att-card__label">Overall Attendance Rate</div>
          <div className="cds-att-card__value">{overall.cdsOverallAttendanceRate || 0}%</div>
          <div className="cds-att-card__sub">Combined participation rate</div>
        </div>

        <div className="cds-att-card cds-att-card--present">
          <div className="cds-att-card__header">
            <div className="cds-att-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <polyline points="16 11 18 13 22 9" />
              </svg>
            </div>
            <span className="cds-att-card__tag">Present Logs</span>
          </div>
          <div className="cds-att-card__label">Total Member Turnout</div>
          <div className="cds-att-card__value">{overall.cdsPresent || 0}</div>
          <div className="cds-att-card__sub">Present member records</div>
        </div>

        <div className="cds-att-card cds-att-card--absent">
          <div className="cds-att-card__header">
            <div className="cds-att-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="18" y1="8" x2="23" y2="13" />
                <line x1="23" y1="8" x2="18" y2="13" />
              </svg>
            </div>
            <span className="cds-att-card__tag">Absenteeism</span>
          </div>
          <div className="cds-att-card__label">Total Absences</div>
          <div className="cds-att-card__value">{overall.cdsAbsent || 0}</div>
          <div className="cds-att-card__sub">Absent member records</div>
        </div>
      </div>

      {/* Ward Attendance Overview */}
      <div className="cds-att-wards-section">
        <h2 className="cds-section-title">Ward Attendance Performance</h2>
        <div className="cds-ward-grid">
          {wards.map(ward => (
            <div key={ward.wardId} className="cds-ward-card">
              <div className="cds-ward-card__header">
                <span className="cds-ward-card__badge">Ward {ward.wardNumber}</span>
                <span className="cds-ward-card__title">{ward.wardName}</span>
              </div>
              <div className="cds-ward-card__body">
                <div className="cds-ward-metric">
                  <span className="cds-ward-metric__label">Meetings Held:</span>
                  <span className="cds-ward-metric__value">{ward.totalMeetings}</span>
                </div>
                <div className="cds-ward-metric">
                  <span className="cds-ward-metric__label">Avg Attendance:</span>
                  <span className={`cds-att-badge ${getAttendanceBadgeClass(ward.attendanceRate)}`}>
                    {ward.attendanceRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unit Level Attendance Table */}
      <div className="cds-table-container">
        <div className="cds-table-toolbar">
          <div className="cds-table-toolbar__title">
            <span>Unit Meeting & Attendance Ledgers ({filteredUnits.length})</span>
          </div>

          <div className="cds-table-toolbar__controls">
            <div className="cds-search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search unit or ward..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="cds-filter-select"
              value={selectedWardFilter}
              onChange={e => setSelectedWardFilter(e.target.value)}
            >
              <option value="ALL">All Wards</option>
              {wardsList.map(w => (
                <option key={w.wardId} value={w.wardId}>
                  Ward {w.wardNumber} - {w.wardName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="cds-loading-state">Loading meeting & attendance data from database...</div>
        ) : filteredUnits.length === 0 ? (
          <div className="cds-empty-state">No unit attendance records found.</div>
        ) : (
          <table className="cds-data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('unitName')} style={{ cursor: 'pointer' }}>
                  Unit Name {sortField === 'unitName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Ward</th>
                <th onClick={() => handleSort('totalMeetings')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  Total Meetings
                </th>
                <th onClick={() => handleSort('completedMeetings')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  Completed
                </th>
                <th onClick={() => handleSort('attendanceRate')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                  Attendance Rate {sortField === 'attendanceRate' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ textAlign: 'center' }}>Present / Absent Logs</th>
                <th>Last Meeting Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map(unit => (
                <tr key={unit.unitId}>
                  <td>
                    <div className="cds-unit-name-cell">
                      <span className="cds-unit-badge">{unit.unitName.substring(0, 2).toUpperCase()}</span>
                      <div>
                        <div className="cds-unit-name-text">{unit.unitName}</div>
                        <div className="cds-unit-sub-text">{unit.memberCount} Members</div>
                      </div>
                    </div>
                  </td>
                  <td>{unit.wardFormatted}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{unit.totalMeetings}</td>
                  <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{unit.completedMeetings}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="cds-att-rate-cell">
                      <span className={`cds-att-badge ${getAttendanceBadgeClass(unit.attendanceRate)}`}>
                        {unit.attendanceRate}%
                      </span>
                      <div className="cds-att-progress-bar">
                        <div
                          className="cds-att-progress-fill"
                          style={{ width: `${Math.min(100, unit.attendanceRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="cds-turnout-pill">
                      <span className="cds-turnout-present">{unit.presentCount} Present</span>
                      <span className="cds-turnout-sep">/</span>
                      <span className="cds-turnout-absent">{unit.absentCount} Absent</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {unit.lastMeetingDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default MeetingAttendanceView;
