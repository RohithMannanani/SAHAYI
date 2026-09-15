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

  // Pay Installment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payModalLoan, setPayModalLoan] = useState(null);
  const [installmentInput, setInstallmentInput] = useState('');
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

  const openPayModal = (loan) => {
    if (!loan) return;
    setPayModalLoan(loan);
    const outstanding = loan.outstandingBalance || 0;
    const monthlyPrincipal = Math.round(loan.amountRequested / Math.max(1, loan.tenureMonths));
    const principalDue = Math.min(outstanding, monthlyPrincipal);
    const monthlyInterest = Math.round(outstanding * ((loan.interestRate || 1) / 100));
    const suggestedEmi = principalDue + monthlyInterest;
    setInstallmentInput(suggestedEmi > 0 ? suggestedEmi.toString() : '1200');
    setShowPayModal(true);
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
      const res = await loanService.payInstallment(payModalLoan.loanId, amountPaidVal);
      setSuccessMsg(res.message || `Monthly installment of ₹${amountPaidVal.toLocaleString('en-IN')} paid successfully! Receipt #${res.receiptNumber}`);
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

  const activeLoan = loans.find(l => l.status === 'Disbursed' || l.status === 'Approved' || l.status === 'Pending');
  
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
                  ₹{(viewedLoan.outstandingBalance || 0).toLocaleString('en-IN')}
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
            <div style={{ background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>Loan Taken Amount</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>₹{viewedLoan.amountRequested.toLocaleString('en-IN')}</span>
            </div>
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

          {/* Repayment Grid / Ledger Table */}
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📜</span> Repayment Grid & Receipts Ledger
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {scheduledLoans.length > 1 && (
                  <select
                    value={selectedLoanId}
                    onChange={e => setSelectedLoanId(parseInt(e.target.value))}
                    style={{ padding: '4px 10px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#334155' }}
                  >
                    {scheduledLoans.map(l => (
                      <option key={l.loanId} value={l.loanId}>
                        Loan #{l.loanId} (₹{l.amountRequested.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                )}
                {(viewedLoan.status === 'Disbursed' || viewedLoan.status === 'Approved') && (
                  <button
                    onClick={() => openPayModal(viewedLoan)}
                    style={{
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + Pay Installment
                  </button>
                )}
                <span style={{ fontSize: '0.78rem', color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
                  {(viewedLoan.repayments || []).length} Payments Recorded
                </span>
              </div>
            </div>

            {(!viewedLoan.repayments || viewedLoan.repayments.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '36px 20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>Repayment is scheduled. No payment receipts recorded yet for this taken loan.</p>
                <small style={{ color: '#64748b', display: 'block', marginTop: '4px', marginBottom: '12px' }}>
                  Pay your monthly installment directly using the button above or handover to the Unit Treasurer.
                </small>
                {(viewedLoan.status === 'Disbursed' || viewedLoan.status === 'Approved') && (
                  <button
                    onClick={() => openPayModal(viewedLoan)}
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Pay First Installment Now
                  </button>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px' }}>Receipt #</th>
                      <th style={{ padding: '12px 14px' }}>Payment Date</th>
                      <th style={{ padding: '12px 14px' }}>Principal Paid</th>
                      <th style={{ padding: '12px 14px' }}>Interest Paid</th>
                      <th style={{ padding: '12px 14px' }}>Total Amount Paid</th>
                      <th style={{ padding: '12px 14px' }}>Recorded By</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewedLoan.repayments.map((r, idx) => (
                      <tr key={r.repaymentId || idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '0.85rem' }}>{r.receiptNumber}</td>
                        <td style={{ padding: '12px 14px', color: '#334155' }}>{new Date(r.repaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td style={{ padding: '12px 14px', color: '#15803d', fontWeight: 600 }}>₹{r.principalComponent.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 14px', color: '#1d4ed8', fontWeight: 600 }}>₹{r.interestComponent.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>₹{r.amountPaid.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.recordedByName || 'Unit Member / Treasurer'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                            ✓ Recorded
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
            </div>
            <div className="mem-card__body" style={{ padding: '20px', background: 'white', borderRadius: '0 0 12px 12px', border: '1px solid #e2e8f0', borderTop: 'none' }}>
              {activeLoan ? (
                <div className="mem-alert mem-alert--warning" style={{ fontSize: '0.9rem' }}>
                  You currently have a <strong>{activeLoan.status}</strong> loan (₹{activeLoan.amountRequested.toLocaleString('en-IN')}). You cannot apply for a new loan until your existing loan is settled.
                </div>
              ) : (
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

                    {/* Installment Amount Input */}
                    <div className="mem-form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                        Installment Payment Amount (₹)
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
                        Amount will be split automatically into monthly interest due (₹{interestDue}) and principal repayment (₹{Math.max(0, Math.round((parseFloat(installmentInput) || 0) - interestDue))}).
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
