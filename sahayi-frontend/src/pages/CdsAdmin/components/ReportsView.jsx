import React, { useState } from 'react';
import './ReportsView.css';

function ReportsView({ cdsAnalytics, wardsList, selectedWardFilter, setSelectedWardFilter }) {
  const [selectedReportType, setSelectedReportType] = useState('savings');

  const overall = cdsAnalytics?.overall || {};
  const units = cdsAnalytics?.units || [];

  const filteredUnits = units.filter(u =>
    selectedWardFilter === 'ALL' || String(u.wardId) === String(selectedWardFilter)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="cds-reports-view">
      <div className="cds-page-header">
        <div>
          <h1 className="cds-page-header__title">CDS Reports Center</h1>
          <p className="cds-page-header__sub">
            Generate, view, and print comprehensive system reports for total savings, financial ledgers, and meeting attendance.
          </p>
        </div>

        <button className="cds-btn-print" onClick={handlePrint}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print / Export Report
        </button>
      </div>

      {/* Report Selector Controls */}
      <div className="cds-reports-controls">
        <div className="cds-report-type-selector">
          <button
            className={`cds-report-tab ${selectedReportType === 'savings' ? 'active' : ''}`}
            onClick={() => setSelectedReportType('savings')}
          >
            Total Savings Summary
          </button>
          <button
            className={`cds-report-tab ${selectedReportType === 'financial' ? 'active' : ''}`}
            onClick={() => setSelectedReportType('financial')}
          >
            Financial Analytics Ledger
          </button>
          <button
            className={`cds-report-tab ${selectedReportType === 'attendance' ? 'active' : ''}`}
            onClick={() => setSelectedReportType('attendance')}
          >
            Meeting & Attendance Log
          </button>
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

      {/* Printable Report Document Card */}
      <div className="cds-report-paper">
        <div className="cds-report-header-print">
          <h2>KUDUMBASHREE AYALKOOTTAM MANAGEMENT SYSTEM</h2>
          <h3>CDS Level Official Statement & Summary Report</h3>
          <div className="cds-report-meta">
            <span>Generated Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span>Target Ward: {selectedWardFilter === 'ALL' ? 'All Panchayath Wards' : `Ward ID ${selectedWardFilter}`}</span>
          </div>
        </div>

        {/* Report 1: Total Savings */}
        {selectedReportType === 'savings' && (
          <div className="cds-report-section">
            <h4 className="cds-report-title">1. Total Savings Consolidated Report</h4>
            <div className="cds-report-summary-box">
              <div className="cds-report-kpi">
                <span className="label">Total Combined Savings:</span>
                <span className="val">₹{(overall.cdsTotalSavings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="cds-report-kpi">
                <span className="label">Savings in Lakhs:</span>
                <span className="val">₹{overall.cdsSavingsLakhs || 0} Lakhs</span>
              </div>
              <div className="cds-report-kpi">
                <span className="label">Active Ayalkoottam Units:</span>
                <span className="val">{overall.activeUnits || 0} / {overall.totalUnits || 0}</span>
              </div>
            </div>

            <table className="cds-report-table">
              <thead>
                <tr>
                  <th>Unit Name</th>
                  <th>Ward</th>
                  <th>Bank Account</th>
                  <th style={{ textAlign: 'right' }}>Bank Balance (₹)</th>
                  <th style={{ textAlign: 'right' }}>Savings Collected (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total Savings (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map(u => (
                  <tr key={u.unitId}>
                    <td>{u.unitName}</td>
                    <td>{u.wardFormatted}</td>
                    <td>{u.bankName} - {u.accountNumber}</td>
                    <td style={{ textAlign: 'right' }}>₹{u.bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>₹{u.savingsCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{u.totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 2: Financial Ledger */}
        {selectedReportType === 'financial' && (
          <div className="cds-report-section">
            <h4 className="cds-report-title">2. Financial Analytics & Loan Disbursal Ledger</h4>
            <table className="cds-report-table">
              <thead>
                <tr>
                  <th>Unit Name</th>
                  <th>Ward</th>
                  <th style={{ textAlign: 'right' }}>Bank Balance</th>
                  <th style={{ textAlign: 'right' }}>Loans Approved</th>
                  <th style={{ textAlign: 'right' }}>Loan Repayments</th>
                  <th style={{ textAlign: 'right' }}>Outstanding Due</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map(u => (
                  <tr key={u.unitId}>
                    <td>{u.unitName}</td>
                    <td>{u.wardFormatted}</td>
                    <td style={{ textAlign: 'right' }}>₹{u.bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>₹{u.loansDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right' }}>₹{u.loanRepayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'right', color: u.outstandingBalance > 0 ? '#b91c1c' : '#374151' }}>
                      ₹{u.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Report 3: Meeting Attendance */}
        {selectedReportType === 'attendance' && (
          <div className="cds-report-section">
            <h4 className="cds-report-title">3. Meeting & Attendance Audit Log</h4>
            <table className="cds-report-table">
              <thead>
                <tr>
                  <th>Unit Name</th>
                  <th>Ward</th>
                  <th style={{ textAlign: 'center' }}>Total Meetings</th>
                  <th style={{ textAlign: 'center' }}>Completed</th>
                  <th style={{ textAlign: 'center' }}>Attendance Rate (%)</th>
                  <th style={{ textAlign: 'center' }}>Turnout (Present / Absent)</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map(u => (
                  <tr key={u.unitId}>
                    <td>{u.unitName}</td>
                    <td>{u.wardFormatted}</td>
                    <td style={{ textAlign: 'center' }}>{u.totalMeetings}</td>
                    <td style={{ textAlign: 'center' }}>{u.completedMeetings}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{u.attendanceRate}%</td>
                    <td style={{ textAlign: 'center' }}>{u.presentCount} Present / {u.absentCount} Absent</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="cds-report-footer-signature">
          <div>
            <div className="sig-line" />
            <span>CDS Chairman Signature</span>
          </div>
          <div>
            <div className="sig-line" />
            <span>CDS Member Secretary Stamp</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsView;
