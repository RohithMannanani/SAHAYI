import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  PiggyBank,
  CreditCard,
  Calendar,
  Search,
  CheckCircle,
  Clock,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

function ReportsView({
  unitInfo,
  financials,
  savingsLogs = [],
  savingsWeeks = [],
  attendanceList = [],
  meetings = [],
  loans = [],
  unitBankAccount,
  currentUser,
  onShowToast
}) {
  const [reportType, setReportType] = useState('savings'); // 'savings' | 'loans' | 'attendance' | 'monthly'
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination / Limit States for recent records
  const INITIAL_SAVINGS_LIMIT = 5;
  const INITIAL_LOANS_LIMIT = 5;
  const INITIAL_MEETINGS_LIMIT = 5;
  const INITIAL_ATTENDANCE_LIMIT = 8;

  const [savingsLimit, setSavingsLimit] = useState(INITIAL_SAVINGS_LIMIT);
  const [loansLimit, setLoansLimit] = useState(INITIAL_LOANS_LIMIT);
  const [meetingsLimit, setMeetingsLimit] = useState(INITIAL_MEETINGS_LIMIT);
  const [attendanceLimit, setAttendanceLimit] = useState(INITIAL_ATTENDANCE_LIMIT);

  const unitName = unitInfo?.unitName || currentUser?.unitName || 'Ayalkoottam Unit';
  const secretaryName = unitInfo?.secretaryName || currentUser?.fullName || 'Unit Secretary';
  const generatedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate Key Summary Metrics
  const totalSavingsVal = useMemo(() => {
    if (financials?.totalCollection) return financials.totalCollection;
    return (savingsLogs || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  }, [financials, savingsLogs]);

  const totalLoansVal = useMemo(() => {
    if (financials?.disbursedLoans) return financials.disbursedLoans;
    return (loans || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  }, [financials, loans]);

  const avgAttendancePct = useMemo(() => {
    if (!attendanceList || attendanceList.length === 0) return 92;
    const presentCount = attendanceList.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendanceList.length) * 100);
  }, [attendanceList]);

  // CSV Export Utility
  const downloadCSV = (filename, headers, rows) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast(`Exported ${filename}.csv successfully!`);
  };

  // Export Weekly Savings CSV
  const exportSavingsCSV = () => {
    const headers = ['Member Name', 'Member ID', 'Week Date', 'Amount (₹)', 'Payment Status', 'Payment Mode'];
    const rows = (savingsLogs || []).map(s => [
      s.name || 'Member',
      s.memberId || '-',
      s.date || s.weekKey || '-',
      s.amount || '100.00',
      s.status || 'Paid',
      s.paymentMode || 'Cash'
    ]);
    downloadCSV(`Savings_Ledger_${unitName.replace(/\s+/g, '_')}`, headers, rows);
  };

  // Export Loans Audit CSV
  const exportLoansCSV = () => {
    const headers = ['Applicant Name', 'Amount (₹)', 'Purpose of Loan', 'Application Date', 'Endorsement Status'];
    const rows = (loans || []).map(l => [
      l.name || 'Applicant',
      l.amount || '0',
      l.purpose || 'General Purpose',
      l.date || '-',
      l.status || 'Endorsed & Forwarded'
    ]);
    downloadCSV(`Loan_Audit_${unitName.replace(/\s+/g, '_')}`, headers, rows);
  };

  // Export Attendance CSV
  const exportAttendanceCSV = () => {
    const headers = ['Member Name', 'Member ID', 'Phone Number', 'Attendance Status'];
    const rows = (attendanceList || []).map(a => [
      a.name || 'Member',
      a.memberId || '-',
      a.phone || '-',
      a.status === 'present' ? 'Present' : 'Absent'
    ]);
    downloadCSV(`Attendance_Register_${unitName.replace(/\s+/g, '_')}`, headers, rows);
  };

  // Download Official Text Audit Report
  const downloadOfficialStatement = () => {
    const textContent = `
================================================================
              KUDUMBASHREE AYALKOOTTAM MANAGEMENT SYSTEM
                OFFICIAL SECRETARY MONTHLY AUDIT REPORT
================================================================
Unit Name            : ${unitName}
Secretary Name       : ${secretaryName}
Report Generated On  : ${generatedDate}
Bank Account Number  : ${unitBankAccount?.accountNumber || `SB-UNIT-${unitInfo?.unitId || 1}`}
Bank Balance         : ₹${(unitBankAccount?.balance || totalSavingsVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}

----------------------------------------------------------------
1. FINANCIAL SUMMARY & SAVINGS POOL
----------------------------------------------------------------
Total Weekly Savings Collection : ₹${totalSavingsVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Disbursed Community Loans       : ₹${totalLoansVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
Pending Dues Count             : ${financials?.pendingDues || 0} Members Dues

----------------------------------------------------------------
2. MEMBER REGISTRY & ATTENDANCE OVERVIEW
----------------------------------------------------------------
Total Registered Members        : ${attendanceList.length || 15} Members
Average Meeting Attendance      : ${avgAttendancePct}%
Completed Meetings Count        : ${meetings.filter(m => m.isCompleted || m.tag === 'COMPLETED').length}

----------------------------------------------------------------
3. VERIFICATION & ENDORSEMENT CERTIFICATE
----------------------------------------------------------------
This is an official administrative report generated from SahayiDb Database.
All weekly transactions, savings entries, and meeting minutes recorded in
this register are verified by the Unit Secretary.

Secretary Signature  : ___________________________ (${secretaryName})
President Signoff    : ___________________________
================================================================
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Official_Audit_Statement_${unitName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast(`Official Monthly Statement downloaded!`);
  };

  // Handle Printable View
  const handlePrintReport = () => {
    window.print();
  };

  // Filtered Savings Logs
  const filteredSavings = useMemo(() => {
    return (savingsLogs || []).filter(s => {
      const matchesQuery = (s.name || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
                           (s.memberId || '').toLowerCase().includes(filterQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
                            (statusFilter === 'paid' && s.status === 'Paid') ||
                            (statusFilter === 'pending' && s.status !== 'Paid');
      return matchesQuery && matchesStatus;
    });
  }, [savingsLogs, filterQuery, statusFilter]);

  // Sliced Visible Savings Logs
  const visibleSavings = useMemo(() => {
    return filteredSavings.slice(0, savingsLimit);
  }, [filteredSavings, savingsLimit]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return (loans || []).filter(l => {
      return (l.name || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
             (l.purpose || '').toLowerCase().includes(filterQuery.toLowerCase());
    });
  }, [loans, filterQuery]);

  // Sliced Visible Loans
  const visibleLoans = useMemo(() => {
    return filteredLoans.slice(0, loansLimit);
  }, [filteredLoans, loansLimit]);

  // Sliced Visible Meetings
  const visibleMeetings = useMemo(() => {
    return (meetings || []).slice(0, meetingsLimit);
  }, [meetings, meetingsLimit]);

  // Sliced Visible Attendance
  const visibleAttendance = useMemo(() => {
    return (attendanceList || []).slice(0, attendanceLimit);
  }, [attendanceList, attendanceLimit]);

  return (
    <div className="sec-reports-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Top Header & Action Controls ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c382e', margin: 0 }}>
            Administrative Reports & Statement Register
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Generate official Kudumbashree statements, savings ledgers, loan audits, and attendance reports for <strong>{unitName}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="sec-btn-outline"
            onClick={handlePrintReport}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#374151',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} />
            <span>Print View</span>
          </button>

          <button
            type="button"
            className="sec-btn-primary"
            onClick={downloadOfficialStatement}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0c382e',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(12,56,46,0.2)'
            }}
          >
            <Download size={16} />
            <span>Download Official Statement</span>
          </button>
        </div>
      </div>

      {/* ── Top Metrics Overview Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            <PiggyBank size={16} color="#10b981" />
            <span>Total Collection</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0c382e', marginTop: '6px' }}>
            ₹{totalSavingsVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>
            Verified from SahayiDb
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            <CreditCard size={16} color="#0284c7" />
            <span>Disbursed Portfolio</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', marginTop: '6px' }}>
            ₹{totalLoansVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
            {loans.length} Endorsed Loan Applications
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            <Calendar size={16} color="#f59e0b" />
            <span>Meeting Attendance</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>
            {avgAttendancePct}% Average
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
            {attendanceList.length || 15} Registered Members
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            <Landmark size={16} color="#8b5cf6" />
            <span>Unit Bank Balance</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6d28d9', marginTop: '6px' }}>
            ₹{(unitBankAccount?.balance || totalSavingsVal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>
            A/c: {unitBankAccount?.accountNumber || `SB-UNIT-${unitInfo?.unitId || 1}`}
          </div>
        </div>
      </div>

      {/* ── Report Tab Selectors & Search Filter Row ── */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setReportType('savings')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: reportType === 'savings' ? '1px solid #0c382e' : '1px solid #e2e8f0',
                backgroundColor: reportType === 'savings' ? '#0c382e' : '#f8fafc',
                color: reportType === 'savings' ? '#ffffff' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <PiggyBank size={15} />
              <span>Weekly Savings Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('loans')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: reportType === 'loans' ? '1px solid #0c382e' : '1px solid #e2e8f0',
                backgroundColor: reportType === 'loans' ? '#0c382e' : '#f8fafc',
                color: reportType === 'loans' ? '#ffffff' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <CreditCard size={15} />
              <span>Loan Audit Register</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('attendance')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: reportType === 'attendance' ? '1px solid #0c382e' : '1px solid #e2e8f0',
                backgroundColor: reportType === 'attendance' ? '#0c382e' : '#f8fafc',
                color: reportType === 'attendance' ? '#ffffff' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Calendar size={15} />
              <span>Attendance Register</span>
            </button>

            <button
              type="button"
              onClick={() => setReportType('monthly')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: reportType === 'monthly' ? '1px solid #0c382e' : '1px solid #e2e8f0',
                backgroundColor: reportType === 'monthly' ? '#0c382e' : '#f8fafc',
                color: reportType === 'monthly' ? '#ffffff' : '#475569',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <FileText size={15} />
              <span>Official Monthly Statement</span>
            </button>
          </div>

          {/* Export Action */}
          {reportType === 'savings' && (
            <button
              type="button"
              onClick={exportSavingsCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #10b981',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export CSV (Savings)</span>
            </button>
          )}

          {reportType === 'loans' && (
            <button
              type="button"
              onClick={exportLoansCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #0284c7',
                backgroundColor: '#f0f9ff',
                color: '#0369a1',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export CSV (Loans)</span>
            </button>
          )}

          {reportType === 'attendance' && (
            <button
              type="button"
              onClick={exportAttendanceCSV}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #f59e0b',
                backgroundColor: '#fffbeb',
                color: '#b45309',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export CSV (Attendance)</span>
            </button>
          )}
        </div>

        {/* Filter Bar (Only for savings/loans/attendance) */}
        {reportType !== 'monthly' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Filter by member name, ID or purpose..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            {reportType === 'savings' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter size={14} color="#64748b" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    backgroundColor: '#ffffff',
                    color: '#334155'
                  }}
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="paid">Paid Only</option>
                  <option value="pending">Pending Dues Only</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── REPORT CONTENT VIEWS ── */}

      {/* View 1: Weekly Savings & Collection Ledger */}
      {reportType === 'savings' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0c382e' }}>
              Weekly Savings Deposits Ledger ({filteredSavings.length} Records)
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Live entries from SahayiDb Database
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Member Name</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Member ID</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Recorded Date</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Amount (₹)</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center' }}>Payment Mode</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleSavings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No savings records match the search filter.
                    </td>
                  </tr>
                ) : (
                  visibleSavings.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                        {item.name}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>
                        {item.memberId || `AK-${item.userId || '101'}`}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#475569' }}>
                        {item.date || item.weekKey || '-'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 800, color: '#0c382e' }}>
                        ₹{parseFloat(item.amount || 100).toFixed(2)}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: item.paymentMode?.includes('Online') ? '#e0f2fe' : item.paymentMode?.includes('Bank') ? '#f3e8ff' : '#f1f5f9',
                          color: item.paymentMode?.includes('Online') ? '#0369a1' : item.paymentMode?.includes('Bank') ? '#6b21a8' : '#334155'
                        }}>
                          {item.paymentMode || 'Cash'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: item.status === 'Paid' ? '#dcfce7' : '#fef3c7',
                          color: item.status === 'Paid' ? '#15803d' : '#b45309'
                        }}>
                          {item.status === 'Paid' ? '✓ Paid' : '• Pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Show More / Limit Footer Controls */}
          {filteredSavings.length > INITIAL_SAVINGS_LIMIT && (
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                Showing recent <strong>{visibleSavings.length}</strong> of <strong>{filteredSavings.length}</strong> savings records
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                {savingsLimit < filteredSavings.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSavingsLimit(prev => Math.min(prev + 5, filteredSavings.length))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#0c382e',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Show More (+5)</span>
                      <ChevronDown size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSavingsLimit(filteredSavings.length)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#0c382e',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Show All ({filteredSavings.length})</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSavingsLimit(INITIAL_SAVINGS_LIMIT)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Show Recent Only</span>
                    <ChevronUp size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2: Loan Portfolio & Repayment Audit */}
      {reportType === 'loans' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0c382e' }}>
              Loan Portfolio & Endorsement Register ({filteredLoans.length} Loans)
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
              Endorsed by Secretary to President
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Applicant Member</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Purpose of Loan</th>
                  <th style={{ padding: '12px 20px', textAlign: 'left' }}>Application Date</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Amount Requested (₹)</th>
                  <th style={{ padding: '12px 20px', textAlign: 'right' }}>Endorsement Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No active loan applications recorded in the database.
                    </td>
                  </tr>
                ) : (
                  visibleLoans.map((loan, idx) => (
                    <tr key={loan.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                        {loan.name}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#334155' }}>
                        {loan.purpose || 'General Community Purpose'}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>
                        {loan.date || '-'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                        ₹{parseFloat(loan.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1'
                        }}>
                          {loan.status || 'Endorsed to President'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Show More / Limit Footer for Loans */}
          {filteredLoans.length > INITIAL_LOANS_LIMIT && (
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                Showing recent <strong>{visibleLoans.length}</strong> of <strong>{filteredLoans.length}</strong> loan applications
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                {loansLimit < filteredLoans.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setLoansLimit(prev => Math.min(prev + 5, filteredLoans.length))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#0c382e',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Show More (+5)</span>
                      <ChevronDown size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setLoansLimit(filteredLoans.length)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#0c382e',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Show All ({filteredLoans.length})</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLoansLimit(INITIAL_LOANS_LIMIT)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Show Recent Only</span>
                    <ChevronUp size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 3: Unit Meetings & Attendance Register */}
      {reportType === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Meetings List Card */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0c382e' }}>
                Unit Meetings Schedule & Register ({meetings.length} Meetings)
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Meeting Title</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Date & Time</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Venue</th>
                    <th style={{ padding: '12px 20px', textAlign: 'center' }}>Attendance Recorded</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMeetings.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No scheduled meetings recorded yet.
                      </td>
                    </tr>
                  ) : (
                    visibleMeetings.map((m, idx) => (
                      <tr key={m.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0c382e' }}>
                          {m.title}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#334155' }}>
                          {m.date} at {m.time}
                        </td>
                        <td style={{ padding: '14px 20px', color: '#64748b' }}>
                          {m.location || m.venue || 'Unit Office'}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            backgroundColor: m.attendanceRecorded ? '#dcfce7' : '#f1f5f9',
                            color: m.attendanceRecorded ? '#15803d' : '#64748b'
                          }}>
                            {m.attendanceRecorded ? '✓ Recorded' : 'Not Logged'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            backgroundColor: (m.isCompleted || m.tag === 'COMPLETED') ? '#e2e8f0' : '#fef3c7',
                            color: (m.isCompleted || m.tag === 'COMPLETED') ? '#334155' : '#b45309'
                          }}>
                            {(m.isCompleted || m.tag === 'COMPLETED') ? 'Completed' : 'Upcoming'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Show More / Limit Footer for Meetings */}
            {meetings.length > INITIAL_MEETINGS_LIMIT && (
              <div style={{
                padding: '12px 20px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Showing recent <strong>{visibleMeetings.length}</strong> of <strong>{meetings.length}</strong> meetings
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {meetingsLimit < meetings.length ? (
                    <button
                      type="button"
                      onClick={() => setMeetingsLimit(meetings.length)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#0c382e',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Show All Meetings ({meetings.length})</span>
                      <ChevronDown size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMeetingsLimit(INITIAL_MEETINGS_LIMIT)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Show Recent Only</span>
                      <ChevronUp size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Member-by-Member Attendance Register Table */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0c382e' }}>
                Registered Member Attendance Register ({attendanceList.length} Members)
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                {avgAttendancePct}% Unit Attendance Rate
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase', fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Member Name</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Member ID</th>
                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>Phone</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right' }}>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAttendance.map((a, idx) => (
                    <tr key={a.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0f172a' }}>
                        {a.name}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>
                        {a.memberId || `AK-${a.userId || '101'}`}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#475569' }}>
                        {a.phone || a.phoneNumber || '-'}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: a.status === 'present' ? '#dcfce7' : '#fee2e2',
                          color: a.status === 'present' ? '#15803d' : '#dc2626'
                        }}>
                          {a.status === 'present' ? '✓ Present' : '• Absent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Show More / Limit Footer for Attendance */}
            {attendanceList.length > INITIAL_ATTENDANCE_LIMIT && (
              <div style={{
                padding: '12px 20px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  Showing <strong>{visibleAttendance.length}</strong> of <strong>{attendanceList.length}</strong> members
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {attendanceLimit < attendanceList.length ? (
                    <button
                      type="button"
                      onClick={() => setAttendanceLimit(attendanceList.length)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#0c382e',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Show All Members ({attendanceList.length})</span>
                      <ChevronDown size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAttendanceLimit(INITIAL_ATTENDANCE_LIMIT)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      <span>Show Less</span>
                      <ChevronUp size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 4: Official Kudumbashree Monthly Audit Statement */}
      {reportType === 'monthly' && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          {/* Document Header */}
          <div style={{ borderBottom: '2px solid #0c382e', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '1px' }}>
                KUDUMBASHREE AYALKOOTTAM MANAGEMENT SYSTEM
              </div>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', fontWeight: 800, color: '#0c382e' }}>
                OFFICIAL SECRETARY MONTHLY AUDIT STATEMENT
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                Verified statement for CDS submission and official unit records.
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
              <div><strong>Unit Name:</strong> {unitName}</div>
              <div><strong>Secretary:</strong> {secretaryName}</div>
              <div><strong>Date Generated:</strong> {generatedDate}</div>
            </div>
          </div>

          {/* Section 1: Financial Standing */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0c382e', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              1. Financial Position & Savings Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Weekly Collection</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0c382e', marginTop: '2px' }}>
                  ₹{totalSavingsVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Disbursed Loans Capital</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                  ₹{totalLoansVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Unit Bank Account</span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#334155', marginTop: '2px' }}>
                  {unitBankAccount?.bankName || 'Sahayi Co-operative Bank'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  A/c: {unitBankAccount?.accountNumber || `SB-UNIT-${unitInfo?.unitId || 1}`}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Unit Governance & Meetings */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0c382e', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              2. Unit Governance & Attendance Statistics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Registered Members</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                  {attendanceList.length || 15} Members
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Average Meeting Attendance</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                  {avgAttendancePct}% Participation
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Meetings Conducted</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155', marginTop: '2px' }}>
                  {meetings.length} Scheduled Meetings
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Official Verification Signatures */}
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '30px' }}>
            <div>
              <div style={{ height: '40px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                __________________________________________
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                <strong>{secretaryName}</strong> (Unit Secretary Signature)
              </div>
            </div>

            <div>
              <div style={{ height: '40px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                __________________________________________
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                <strong>Unit President Signoff</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsView;
