import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchUnitBankAccount } from '../services/api.js';
import loanService from '../services/loanService.js';

/**
 * Generates an official Kudumbashree / Sahayi Savings Passbook in PDF format.
 * Matches the traditional physical passbook structure with:
 * - English headings (SAVINGS PASSBOOK, Weekly Thrift & Savings Register)
 * - Ayalkoottam Details (Name, Unit ID, Ward, CDS)
 * - Member Details (Name, Member ID, Phone, House Name, Total Savings)
 * - Passbook Table matching the physical Kudumbashree passbook columns:
 *   1. Date
 *   2. Deposited Amount (Rs.)
 *   3. Withdrawn Amount (Rs.)
 *   4. Balance (Rs.)
 *   5. Secretary's Signature
 */
export const generateSavingsPassbookPdf = async ({
  dashboardData,
  currentUser,
  savingsWeeks = [],
  myPaymentsList = [],
  bankAccount = null,
  loans = []
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const memberName = dashboardData?.fullName || currentUser?.fullName || 'Beena Joy';
  const rawUnitName = dashboardData?.unitName || currentUser?.unitName || 'Haritha';
  const unitName = rawUnitName.toLowerCase().includes('ayalkoottam')
    ? rawUnitName
    : `${rawUnitName} Ayalkoottam`;

  const memberId = dashboardData?.memberIdStr || `AK-${String(currentUser?.userId || 5).padStart(3, '0')}`;
  const unitId = dashboardData?.unitId || currentUser?.unitId || 1;
  const unitCode = `AK-UNIT-${String(unitId).padStart(3, '0')}`;
  const phone = dashboardData?.phoneNumber || currentUser?.phoneNumber || '9876543210';
  const houseName = dashboardData?.houseName || currentUser?.houseName || 'Kudumbashree Residence';
  const wardNumber = dashboardData?.wardNumber || currentUser?.wardNumber || 'Ward 04';
  const roleName = dashboardData?.roleName || currentUser?.role || 'Member';

  // Calculate member total savings dynamically (never hardcode 5200 fallback)
  let totalSavings = 0;
  if (Array.isArray(myPaymentsList) && myPaymentsList.length > 0) {
    totalSavings = myPaymentsList
      .filter((r) => (r.status || '').toLowerCase() === 'paid')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  } else if (dashboardData?.savings?.totalSavings != null) {
    totalSavings = Number(dashboardData.savings.totalSavings);
  } else if (currentUser?.totalSavings != null) {
    totalSavings = Number(currentUser.totalSavings);
  } else if (dashboardData?.savings?.weeklyHistory && dashboardData.savings.weeklyHistory.length > 0) {
    totalSavings = dashboardData.savings.weeklyHistory
      .filter((r) => (r.status || '').toLowerCase() === 'paid')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  }

  const savingsGoal = Number(dashboardData?.savings?.savingsGoal || 100000);
  const progressPct = savingsGoal > 0 ? Math.min(100, Math.round((totalSavings / savingsGoal) * 100)) : 0;

  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // ── 1. Top Decorative Header Banner ──
  // Deep Kudumbashree Green
  doc.setFillColor(15, 81, 50);
  doc.rect(0, 0, 210, 36, 'F');

  // Accent Gold / Emerald Stripe
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 36, 210, 2, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KERALA STATE POVERTY ERADICATION MISSION - KUDUMBASHREE', 105, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text('SAHAYI AYALKOOTTAM MANAGEMENT INFORMATION SYSTEM (MIS)', 105, 17, { align: 'center' });

  // Main English Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('SAVINGS', 105, 26, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(230, 245, 235);
  doc.text('Official Member Weekly Thrift & Cumulative Savings Ledger', 105, 31, { align: 'center' });

  // ── 2. Top Info Boxes (Ayalkoottam Details & Member Details) ──
  const startY = 43;
  const boxWidth = 90;
  const boxHeight = 36;
  const leftX = 14;
  const rightX = 106;

  // --- Ayalkoottam Details Card (Left) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftX, startY, boxWidth, boxHeight, 2, 2, 'FD');

  // Card Header Ribbon
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(leftX, startY, boxWidth, 7, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(leftX, startY + 7, leftX + boxWidth, startY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 81, 50);
  doc.text('AYALKOOTTAM (NHG) DETAILS', leftX + 4, startY + 5);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('Ayalkoottam Name:', leftX + 4, startY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(unitName, leftX + 38, startY + 13);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Unit Reg. ID:', leftX + 4, startY + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(unitCode, leftX + 38, startY + 19);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Ward & CDS:', leftX + 4, startY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${wardNumber} • Kudumbashree CDS`, leftX + 38, startY + 25);

  // Resolve original bank account name from UnitBankAccounts.BankName
  let resolvedBankName = (
    bankAccount?.bankName ||
    bankAccount?.BankName ||
    dashboardData?.bankAccount?.bankName ||
    dashboardData?.bankAccount?.BankName ||
    dashboardData?.bankName ||
    dashboardData?.BankName ||
    currentUser?.bankName ||
    ''
  ).trim();

  if (!resolvedBankName && unitId) {
    try {
      const bankRes = await fetchUnitBankAccount(unitId);
      if (bankRes?.data?.bankName) {
        resolvedBankName = bankRes.data.bankName.trim();
      }
    } catch (e) {
      console.warn('Could not fetch UnitBankAccounts from database:', e);
    }
  }

  if (!resolvedBankName) {
    resolvedBankName = 'Kerala Gramin Bank';
  }

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Account:', leftX + 4, startY + 31);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(resolvedBankName, leftX + 38, startY + 31);

  // --- Member Details Card (Right) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(rightX, startY, boxWidth, boxHeight, 2, 2, 'FD');

  // Card Header Ribbon
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightX, startY, boxWidth, 7, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(rightX, startY + 7, rightX + boxWidth, startY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 81, 50);
  doc.text('MEMBER DETAILS', rightX + 4, startY + 5);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('Member Name:', rightX + 4, startY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(memberName, rightX + 34, startY + 13);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Member ID:', rightX + 4, startY + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${memberId} (${roleName})`, rightX + 34, startY + 19);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Contact Phone:', rightX + 4, startY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(phone, rightX + 34, startY + 25);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('House Name:', rightX + 4, startY + 31);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(houseName, rightX + 34, startY + 31);

  // ── 3. Financial Summary Strip ──
  const stripY = 82;
  doc.setFillColor(240, 253, 244); // light emerald
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, stripY, 182, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  const finTitle = 'FINANCIAL STANDING:';
  doc.text(finTitle, 18, stripY + 5.8);
  let finCurX = 18 + doc.getTextWidth(finTitle) + 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total Savings Balance: ', finCurX, stripY + 5.8);
  finCurX += doc.getTextWidth('Total Savings Balance: ');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  const savingsStr = `Rs. ${totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  doc.text(savingsStr, finCurX, stripY + 5.8);
  finCurX += doc.getTextWidth(savingsStr) + 10;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Target Goal: ', finCurX, stripY + 5.8);
  finCurX += doc.getTextWidth('Target Goal: ');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Rs. ${savingsGoal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${progressPct}%)`, finCurX, stripY + 5.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Statement Issue Date: ${currentDateStr} | Account Status: Active & In Good Standing | Default Fine: Rs. 0.00 (Nil Fine)`, 18, stripY + 11.2);

  // ── 4. Passbook Ledger Table ──
  // Extract or build payment rows
  let rawRows = [];
  if (Array.isArray(myPaymentsList) && myPaymentsList.length > 0) {
    rawRows = [...myPaymentsList];
  } else if (dashboardData?.savings?.weeklyHistory && dashboardData.savings.weeklyHistory.length > 0) {
    rawRows = dashboardData.savings.weeklyHistory.map((row, idx) => ({
      weekTitle: row.weekTitle || `Week ${row.savingsWeekId}`,
      amount: row.amount || 100,
      status: row.status || 'Paid',
      paymentMode: row.paymentMode || 'Online',
      paidDate: row.paidDate || '-',
      receiptNumber: row.receiptNumber || `AK-REC-2026-${String(row.savingsWeekId || idx + 1).padStart(3, '0')}`
    }));
  } else if (Array.isArray(savingsWeeks) && savingsWeeks.length > 0) {
    const targetUserId = currentUser?.userId || dashboardData?.userId;
    savingsWeeks.forEach((w) => {
      const matchMember = w.members?.find((m) => m.userId === targetUserId);
      if (matchMember) {
        rawRows.push({
          weekTitle: w.weekTitle || `Week ${w.weekNumber}`,
          amount: matchMember.amount || 100,
          status: matchMember.status || 'Paid',
          paymentMode: matchMember.paymentMode || 'Online',
          paidDate: matchMember.paidDate || '-',
          receiptNumber: matchMember.receiptNumber || `AK-REC-2026-${String(w.weekNumber || 1).padStart(3, '0')}`
        });
      }
    });
  }

  // If no weekly history rows found but member has an opening savings balance
  if (rawRows.length === 0 && totalSavings > 0) {
    rawRows = [
      {
        weekTitle: 'Initial Savings Deposit',
        amount: totalSavings,
        status: 'Paid',
        paidDate: new Date().toLocaleDateString('en-GB'),
        receiptNumber: 'AK-INIT-001'
      }
    ];
  }

  // Calculate cumulative running balances
  const paidRows = rawRows.filter(r => (r.status || '').toLowerCase() === 'paid');
  const sumOfPaidRows = paidRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const baseStartingBalance = Math.max(0, totalSavings - sumOfPaidRows);

  let currentRunning = baseStartingBalance;
  // If rows are newest first, reverse to compute running balance forward, then map
  const chronological = [...rawRows].reverse();
  const tableData = [];
  const secSignName = dashboardData?.secretaryName || currentUser?.secretaryName || 'Secretary';

  chronological.forEach((row) => {
    const isPaid = (row.status || '').toLowerCase() === 'paid';
    const depositAmt = isPaid ? Number(row.amount || 0) : 0;
    if (isPaid) {
      currentRunning += depositAmt;
    }

    const dateDisplay = (row.paidDate && row.paidDate !== '-')
      ? row.paidDate
      : (row.weekTitle ? row.weekTitle.replace(/^Week \d+:\s*/, '') : 'Current Week');

    tableData.push([
      dateDisplay,
      isPaid ? `${depositAmt.toFixed(2)}` : '-',
      '-',
      `${currentRunning.toFixed(2)}`,
      isPaid ? `Verified (${secSignName})` : 'Pending Deposit'
    ]);
  });

  // Add empty ledger rows with grid lines just like the physical Kudumbashree passbook
  const emptyRowsCount = Math.max(4, 12 - tableData.length);
  for (let i = 0; i < emptyRowsCount; i++) {
    tableData.push(['', '', '', '', '']);
  }

  // Generate Table using autoTable
  autoTable(doc, {
    startY: 100,
    head: [[
      'Date / Week',
      'Deposited Amount (Rs.)',
      'Withdrawn Amount (Rs.)',
      'Balance (Rs.)',
      "Secretary's Signature"
    ]],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [15, 81, 50], // Kudumbashree Forest Green
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8.2,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 44, halign: 'center' },
      1: { cellWidth: 36, halign: 'right' },
      2: { cellWidth: 36, halign: 'right' },
      3: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 32, halign: 'center', fontStyle: 'italic', textColor: [22, 101, 52] }
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const isBlankRow = data.row.raw && Array.isArray(data.row.raw) && data.row.raw.every(c => c === '' || c == null);
        if (isBlankRow) {
          data.cell.text = [''];
          return;
        }

        const raw = Array.isArray(data.cell.text) ? data.cell.text.join(' ') : String(data.cell.text || '');
        if ([1, 2, 3].includes(data.column.index)) {
          let cleaned = raw.replace(/Rs\.?\s*/gi, '').replace(/₹\s*/g, '').trim();
          if ([1, 2].includes(data.column.index)) {
            if (cleaned === '0' || cleaned === '0.00' || cleaned === '0.0' || cleaned === '') {
              cleaned = '-';
            }
          }
          data.cell.text = [cleaned];
        }
      }
    }
  });

  // ── 5. Official Signature & Stamp Verification Footer ──
  const finalY = doc.lastAutoTable ? Math.min(252, doc.lastAutoTable.finalY + 12) : 230;

  // Signature Blocks
  const sigY = finalY;
  const colWidth = 58;

  // Member Signature
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(14, sigY + 15, 14 + colWidth, sigY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Member's Signature", 14 + (colWidth / 2), sigY + 19, { align: 'center' });
  doc.text(memberName, 14 + (colWidth / 2), sigY + 23, { align: 'center' });

  // Treasurer Signature
  const treasX = 76;
  doc.line(treasX, sigY + 15, treasX + colWidth, sigY + 15);
  doc.text("Treasurer's Signature", treasX + (colWidth / 2), sigY + 19, { align: 'center' });
  doc.text("Priya R (Treasurer)", treasX + (colWidth / 2), sigY + 23, { align: 'center' });

  // Secretary Signature & Seal
  const secX = 138;
  doc.line(secX, sigY + 15, secX + colWidth, sigY + 15);
  doc.text("Secretary's Signature & Seal", secX + (colWidth / 2), sigY + 19, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 81, 50);
  doc.text("Devika V (Secretary)", secX + (colWidth / 2), sigY + 23, { align: 'center' });

  // Bottom Notice Bar
  const footerBarY = 282;
  doc.setFillColor(241, 245, 249);
  doc.rect(0, footerBarY, 210, 15, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, footerBarY, 210, footerBarY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `This is an authentic computer-generated digital Kudumbashree Savings Passbook generated from SahayiDb.`,
    105,
    footerBarY + 5,
    { align: 'center' }
  );
  doc.text(
    `Ayalkoottam: ${unitName} | Member: ${memberName} (${memberId}) | Generated on: ${currentDateStr} | Page 1 of 2`,
    105,
    footerBarY + 9,
    { align: 'center' }
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ── PAGE 2: OFFICIAL LOAN PASSBOOK (SAME FORMAT AS SAVINGS PAGE) ──
  // ══════════════════════════════════════════════════════════════════════════
  doc.addPage();

  // Resolve loan data for Page 2
  let resolvedLoans = Array.isArray(loans) && loans.length > 0 ? loans : (dashboardData?.loans || []);
  if (resolvedLoans.length === 0 && typeof window !== 'undefined' && loanService?.getMyLoans) {
    try {
      const fetched = await loanService.getMyLoans();
      if (Array.isArray(fetched) && fetched.length > 0) {
        resolvedLoans = fetched;
      }
    } catch (err) {
      console.warn('Could not fetch loans from loanService:', err);
    }
  }

  // Active loan entity or dashboard activeLoan
  const activeLoanObj = resolvedLoans.find(l => l.status === 'Disbursed' || l.status === 'Approved' || l.status === 'In Repayment') 
    || resolvedLoans[0] 
    || null;

  const hasLoan = Boolean(activeLoanObj || dashboardData?.activeLoan?.hasLoan);
  const loanId = activeLoanObj?.loanId || dashboardData?.activeLoan?.loanId || (hasLoan ? 1 : null);
  // Fine Details Calculation (from LoanFineCalculator policy: Rs. 50 per missed repayment month)
  let loanFineAmount = Number(activeLoanObj?.fineAmount || 0);
  const fineEntries = [];

  if (activeLoanObj?.disbursedDate && (activeLoanObj.status === 'Disbursed' || activeLoanObj.status === 'Closed')) {
    const sortedRepaymentsForFine = [...(activeLoanObj.repayments || [])].sort((a, b) => new Date(a.repaymentDate) - new Date(b.repaymentDate));
    const maxRepaymentTime = sortedRepaymentsForFine.length > 0 
      ? Math.max(...sortedRepaymentsForFine.map(r => new Date(r.repaymentDate).getTime()))
      : 0;
    const cutoffTime = Math.max(Date.now(), maxRepaymentTime);
    const startDate = new Date(activeLoanObj.disbursedDate);
    let monthIdx = 1;
    let accumulatedFines = 0;

    while (true) {
      const intervalEnd = new Date(startDate);
      intervalEnd.setMonth(intervalEnd.getMonth() + monthIdx);
      if (intervalEnd.getTime() > cutoffTime) break;

      const countSoFar = sortedRepaymentsForFine.filter(r => {
        const rDate = new Date(r.repaymentDate);
        return rDate <= intervalEnd && (r.amountPaid > 0 || r.principalComponent > 0 || r.interestComponent > 0);
      }).length;

      if (countSoFar < monthIdx) {
        accumulatedFines += 50;
        fineEntries.push({
          date: intervalEnd,
          dateStr: intervalEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          fineAmount: 50,
          description: `Missed Month ${monthIdx} Penalty`
        });
      }
      monthIdx++;
    }
    loanFineAmount = Math.max(loanFineAmount, accumulatedFines);
  }

  const sanctionedAmount = Number(activeLoanObj?.amountRequested || dashboardData?.activeLoan?.loanAmount || 15000);
  const totalAdjustedLoan = sanctionedAmount + loanFineAmount;
  const principalPaid = Number(activeLoanObj?.totalPrincipalPaid || 0);
  const outstandingBal = Number(activeLoanObj?.outstandingBalance ?? (Math.max(0, totalAdjustedLoan - principalPaid)));
  const loanPurpose = activeLoanObj?.purpose || 'Small Enterprise / Agriculture';
  const tenure = activeLoanObj?.tenureMonths || 12;
  const interestRate = activeLoanObj?.interestRate || 1.0;
  const loanStatus = activeLoanObj?.status || dashboardData?.activeLoan?.status || (hasLoan ? 'Disbursed' : 'No Active Loan');
  const nextPayment = activeLoanObj ? Math.round(sanctionedAmount / tenure + (outstandingBal * (interestRate / 100))) : (dashboardData?.activeLoan?.nextPayment || 0);
  const nextDueDate = dashboardData?.activeLoan?.dueDate || '10th of Next Month';

  // ── 1. Top Decorative Header Banner (Page 2) ──
  doc.setFillColor(15, 81, 50);
  doc.rect(0, 0, 210, 36, 'F');

  // Accent Gold / Emerald Stripe
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 36, 210, 2, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KERALA STATE POVERTY ERADICATION MISSION - KUDUMBASHREE', 105, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text('SAHAYI AYALKOOTTAM MANAGEMENT INFORMATION SYSTEM (MIS)', 105, 17, { align: 'center' });

  // Main English Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('LOAN', 105, 26, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(230, 245, 235);
  doc.text('Official Member Loan Sanction & Repayment Ledger Register', 105, 31, { align: 'center' });

  // ── 2. Top Info Boxes (Ayalkoottam Details & Member Loan Details) ──
  // --- Ayalkoottam Details Card (Left - Identical to Page 1) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftX, startY, boxWidth, boxHeight, 2, 2, 'FD');

  // Card Header Ribbon
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(leftX, startY, boxWidth, 7, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(leftX, startY + 7, leftX + boxWidth, startY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 81, 50);
  doc.text('AYALKOOTTAM (NHG) DETAILS', leftX + 4, startY + 5);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('Ayalkoottam Name:', leftX + 4, startY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(unitName, leftX + 38, startY + 13);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Unit Reg. ID:', leftX + 4, startY + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(unitCode, leftX + 38, startY + 19);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Ward & CDS:', leftX + 4, startY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${wardNumber} • Kudumbashree CDS`, leftX + 38, startY + 25);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Account:', leftX + 4, startY + 31);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(resolvedBankName, leftX + 38, startY + 31);

  // --- Member & Loan Details Card (Right) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(rightX, startY, boxWidth, boxHeight, 2, 2, 'FD');

  // Card Header Ribbon
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightX, startY, boxWidth, 7, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(rightX, startY + 7, rightX + boxWidth, startY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 81, 50);
  doc.text('MEMBER & LOAN DETAILS', rightX + 4, startY + 5);

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('Member Name:', rightX + 4, startY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(memberName, rightX + 34, startY + 13);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Member ID:', rightX + 4, startY + 19);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${memberId} (${roleName})`, rightX + 34, startY + 19);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Sanction:', rightX + 4, startY + 25);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(hasLoan ? `Loan #${loanId} • ${loanPurpose.slice(0, 18)}` : 'No Active Loan', rightX + 34, startY + 25);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Term & Fine:', rightX + 4, startY + 31);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(loanFineAmount > 0 ? 185 : 15, loanFineAmount > 0 ? 28 : 23, loanFineAmount > 0 ? 28 : 42);
  doc.text(
    hasLoan
      ? `${tenure} Mos @ ${interestRate}% • Fine: Rs. ${loanFineAmount.toFixed(2)}`
      : 'Eligible for Micro-loan (Nil Fine)',
    rightX + 34,
    startY + 31
  );

  // ── 3. Loan Standing Summary Strip (With Fine Details) ──
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, stripY, 182, 14, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  const titleText = 'LOAN STANDING:';
  doc.text(titleText, 18, stripY + 5.8);
  const titleW = doc.getTextWidth(titleText);

  // Dynamic layout for the 4 metrics to ensure perfect spacing, zero overlap, and clean alignment inside the box
  const summaryMetrics = [
    {
      label: 'Sanctioned: ',
      val: `Rs. ${sanctionedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      color: [30, 41, 59]
    },
    {
      label: 'Late Fine: ',
      val: `Rs. ${loanFineAmount.toFixed(2)}`,
      color: loanFineAmount > 0 ? [220, 38, 38] : [22, 101, 52]
    },
    {
      label: 'Repaid: ',
      val: `Rs. ${principalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      color: [16, 185, 129]
    },
    {
      label: 'Outstanding: ',
      val: `Rs. ${outstandingBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      color: hasLoan && outstandingBal > 0 ? [185, 28, 28] : [16, 185, 129]
    }
  ];

  const startMetricsX = 18 + titleW + 4;
  const rightBoundaryX = 192; // 4mm inside right margin 196
  const usableWidth = rightBoundaryX - startMetricsX;

  // Measure content widths
  let totalMetricsW = 0;
  const measuredMetrics = summaryMetrics.map(m => {
    doc.setFont('helvetica', 'normal');
    const labelW = doc.getTextWidth(m.label);
    doc.setFont('helvetica', 'bold');
    const valW = doc.getTextWidth(m.val);
    const totalW = labelW + valW;
    totalMetricsW += totalW;
    return { ...m, labelW, valW, totalW };
  });

  const metricGap = Math.max(3, (usableWidth - totalMetricsW) / (summaryMetrics.length - 1));
  let curMetricsX = startMetricsX;

  measuredMetrics.forEach((m, idx) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(m.label, curMetricsX, stripY + 5.8);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, curMetricsX + m.labelW, stripY + 5.8);

    curMetricsX += m.totalW + (idx < measuredMetrics.length - 1 ? metricGap : 0);
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    hasLoan
      ? `Status: ${loanStatus} | Penalty Policy: Rs. 50/missed month | Next Due: ${nextDueDate} | Monthly Due: Rs. ${nextPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      : `Status: No Active Loan | Member account in good standing (Zero Fines / Nil Penalty)`,
    18,
    stripY + 11.2
  );

  // ── 4. Loan Passbook Ledger Table (With Dedicated Fine Column) ──
  // Helper to extract clean numeric value (stripping any Rs. or symbols)
  const cleanAmountVal = (val) => {
    if (val == null || val === '' || val === '-') return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const num = parseFloat(String(val).replace(/Rs\.?\s*/gi, '').replace(/[^\d.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Helper to format table cells without 'Rs.' and never showing '0' or '0.00' (showing '-' instead)
  const formatLedgerCell = (val) => {
    const num = cleanAmountVal(val);
    if (num <= 0) return '-';
    return num.toFixed(2);
  };

  const formatBalanceCell = (val) => {
    const num = cleanAmountVal(val);
    return num.toFixed(2);
  };

  const loanTableData = [];
  let runningLoanBal = sanctionedAmount;

  // Combine repayments and fines chronologically
  const mergedTransactions = [];

  if (activeLoanObj?.repayments && activeLoanObj.repayments.length > 0) {
    activeLoanObj.repayments.forEach(r => {
      mergedTransactions.push({
        type: 'repayment',
        date: new Date(r.repaymentDate),
        data: r
      });
    });
  }

  fineEntries.forEach(f => {
    mergedTransactions.push({
      type: 'fine',
      date: f.date,
      data: f
    });
  });

  // Sort chronological
  mergedTransactions.sort((a, b) => a.date - b.date);

  if (mergedTransactions.length > 0) {
    mergedTransactions.forEach((entry, idx) => {
      if (entry.type === 'fine') {
        const f = entry.data;
        const fineAmt = cleanAmountVal(f.fineAmount);
        runningLoanBal += fineAmt;
        loanTableData.push([
          f.dateStr || 'Missed Month',
          '-',
          '-',
          formatLedgerCell(fineAmt),
          formatBalanceCell(runningLoanBal),
          'Penalty (Late Fine)'
        ]);
      } else {
        const r = entry.data;
        const pPaid = cleanAmountVal(r.principalComponent || r.amountPaid);
        const iPaid = cleanAmountVal(r.interestComponent);
        const finePaid = cleanAmountVal(r.finePaid || r.fineAmount);
        runningLoanBal = Math.max(0, runningLoanBal - pPaid);
        const dStr = r.repaymentDate
          ? new Date(r.repaymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : `Installment #${idx + 1}`;

        loanTableData.push([
          dStr,
          formatLedgerCell(pPaid),
          formatLedgerCell(iPaid),
          formatLedgerCell(finePaid),
          formatBalanceCell(runningLoanBal),
          r.recordedByName ? `Verified (${r.recordedByName.split(' ')[0]})` : 'Verified (Devika V)'
        ]);
      }
    });
  } else if (dashboardData?.repaymentSchedule && dashboardData.repaymentSchedule.length > 0) {
    dashboardData.repaymentSchedule.forEach((r, idx) => {
      const pPaid = cleanAmountVal(r.principal);
      const iPaid = cleanAmountVal(r.interest);
      if (r.status === 'paid') {
        runningLoanBal = Math.max(0, runningLoanBal - pPaid);
      }
      loanTableData.push([
        r.month || `Installment #${idx + 1}`,
        formatLedgerCell(pPaid),
        formatLedgerCell(iPaid),
        '-',
        formatBalanceCell(runningLoanBal),
        r.status === 'paid' ? 'Verified (Devika V)' : 'Scheduled'
      ]);
    });
  } else if (hasLoan) {
    const monthlyP = Math.round(sanctionedAmount / tenure);
    const monthlyI = Math.round(sanctionedAmount * (interestRate / 100));
    runningLoanBal = Math.max(0, sanctionedAmount - monthlyP);
    loanTableData.push([
      'Sanction Entry',
      formatLedgerCell(monthlyP),
      formatLedgerCell(monthlyI),
      '-',
      formatBalanceCell(runningLoanBal),
      'Verified (Devika V)'
    ]);
  }

  // Add authentic empty passbook grid rows
  const emptyLoanRows = Math.max(4, 12 - loanTableData.length);
  for (let i = 0; i < emptyLoanRows; i++) {
    loanTableData.push(['', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: 100,
    head: [[
      'Date / Month',
      'Principal Paid (Rs.)',
      'Interest Paid (Rs.)',
      'Fine (Rs.)',
      'Remaining Balance (Rs.)',
      "Secretary's Signature"
    ]],
    body: loanTableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [15, 81, 50],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8.2,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 36, halign: 'center' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 26, halign: 'right', textColor: [185, 28, 28] },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 28, halign: 'center', fontStyle: 'italic', textColor: [22, 101, 52] }
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const isBlankRow = data.row.raw && Array.isArray(data.row.raw) && data.row.raw.every(c => c === '' || c == null);
        if (isBlankRow) {
          data.cell.text = [''];
          return;
        }

        const raw = Array.isArray(data.cell.text) ? data.cell.text.join(' ') : String(data.cell.text || '');
        // For numeric columns (Principal Paid, Interest Paid, Fine, Remaining Balance)
        if ([1, 2, 3, 4].includes(data.column.index)) {
          // Remove any 'Rs.' or 'Rs' or '₹' from cell text
          let cleaned = raw.replace(/Rs\.?\s*/gi, '').replace(/₹\s*/g, '').trim();
          // Never show 0 or 0.00 in payment/fine columns (1, 2, 3) - show '-' instead
          if ([1, 2, 3].includes(data.column.index)) {
            if (cleaned === '0' || cleaned === '0.00' || cleaned === '0.0' || cleaned === '') {
              cleaned = '-';
            }
          }
          data.cell.text = [cleaned];
        }
      }
    }
  });

  // ── 5. Official Signature & Stamp Verification Footer (Page 2) ──
  const finalLoanY = doc.lastAutoTable ? Math.min(252, doc.lastAutoTable.finalY + 12) : 230;

  // Member Signature
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(14, finalLoanY + 15, 14 + colWidth, finalLoanY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Member's Signature", 14 + (colWidth / 2), finalLoanY + 19, { align: 'center' });
  doc.text(memberName, 14 + (colWidth / 2), finalLoanY + 23, { align: 'center' });

  // Treasurer Signature
  doc.line(treasX, finalLoanY + 15, treasX + colWidth, finalLoanY + 15);
  doc.text("Treasurer's Signature", treasX + (colWidth / 2), finalLoanY + 19, { align: 'center' });
  doc.text("Priya R (Treasurer)", treasX + (colWidth / 2), finalLoanY + 23, { align: 'center' });

  // Secretary Signature & Seal
  doc.line(secX, finalLoanY + 15, secX + colWidth, finalLoanY + 15);
  doc.text("Secretary's Signature & Seal", secX + (colWidth / 2), finalLoanY + 19, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 81, 50);
  doc.text("Devika V (Secretary)", secX + (colWidth / 2), finalLoanY + 23, { align: 'center' });

  // Bottom Notice Bar (Page 2)
  doc.setFillColor(241, 245, 249);
  doc.rect(0, footerBarY, 210, 15, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, footerBarY, 210, footerBarY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `This is an authentic computer-generated digital Kudumbashree Loan Passbook generated from SahayiDb.`,
    105,
    footerBarY + 5,
    { align: 'center' }
  );
  doc.text(
    `Ayalkoottam: ${unitName} | Member: ${memberName} (${memberId}) | Generated on: ${currentDateStr} | Page 2 of 2`,
    105,
    footerBarY + 9,
    { align: 'center' }
  );

  // Trigger browser download
  const safeMemberName = memberName.replace(/\s+/g, '_');
  const safeUnitName = rawUnitName.replace(/\s+/g, '_');
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const fileDateStr = `${day}-${month}-${year}`;
  const fileName = `Passbook_${safeMemberName}_${safeUnitName}_${fileDateStr}.pdf`;

  doc.save(fileName);
  return fileName;
};

/**
 * Generates an official Kudumbashree Weekly Payment Receipt in PDF format.
 */
export const generateSingleReceiptPdf = ({
  item,
  memberName,
  unitName,
  memberId = 'AK-001'
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // A5 is standard receipt size
  });

  // Top header banner
  doc.setFillColor(15, 81, 50);
  doc.rect(0, 0, 148, 28, 'F');
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 28, 148, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KUDUMBASHREE - SAHAYI AYALKOOTTAM CONNECT', 74, 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(209, 250, 229);
  doc.text('WEEKLY SAVINGS PAYMENT ACKNOWLEDGEMENT RECEIPT', 74, 15, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL PAYMENT RECEIPT', 74, 23, { align: 'center' });

  // Receipt Details Card
  const startY = 34;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, startY, 128, 72, 2, 2, 'FD');

  const rows = [
    ['Receipt Number:', item.receiptNumber || 'AK-REC-2026-040'],
    ['Member Name:', memberName],
    ['Member ID:', memberId],
    ['Ayalkoottam (NHG):', unitName],
    ['Week Period:', item.weekTitle || 'Week 40'],
    ['Deposit Amount:', `Rs. ${Number(item.amount || 100).toFixed(2)}`],
    ['Payment Mode:', item.paymentMode || 'Online (UPI / Razorpay)'],
    ['Payment Date:', item.paidDate || '28-09-2026'],
    ['Payment Status:', item.status ? item.status.toUpperCase() : 'PAID']
  ];

  let currentY = startY + 8;
  rows.forEach(([label, val], idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, 16, currentY);

    doc.setFont('helvetica', label === 'Deposit Amount:' || label === 'Payment Status:' ? 'bold' : 'normal');
    doc.setTextColor(
      label === 'Payment Status:'
        ? (val === 'PAID' ? 22 : 185)
        : (label === 'Deposit Amount:' ? 15 : 15),
      label === 'Payment Status:'
        ? (val === 'PAID' ? 101 : 28)
        : (label === 'Deposit Amount:' ? 81 : 23),
      label === 'Payment Status:'
        ? (val === 'PAID' ? 52 : 28)
        : (label === 'Deposit Amount:' ? 50 : 42)
    );
    doc.text(String(val), 60, currentY);

    if (idx < rows.length - 1) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.line(16, currentY + 2.2, 132, currentY + 2.2);
    }
    currentY += 6.8;
  });

  // Stamp & Secretary Sign
  const sigY = 114;
  doc.setDrawColor(148, 163, 184);
  doc.line(16, sigY + 12, 60, sigY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Member's Signature", 38, sigY + 16, { align: 'center' });

  doc.line(88, sigY + 12, 132, sigY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 81, 50);
  doc.text('Devika V (Secretary)', 110, sigY + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signature & Seal', 110, sigY + 20, { align: 'center' });

  // Bottom Notice
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 196, 148, 14, 'F');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authentic digital receipt generated from SahayiDb. No physical signature required.', 74, 202, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 74, 206, { align: 'center' });

  const fileName = `Receipt_${item.receiptNumber || 'SAV'}_${memberName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  return fileName;
};

