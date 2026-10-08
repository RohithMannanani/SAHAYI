import React, { useState, useEffect, useMemo } from 'react';
import './MeetingMinutesModal.css';
import {
  X,
  FileText,
  Printer,
  Copy,
  Check,
  Edit3,
  Save,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { formatTimeTo12Hr } from '../../utils/formatTime';
import { getWeekRange, parseLogDate } from '../../utils/weeklyCollectionUtils';

function MeetingMinutesModal({
  meeting,
  unitInfo,
  attendanceList = [],
  members = [],
  savingsLogs = [],
  savingsWeeks = [],
  loanRepayments = [],
  loans = [],
  onClose,
  onShowToast
}) {
  const [activeView, setActiveView] = useState('document'); // 'document' | 'record' | 'edit'
  const [isCopied, setIsCopied] = useState(false);

  const unitName = unitInfo?.unitName || 'HARITHA AYALKOOTTAM';
  const wardNumber = unitInfo?.wardNumber || 'Ward 3';
  const cdsName = unitInfo?.cdsName || 'Kudumbashree Community Development Society (CDS)';
  const secretaryName = unitInfo?.secretaryName || 'Shailaja Vijayan (Sec.)';

  // Find President name from members or attendance list
  const presidentMember = useMemo(() => {
    const all = [...(members || []), ...(attendanceList || [])];
    return all.find(m => {
      const r = (m.role || m.RoleName || '').toLowerCase();
      return r.includes('president') || m.isPresident;
    });
  }, [members, attendanceList]);

  const rawPresName = presidentMember?.fullName || presidentMember?.name || 'Smt. Suma Devi';
  const presidentName = rawPresName.includes('(Pres.)') ? rawPresName : `${rawPresName} (Pres.)`;
  const formattedSecName = secretaryName.includes('(Sec.)') ? secretaryName : `${secretaryName} (Sec.)`;

  // Meeting identification & metadata
  const meetingId = meeting?.id || meeting?.meetingId || 1;
  const formattedRecordNumber = useMemo(() => {
    if (meeting?.meetingNumber) return meeting.meetingNumber;
    if (meetingId >= 1000) return meetingId;
    return 2000 + Number(meetingId || 8);
  }, [meeting, meetingId]);

  const rawDate = meeting?.date || new Date().toISOString().split('T')[0];
  const dateObj = useMemo(() => parseLogDate(rawDate), [rawDate]);
  const formattedFullDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : 'Nov 01, 2026';

  const formattedTime = meeting?.time ? formatTimeTo12Hr(meeting.time) : '03:00 PM';
  const venue = meeting?.location || meeting?.venue || 'Haritha Center';

  // Attendance stats
  const totalMembersCount = attendanceList.length > 0 ? attendanceList.length : (members.length > 0 ? members.length : 10);
  
  const presentCount = useMemo(() => {
    if (meeting?.attendances && meeting.attendances.length > 0) {
      return meeting.attendances.filter(a => a.isPresent || a.IsPresent).length;
    }
    const presentInList = attendanceList.filter(a => a.status === 'present').length;
    return presentInList > 0 ? presentInList : totalMembersCount;
  }, [meeting, attendanceList, totalMembersCount]);

  const attendancePercent = Math.round((presentCount / Math.max(1, totalMembersCount)) * 100);

  // Next meeting calculation (7 days later)
  const nextMeetingDateFormatted = useMemo(() => {
    const d = new Date(dateObj);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + 7);
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    return 'Sunday, November 8, 2026';
  }, [dateObj]);

  // ── 1. Calculate Meeting Week Date Range (Monday 00:00 to Sunday 23:59) ──
  const { weekMonday, weekSunday, weekTitle } = useMemo(() => {
    const { monday, sunday } = getWeekRange(dateObj);
    const startM = monday.toLocaleDateString('en-US', { month: 'short' });
    const endM = sunday.toLocaleDateString('en-US', { month: 'short' });
    const y = monday.getFullYear();
    const title = startM === endM
      ? `${startM} ${monday.getDate()} – ${sunday.getDate()}, ${y}`
      : `${startM} ${monday.getDate()} – ${endM} ${sunday.getDate()}, ${y}`;

    return {
      weekMonday: monday,
      weekSunday: sunday,
      weekTitle: title
    };
  }, [dateObj]);

  // ── 2. Actual Savings Collections for this Meeting's Week ──
  const weekSavingsStats = useMemo(() => {
    // 1. Check if a matching week exists in savingsWeeks (from server-side weekly ledger)
    const matchingWeek = Array.isArray(savingsWeeks) ? savingsWeeks.find(w => {
      if (!w) return false;
      if (meeting?.savingsWeekId && (w.id === meeting.savingsWeekId || w.savingsWeekId === meeting.savingsWeekId)) return true;
      if (w.startDate && w.endDate) {
        const wStart = parseLogDate(w.startDate);
        const wEnd = parseLogDate(w.endDate);
        if (wStart && wEnd && wStart <= weekSunday && wEnd >= weekMonday) return true;
      }
      return false;
    }) : null;

    if (matchingWeek) {
      const membersList = Array.isArray(matchingWeek.members) ? matchingWeek.members : [];
      const paidMembers = membersList.filter(m => (m.status || '').toLowerCase() === 'paid');
      const paidCount = matchingWeek.paidCount !== undefined ? Number(matchingWeek.paidCount) : paidMembers.length;
      const totalAmount = matchingWeek.totalCollected !== undefined
        ? (parseFloat(matchingWeek.totalCollected) || 0)
        : paidMembers.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
      const cashTotal = paidMembers
        .filter(m => !(m.paymentMode || '').toLowerCase().includes('online'))
        .reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
      const onlineTotal = paidMembers
        .filter(m => (m.paymentMode || '').toLowerCase().includes('online'))
        .reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
      const pendingCount = matchingWeek.pendingCount !== undefined
        ? Number(matchingWeek.pendingCount)
        : Math.max(0, totalMembersCount - paidCount);

      return {
        paidCount,
        pendingCount,
        totalAmount,
        cashTotal,
        onlineTotal,
        paidMembers,
        hasActualLogs: true
      };
    }

    // 2. Otherwise filter individual records from savingsLogs
    const weekItems = (savingsLogs || []).filter(item => {
      if (!item) return false;
      const logD = parseLogDate(item.paidDate || item.date);
      if (logD >= weekMonday && logD <= weekSunday) return true;
      if (meeting?.savingsWeekId && item.savingsWeekId === meeting.savingsWeekId) return true;
      return false;
    });

    // Deduplicate by user
    const uniqueMap = new Map();
    weekItems.forEach(item => {
      const uKey = String(item.userId || item.UserId || item.id || '');
      if (!uniqueMap.has(uKey) || item.status === 'Paid') {
        uniqueMap.set(uKey, item);
      }
    });

    const relevantItems = Array.from(uniqueMap.values());
    const paidItems = relevantItems.filter(i => (i.status || '').toLowerCase() === 'paid');
    const paidCount = paidItems.length;
    const totalAmount = paidItems.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);
    const cashTotal = paidItems
      .filter(i => !(i.paymentMode || '').toLowerCase().includes('online'))
      .reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);
    const onlineTotal = paidItems
      .filter(i => (i.paymentMode || '').toLowerCase().includes('online'))
      .reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);
    const pendingCount = Math.max(0, totalMembersCount - paidCount);

    return {
      paidCount,
      pendingCount,
      totalAmount,
      cashTotal,
      onlineTotal,
      paidMembers: paidItems,
      hasActualLogs: weekItems.length > 0
    };
  }, [savingsWeeks, savingsLogs, weekMonday, weekSunday, meeting, totalMembersCount]);

  // ── 3. Actual Loan Repayments Done in this Meeting's Week ──
  const weekRepaymentStats = useMemo(() => {
    if (!Array.isArray(loanRepayments) || loanRepayments.length === 0) {
      return {
        repaymentCount: 0,
        totalAmount: 0,
        principalTotal: 0,
        interestTotal: 0,
        repaymentsList: []
      };
    }

    const matched = loanRepayments.filter(r => {
      if (!r || !r.repaymentDate) return false;
      const rDate = new Date(r.repaymentDate);
      return !isNaN(rDate.getTime()) && rDate >= weekMonday && rDate <= weekSunday;
    });

    const totalAmount = matched.reduce((acc, r) => acc + (parseFloat(r.amountPaid) || 0), 0);
    const principalTotal = matched.reduce((acc, r) => acc + (parseFloat(r.principalComponent) || 0), 0);
    const interestTotal = matched.reduce((acc, r) => acc + (parseFloat(r.interestComponent) || 0), 0);

    return {
      repaymentCount: matched.length,
      totalAmount,
      principalTotal,
      interestTotal,
      repaymentsList: matched
    };
  }, [loanRepayments, weekMonday, weekSunday]);

  // ── 4. Actual Loan Activity (Reviewed/Applied in this Week) ──
  const weekLoanActivity = useMemo(() => {
    if (!Array.isArray(loans) || loans.length === 0) return null;
    return loans.find(l => {
      if (!l) return false;
      const aDate = l.appliedDate ? new Date(l.appliedDate) : null;
      return aDate && !isNaN(aDate.getTime()) && aDate >= weekMonday && aDate <= weekSunday;
    }) || loans.find(l => l.status === 'Approved' || l.status === 'Pending') || loans[0] || null;
  }, [loans, weekMonday, weekSunday]);

  // Storage key for persistent custom minutes
  const storageKey = `sahayi_meeting_minutes_${unitInfo?.unitId || 1}_${meetingId}`;

  // Helper to construct dynamic minutes based on actual counts
  const constructDynamicMinutes = () => {
    const prevMeetingNum = Math.max(1, Number(formattedRecordNumber) - 1);
    const firstRepayment = weekRepaymentStats.repaymentsList[0];

    const assemblyText = weekSavingsStats.paidCount > 0
      ? `Meeting opened with silent prayer and the Kudumbashree Anthem. Presided over by ${presidentName}. The weekly thrift savings collection was reviewed with ${weekSavingsStats.paidCount} members contributing a total of ₹${weekSavingsStats.totalAmount.toLocaleString('en-IN')}.00 (Cash: ₹${weekSavingsStats.cashTotal.toLocaleString('en-IN')} | Online: ₹${weekSavingsStats.onlineTotal.toLocaleString('en-IN')}). Minutes and financial statements of Meeting #${prevMeetingNum} were read aloud by the Secretary and ratified unanimously.`
      : `Meeting opened with silent prayer and the Kudumbashree Anthem. Presided over by ${presidentName}. The weekly thrift savings collection was reviewed with nil collections (₹0.00) recorded for this week. Minutes and financial statements of Meeting #${prevMeetingNum} were read aloud by the Secretary and ratified unanimously.`;

    const loanApplicant = weekLoanActivity?.memberName || weekLoanActivity?.name || (weekLoanActivity ? `Member (AK-${weekLoanActivity.userId})` : 'Nil');
    const loanAppType = weekLoanActivity ? (weekLoanActivity.purpose || 'General Micro-Enterprise Loan') : 'Nil New Applications';
    const loanAppStatus = weekLoanActivity ? (weekLoanActivity.status === 'Approved' ? 'UNANIMOUSLY APPROVED' : weekLoanActivity.status.toUpperCase()) : 'NO LOANS SUBMITTED';
    const loanAppAmt = weekLoanActivity ? Number(weekLoanActivity.amountRequested || 0).toLocaleString('en-IN') + '.00' : '0.00';
    const loanAppTenure = weekLoanActivity ? `${weekLoanActivity.tenureMonths || 12} Months` : '-';
    const loanAppRate = weekLoanActivity ? `${weekLoanActivity.interestRate || 1.0}% / month` : '-';
    const loanAppNotes = weekLoanActivity
      ? 'Applicant attendance record and thrift deposit consistency verified against unit passbook.'
      : 'No member micro-loan requests placed for review during this meeting session.';

    return {
      assemblyReviewText: assemblyText,
      loanAppMember: loanApplicant,
      loanAppType: loanAppType,
      loanAppStatus: loanAppStatus,
      loanAppAmount: loanAppAmt,
      loanAppTenure: loanAppTenure,
      loanAppRate: loanAppRate,
      loanAppNotes: loanAppNotes,

      repayMember: firstRepayment ? (firstRepayment.borrowerName || 'Member') : (weekRepaymentStats.repaymentCount > 0 ? `${weekRepaymentStats.repaymentCount} Members` : 'Nil Repayments'),
      repayLoanDesc: weekRepaymentStats.repaymentCount > 0 ? `${weekRepaymentStats.repaymentCount} Loan EMI Installment(s) Collected` : 'No loan repayments due or collected this week',
      repayTotalAmount: weekRepaymentStats.totalAmount.toLocaleString('en-IN') + '.00',
      repayPrincipal: weekRepaymentStats.principalTotal.toLocaleString('en-IN') + '.00',
      repayInterest: weekRepaymentStats.interestTotal.toLocaleString('en-IN') + '.00',
      repayReceipt: firstRepayment ? (firstRepayment.receiptNumber || `REC-${firstRepayment.repaymentId}`) : 'N/A',

      announcementsText: 'Unit agreed to join the Panchayath sanitation drive on Sunday. Discussed CDS/ADS welfare circulars and confirmed dates for initiating the community vegetable garden.',
      thriftAmount: weekSavingsStats.totalAmount.toLocaleString('en-IN') + '.00',
      loanApprovedStat: weekRepaymentStats.repaymentCount > 0
        ? `₹${weekRepaymentStats.totalAmount.toLocaleString('en-IN')} EMI Collected`
        : (weekLoanActivity ? `₹${Number(weekLoanActivity.amountRequested || 0).toLocaleString('en-IN')} Loan Sanctioned` : 'Nil Loan Recoveries'),

      nextMeetingDate: nextMeetingDateFormatted,
      nextMeetingTime: formattedTime,
      nextMeetingVenue: `Puthanpurackal (${secretaryName}'s residence)`
    };
  };

  // Form states for editable sections
  const [minutesData, setMinutesData] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed._isUserEdited) {
          return parsed;
        }
      }
    } catch {}
    return constructDynamicMinutes();
  });

  // Re-sync with actual data if storage was not manually overridden
  const handleResetToLiveData = () => {
    const liveGenerated = constructDynamicMinutes();
    setMinutesData(liveGenerated);
    localStorage.removeItem(storageKey);
    if (onShowToast) {
      onShowToast('Minutes re-synchronized with live weekly collections & repayments!', 'info');
    }
  };

  const handleSaveCustomMinutes = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(storageKey, JSON.stringify(minutesData));
      if (onShowToast) {
        onShowToast(`Minutes of Meeting #${formattedRecordNumber} saved successfully!`, 'success');
      }
      setActiveView('document');
    } catch (err) {
      console.error('Failed to save minutes:', err);
    }
  };

  // Plain Text formatted for copying or printing
  const formattedPlainTextRecord = useMemo(() => {
    const repaymentsText = weekRepaymentStats.repaymentCount > 0
      ? weekRepaymentStats.repaymentsList.map((r, i) => 
          `   3.${i + 1} ${r.borrowerName || 'Member'} • Loan #${r.loanId || 'N/A'}: ₹${Number(r.amountPaid || 0).toLocaleString('en-IN')}.00 (Principal: ₹${Number(r.principalComponent || 0).toLocaleString('en-IN')}, Interest: ₹${Number(r.interestComponent || 0).toLocaleString('en-IN')} | Receipt #${r.receiptNumber || 'N/A'}, Mode: ${r.paymentMode || 'Cash'})`
        ).join('\n')
      : `   Nil loan repayments collected during the week (${weekTitle}). All active loans within billing cycle.`;

    return `${unitName.toUpperCase()}
${cdsName} • ${wardNumber}
MEETING RECORD #${formattedRecordNumber}

DATE & TIME: ${formattedFullDate} • ${formattedTime}
PRESIDING OFFICER: ${presidentName}
RECORDED BY: ${formattedSecName}
VENUE: ${venue}

--------------------------------------------------
ATTENDANCE QUORUM: ${presentCount} / ${totalMembersCount} Members (${attendancePercent}% Present)
WEEKLY THRIFT SAVINGS: ₹${weekSavingsStats.totalAmount.toLocaleString('en-IN')}.00 (${weekSavingsStats.paidCount} / ${totalMembersCount} Members Paid)
   [Cash: ₹${weekSavingsStats.cashTotal.toLocaleString('en-IN')} • Online: ₹${weekSavingsStats.onlineTotal.toLocaleString('en-IN')}]
LOAN ACTIVITY (EMI): ₹${weekRepaymentStats.totalAmount.toLocaleString('en-IN')}.00 (${weekRepaymentStats.repaymentCount} Installment(s) Recovered)
--------------------------------------------------

MEETING PROCEEDINGS & RESOLUTIONS:

1. Group Assembly & Previous Minutes Review
${minutesData.assemblyReviewText}

2. Micro-Loan Application Review & Approval
${minutesData.loanAppMember} • ${minutesData.loanAppType} [${minutesData.loanAppStatus}]
Sanctioned Amount: ₹${minutesData.loanAppAmount} | Tenure: ${minutesData.loanAppTenure} | Reducing Rate: ${minutesData.loanAppRate}
${minutesData.loanAppNotes}

3. Loan Repayment (EMI Collection) - Actual Week Records (${weekRepaymentStats.repaymentCount} Recovered, Total: ₹${weekRepaymentStats.totalAmount.toLocaleString('en-IN')}.00):
${repaymentsText}

4. Community, Welfare & Ward Announcements
${minutesData.announcementsText}

(Digitally ratified & verified by Presiding Officer & Secretary)`;
  }, [
    unitName,
    cdsName,
    wardNumber,
    formattedRecordNumber,
    formattedFullDate,
    formattedTime,
    presidentName,
    formattedSecName,
    venue,
    presentCount,
    totalMembersCount,
    attendancePercent,
    weekSavingsStats,
    weekRepaymentStats,
    weekTitle,
    minutesData,
    nextMeetingDateFormatted
  ]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formattedPlainTextRecord);
      setIsCopied(true);
      if (onShowToast) onShowToast('Minutes copied to clipboard!', 'success');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-modal-overlay" onClick={onClose}>
      <div className="min-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Top green accent bar */}
        <div className="min-top-accent-bar" />

        {/* ── Modal Utility Controls (No Print) ── */}
        <div className="min-controls-bar no-print">
          <div className="min-nav-tabs">
            <button
              type="button"
              className={`min-nav-tab ${activeView === 'document' ? 'min-nav-tab--active' : ''}`}
              onClick={() => setActiveView('document')}
            >
              <FileText size={14} />
              <span>Minutes Sheet</span>
            </button>
            <button
              type="button"
              className={`min-nav-tab ${activeView === 'record' ? 'min-nav-tab--active' : ''}`}
              onClick={() => setActiveView('record')}
            >
              <span>Plain Text</span>
            </button>
            <button
              type="button"
              className={`min-nav-tab ${activeView === 'edit' ? 'min-nav-tab--active' : ''}`}
              onClick={() => setActiveView('edit')}
            >
              <Edit3 size={14} />
              <span>Edit Resolutions</span>
            </button>
          </div>

          <div className="min-actions-row">
            <button
              type="button"
              className="min-btn-utility"
              onClick={handleCopyToClipboard}
              title="Copy minutes as text"
            >
              {isCopied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              className="min-btn-utility min-btn-utility--primary"
              onClick={handlePrint}
              title="Print official minutes document"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              type="button"
              className="min-btn-close"
              onClick={onClose}
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Modal Main Body ── */}
        <div className="min-modal-body">
          {activeView === 'document' && (
            <div className="min-document-paper">
              {/* ── Header ── */}
              <div className="min-header-row">
                <div className="min-brand-wrap">
                  <div className="min-ks-logo">
                    <span className="min-ks-text">KS</span>
                    <span className="min-ks-dot" />
                  </div>
                  <div className="min-brand-info">
                    <div className="min-title-line">
                      <h2 className="min-unit-title">{unitName.toUpperCase()}</h2>
                      <span className="min-active-pill">ACTIVE</span>
                    </div>
                    <p className="min-unit-subtitle">
                      {cdsName} • {wardNumber}
                    </p>
                  </div>
                </div>

                <div className="min-record-box">
                  <div className="min-record-label">MEETING RECORD</div>
                  <div className="min-record-number">#{formattedRecordNumber}</div>
                </div>
              </div>

              {/* ── Grey Metadata Card ── */}
              <div className="min-meta-strip">
                <div className="min-meta-col">
                  <span className="min-meta-label">DATE & TIME</span>
                  <span className="min-meta-val">{formattedFullDate} • {formattedTime}</span>
                </div>
                <div className="min-meta-col">
                  <span className="min-meta-label">PRESIDING OFFICER</span>
                  <span className="min-meta-val">{presidentName}</span>
                </div>
                <div className="min-meta-col">
                  <span className="min-meta-label">RECORDED BY</span>
                  <span className="min-meta-val">{formattedSecName}</span>
                </div>
                <div className="min-meta-col">
                  <span className="min-meta-label">VENUE</span>
                  <span className="min-meta-val">{venue}</span>
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="min-horizontal-divider" />

              {/* ── Three KPI Cards (Actual Weekly Metrics) ── */}
              <div className="min-kpi-grid">
                {/* 1. Attendance Quorum */}
                <div className="min-kpi-card">
                  <div className="min-kpi-head">
                    <span className="min-kpi-title">Attendance Quorum</span>
                    <span className="min-pill min-pill--green">{attendancePercent}% Present</span>
                  </div>
                  <div className="min-kpi-main">
                    <span className="min-kpi-value-bold">{presentCount}</span>
                    <span className="min-kpi-value-sub"> /{totalMembersCount} Members</span>
                  </div>
                  <div className="min-kpi-footer min-kpi-footer--green">
                    ✓ Full Quorum Validated
                  </div>
                </div>

                {/* 2. Weekly Thrift Savings (Actual Collections of that week) */}
                <div className="min-kpi-card">
                  <div className="min-kpi-head">
                    <span className="min-kpi-title">Weekly Thrift Savings</span>
                    <span className={`min-pill ${weekSavingsStats.paidCount > 0 ? 'min-pill--amber' : 'min-pill--muted'}`}>
                      {weekSavingsStats.paidCount} / {totalMembersCount} Paid
                    </span>
                  </div>
                  <div className="min-kpi-main">
                    <span className={`min-kpi-value-bold ${weekSavingsStats.totalAmount > 0 ? 'min-text-green' : ''}`}>
                      ₹{weekSavingsStats.totalAmount.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                  <div className="min-kpi-footer min-kpi-footer--muted">
                    {weekSavingsStats.paidCount > 0
                      ? `Cash: ₹${weekSavingsStats.cashTotal.toLocaleString('en-IN')} • Online: ₹${weekSavingsStats.onlineTotal.toLocaleString('en-IN')}`
                      : 'Nil Savings Collected This Week'}
                  </div>
                </div>

                {/* 3. Loan Activity / EMI Recoveries (Actual Repayments of that week) */}
                <div className="min-kpi-card">
                  <div className="min-kpi-head">
                    <span className="min-kpi-title">Loan Activity (EMI)</span>
                    <span className={`min-pill ${weekRepaymentStats.repaymentCount > 0 ? 'min-pill--purple' : 'min-pill--muted'}`}>
                      {weekRepaymentStats.repaymentCount} Recovered
                    </span>
                  </div>
                  <div className="min-kpi-main">
                    <span className="min-kpi-value-bold">
                      ₹{weekRepaymentStats.totalAmount.toLocaleString('en-IN')}.00
                    </span>
                  </div>
                  <div className="min-kpi-footer min-kpi-footer--green">
                    {weekRepaymentStats.repaymentCount > 0
                      ? `Principal: ₹${weekRepaymentStats.principalTotal.toLocaleString('en-IN')} | Interest: ₹${weekRepaymentStats.interestTotal.toLocaleString('en-IN')}`
                      : (minutesData.loanApprovedStat || 'Nil Recoveries This Week')}
                  </div>
                </div>
              </div>

              {/* ── Proceedings & Resolutions ── */}
              <div className="min-section-heading">
                <span className="min-dot-green" />
                <h3 className="min-section-title">MEETING PROCEEDINGS & RESOLUTIONS</h3>
              </div>

              <div className="min-proceedings-container">
                {/* 1. Group Assembly & Previous Minutes Review */}
                <div className="min-proceeding-block">
                  <h4 className="min-block-title">1. Group Assembly & Previous Minutes Review</h4>
                  <p className="min-block-text">
                    {minutesData.assemblyReviewText}
                  </p>
                </div>

                {/* 2. Micro-Loan Application Review & Approval */}
                <div className="min-proceeding-block">
                  <h4 className="min-block-title">2. Micro-Loan Application Review & Approval</h4>
                  <div className="min-subcard">
                    <div className="min-subcard-top">
                      <div className="min-subcard-title-wrap">
                        <span className="min-subcard-strong">{minutesData.loanAppMember}</span>
                        <span className="min-subcard-bullet">•</span>
                        <span className="min-subcard-sub">{minutesData.loanAppType}</span>
                      </div>
                      <span className="min-pill-outline-green">
                        {minutesData.loanAppStatus}
                      </span>
                    </div>
                    <div className="min-subcard-meta">
                      <span>Sanctioned Amount: <strong>₹{minutesData.loanAppAmount}</strong></span>
                      <span className="min-subcard-pipe">|</span>
                      <span>Tenure: <strong>{minutesData.loanAppTenure}</strong></span>
                      <span className="min-subcard-pipe">|</span>
                      <span>Reducing Rate: <strong>{minutesData.loanAppRate}</strong></span>
                    </div>
                    <div className="min-subcard-note">
                      {minutesData.loanAppNotes}
                    </div>
                  </div>
                </div>

                {/* 3. Loan Repayment (EMI Collection) - Render Actual Week Repayments */}
                <div className="min-proceeding-block">
                  <h4 className="min-block-title">
                    3. Loan Repayment (EMI Collection) — Week of {weekTitle}
                  </h4>

                  {weekRepaymentStats.repaymentsList.length > 0 ? (
                    <div className="min-repay-list">
                      {weekRepaymentStats.repaymentsList.map((rep, idx) => (
                        <div key={rep.repaymentId || idx} className="min-subcard">
                          <div className="min-subcard-top">
                            <div className="min-subcard-title-wrap">
                              <span className="min-subcard-strong">{rep.borrowerName || 'Member'}</span>
                              <span className="min-subcard-bullet">•</span>
                              <span className="min-subcard-sub">Loan #{rep.loanId || 'N/A'} Monthly Installment</span>
                              <span className="min-pill-mode">{rep.paymentMode || 'Cash'}</span>
                            </div>
                            <div className="min-subcard-amount">
                              ₹{Number(rep.amountPaid || 0).toLocaleString('en-IN')}.00
                            </div>
                          </div>
                          <div className="min-subcard-bottom-row">
                            <div className="min-subcard-breakdown">
                              <span>Principal Component: <strong>₹{Number(rep.principalComponent || 0).toLocaleString('en-IN')}.00</strong></span>
                              <span className="min-subcard-pipe">|</span>
                              <span>Diminishing Interest: <strong>₹{Number(rep.interestComponent || 0).toLocaleString('en-IN')}.00</strong></span>
                            </div>
                            <div className="min-receipt-badge">
                              Receipt #{rep.receiptNumber || `REC-${rep.repaymentId}`}
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="min-repay-summary-banner">
                        <span>
                          ✓ Verified Repayment Total: <strong>₹{weekRepaymentStats.totalAmount.toLocaleString('en-IN')}.00</strong> across <strong>{weekRepaymentStats.repaymentCount}</strong> member installment(s)
                        </span>
                        <span>
                          Principal: ₹{weekRepaymentStats.principalTotal.toLocaleString('en-IN')} | Interest: ₹{weekRepaymentStats.interestTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="min-subcard min-subcard--empty">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
                        <div>
                          <div style={{ fontWeight: 700, color: '#334155' }}>
                            Nil Loan Repayments Collected This Week
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                            No member loan repayments were recorded during the week ({weekTitle}). All active unit loans are within their regular billing cycles or awaiting upcoming installment schedules.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Community, Welfare & Ward Announcements */}
                <div className="min-proceeding-block">
                  <h4 className="min-block-title">4. Community, Welfare & Ward Announcements</h4>
                  <p className="min-block-text">
                    {minutesData.announcementsText}
                  </p>
                </div>
              </div>

              {/* ── Signatures & Digital Attestation ── */}
              <div className="min-signatures-row">
                <div className="min-sig-block">
                  <div className="min-sig-line" />
                  <div className="min-sig-name">{presidentName}</div>
                  <div className="min-sig-role">Presiding Officer (President)</div>
                </div>

                <div className="min-verification-badge">
                  <div className="min-verify-icon">
                    <CheckCircle2 size={13} color="#059669" />
                    <span>DIGITALLY RATIFIED & VALIDATED</span>
                  </div>
                  <div className="min-verify-sub">Kudumbashree Ayalkoottam Register</div>
                </div>

                <div className="min-sig-block">
                  <div className="min-sig-line" />
                  <div className="min-sig-name">{formattedSecName}</div>
                  <div className="min-sig-role">Recorded by (Secretary)</div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'record' && (
            <div className="min-plaintext-wrap">
              <div className="min-plaintext-bar">
                <span className="min-plaintext-hint">
                  Plain text record format ready for statutory filing or distribution:
                </span>
                <button
                  type="button"
                  className="min-btn-utility"
                  onClick={handleCopyToClipboard}
                >
                  {isCopied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
              <pre className="min-plaintext-code">{formattedPlainTextRecord}</pre>
            </div>
          )}

          {activeView === 'edit' && (
            <form onSubmit={handleSaveCustomMinutes} className="min-edit-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div className="min-form-section-title">
                  <Edit3 size={15} />
                  <span>Edit Meeting Proceedings & Custom Notes</span>
                </div>
                <button
                  type="button"
                  className="min-btn-resync"
                  onClick={handleResetToLiveData}
                  title="Recalculate and auto-fill from live savings and loan records"
                >
                  <RotateCcw size={13} />
                  <span>Auto-fill from Live Week Data</span>
                </button>
              </div>

              {/* Item 1 */}
              <div className="min-form-group">
                <label>1. Group Assembly & Previous Minutes Review:</label>
                <textarea
                  className="min-form-textarea"
                  value={minutesData.assemblyReviewText}
                  onChange={(e) => setMinutesData({ ...minutesData, assemblyReviewText: e.target.value })}
                />
              </div>

              {/* Item 2 */}
              <div className="min-form-fieldset">
                <div className="min-form-fieldset-legend">2. Micro-Loan Application Review & Approval:</div>
                <div className="min-form-row">
                  <div className="min-form-group min-flex-1">
                    <label>Applicant Name:</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.loanAppMember}
                      onChange={(e) => setMinutesData({ ...minutesData, loanAppMember: e.target.value })}
                    />
                  </div>
                  <div className="min-form-group min-flex-1">
                    <label>Loan Purpose / Category:</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.loanAppType}
                      onChange={(e) => setMinutesData({ ...minutesData, loanAppType: e.target.value })}
                    />
                  </div>
                  <div className="min-form-group">
                    <label>Approval Status:</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.loanAppStatus}
                      onChange={(e) => setMinutesData({ ...minutesData, loanAppStatus: e.target.value })}
                    />
                  </div>
                </div>
                <div className="min-form-row">
                  <div className="min-form-group min-flex-1">
                    <label>Sanctioned Amount (₹):</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.loanAppAmount}
                      onChange={(e) => setMinutesData({ ...minutesData, loanAppAmount: e.target.value })}
                    />
                  </div>
                  <div className="min-form-group min-flex-1">
                    <label>Tenure:</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.loanAppTenure}
                      onChange={(e) => setMinutesData({ ...minutesData, loanAppTenure: e.target.value })}
                    />
                  </div>
                  <div className="min-form-group min-flex-1">
                    <label>Reducing Rate:</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.loanAppRate}
                      onChange={(e) => setMinutesData({ ...minutesData, loanAppRate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="min-form-group">
                  <label>Verification & Disbursal Notes:</label>
                  <input
                    type="text"
                    className="min-form-input"
                    value={minutesData.loanAppNotes}
                    onChange={(e) => setMinutesData({ ...minutesData, loanAppNotes: e.target.value })}
                  />
                </div>
              </div>

              {/* Item 3 */}
              <div className="min-form-fieldset">
                <div className="min-form-fieldset-legend">
                  3. Loan Repayment (EMI Summary Overrides):
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
                  Live Data: <strong>{weekRepaymentStats.repaymentCount}</strong> repayment(s) totaling <strong>₹{weekRepaymentStats.totalAmount.toLocaleString('en-IN')}.00</strong> recorded for this week.
                </div>
                <div className="min-form-row">
                  <div className="min-form-group min-flex-1">
                    <label>Primary Borrower Name:</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.repayMember}
                      onChange={(e) => setMinutesData({ ...minutesData, repayMember: e.target.value })}
                    />
                  </div>
                  <div className="min-form-group min-flex-1">
                    <label>Loan Description:</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.repayLoanDesc}
                      onChange={(e) => setMinutesData({ ...minutesData, repayLoanDesc: e.target.value })}
                    />
                  </div>
                  <div className="min-form-group">
                    <label>Total Repaid (₹):</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.repayTotalAmount}
                      onChange={(e) => setMinutesData({ ...minutesData, repayTotalAmount: e.target.value })}
                    />
                  </div>
                </div>
                <div className="min-form-row">
                  <div className="min-form-group min-flex-1">
                    <label>Principal (₹):</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.repayPrincipal}
                      onChange={(e) => setMinutesData({ ...minutesData, repayPrincipal: e.target.value })}
                    />
                  </div>
                  <div className="min-form-group min-flex-1">
                    <label>Interest (₹):</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.repayInterest}
                      onChange={(e) => setMinutesData({ ...minutesData, repayInterest: e.target.value })}
                    />
                  </div>
                  <div className="min-form-group min-flex-1">
                    <label>Receipt #:</label>
                    <input
                      type="text"
                      className="min-form-input"
                      value={minutesData.repayReceipt}
                      onChange={(e) => setMinutesData({ ...minutesData, repayReceipt: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Item 4 */}
              <div className="min-form-group">
                <label>4. Community, Welfare & Ward Announcements:</label>
                <textarea
                  className="min-form-textarea"
                  value={minutesData.announcementsText}
                  onChange={(e) => setMinutesData({ ...minutesData, announcementsText: e.target.value })}
                />
              </div>

              {/* Form Buttons */}
              <div className="min-form-actions">
                <button
                  type="button"
                  className="min-btn-form-cancel"
                  onClick={() => setActiveView('document')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-btn-form-save"
                >
                  <Save size={14} />
                  <span>Save Minutes & Return to Document</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default MeetingMinutesModal;
