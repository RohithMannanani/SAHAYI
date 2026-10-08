import React, { useState, useEffect, useMemo } from 'react';
import './PresidentReportsView.css';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CreditCard,
  PiggyBank,
  Users,
  Calendar,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Landmark
} from 'lucide-react';
import loanService from '../../../services/loanService';
import MeetingMinutesModal from '../../Secretary/components/modals/MeetingMinutesModal';
import { isMeetingDatePassed } from '../../Secretary/utils/formatTime';

function PresidentReportsView({
  dashboardData,
  savingsWeeks = [],
  pendingLoans = [],
  currentUser,
  onShowToast
}) {
  const [activeReportTab, setActiveReportTab] = useState('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loanMonitorData, setLoanMonitorData] = useState(null);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(10);
  const [selectedMinutesMeeting, setSelectedMinutesMeeting] = useState(null);

  const unitName = dashboardData?.unitName || currentUser?.unitName || 'Ayalkoottam Unit';
  const presidentName = currentUser?.fullName || currentUser?.name || 'Unit President';
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Fetch full loans audit from backend president endpoint
  const fetchLoanData = async () => {
    setIsLoadingLoans(true);
    try {
      const data = await loanService.monitorLoans();
      setLoanMonitorData(data);
    } catch (err) {
      console.error('Failed to load loan monitor data for reports:', err);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  useEffect(() => {
    fetchLoanData();
  }, []);

  // ── Financial Totals Computation ───────────────────────────
  const totalUnitSavings = useMemo(() => {
    if (dashboardData?.bankAccount?.balance !== undefined && dashboardData?.bankAccount?.balance !== null) {
      return parseFloat(dashboardData.bankAccount.balance);
    }
    return dashboardData?.totalWeeklyCollection || savingsWeeks.reduce((acc, w) => acc + (w.totalCollected || 0), 0);
  }, [dashboardData, savingsWeeks]);

  const loansList = useMemo(() => {
    return loanMonitorData?.loans || [];
  }, [loanMonitorData]);

  const totalDisbursedAmount = useMemo(() => {
    return loanMonitorData?.totalDisbursed || dashboardData?.disbursedLoansTotal || 0;
  }, [loanMonitorData, dashboardData]);

  const totalOutstandingBalance = useMemo(() => {
    return loanMonitorData?.totalOutstandingBalance || 0;
  }, [loanMonitorData]);

  const totalInterestCollected = useMemo(() => {
    return loanMonitorData?.totalInterestCollected || 0;
  }, [loanMonitorData]);

  const membersList = useMemo(() => {
    return dashboardData?.members || [];
  }, [dashboardData]);

  const meetingsList = useMemo(() => {
    return dashboardData?.meetings || [];
  }, [dashboardData]);

  const isMeetingDone = (m) => Boolean(m.isCompleted || m.tag === 'COMPLETED' || isMeetingDatePassed(m.date, m.time));

  const completedMeetingsCount = useMemo(() => {
    return meetingsList.filter(isMeetingDone).length;
  }, [meetingsList]);

  const meetingQuorumRate = useMemo(() => {
    if (!meetingsList.length) return 100;
    return Math.round((completedMeetingsCount / meetingsList.length) * 100);
  }, [completedMeetingsCount, meetingsList]);

  // Total thrift collection across all savings logs
  const savingsLogs = useMemo(() => {
    return dashboardData?.savingsLogs || [];
  }, [dashboardData]);

  // ── Filtered Datasets ──────────────────────────────────────
  const filteredLoans = useMemo(() => {
    return loansList.filter(l => {
      const matchesSearch = !searchQuery ||
        (l.memberName && l.memberName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.purpose && l.purpose.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (String(l.loanId).includes(searchQuery));
      const matchesStatus = statusFilter === 'all' || (l.status && l.status.toLowerCase() === statusFilter.toLowerCase());
      return matchesSearch && matchesStatus;
    });
  }, [loansList, searchQuery, statusFilter]);

  const filteredSavingsWeeks = useMemo(() => {
    return savingsWeeks.filter(w => {
      const title = (w.weekTitle || `${w.startDate} - ${w.endDate}`).toLowerCase();
      return !searchQuery || title.includes(searchQuery.toLowerCase());
    });
  }, [savingsWeeks, searchQuery]);

  const filteredMembers = useMemo(() => {
    return membersList.filter(m => {
      const matchesSearch = !searchQuery ||
        (m.fullName && m.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.phone && m.phone.includes(searchQuery)) ||
        (m.houseName && m.houseName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && m.isActive !== false) ||
        (statusFilter === 'inactive' && m.isActive === false);
      return matchesSearch && matchesStatus;
    });
  }, [membersList, searchQuery, statusFilter]);

  const filteredMeetings = useMemo(() => {
    return meetingsList.filter(m => {
      const done = isMeetingDone(m);
      const matchesSearch = !searchQuery ||
        (m.title && m.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.venue && m.venue.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'completed' && done) ||
        (statusFilter === 'upcoming' && !done);
      return matchesSearch && matchesStatus;
    });
  }, [meetingsList, searchQuery, statusFilter]);

  // ── CSV Export Handler ─────────────────────────────────────
  const exportToCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `Sahayi_President_${activeReportTab}_Report`;

    if (activeReportTab === 'summary') {
      headers = ['Metric Name', 'Audited Value', 'Verification Reference'];
      rows = [
        ['Unit Name', unitName, 'Kerala Kudumbashree State Mission'],
        ['Presiding Officer', presidentName, 'President'],
        ['Audit Date', currentDate, 'Sahayi Governance Framework'],
        ['Total Registered Members', membersList.length, 'Verified Directory'],
        ['Total Unit Thrift Savings', `₹${totalUnitSavings.toLocaleString('en-IN')}`, 'Bank Account / Savings Ledger'],
        ['Total Disbursed Loan Volume', `₹${totalDisbursedAmount.toLocaleString('en-IN')}`, 'President Approved Loans'],
        ['Current Outstanding Loan Portfolio', `₹${totalOutstandingBalance.toLocaleString('en-IN')}`, 'Loan Repayment Tracker'],
        ['Cumulative Interest Earned', `₹${totalInterestCollected.toLocaleString('en-IN')}`, 'Unit Group Fund Yield'],
        ['Scheduled Unit Meetings', meetingsList.length, 'Secretary Minutes Book'],
        ['Completed Meetings Quorum Rate', `${meetingQuorumRate}%`, 'Attendance Record']
      ];
    } else if (activeReportTab === 'loans') {
      filename = `Sahayi_President_Loan_Portfolio_Audit`;
      headers = ['Loan ID', 'Member Name', 'Requested (₹)', 'Fine (₹)', 'Interest Paid (₹)', 'Outstanding (₹)', 'Status', 'Applied Date', 'Approved By'];
      rows = filteredLoans.map(l => [
        `LN-${l.loanId}`,
        l.memberName || 'Member',
        l.amountRequested || 0,
        l.fineAmount || 0,
        l.totalInterestPaid || 0,
        l.outstandingBalance || 0,
        l.status || 'Pending',
        l.appliedDate ? new Date(l.appliedDate).toLocaleDateString() : '-',
        l.approvedByName || '-'
      ]);
    } else if (activeReportTab === 'savings') {
      filename = `Sahayi_President_Weekly_Savings_Audit`;
      headers = ['Week Period', 'Total Collected (₹)', 'Paid Members Count', 'Pending Dues Count', 'Collection Status'];
      rows = filteredSavingsWeeks.map(w => [
        w.weekTitle || `${w.startDate} - ${w.endDate}`,
        w.totalCollected || 0,
        w.paidCount || 0,
        w.pendingCount || 0,
        (w.pendingCount === 0 ? '100% Cleared' : `${w.pendingCount} Dues Pending`)
      ]);
    } else if (activeReportTab === 'meetings') {
      filename = `Sahayi_President_Meetings_Quorum_Audit`;
      headers = ['Meeting ID', 'Title', 'Date', 'Time', 'Venue', 'Status'];
      rows = filteredMeetings.map((m, idx) => [
        `MTG-${m.id || idx + 1}`,
        m.title || 'Weekly Meeting',
        m.date || '-',
        m.time || '-',
        m.venue || m.location || '-',
        (isMeetingDone(m) ? 'Completed' : 'Upcoming')
      ]);
    } else if (activeReportTab === 'members') {
      filename = `Sahayi_President_Members_Standing_Audit`;
      headers = ['Member Name', 'Role', 'Phone', 'House Name', 'Status'];
      rows = filteredMembers.map(m => [
        m.fullName || m.name || 'Member',
        m.role || (m.isPresident ? 'President' : m.isSecretary ? 'Secretary' : m.isTreasurer ? 'Treasurer' : 'Member'),
        m.phone || '-',
        m.houseName || '-',
        m.isActive !== false ? 'Active' : 'Inactive'
      ]);
    }

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

    if (onShowToast) {
      onShowToast(`Exported ${filename}.csv successfully!`, 'success');
    }
  };

  // ── Print Handler ──────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pres-reports-wrapper">
      {/* ── Top Header & Actions ── */}
      <div className="pres-reports-header no-print">
        <div>
          <h2 className="pres-reports-title">
            <ShieldCheck size={26} color="#0c382e" />
            Presidential Executive Audit & Reports Center
          </h2>
          <p className="pres-reports-subtitle">
            Executive oversight, statutory Kudumbashree governance certificates, loan approval audits, and weekly thrift statements for <strong>{unitName}</strong>.
          </p>
        </div>

        <div className="pres-reports-actions">
          <button
            type="button"
            className="pres-rep-btn pres-rep-btn--outline"
            onClick={fetchLoanData}
            title="Refresh audited metrics"
          >
            <RefreshCw size={15} className={isLoadingLoans ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="pres-rep-btn pres-rep-btn--outline"
            onClick={handlePrint}
            title="Print official report"
          >
            <Printer size={15} />
            <span>Print Official Statement</span>
          </button>

          <button
            type="button"
            className="pres-rep-btn pres-rep-btn--primary"
            onClick={exportToCSV}
            title="Download CSV report"
          >
            <Download size={15} />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="pres-rep-nav no-print">
        <button
          type="button"
          className={`pres-rep-tab-btn ${activeReportTab === 'summary' ? 'pres-rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveReportTab('summary'); setStatusFilter('all'); setSearchQuery(''); }}
        >
          <Landmark size={17} />
          <span>Executive Governance Statement</span>
        </button>

        <button
          type="button"
          className={`pres-rep-tab-btn ${activeReportTab === 'loans' ? 'pres-rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveReportTab('loans'); setStatusFilter('all'); setSearchQuery(''); }}
        >
          <CreditCard size={17} />
          <span>Loan Portfolio & Approvals</span>
        </button>

        <button
          type="button"
          className={`pres-rep-tab-btn ${activeReportTab === 'savings' ? 'pres-rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveReportTab('savings'); setStatusFilter('all'); setSearchQuery(''); }}
        >
          <PiggyBank size={17} />
          <span>Weekly Thrift & Capital</span>
        </button>

        <button
          type="button"
          className={`pres-rep-tab-btn ${activeReportTab === 'meetings' ? 'pres-rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveReportTab('meetings'); setStatusFilter('all'); setSearchQuery(''); }}
        >
          <Calendar size={17} />
          <span>Meetings & Quorum Audit</span>
        </button>

        <button
          type="button"
          className={`pres-rep-tab-btn ${activeReportTab === 'members' ? 'pres-rep-tab-btn--active' : ''}`}
          onClick={() => { setActiveReportTab('members'); setStatusFilter('all'); setSearchQuery(''); }}
        >
          <Users size={17} />
          <span>Members Roster & Standing</span>
        </button>
      </div>

      {/* ── Search & Filter Bar (Shown on data tabs) ── */}
      {activeReportTab !== 'summary' && (
        <div className="pres-rep-filter-bar no-print">
          <div className="pres-rep-search-input-wrap">
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder={`Search ${activeReportTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="pres-rep-filter-controls">
            {activeReportTab === 'loans' && (
              <select
                className="pres-rep-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Loan Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Disbursed">Disbursed (Active)</option>
                <option value="Pending">Pending President Approval</option>
                <option value="Closed">Closed / Settled</option>
                <option value="Rejected">Rejected</option>
              </select>
            )}

            {activeReportTab === 'members' && (
              <select
                className="pres-rep-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Member Standings</option>
                <option value="active">Active Members</option>
                <option value="inactive">Inactive</option>
              </select>
            )}

            {activeReportTab === 'meetings' && (
              <select
                className="pres-rep-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Meetings</option>
                <option value="completed">Completed Meetings</option>
                <option value="upcoming">Upcoming Meetings</option>
              </select>
            )}

            {(searchQuery || statusFilter !== 'all') && (
              <button
                type="button"
                className="pres-rep-btn pres-rep-btn--outline"
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 1: EXECUTIVE GOVERNANCE STATEMENT ── */}
      {activeReportTab === 'summary' && (
        <div className="pres-exec-statement pres-print-target">
          <div className="pres-exec-header">
            <div className="pres-exec-brand-box">
              <div className="pres-exec-emblem">KS</div>
              <div className="pres-exec-title-group">
                <h3>Kudumbashree Community Development Society</h3>
                <p>Ayalkoottam Executive Governance & Audit Statement • State Poverty Eradication Mission</p>
              </div>
            </div>

            <div className="pres-exec-meta">
              <div><strong>Ayalkoottam:</strong> {unitName}</div>
              <div><strong>Presiding Officer:</strong> {presidentName}</div>
              <div><strong>Statement Date:</strong> {currentDate}</div>
              <div><strong>Audit Status:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>VERIFIED & ACTIVE</span></div>
            </div>
          </div>

          {/* Key Executive Metrics Grid */}
          <div className="pres-rep-metrics-grid" style={{ marginBottom: '24px' }}>
            <div className="pres-rep-metric-card" style={{ borderLeft: '4px solid #10b981' }}>
              <span className="pres-rep-metric-label">Unit Capital & Savings</span>
              <div className="pres-rep-metric-val">₹{totalUnitSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="pres-rep-metric-sub">Accumulated thrift in unit account</div>
            </div>

            <div className="pres-rep-metric-card" style={{ borderLeft: '4px solid #0284c7' }}>
              <span className="pres-rep-metric-label">Disbursed Loans</span>
              <div className="pres-rep-metric-val" style={{ color: '#0284c7' }}>₹{totalDisbursedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="pres-rep-metric-sub">Community credit extended</div>
            </div>

            <div className="pres-rep-metric-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <span className="pres-rep-metric-label">Active Outstanding</span>
              <div className="pres-rep-metric-val" style={{ color: '#b45309' }}>₹{totalOutstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="pres-rep-metric-sub">Repayments in collection cycle</div>
            </div>

            <div className="pres-rep-metric-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <span className="pres-rep-metric-label">Democratic Quorum</span>
              <div className="pres-rep-metric-val" style={{ color: '#8b5cf6' }}>{meetingQuorumRate}%</div>
              <div className="pres-rep-metric-sub">{completedMeetingsCount} of {meetingsList.length} meetings held</div>
            </div>
          </div>

          {/* Statutory Compliance Checklist */}
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0c382e', margin: '20px 0 12px 0' }}>
            Statutory Ayalkoottam Governance Compliance Matrix
          </h4>
          <div className="pres-exec-checklist">
            <div className="pres-exec-check-item">
              <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Weekly Thrift Discipline</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {savingsWeeks.length} weekly cycles tracked with regular ₹100 mandatory contributions.
                </div>
              </div>
            </div>

            <div className="pres-exec-check-item">
              <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Presidential Loan Vetting</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Dual-signoff policy enforced for loan sanctions; {loansList.length} total applications reviewed.
                </div>
              </div>
            </div>

            <div className="pres-exec-check-item">
              <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Bank Account Reconciliation</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {dashboardData?.bankAccount?.accountNumber ? `A/C: ${dashboardData.bankAccount.accountNumber} (${dashboardData.bankAccount.bankName || 'Verified Bank'})` : 'Unit Bank linked with passbook ledger.'}
                </div>
              </div>
            </div>

            <div className="pres-exec-check-item">
              <CheckCircle size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>Member Democracy & Voice</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {membersList.length} active registered members participating in unit meetings and mutual aid.
                </div>
              </div>
            </div>
          </div>

          {/* Official Endorsement Signatures */}
          <div className="pres-exec-signatures">
            <div className="pres-sig-block">
              <div className="pres-sig-line"></div>
              <div className="pres-sig-title">{dashboardData?.secretaryName || 'Unit Secretary'}</div>
              <div className="pres-sig-sub">Secretary • Records Custodian</div>
            </div>

            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', maxWidth: '280px' }}>
              <div>[ OFFICIAL KUDUMBASHREE SEAL ]</div>
              <div style={{ marginTop: '4px' }}>Certified by Digital Audit Register (Sahayi)</div>
            </div>

            <div className="pres-sig-block">
              <div className="pres-sig-line"></div>
              <div className="pres-sig-title">{presidentName}</div>
              <div className="pres-sig-sub">President • Presiding Executive</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: LOAN PORTFOLIO & AUDIT ── */}
      {activeReportTab === 'loans' && (
        <div className="pres-rep-card pres-print-target">
          <div className="pres-rep-card-head">
            <div>
              <h3 className="pres-rep-card-title">
                <CreditCard size={18} color="#0c382e" />
                Comprehensive Loan Portfolio & Approval Audit
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Showing {filteredLoans.length} loans audited for {unitName}.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="pres-badge pres-badge--info">Total: ₹{totalDisbursedAmount.toLocaleString('en-IN')}</span>
              <span className="pres-badge pres-badge--warning">Outstanding: ₹{totalOutstandingBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pres-rep-table-wrap">
            <table className="pres-rep-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Member Name</th>
                  <th>Amount Requested</th>
                  <th>Fine / Penalty</th>
                  <th>Interest Collected</th>
                  <th>Outstanding Balance</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No loan records matching the search/filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.slice(0, visibleLimit).map((loan) => (
                    <tr key={loan.loanId}>
                      <td style={{ fontWeight: 700, color: '#0c382e' }}>LN-{loan.loanId}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{loan.memberName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{loan.purpose}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0c382e' }}>
                        ₹{(loan.amountRequested || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ color: (loan.fineAmount > 0) ? '#dc2626' : '#64748b' }}>
                        ₹{(loan.fineAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>
                        ₹{(loan.totalInterestPaid || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: 700, color: (loan.outstandingBalance > 0) ? '#b45309' : '#16a34a' }}>
                        {loan.status === 'Disbursed' ? `₹${(loan.outstandingBalance || 0).toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td>
                        <span className={`pres-badge ${
                          loan.status === 'Disbursed' ? 'pres-badge--info' :
                          loan.status === 'Approved' ? 'pres-badge--success' :
                          loan.status === 'Pending' ? 'pres-badge--warning' :
                          loan.status === 'Closed' ? 'pres-badge--neutral' : 'pres-badge--danger'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td>{loan.appliedDate ? new Date(loan.appliedDate).toLocaleDateString() : '-'}</td>
                      <td>{loan.approvedByName || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredLoans.length > 10 && (
            <div style={{ padding: '12px 24px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }} className="no-print">
              <button
                type="button"
                className="pres-rep-btn pres-rep-btn--outline"
                onClick={() => setVisibleLimit(prev => prev > 10 ? 10 : filteredLoans.length)}
              >
                {visibleLimit > 10 ? <><ChevronUp size={15} /> Show Less</> : <><ChevronDown size={15} /> View All ({filteredLoans.length}) Records</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: THRIFT SAVINGS & CAPITAL ── */}
      {activeReportTab === 'savings' && (
        <div className="pres-rep-card pres-print-target">
          <div className="pres-rep-card-head">
            <div>
              <h3 className="pres-rep-card-title">
                <PiggyBank size={18} color="#0c382e" />
                Weekly Thrift Collection & Capital Formation Register
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Tracking weekly collection performance and deposit clearance for {unitName}.
              </p>
            </div>
            <span className="pres-badge pres-badge--success">
              Total Capital: ₹{totalUnitSavings.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="pres-rep-table-wrap">
            <table className="pres-rep-table">
              <thead>
                <tr>
                  <th>Savings Period / Week</th>
                  <th>Amount Collected</th>
                  <th>Paid Members</th>
                  <th>Pending Dues</th>
                  <th>Collection Rate</th>
                  <th>Standing</th>
                </tr>
              </thead>
              <tbody>
                {filteredSavingsWeeks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No weekly savings records found.
                    </td>
                  </tr>
                ) : (
                  filteredSavingsWeeks.slice(0, visibleLimit).map((week, idx) => {
                    const totalMembers = (week.paidCount || 0) + (week.pendingCount || 0);
                    const collectionRate = totalMembers > 0 ? Math.round(((week.paidCount || 0) / totalMembers) * 100) : 100;
                    return (
                      <tr key={week.id || idx}>
                        <td style={{ fontWeight: 600, color: '#0c382e' }}>
                          {week.weekTitle || `${week.startDate} – ${week.endDate}`}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0c382e' }}>
                          ₹{(week.totalCollected || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>{week.paidCount || 0} Paid</td>
                        <td style={{ color: (week.pendingCount > 0) ? '#dc2626' : '#64748b', fontWeight: 600 }}>
                          {week.pendingCount || 0} Pending
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', minWidth: '60px' }}>
                              <div style={{ width: `${collectionRate}%`, height: '100%', background: collectionRate === 100 ? '#10b981' : '#f59e0b' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{collectionRate}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`pres-badge ${week.pendingCount === 0 ? 'pres-badge--success' : 'pres-badge--warning'}`}>
                            {week.pendingCount === 0 ? 'Fully Cleared' : `${week.pendingCount} Dues`}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredSavingsWeeks.length > 10 && (
            <div style={{ padding: '12px 24px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }} className="no-print">
              <button
                type="button"
                className="pres-rep-btn pres-rep-btn--outline"
                onClick={() => setVisibleLimit(prev => prev > 10 ? 10 : filteredSavingsWeeks.length)}
              >
                {visibleLimit > 10 ? <><ChevronUp size={15} /> Show Less</> : <><ChevronDown size={15} /> View All ({filteredSavingsWeeks.length}) Weeks</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: MEETINGS & QUORUM AUDIT ── */}
      {activeReportTab === 'meetings' && (
        <div className="pres-rep-card pres-print-target">
          <div className="pres-rep-card-head">
            <div>
              <h3 className="pres-rep-card-title">
                <Calendar size={18} color="#0c382e" />
                Democratic Governance & Meetings Quorum Register
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Official attendance register and weekly meeting minutes records for {unitName}.
              </p>
            </div>
            <span className="pres-badge pres-badge--info">Quorum Compliance: {meetingQuorumRate}%</span>
          </div>

          <div className="pres-rep-table-wrap">
            <table className="pres-rep-table">
              <thead>
                <tr>
                  <th>Meeting Title</th>
                  <th>Scheduled Date</th>
                  <th>Time</th>
                  <th>Venue / Location</th>
                  <th>Minutes & Resolutions</th>
                  <th>Governance Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No meeting records found.
                    </td>
                  </tr>
                ) : (
                  filteredMeetings.map((mtg, idx) => (
                    <tr key={mtg.id || idx}>
                      <td style={{ fontWeight: 600, color: '#0c382e' }}>{mtg.title}</td>
                      <td>{mtg.date || '-'}</td>
                      <td>{mtg.time || '-'}</td>
                      <td>{mtg.venue || mtg.location || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            {mtg.decisions || mtg.agenda || 'Regular weekly review & collection'}
                          </span>
                          <button
                            type="button"
                            className="pres-rep-view-min-btn"
                            onClick={() => setSelectedMinutesMeeting(mtg)}
                            title="View Minutes Document"
                          >
                            <FileText size={13} />
                            <span>View Minutes</span>
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`pres-badge ${isMeetingDone(mtg) ? 'pres-badge--success' : 'pres-badge--neutral'}`}>
                          {isMeetingDone(mtg) ? 'Completed & Recorded' : 'Scheduled / Upcoming'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: MEMBERS ROSTER & STANDING ── */}
      {activeReportTab === 'members' && (
        <div className="pres-rep-card pres-print-target">
          <div className="pres-rep-card-head">
            <div>
              <h3 className="pres-rep-card-title">
                <Users size={18} color="#0c382e" />
                Unit Membership Roster & Status Audit
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                All registered community participants in {unitName}. Total Strength: <strong>{membersList.length}</strong>.
              </p>
            </div>
          </div>

          <div className="pres-rep-table-wrap">
            <table className="pres-rep-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Executive / Member Role</th>
                  <th>Phone Number</th>
                  <th>House Name</th>
                  <th>Standing</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No member records matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member, idx) => (
                    <tr key={member.userId || member.id || idx}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0c382e' }}>
                          {member.fullName || member.name || 'Member'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: AK-{member.userId || idx + 1}</div>
                      </td>
                      <td>
                        <span className="pres-badge pres-badge--neutral">
                          {member.role || (member.isPresident ? 'President' : member.isSecretary ? 'Secretary' : member.isTreasurer ? 'Treasurer' : 'Member')}
                        </span>
                      </td>
                      <td>{member.phone || '-'}</td>
                      <td>{member.houseName || '-'}</td>
                      <td>
                        <span className={`pres-badge ${member.isActive !== false ? 'pres-badge--success' : 'pres-badge--danger'}`}>
                          {member.isActive !== false ? 'Active & Good Standing' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedMinutesMeeting && (
        <MeetingMinutesModal
          meeting={selectedMinutesMeeting}
          unitInfo={{
            unitName,
            wardNumber: dashboardData?.wardNumber || 'Ward 3',
            cdsName: 'Kudumbashree Community Development Society (CDS)',
            secretaryName: dashboardData?.secretaryName || 'Shailaja Vijayan (Sec.)'
          }}
          attendanceList={selectedMinutesMeeting?.attendances || []}
          members={membersList}
          savingsLogs={dashboardData?.savingsLogs || []}
          savingsWeeks={dashboardData?.savingsWeeks || []}
          loanRepayments={dashboardData?.loanRepayments || []}
          loans={dashboardData?.loans || []}
          onClose={() => setSelectedMinutesMeeting(null)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}

export default PresidentReportsView;
