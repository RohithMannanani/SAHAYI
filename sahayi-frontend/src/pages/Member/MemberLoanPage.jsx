import React, { useState, useEffect } from 'react';
import loanService from '../../services/loanService';
import { fetchMemberDashboard } from '../../services/api';
import RepaymentScheduleModal from '../../components/RepaymentScheduleModal';
import './MemberLoanPage.css';

const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const MemberLoanPage = ({ unitTotalSavings: propUnitSavings }) => {
  const [loans, setLoans] = useState([]);
  const [unitTotalSavings, setUnitTotalSavings] = useState(propUnitSavings || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [selectedModalLoan, setSelectedModalLoan] = useState(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  // Passbook Ledger Pagination & Sorting State
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerSortAsc, setLedgerSortAsc] = useState(true); // true = Oldest First, false = Newest First

  // Pay Installment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payModalLoan, setPayModalLoan] = useState(null);
  const [installmentInput, setInstallmentInput] = useState('');
  const [repaymentType, setRepaymentType] = useState('Combined'); // 'Combined', 'InterestOnly', 'PrincipalOnly', 'FullPayoff'
  const [paymentMode, setPaymentMode] = useState('Online');
  const [isPayingInstallment, setIsPayingInstallment] = useState(false);

  const [formData, setFormData] = useState({
    amountRequested: '',
    purpose: '',
    tenureMonths: 12,
    interestRate: 1.0
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (propUnitSavings !== undefined && propUnitSavings !== null) {
      setUnitTotalSavings(propUnitSavings);
    }
  }, [propUnitSavings]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      let userObj = null;
      try {
        const raw = localStorage.getItem('user');
        if (raw) userObj = JSON.parse(raw);
      } catch (e) {}

      const [loansRes, dashRes] = await Promise.allSettled([
        loanService.getMyLoans(),
        fetchMemberDashboard(userObj?.userId, userObj?.unitId)
      ]);

      if (loansRes.status === 'fulfilled' && loansRes.value) {
        const loansData = loansRes.value || [];
        setLoans(loansData);
        // Automatically select loan that has scheduled repayments (Disbursed, Approved, Closed)
        const scheduled = loansData.find(l => l.status === 'Disbursed' || l.status === 'Approved' || l.status === 'Closed');
        if (scheduled) {
          setSelectedLoanId(scheduled.loanId);
        }
      }
      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setUnitTotalSavings(dashRes.value.data.unitTotalSavings || 0);
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const openPayModal = (loan, initialType = 'Combined') => {
    if (!loan) return;
    setPayModalLoan(loan);
    setRepaymentType(initialType);
    const outstanding = loan.outstandingBalance || 0;
    const totalLoan = loan.totalLoanAmount || ((loan.amountRequested || 0) + (loan.fineAmount || 0));
    const monthlyPrincipal = Math.round(totalLoan / Math.max(1, loan.tenureMonths || 12));
    const monthlyInterest = Math.round(outstanding * ((loan.interestRate || 1) / 100));

    if (initialType === 'InterestOnly') {
      setInstallmentInput(monthlyInterest.toString());
    } else if (initialType === 'PrincipalOnly') {
      setInstallmentInput(monthlyPrincipal.toString());
    } else if (initialType === 'FullPayoff') {
      setInstallmentInput((outstanding + monthlyInterest).toString());
    } else {
      const suggestedEmi = monthlyPrincipal + monthlyInterest;
      setInstallmentInput(suggestedEmi > 0 ? suggestedEmi.toString() : '1200');
    }
    setShowPayModal(true);
  };

  const handleRepaymentTypeSelect = (type) => {
    setRepaymentType(type);
    if (!payModalLoan) return;

    const outstanding = payModalLoan.outstandingBalance || 0;
    const totalLoan = payModalLoan.totalLoanAmount || ((payModalLoan.amountRequested || 0) + (payModalLoan.fineAmount || 0));
    const monthlyPrincipal = Math.round(totalLoan / Math.max(1, payModalLoan.tenureMonths || 12));
    const monthlyInterest = Math.round(outstanding * ((payModalLoan.interestRate || 1) / 100));

    if (type === 'InterestOnly') {
      setInstallmentInput(monthlyInterest.toString());
    } else if (type === 'PrincipalOnly') {
      setInstallmentInput(monthlyPrincipal.toString());
    } else if (type === 'FullPayoff') {
      setInstallmentInput((outstanding + monthlyInterest).toString());
    } else {
      const suggestedEmi = monthlyPrincipal + monthlyInterest;
      setInstallmentInput(suggestedEmi.toString());
    }
  };

  const handlePayInstallmentSubmit = async (e) => {
    e.preventDefault();
    const amountPaidVal = parseFloat(installmentInput);
    if (!amountPaidVal || amountPaidVal <= 0) {
      setError('Please enter a valid installment payment amount.');
      return;
    }

    try {
      setIsPayingInstallment(true);
      setError(null);
      setSuccessMsg('');
      const payload = {
        amountPaid: amountPaidVal,
        repaymentType: repaymentType,
        principalComponent: repaymentType === 'PrincipalOnly' ? amountPaidVal : null,
        interestComponent: repaymentType === 'PrincipalOnly' ? 0 : (repaymentType === 'InterestOnly' ? amountPaidVal : null)
      };

      const res = await loanService.payInstallment(payModalLoan.loanId, payload);
      setSuccessMsg(res.message || `Loan repayment of ₹${amountPaidVal.toLocaleString('en-IN')} recorded successfully! Receipt #${res.receiptNumber}`);
      setShowPayModal(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to process installment payment.');
    } finally {
      setIsPayingInstallment(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amountRequested);

    if (isNaN(amountVal) || amountVal <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }

    if (unitTotalSavings >= 0 && amountVal > unitTotalSavings) {
      setError(`Amount requested (₹${amountVal.toLocaleString('en-IN')}) cannot exceed total unit savings (₹${unitTotalSavings.toLocaleString('en-IN')}).`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg('');
      
      const payload = {
        amountRequested: amountVal,
        purpose: formData.purpose,
        tenureMonths: parseInt(formData.tenureMonths),
        interestRate: parseFloat(formData.interestRate)
      };

      await loanService.applyForLoan(payload);
      setSuccessMsg('Loan application submitted successfully!');
      setFormData({ amountRequested: '', purpose: '', tenureMonths: 12, interestRate: 1.0 });
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit loan application');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    let bgClass = 'mem-badge--light';
    if (status === 'Approved') bgClass = 'mem-badge--success';
    if (status === 'Pending') bgClass = 'mem-badge--warning';
    if (status === 'Disbursed') bgClass = 'mem-badge--info';
    if (status === 'Closed') bgClass = 'mem-badge--secondary';
    if (status === 'Rejected') bgClass = 'mem-badge--danger';
    return <span className={`mem-badge ${bgClass}`}>{status}</span>;
  };

  const pendingLoan = loans.find(l => l.status === 'Pending');
  const activeLoan = loans.find(l => l.status === 'Disbursed' || l.status === 'Approved');
  const activeLoanRepaymentCount = activeLoan?.repayments?.length || 0;
  
  // Only show Taken Loan Overview & Repayment Grid if repayment is scheduled (Disbursed, Approved, or Closed)
  const scheduledLoans = loans.filter(l => l.status === 'Disbursed' || l.status === 'Approved' || l.status === 'Closed');
  const viewedLoan = scheduledLoans.find(l => l.loanId === selectedLoanId) || scheduledLoans[0] || null;

  const amountVal = parseFloat(formData.amountRequested) || 0;
  const isAmountExceeded = amountVal > unitTotalSavings;

  return (
    <div className="member-loan-page">
      <div className="mem-loan-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#0c382e', marginBottom: '6px' }}>My Loans & Repayment Ledger</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          Inspect taken loans, pay monthly installments online or in cash, and view scheduled repayment statements.
        </p>
      </div>
      
      {error && <div className="mem-alert mem-alert--danger">{error}</div>}
      {successMsg && <div className="mem-alert mem-alert--success">{successMsg}</div>}

      {/* ── Low Unit Savings Alert & Early Payoff Notice Banner ── */}
      {viewedLoan && viewedLoan.status === 'Disbursed' && viewedLoan.outstandingBalance > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 300px' }}>
            <div style={{ fontSize: '1.8rem' }}>⚡</div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#92400e' }}>
                Fund Release Notice (Early Loan Payoff)
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: '#78350f' }}>
                Available Unit Savings is <strong>₹{unitTotalSavings.toLocaleString('en-IN')}</strong>. If a fellow unit member requires an urgent loan, you can prepay your remaining loan balance (<strong>₹{(viewedLoan.outstandingBalance || 0).toLocaleString('en-IN')}</strong>) early to free up unit funds immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => openPayModal(viewedLoan, 'FullPayoff')}
            style={{
              background: '#d97706',
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            ⚡ Prepay Rest of Amount Now
          </button>
        </div>
      )}

      {/* ── Section 1: Taken Loan Summary & Repayment Grid ── */}
      {loading ? (
        <div className="mem-card" style={{ padding: '30px', textAlign: 'center', color: '#64748b', marginBottom: '24px' }}>
          Loading loan details...
        </div>
      ) : viewedLoan ? (
        <div className="mem-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          {/* Card Header */}
          <div style={{ background: 'linear-gradient(135deg, #0c382e 0%, #166534 100%)', color: 'white', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                  Scheduled Loan #{viewedLoan.loanId} — {viewedLoan.purpose}
                </h3>
                <span style={{
                  background: viewedLoan.status === 'Disbursed' ? '#059669' : viewedLoan.status === 'Closed' ? '#64748b' : '#f59e0b',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '12px'
                }}>
                  {viewedLoan.status === 'Disbursed' ? 'Active In Repayment' : viewedLoan.status}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a7f3d0', marginTop: '6px' }}>
                Applied: {new Date(viewedLoan.appliedDate).toLocaleDateString('en-IN')} {viewedLoan.disbursedDate ? `• Disbursed: ${new Date(viewedLoan.disbursedDate).toLocaleDateString('en-IN')}` : ''}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#a7f3d0', display: 'block', fontWeight: 600 }}>Net Outstanding Balance</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
                  ₹{(() => {
                    const sortedR = [...(viewedLoan.repayments || [])].sort((a, b) => new Date(a.repaymentDate) - new Date(b.repaymentDate));
                    const maxRTime = sortedR.length > 0 ? Math.max(...sortedR.map(r => new Date(r.repaymentDate).getTime())) : 0;
                    const cutoffTime = Math.max(Date.now(), maxRTime);
                    let mIdx = 1;
                    let fAmt = 0;
                    const stDate = viewedLoan.disbursedDate ? new Date(viewedLoan.disbursedDate) : (viewedLoan.appliedDate ? new Date(viewedLoan.appliedDate) : new Date());
                    if (viewedLoan.disbursedDate && (viewedLoan.status === 'Disbursed' || viewedLoan.status === 'Closed')) {
                      while (true) {
                        const iEnd = new Date(stDate);
                        iEnd.setMonth(iEnd.getMonth() + mIdx);
                        if (iEnd.getTime() > cutoffTime) break;
                        const countSoFar = sortedR.filter(r => {
                          const rd = new Date(r.repaymentDate);
                          return rd <= iEnd && (r.amountPaid > 0 || r.principalComponent > 0 || r.interestComponent > 0);
                        }).length;
                        if (countSoFar < mIdx) fAmt += 50;
                        mIdx++;
                      }
                    }
                    const fineToUse = Math.max(viewedLoan.fineAmount || 0, fAmt);
                    const totLoan = (viewedLoan.amountRequested || 0) + fineToUse;
                    return Math.max(0, totLoan - (viewedLoan.totalPrincipalPaid || 0)).toLocaleString('en-IN');
                  })()}
                </span>
              </div>
              <button
                onClick={() => setScheduleModalOpen(true)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '10px 16px',
                  borderRadius: '24px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📅</span> View Schedule
              </button>
              {(viewedLoan.status === 'Disbursed' || viewedLoan.status === 'Approved') && (
                <button
                  onClick={() => openPayModal(viewedLoan)}
                  style={{
                    background: '#ffffff',
                    color: '#059669',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '24px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  title="Pay monthly loan installment online or cash"
                >
                  <span>💳</span> Pay Installment
                </button>
              )}
            </div>
          </div>

          {/* Financial KPI Summary Cards */}
          <div style={{ padding: '18px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
            {(() => {
              const sortedR = [...(viewedLoan.repayments || [])].sort((a, b) => new Date(a.repaymentDate) - new Date(b.repaymentDate));
              const maxRTime = sortedR.length > 0 ? Math.max(...sortedR.map(r => new Date(r.repaymentDate).getTime())) : 0;
              const cutoffTime = Math.max(Date.now(), maxRTime);
              let mIdx = 1;
              let fAmt = 0;
              const stDate = viewedLoan.disbursedDate ? new Date(viewedLoan.disbursedDate) : (viewedLoan.appliedDate ? new Date(viewedLoan.appliedDate) : new Date());
              if (viewedLoan.disbursedDate && (viewedLoan.status === 'Disbursed' || viewedLoan.status === 'Closed')) {
                while (true) {
                  const iEnd = new Date(stDate);
                  iEnd.setMonth(iEnd.getMonth() + mIdx);
                  if (iEnd.getTime() > cutoffTime) break;
                  const countSoFar = sortedR.filter(r => {
                    const rd = new Date(r.repaymentDate);
                    return rd <= iEnd && (r.amountPaid > 0 || r.principalComponent > 0 || r.interestComponent > 0);
                  }).length;
                  if (countSoFar < mIdx) fAmt += 50;
                  mIdx++;
                }
              }
              const effectiveFine = Math.max(viewedLoan.fineAmount || 0, fAmt);
              const effectiveTotalLoan = (viewedLoan.amountRequested || 0) + effectiveFine;
              return (
                <>
                  <div style={{ background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Loan Taken Amount</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>₹{viewedLoan.amountRequested.toLocaleString('en-IN')}</span>
                  </div>
                  {effectiveFine > 0 && (
                    <div style={{ background: '#fef2f2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                      <span style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 700, display: 'block' }}>Missed Payment Fine</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#dc2626' }}>₹{effectiveFine.toLocaleString('en-IN')} <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>(₹50/mo)</span></span>
                    </div>
                  )}
                  {effectiveFine > 0 && (
                    <div style={{ background: '#eff6ff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                      <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 700, display: 'block' }}>Total Adjusted Loan</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1d4ed8' }}>₹{effectiveTotalLoan.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </>
              );
            })()}
            <div style={{ background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, display: 'block' }}>Principal Paid</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#15803d' }}>₹{(viewedLoan.totalPrincipalPaid || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <span style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 600, display: 'block' }}>Interest Paid</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1d4ed8' }}>₹{(viewedLoan.totalInterestPaid || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
              <span style={{ fontSize: '0.75rem', color: '#c2410c', fontWeight: 600, display: 'block' }}>Interest Rate & Tenure</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#9a3412' }}>{viewedLoan.interestRate}% • {viewedLoan.tenureMonths} Mo</span>
            </div>
          </div>

          {/* Repayment Grid / Kudumbashree Passbook Register Table */}
          <div style={{ padding: '20px 24px' }}>
            {(() => {
              // Build all entries with accurate running balance including Top-Up Disbursements & Missed Payment Fines
              const buildAllLedgerEntries = (loan) => {
                if (!loan) return [];
                const rawEntries = [];

                const sortedRepayments = [...(loan.repayments || [])].sort((a, b) => new Date(a.repaymentDate) - new Date(b.repaymentDate));

                let totalTopUps = 0;
                sortedRepayments.forEach(r => {
                  if (r.principalComponent < 0) {
                    totalTopUps += Math.abs(r.principalComponent);
                  }
                });

                const initialDisbursed = Math.max(0, (loan.amountRequested || 0) - totalTopUps);
                const startDate = loan.disbursedDate ? new Date(loan.disbursedDate) : (loan.appliedDate ? new Date(loan.appliedDate) : new Date());

                // Initial Loan Disbursement Entry
                rawEntries.push({
                  id: `disb-${loan.loanId}`,
                  date: startDate,
                  loanDisbursed: initialDisbursed,
                  fineCharged: 0,
                  principalRepaid: 0,
                  interestPaid: 0,
                  receiptNumber: `DISB-LN-#${loan.loanId} (Disbursed)`,
                  isDisbursement: true,
                  isFine: false
                });

                // Identify completed 1-month intervals for missed payment fines
                if (loan.disbursedDate && (loan.status === 'Disbursed' || loan.status === 'Closed')) {
                  const maxRepaymentTime = sortedRepayments.length > 0 
                    ? Math.max(...sortedRepayments.map(r => new Date(r.repaymentDate).getTime()))
                    : 0;
                  const cutoffTime = Math.max(Date.now(), maxRepaymentTime);
                  let monthIdx = 1;

                  while (true) {
                    const intervalEnd = new Date(startDate);
                    intervalEnd.setMonth(intervalEnd.getMonth() + monthIdx);

                    if (intervalEnd.getTime() > cutoffTime) break;

                    const countSoFar = sortedRepayments.filter(r => {
                      const rDate = new Date(r.repaymentDate);
                      return rDate <= intervalEnd && (r.amountPaid > 0 || r.principalComponent > 0 || r.interestComponent > 0);
                    }).length;

                    if (countSoFar < monthIdx) {
                      rawEntries.push({
                        id: `fine-m${monthIdx}-${loan.loanId}`,
                        date: intervalEnd,
                        loanDisbursed: 0,
                        fineCharged: 50,
                        principalRepaid: 0,
                        interestPaid: 0,
                        receiptNumber: `PENALTY-FINE-M${monthIdx} (₹50 Missed Payment Fine)`,
                        isDisbursement: false,
                        isFine: true
                      });
                    }

                    monthIdx++;
                  }
                }

                // Add Repayments & Top-Up Disbursements
                sortedRepayments.forEach((r, idx) => {
                  if (r.principalComponent < 0) {
                    const topUpAmt = Math.abs(r.principalComponent);
                    rawEntries.push({
                      id: r.repaymentId || `topup-${idx}`,
                      date: new Date(r.repaymentDate),
                      loanDisbursed: topUpAmt,
                      fineCharged: 0,
                      principalRepaid: 0,
                      interestPaid: 0,
                      receiptNumber: r.receiptNumber || `DISB-LN-#${loan.loanId}-TOPUP (Disbursed)`,
                      isDisbursement: true,
                      isFine: false
                    });
                  } else {
                    const principalPaid = r.principalComponent || 0;
                    const receiptStr = r.receiptNumber || '';
                    const isDeposited = r.isBankDeposited || (r.paymentMode || '').toLowerCase().includes('bank deposited');
                    rawEntries.push({
                      id: r.repaymentId || `repay-${idx}`,
                      date: new Date(r.repaymentDate),
                      loanDisbursed: 0,
                      fineCharged: 0,
                      principalRepaid: principalPaid,
                      interestPaid: r.interestComponent || 0,
                      receiptNumber: receiptStr ? (isDeposited ? `${receiptStr} ✓ (In Bank)` : `${receiptStr} (In Hand)`) : 'REC-LN',
                      isDisbursement: false,
                      isFine: false
                    });
                  }
                });

                // Sort chronologically by date
                rawEntries.sort((a, b) => {
                  if (a.date.getTime() !== b.date.getTime()) {
                    return a.date - b.date;
                  }
                  const typeOrder = e => e.isDisbursement ? 0 : e.isFine ? 1 : 2;
                  return typeOrder(a) - typeOrder(b);
                });

                // Compute running balance row by row
                let runningBal = 0;
                const entriesWithBalance = rawEntries.map(entry => {
                  if (entry.isDisbursement) {
                    runningBal += entry.loanDisbursed;
                  } else if (entry.isFine) {
                    runningBal += entry.fineCharged;
                  } else {
                    runningBal = Math.max(0, runningBal - entry.principalRepaid);
                  }
                  return {
                    ...entry,
                    balance: runningBal
                  };
                });

                if (!ledgerSortAsc) {
                  entriesWithBalance.reverse(); // Newest first
                }

                return entriesWithBalance;
              };

              const PAGE_SIZE = 6;
              const allEntries = buildAllLedgerEntries(viewedLoan);
              const totalPages = Math.max(1, Math.ceil(allEntries.length / PAGE_SIZE));
              const currentPage = Math.min(ledgerPage, totalPages);
              const startIndex = (currentPage - 1) * PAGE_SIZE;
              const pageEntries = allEntries.slice(startIndex, startIndex + PAGE_SIZE);

              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📖</span> Loan Passbook Ledger
                      </h4>
                      <small style={{ color: '#64748b', fontSize: '0.78rem' }}>
                        6 entries per page • Showing {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, allEntries.length)} of {allEntries.length} entries
                      </small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Button 1: Sort Button */}
                      <button
                        onClick={() => {
                          setLedgerSortAsc(!ledgerSortAsc);
                          setLedgerPage(1);
                        }}
                        style={{
                          background: '#f1f5f9',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Click to toggle sorting order (Oldest / Newest)"
                      >
                        <span>⇅ Sort:</span>
                        <span style={{ color: '#059669' }}>{ledgerSortAsc ? 'Oldest First ⬆' : 'Newest First ⬇'}</span>
                      </button>

                      {/* Button 2: Previous Page Button */}
                      <button
                        onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                          background: currentPage === 1 ? '#f1f5f9' : '#ffffff',
                          color: currentPage === 1 ? '#cbd5e1' : '#0f172a',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                        }}
                        title="Go to previous ledger page"
                      >
                        ◀ Previous Page
                      </button>

                      {/* Page Counter Badge */}
                      <span style={{ fontSize: '0.78rem', color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 10px', borderRadius: '12px', fontWeight: 700 }}>
                        Page {currentPage} of {totalPages}
                      </span>

                      {/* Button 3: Next Page Button */}
                      <button
                        onClick={() => setLedgerPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          background: currentPage === totalPages ? '#f1f5f9' : '#ffffff',
                          color: currentPage === totalPages ? '#cbd5e1' : '#0f172a',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                        }}
                        title="Go to next ledger page"
                      >
                        Next Page ▶
                      </button>

                      {(viewedLoan.status === 'Disbursed' || viewedLoan.status === 'Approved') && (
                        <button
                          onClick={() => openPayModal(viewedLoan, 'Combined')}
                          style={{
                            background: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '16px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          + Pay Installment
                        </button>
                      )}
                    </div>
                  </div>

                  {/* kudumbashree Passbook Ledger Table */}
                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #059669', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                      <thead>
                        <tr style={{ background: '#0c382e', color: '#ffffff', textAlign: 'left', borderBottom: '2px solid #059669' }}>
                          <th style={{ padding: '12px 14px', color: '#ffffff', fontWeight: 700 }}>Date</th>
                          <th style={{ padding: '12px 14px', color: '#ffffff', fontWeight: 700 }}>Loan Disbursed</th>
                          <th style={{ padding: '12px 14px', color: '#ffffff', fontWeight: 700 }}>Fine Charged</th>
                          <th style={{ padding: '12px 14px', color: '#ffffff', fontWeight: 700 }}>Principal Repaid</th>
                          <th style={{ padding: '12px 14px', color: '#ffffff', fontWeight: 700 }}>Interest Paid</th>
                          <th style={{ padding: '12px 14px', color: '#ffffff', fontWeight: 700 }}>Remaining Balance</th>
                          <th style={{ padding: '12px 14px', color: '#ffffff', fontWeight: 700 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <span>Secretary Signature / Receipt #</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                                  disabled={currentPage === 1}
                                  style={{ background: currentPage === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '4px', padding: '2px 8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                  title="Previous Page"
                                >
                                  &lt;
                                </button>
                                <button
                                  onClick={() => setLedgerPage(p => Math.min(totalPages, p + 1))}
                                  disabled={currentPage === totalPages}
                                  style={{ background: currentPage === totalPages ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '4px', padding: '2px 8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                                  title="Next Page"
                                >
                                  &gt;
                                </button>
                              </div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageEntries.map((entry, idx) => (
                          <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: entry.isDisbursement ? '#f0fdf4' : entry.isFine ? '#fef2f2' : idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                            <td style={{ padding: '12px 14px', fontWeight: entry.isDisbursement || entry.isFine ? 600 : 400, color: entry.isDisbursement ? '#166534' : entry.isFine ? '#b91c1c' : '#334155' }}>
                              {entry.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ padding: '12px 14px', color: entry.loanDisbursed > 0 ? '#15803d' : '#94a3b8', fontWeight: entry.loanDisbursed > 0 ? 800 : 400 }}>
                              {entry.loanDisbursed > 0 ? `₹${entry.loanDisbursed.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td style={{ padding: '12px 14px', color: entry.fineCharged > 0 ? '#dc2626' : '#94a3b8', fontWeight: entry.fineCharged > 0 ? 800 : 400 }}>
                              {entry.fineCharged > 0 ? `₹${entry.fineCharged.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td style={{ padding: '12px 14px', color: entry.principalRepaid > 0 ? '#15803d' : '#94a3b8', fontWeight: entry.principalRepaid > 0 ? 700 : 400 }}>
                              {entry.principalRepaid > 0 ? `₹${entry.principalRepaid.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td style={{ padding: '12px 14px', color: entry.interestPaid > 0 ? '#1d4ed8' : '#94a3b8', fontWeight: entry.interestPaid > 0 ? 700 : 400 }}>
                              {entry.interestPaid > 0 ? `₹${entry.interestPaid.toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: entry.balance > 0 ? '#dc2626' : '#15803d' }}>
                              ₹{entry.balance.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '12px 14px', color: entry.isDisbursement ? '#166534' : entry.isFine ? '#b91c1c' : '#0f172a', fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 600 }}>
                              {entry.receiptNumber}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      ) : null}

      {/* ── Section 2: Form & All Loans History ── */}
      <div className="mem-loan-content" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Left Column: Apply for Loan Form */}
        <div className="mem-loan-left" style={{ flex: '1 1 300px', maxWidth: '400px' }}>
          <div className="mem-card apply-loan-card">
            <div className="mem-card__header" style={{ background: '#059669', color: 'white', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: '1.1rem' }}>Apply for a New Loan</h5>
              {activeLoan && activeLoanRepaymentCount >= 4 && (
                <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  4+ Repayments Completed
                </span>
              )}
            </div>
            <div className="mem-card__body" style={{ padding: '20px', background: 'white', borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none' }}>
              {pendingLoan ? (
                <div className="mem-alert mem-alert--warning" style={{ fontSize: '0.9rem' }}>
                  You currently have a <strong>Pending</strong> loan application (#LN-{pendingLoan.loanId} for ₹{pendingLoan.amountRequested.toLocaleString('en-IN')}). Please wait for review before submitting another application.
                </div>
              ) : activeLoan && activeLoanRepaymentCount < 4 ? (
                <div className="mem-alert mem-alert--warning" style={{ fontSize: '0.9rem' }}>
                  You currently have an active <strong>{activeLoan.status}</strong> loan (₹{activeLoan.amountRequested.toLocaleString('en-IN')}). You have completed <strong>{activeLoanRepaymentCount} of 4</strong> required monthly repayments to unlock an additional loan application.
                </div>
              ) : (
                <>
                  {activeLoan && activeLoanRepaymentCount >= 4 && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.82rem', color: '#065f46' }}>
                      🎉 <strong>Additional Loan Unlocked!</strong> You have completed {activeLoanRepaymentCount} repayments on your existing loan (#LN-{activeLoan.loanId}). You can apply for another loan below.
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    <div className="mem-form-group" style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', margin: 0 }}>Amount Requested (₹)</label>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '12px' }}>
                          Available: ₹{unitTotalSavings.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <input 
                        type="number" 
                        name="amountRequested" 
                        value={formData.amountRequested} 
                        onChange={handleChange} 
                        required 
                        min="100"
                        max={unitTotalSavings || undefined}
                        className="mem-input"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: isAmountExceeded ? '2px solid #ef4444' : '1px solid #cbd5e1',
                          borderRadius: '6px',
                          backgroundColor: isAmountExceeded ? '#fef2f2' : 'white',
                          transition: 'all 0.2s ease'
                        }}
                      />
                      {isAmountExceeded ? (
                        <small style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700 }}>
                          <span>⚠️</span> Amount cannot exceed available unit savings (₹{unitTotalSavings.toLocaleString('en-IN')}).
                        </small>
                      ) : (
                        <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                          Maximum eligible loan limit: ₹{unitTotalSavings.toLocaleString('en-IN')} (Net Unit Funds)
                        </small>
                      )}
                    </div>
                    <div className="mem-form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Purpose</label>
                      <textarea 
                        rows={2} 
                        name="purpose" 
                        value={formData.purpose} 
                        onChange={handleChange} 
                        required 
                        minLength="10"
                        className="mem-input"
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <div className="mem-form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Tenure (Months)</label>
                      <input 
                        type="number" 
                        name="tenureMonths" 
                        value={formData.tenureMonths} 
                        onChange={handleChange} 
                        required 
                        min="1"
                        max="120"
                        className="mem-input"
                        style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                    </div>
                    <button type="submit" disabled={submitting || isAmountExceeded} className="mem-btn-primary" style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '6px', background: isAmountExceeded ? '#9ca3af' : '#059669', color: 'white', fontWeight: 600, cursor: (submitting || isAmountExceeded) ? 'not-allowed' : 'pointer' }}>
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: All Loans Applications List */}
        <div className="mem-loan-right" style={{ flex: '2 1 400px' }}>
          <div className="mem-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div className="mem-card__header" style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>All Loan Applications & History</h5>
            </div>
            <div className="mem-card__body" style={{ padding: '20px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading...</div>
              ) : loans.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', margin: 0 }}>No loan history found.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '12px 8px' }}>Date</th>
                        <th style={{ padding: '12px 8px' }}>Amount</th>
                        <th style={{ padding: '12px 8px' }}>Purpose</th>
                        <th style={{ padding: '12px 8px' }}>Status</th>
                        <th style={{ padding: '12px 8px' }}>Outstanding</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map(loan => {
                        const isScheduled = loan.status === 'Disbursed' || loan.status === 'Approved' || loan.status === 'Closed';
                        return (
                          <tr key={loan.loanId} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: selectedLoanId === loan.loanId ? '#f0fdf4' : 'transparent' }}>
                            <td style={{ padding: '12px 8px', color: '#334155' }}>{new Date(loan.appliedDate).toLocaleDateString()}</td>
                            <td style={{ padding: '12px 8px', fontWeight: 600, color: '#0f172a' }}>₹{loan.amountRequested.toLocaleString('en-IN')}</td>
                            <td style={{ padding: '12px 8px', color: '#334155', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={loan.purpose}>{loan.purpose}</td>
                            <td style={{ padding: '12px 8px' }}>{getStatusBadge(loan.status)}</td>
                            <td style={{ padding: '12px 8px' }}>
                              {loan.status === 'Disbursed' ? (
                                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
                                  ₹{(loan.outstandingBalance || 0).toLocaleString('en-IN')}
                                </span>
                              ) : loan.status === 'Closed' ? (
                                <span style={{ color: '#059669', fontWeight: 600 }}>₹0 (Settled)</span>
                              ) : '-'}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              {isScheduled ? (
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  {(loan.status === 'Disbursed' || loan.status === 'Approved') && (
                                    <button
                                      onClick={() => openPayModal(loan)}
                                      style={{
                                        background: '#059669',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '14px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Pay
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedLoanId(loan.loanId);
                                      setSelectedModalLoan(loan);
                                    }}
                                    style={{
                                      background: selectedLoanId === loan.loanId ? '#047857' : '#ecfdf5',
                                      color: selectedLoanId === loan.loanId ? '#ffffff' : '#047857',
                                      border: '1px solid #a7f3d0',
                                      padding: '5px 10px',
                                      borderRadius: '14px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    title="Inspect repayment grid and receipts statement"
                                  >
                                    View
                                  </button>
                                </div>
                              ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Pending Review</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pay Installment Modal ── */}
      {showPayModal && payModalLoan && (
        <div className="mem-modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="mem-modal" style={{ maxWidth: '500px', width: '90%', borderRadius: '12px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="mem-modal__header" style={{ background: '#0c382e', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="mem-modal__title" style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Pay Monthly Loan Installment
                </h3>
                <small style={{ opacity: 0.85 }}>Loan #{payModalLoan.loanId} • {payModalLoan.purpose}</small>
              </div>
              <button className="mem-modal__close" style={{ color: 'white', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowPayModal(false)}>&times;</button>
            </div>

            <form onSubmit={handlePayInstallmentSubmit} style={{ padding: '20px' }}>
              {(() => {
                const outstanding = payModalLoan.outstandingBalance || 0;
                const interestDue = Math.round(outstanding * ((payModalLoan.interestRate || 1) / 100));
                const maxPayable = outstanding + interestDue;
                return (
                  <>
                    {/* Financial KPI Summary Box */}
                    <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Net Outstanding Balance</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626' }}>
                          ₹{outstanding.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Interest Due ({payModalLoan.interestRate || 1}%)</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#d97706' }}>
                          ₹{interestDue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Max Total Payoff</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#047857' }}>
                          ₹{maxPayable.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Repayment Type Selector (Kudumbashree Flexible Repayment Modes) */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                        Select Repayment Option
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div
                          onClick={() => handleRepaymentTypeSelect('Combined')}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: repaymentType === 'Combined' ? '2px solid #059669' : '1px solid #cbd5e1',
                            background: repaymentType === 'Combined' ? '#ecfdf5' : '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>🟢 Combined EMI</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Principal + Interest</span>
                        </div>

                        <div
                          onClick={() => handleRepaymentTypeSelect('InterestOnly')}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: repaymentType === 'InterestOnly' ? '2px solid #d97706' : '1px solid #cbd5e1',
                            background: repaymentType === 'InterestOnly' ? '#fffbeb' : '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309', display: 'block' }}>🟡 Interest Only</span>
                          <span style={{ fontSize: '0.7rem', color: '#78350f' }}>Interest Only (₹{interestDue})</span>
                        </div>

                        <div
                          onClick={() => handleRepaymentTypeSelect('PrincipalOnly')}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: repaymentType === 'PrincipalOnly' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            background: repaymentType === 'PrincipalOnly' ? '#eff6ff' : '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1d4ed8', display: 'block' }}>🔵 Principal Only</span>
                          <span style={{ fontSize: '0.7rem', color: '#1e40af' }}>Principal Repay Only</span>
                        </div>

                        <div
                          onClick={() => handleRepaymentTypeSelect('FullPayoff')}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: repaymentType === 'FullPayoff' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                            background: repaymentType === 'FullPayoff' ? '#f5f3ff' : '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6d28d9', display: 'block' }}>⚡ Rest of Amount</span>
                          <span style={{ fontSize: '0.7rem', color: '#5b21b6' }}>Early Payoff (₹{maxPayable})</span>
                        </div>
                      </div>
                    </div>

                    {/* Installment Amount Input */}
                    <div className="mem-form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Payment Amount (₹)
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        max={maxPayable > 0 ? maxPayable : 200000}
                        step="any"
                        value={installmentInput}
                        onChange={e => setInstallmentInput(e.target.value)}
                        required
                        className="mem-input"
                        style={{ width: '100%', padding: '12px', fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      />
                      <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                        {repaymentType === 'InterestOnly' && `Paying monthly interest of ₹${interestDue}. Outstanding principal balance will remain ₹${outstanding.toLocaleString('en-IN')}.`}
                        {repaymentType === 'PrincipalOnly' && `Paying principal repayment of ₹${installmentInput || 0}. Remaining principal balance will be reduced.`}
                        {repaymentType === 'FullPayoff' && `Paying total remaining balance of ₹${outstanding.toLocaleString('en-IN')} + interest ₹${interestDue} to close loan early.`}
                        {repaymentType === 'Combined' && `Amount will be split into interest due (₹${interestDue}) and principal repayment.`}
                      </small>
                    </div>
                  </>
                );
              })()}

              {/* Payment Mode Selector */}
              <div className="mem-form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                  Select Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div
                    onClick={() => setPaymentMode('Online')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: paymentMode === 'Online' ? '2px solid #059669' : '1px solid #cbd5e1',
                      background: paymentMode === 'Online' ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>💳 Online Payment</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Razorpay / UPI / Cards</span>
                  </div>
                  <div
                    onClick={() => setPaymentMode('Cash')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: paymentMode === 'Cash' ? '2px solid #059669' : '1px solid #cbd5e1',
                      background: paymentMode === 'Cash' ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>💵 Cash / Transfer</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Direct Treasurer Receipt</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPayingInstallment}
                className="mem-btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: isPayingInstallment ? 'not-allowed' : 'pointer' }}
              >
                {isPayingInstallment ? 'Processing Payment...' : `Pay ₹${parseFloat(installmentInput || 0).toLocaleString('en-IN')} Now`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Repayment Info Modal (Optional Detail View) ── */}
      {selectedModalLoan && (
        <div className="mem-modal-overlay" onClick={() => setSelectedModalLoan(null)}>
          <div className="mem-modal" style={{ maxWidth: '680px', width: '90%', borderRadius: '12px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div className="mem-modal__header" style={{ background: '#059669', color: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="mem-modal__title" style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Loan Repayment Info & Receipts
                </h3>
                <small style={{ opacity: 0.9 }}>Loan ID #{selectedModalLoan.loanId} • {selectedModalLoan.purpose}</small>
              </div>
              <button className="mem-modal__close" style={{ color: 'white', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setSelectedModalLoan(null)}>&times;</button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Loan Amount</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>₹{selectedModalLoan.amountRequested.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block', fontWeight: 600 }}>Principal Paid</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d' }}>₹{(selectedModalLoan.totalPrincipalPaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.75rem', color: '#1e40af', display: 'block', fontWeight: 600 }}>Interest Paid</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1d4ed8' }}>₹{(selectedModalLoan.totalInterestPaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                  <span style={{ fontSize: '0.75rem', color: '#991b1b', display: 'block', fontWeight: 600 }}>Outstanding</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#dc2626' }}>₹{(selectedModalLoan.outstandingBalance || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <h4 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '12px', fontWeight: 700 }}>Recorded Repayment Receipts</h4>
              {(!selectedModalLoan.repayments || selectedModalLoan.repayments.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '30px 15px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No repayment receipts recorded yet for this loan.</p>
                  <small style={{ color: '#94a3b8' }}>Repayments recorded by the Treasurer or paid online will appear here automatically with official receipt numbers.</small>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '10px 8px' }}>Receipt #</th>
                        <th style={{ padding: '10px 8px' }}>Date</th>
                        <th style={{ padding: '10px 8px' }}>Principal</th>
                        <th style={{ padding: '10px 8px' }}>Interest</th>
                        <th style={{ padding: '10px 8px' }}>Total Paid</th>
                        <th style={{ padding: '10px 8px' }}>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedModalLoan.repayments.map(r => (
                        <tr key={r.repaymentId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 8px', fontWeight: 600, color: '#0f172a' }}>{r.receiptNumber}</td>
                          <td style={{ padding: '10px 8px', color: '#475569' }}>{new Date(r.repaymentDate).toLocaleDateString('en-IN')}</td>
                          <td style={{ padding: '10px 8px', color: '#166534', fontWeight: 600 }}>₹{r.principalComponent.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 8px', color: '#1d4ed8' }}>₹{r.interestComponent.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 8px', fontWeight: 700, color: '#0f172a' }}>₹{r.amountPaid.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 8px', color: '#64748b' }}>{r.recordedByName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repayment Schedule Modal */}
      <RepaymentScheduleModal
        loanId={viewedLoan?.loanId}
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
    </div>
  );
};

export default MemberLoanPage;
