import React, { useState, useEffect } from 'react';
import loanService from '../../../services/loanService';
import { depositCashToBank } from '../../../services/api';
import RepaymentScheduleModal from '../../../components/RepaymentScheduleModal';

const TreasurerLoanOps = ({ onDepositSuccess }) => {
  const [activeTab, setActiveTab] = useState('disburse');
  const [pendingLoans, setPendingLoans] = useState([]);
  const [approvedLoans, setApprovedLoans] = useState([]);
  const [activeLoans, setActiveLoans] = useState([]);
  const [unitRepayments, setUnitRepayments] = useState([]);
  const [depositLoading, setDepositLoading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  // Repayment Schedule Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleLoanId, setScheduleLoanId] = useState(null);
  
  // Current user info
  const currentUser = React.useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }, []);

  // Repayment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [installmentDueInfo, setInstallmentDueInfo] = useState(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [allLoans, setAllLoans] = useState([]);
  const [loanSummary, setLoanSummary] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');

  useEffect(() => {
    fetchPendingLoans();
    fetchApprovedLoans();
    fetchUnitRepayments();
  }, []);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingLoans();
    } else if (activeTab === 'disburse') {
      fetchApprovedLoans();
    } else {
      fetchDisbursedLoans();
      fetchUnitRepayments();
    }
  }, [activeTab]);

  const fetchPendingLoans = async () => {
    try {
      setLoading(true);
      const data = await loanService.getPendingLoans();
      setPendingLoans(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load pending loan applications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedLoans = async () => {
    try {
      setLoading(true);
      const data = await loanService.getApprovedLoans();
      setApprovedLoans(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load approved loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisbursedLoans = async () => {
    try {
      setLoading(true);
      const data = await loanService.monitorLoans();
      if (data && data.loans) {
        setAllLoans(data.loans);
        setLoanSummary(data);
        setActiveLoans(data.loans.filter(l => l.status === 'Disbursed'));
      }
      setError(null);
    } catch (err) {
      setError("Failed to load loan records from database.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnitRepayments = async () => {
    try {
      const data = await loanService.getUnitLoanRepayments();
      if (Array.isArray(data)) {
        setUnitRepayments(data);
      }
    } catch (e) {
      console.error('Failed to load unit repayments:', e);
    }
  };

  const handleDepositSingleRepayment = async (repayId, amount) => {
    try {
      setDepositLoading(repayId);
      await depositCashToBank({
        repaymentId: repayId,
        amount: parseFloat(amount) || 0,
        unitId: currentUser?.unitId || 1
      });
      alert('Loan repayment deposited into Unit Bank Account successfully!');
      if (onDepositSuccess) onDepositSuccess();
      fetchDisbursedLoans();
      fetchUnitRepayments();
      if (receipt && (receipt.repaymentId === repayId || receipt.receiptNumber)) {
        setReceipt(prev => ({ ...prev, isBankDeposited: true, paymentMode: 'Cash (Bank Deposited)' }));
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to deposit repayment to bank');
    } finally {
      setDepositLoading(null);
    }
  };

  const handleReview = async (loanId, status) => {
    try {
      setActionLoading(loanId);
      await loanService.reviewLoan(loanId, status);
      fetchPendingLoans();
      if (status === 'Approved') {
        fetchApprovedLoans();
      }
    } catch (err) {
      alert(err.message || 'Failed to review loan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisburse = async (loanId) => {
    if (!window.confirm('Are you sure you want to disburse this loan? This will transfer funds.')) return;
    try {
      setLoading(true);
      await loanService.disburseLoan(loanId);
      alert('Loan disbursed successfully!');
      fetchApprovedLoans();
    } catch (err) {
      alert(err.message || 'Failed to disburse loan');
    } finally {
      setLoading(false);
    }
  };

  const [repaymentType, setRepaymentType] = useState('Combined'); // 'Combined', 'InterestOnly', 'PrincipalOnly', 'FullPayoff'

  const handleOpenRepayment = async (loan, initialType = 'Combined') => {
    setSelectedLoan(loan);
    setRepaymentType(initialType);
    setReceipt(null);
    try {
      const dueInfo = await loanService.getLoanInstallmentDue(loan.loanId);
      setInstallmentDueInfo(dueInfo);

      const outstanding = dueInfo.remainingBalance ?? loan.outstandingBalance ?? 0;
      const interestDue = dueInfo.currentMonthInterestDue ?? Math.round(outstanding * 0.01);
      const principalDue = dueInfo.fixedPrincipalDue ?? Math.round((loan.amountRequested || 0) / (loan.tenureMonths || 12));

      if (initialType === 'InterestOnly') {
        setAmountPaid(interestDue.toString());
      } else if (initialType === 'PrincipalOnly') {
        setAmountPaid(principalDue.toString());
      } else if (initialType === 'FullPayoff') {
        setAmountPaid((outstanding + interestDue).toString());
      } else {
        setAmountPaid((dueInfo.totalInstallmentDue || principalDue + interestDue).toString());
      }
    } catch (err) {
      const monthlyInterestDue = Math.round((loan.outstandingBalance || 0) * ((loan.interestRate || 1) / 100));
      const monthlyPrincipal = Math.round((loan.amountRequested || 0) / (loan.tenureMonths || 12));
      const suggestedTotal = monthlyPrincipal + monthlyInterestDue;
      
      setInstallmentDueInfo({
        remainingBalance: loan.outstandingBalance || 0,
        fixedPrincipalDue: monthlyPrincipal,
        currentMonthInterestDue: monthlyInterestDue,
        totalInstallmentDue: suggestedTotal,
        currentInstallmentNumber: 1,
        totalTenureMonths: loan.tenureMonths || 12
      });

      if (initialType === 'InterestOnly') setAmountPaid(monthlyInterestDue.toString());
      else if (initialType === 'PrincipalOnly') setAmountPaid(monthlyPrincipal.toString());
      else if (initialType === 'FullPayoff') setAmountPaid(((loan.outstandingBalance || 0) + monthlyInterestDue).toString());
      else setAmountPaid(suggestedTotal.toString());
    }
    setShowModal(true);
  };

  const handleRepaymentTypeSelect = (type) => {
    setRepaymentType(type);
    if (!selectedLoan) return;

    const outstanding = installmentDueInfo?.remainingBalance ?? selectedLoan.outstandingBalance ?? 0;
    const interestDue = installmentDueInfo?.currentMonthInterestDue ?? Math.round(outstanding * 0.01);
    const principalDue = installmentDueInfo?.fixedPrincipalDue ?? Math.round(selectedLoan.amountRequested / selectedLoan.tenureMonths);

    if (type === 'InterestOnly') setAmountPaid(interestDue.toString());
    else if (type === 'PrincipalOnly') setAmountPaid(principalDue.toString());
    else if (type === 'FullPayoff') setAmountPaid((outstanding + interestDue).toString());
    else setAmountPaid((principalDue + interestDue).toString());
  };

  const handleRecordRepayment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const amountPaidVal = parseFloat(amountPaid);
      const payload = {
        amountPaid: amountPaidVal,
        repaymentType: repaymentType,
        principalComponent: repaymentType === 'PrincipalOnly' ? amountPaidVal : null,
        interestComponent: repaymentType === 'PrincipalOnly' ? 0 : (repaymentType === 'InterestOnly' ? amountPaidVal : null)
      };

      const res = await loanService.recordRepayment(selectedLoan.loanId, payload);
      setReceipt(res);
      fetchDisbursedLoans();
      fetchUnitRepayments();
      if (onDepositSuccess) onDepositSuccess();
    } catch (err) {
      alert(err.message || 'Failed to record repayment');
    } finally {
      setSubmitting(false);
    }
  };

  const openScheduleModal = (loanId) => {
    setScheduleLoanId(loanId);
    setScheduleModalOpen(true);
  };

  const tabStyle = (isActive) => ({
    padding: '12px 24px',
    cursor: 'pointer',
    borderBottom: isActive ? '3px solid #059669' : '3px solid transparent',
    color: isActive ? '#059669' : '#64748b',
    fontWeight: isActive ? 700 : 500,
    background: 'none',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    fontSize: '0.95rem',
    transition: 'all 0.2s'
  });

  const filteredHistoryLoans = allLoans.filter(l => {
    const matchesFilter = historyFilter === 'all' || (l.status || '').toLowerCase() === historyFilter.toLowerCase();
    const matchesSearch = !historySearch || 
      (l.memberName || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      String(l.loanId).includes(historySearch) ||
      (l.purpose || '').toLowerCase().includes(historySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate live breakdown split for modal
  const inputVal = parseFloat(amountPaid) || 0;
  const interestDue = installmentDueInfo?.currentMonthInterestDue ?? 0;
  const interestSplit = Math.min(interestDue, inputVal);
  const principalSplit = Math.max(0, inputVal - interestSplit);

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', margin: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>
            Community Loan Management & Repayment Audit
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Kudumbashree Diminishing Balance Model (Fixed Monthly Principal + 1% Monthly Interest).
          </p>
        </div>
      </div>
      
      {error && (
        <div style={{ padding: '16px', background: '#fef3c7', color: '#92400e', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', gap: '8px' }}>
        <button style={tabStyle(activeTab === 'disburse')} onClick={() => setActiveTab('disburse')}>
          Pending Disbursement ({approvedLoans.length})
        </button>
        <button style={tabStyle(activeTab === 'emi')} onClick={() => setActiveTab('emi')}>
          EMI Collection ({activeLoans.length})
        </button>
        <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
          Loan & Repayment History ({allLoans.length})
        </button>
      </div>

      <div>
        {activeTab === 'pending' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading pending loan applications...</div>
          ) : pendingLoans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.3 }}>📋</div>
              <p style={{ margin: 0, fontSize: '1rem' }}>No pending loan applications requiring Treasurer review.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr style={{ textAlign: 'left', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Applicant</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Amount Requested</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Purpose</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tenure</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Applied Date</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLoans.map(loan => {
                    const isSelf = currentUser && (currentUser.userId === loan.userId || currentUser.UserId === loan.userId);

                    return (
                      <tr key={loan.loanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{loan.memberName}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Member ID: {loan.userId}</div>
                        </td>
                        <td style={{ padding: '16px 12px', fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                          ₹{loan.amountRequested.toLocaleString()}
                        </td>
                        <td style={{ padding: '16px 12px', color: '#334155' }}>{loan.purpose}</td>
                        <td style={{ padding: '16px 12px', color: '#334155' }}>{loan.tenureMonths} Months</td>
                        <td style={{ padding: '16px 12px', color: '#334155' }}>
                          {new Date(loan.appliedDate).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                          {isSelf ? (
                            <span style={{ display: 'inline-block', padding: '6px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                              Needs President Review
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                style={{ padding: '6px 16px', border: '1px solid #f87171', background: 'white', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                disabled={actionLoading === loan.loanId}
                                onClick={() => handleReview(loan.loanId, 'Rejected')}
                              >
                                Reject
                              </button>
                              <button 
                                style={{ padding: '6px 16px', border: 'none', background: '#10b981', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                disabled={actionLoading === loan.loanId}
                                onClick={() => handleReview(loan.loanId, 'Approved')}
                              >
                                {actionLoading === loan.loanId ? '...' : 'Approve'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'disburse' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
          ) : approvedLoans.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b', margin: 0 }}>No approved loans waiting for disbursement.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr style={{ textAlign: 'left', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Applicant</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Amount</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Purpose</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Approved By</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedLoans.map(loan => (
                    <tr key={loan.loanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{loan.memberName}</td>
                      <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a' }}>₹{loan.amountRequested.toLocaleString()}</td>
                      <td style={{ padding: '16px', color: '#334155' }}>{loan.purpose}</td>
                      <td style={{ padding: '16px', color: '#334155' }}>{loan.approvedByName}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                          onClick={() => handleDisburse(loan.loanId)}
                        >
                          Disburse Funds
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'emi' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
          ) : activeLoans.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#64748b', margin: 0 }}>No active disbursed loans.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr style={{ textAlign: 'left', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Applicant</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Loan Amount</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Outstanding</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Interest Rate</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLoans.map(loan => (
                    <tr key={loan.loanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px', fontWeight: 600, color: '#0f172a' }}>{loan.memberName}</td>
                      <td style={{ padding: '16px', color: '#334155' }}>₹{loan.amountRequested.toLocaleString()}</td>
                      <td style={{ padding: '16px', fontWeight: 700, color: '#ef4444' }}>₹{loan.outstandingBalance.toLocaleString()}</td>
                      <td style={{ padding: '16px', color: '#334155' }}>{loan.interestRate || 1}% / mo</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button 
                            style={{ padding: '6px 12px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                            onClick={() => openScheduleModal(loan.loanId)}
                          >
                            📅 Schedule
                          </button>
                          <button 
                            style={{ padding: '6px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                            onClick={() => handleOpenRepayment(loan)}
                          >
                            Collect EMI
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── LOAN & REPAYMENT HISTORY TAB VIEW ── */}
        {activeTab === 'history' && (
          <div>
            {/* Undeposited EMI in Treasurer Hand Alert Banner */}
            {(() => {
              const undepositedRepayments = unitRepayments.filter(r => !r.isBankDeposited && !(r.paymentMode || '').toLowerCase().includes('bank deposited'));
              const totalUndeposited = undepositedRepayments.reduce((acc, r) => acc + (parseFloat(r.amountPaid) || 0), 0);

              if (undepositedRepayments.length === 0) return null;

              return (
                <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h5 style={{ margin: 0, color: '#92400e', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>💼</span> EMI Repayments In Hand (₹{totalUndeposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                      </h5>
                      <p style={{ margin: '4px 0 0 0', color: '#78350f', fontSize: '0.84rem' }}>
                        {undepositedRepayments.length} loan installment(s) collected from members are in Treasury custody. Deposit them to show in the official Unit Bank Account balance.
                      </p>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                      <thead>
                        <tr style={{ background: '#fef3c7', textAlign: 'left', color: '#78350f' }}>
                          <th style={{ padding: '8px 12px' }}>Borrower</th>
                          <th style={{ padding: '8px 12px' }}>Receipt #</th>
                          <th style={{ padding: '8px 12px' }}>Amount</th>
                          <th style={{ padding: '8px 12px' }}>Date</th>
                          <th style={{ padding: '8px 12px' }}>Mode</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {undepositedRepayments.map(r => (
                          <tr key={r.repaymentId} style={{ borderBottom: '1px solid #fed7aa' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.borrowerName}</td>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{r.receiptNumber}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 800, color: '#059669' }}>₹{r.amountPaid}</td>
                            <td style={{ padding: '8px 12px' }}>{new Date(r.repaymentDate).toLocaleDateString()}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, fontSize: '0.75rem' }}>
                                {r.paymentMode || 'Cash'} (In Hand)
                              </span>
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleDepositSingleRepayment(r.repaymentId, r.amountPaid)}
                                disabled={depositLoading === r.repaymentId}
                                style={{
                                  background: '#0f172a',
                                  color: 'white',
                                  border: 'none',
                                  padding: '5px 14px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {depositLoading === r.repaymentId ? 'Depositing...' : 'Deposit to Bank'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Metric Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Loans</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
                  {loanSummary?.totalLoans || allLoans.length}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Disbursed</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                  ₹{(loanSummary?.totalDisbursed || allLoans.filter(l => l.status === 'Disbursed' || l.status === 'Closed').reduce((a, b) => a + (b.amountRequested || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Outstanding</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
                  ₹{(loanSummary?.totalOutstandingBalance || allLoans.filter(l => l.status === 'Disbursed').reduce((a, b) => a + (b.outstandingBalance || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Interest Earned</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                  ₹{(loanSummary?.totalInterestCollected || allLoans.reduce((a, b) => a + (b.totalInterestPaid || 0), 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'disbursed', 'closed', 'pending', 'approved'].map(st => (
                  <button
                    key={st}
                    onClick={() => setHistoryFilter(st)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: '1px solid #cbd5e1',
                      background: historyFilter === st ? '#0f172a' : '#ffffff',
                      color: historyFilter === st ? '#ffffff' : '#475569',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search borrower or loan ID..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  minWidth: '240px'
                }}
              />
            </div>

            {filteredHistoryLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No matching loans found.</div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr style={{ textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Loan ID</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Borrower</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Principal Paid</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Interest Paid</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Outstanding</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Schedule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistoryLoans.map((loan) => {
                      const isDisbursed = loan.status === 'Disbursed';
                      const isClosed = loan.status === 'Closed';
                      const isPending = loan.status === 'Pending';
                      const isApproved = loan.status === 'Approved';
                      const isRejected = loan.status === 'Rejected';

                      const badgeStyle = isClosed
                        ? { bg: '#f1f5f9', color: '#475569' }
                        : isDisbursed
                        ? { bg: '#dcfce7', color: '#15803d' }
                        : isApproved
                        ? { bg: '#dbeafe', color: '#1d4ed8' }
                        : isPending
                        ? { bg: '#fef3c7', color: '#b45309' }
                        : isRejected
                        ? { bg: '#fee2e2', color: '#b91c1c' }
                        : { bg: '#f1f5f9', color: '#475569' };

                      return (
                        <tr key={loan.loanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                            #LN-{loan.loanId}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{loan.memberName}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{loan.purpose}</div>
                          </td>
                          <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>
                            ₹{(loan.amountRequested || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '14px', fontWeight: 600, color: '#16a34a' }}>
                            ₹{(loan.totalPrincipalPaid || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '14px', fontWeight: 600, color: '#7c3aed' }}>
                            ₹{(loan.totalInterestPaid || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '14px', fontWeight: 800, color: loan.outstandingBalance > 0 ? '#dc2626' : '#16a34a' }}>
                            ₹{(loan.outstandingBalance ?? loan.amountRequested).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: '12px',
                              backgroundColor: badgeStyle.bg,
                              color: badgeStyle.color
                            }}>
                              {loan.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <button
                              onClick={() => openScheduleModal(loan.loanId)}
                              style={{
                                padding: '4px 10px',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              📅 View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repayment Modal (Custom Overlay) */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: 'linear-gradient(135deg, #0c382e 0%, #166534 100%)', color: 'white' }}>
              <h5 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                {receipt ? 'Digital Repayment Receipt' : 'Record EMI Repayment (1% Reducing Model)'}
              </h5>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              {receipt ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3.5rem', color: '#10b981', lineHeight: 1, marginBottom: '8px' }}>✓</div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontWeight: 800 }}>Payment Recorded Successfully!</h4>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
                    Receipt No: <strong style={{ color: '#0f172a' }}>{receipt.receiptNumber}</strong>
                  </p>
                  
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', textAlign: 'left', border: '1px solid #e2e8f0', fontSize: '0.92rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#64748b' }}>Borrower Name:</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{receipt.borrowerName || selectedLoan?.memberName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#64748b' }}>Total Amount Paid:</span>
                      <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>₹{receipt.amountPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>↳ Principal Reduction:</span>
                      <span style={{ fontWeight: 600, color: '#16a34a' }}>₹{receipt.principalPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#64748b' }}>↳ 1% Interest Paid:</span>
                      <span style={{ fontWeight: 600, color: '#d97706' }}>₹{receipt.interestPaid?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#64748b' }}>Remaining Principal Balance:</span>
                      <span style={{ fontWeight: 800, color: receipt.newBalance > 0 ? '#ef4444' : '#15803d' }}>₹{receipt.newBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#64748b' }}>Loan Status:</span>
                      <span style={{ background: receipt.status === 'Closed' ? '#f1f5f9' : '#dcfce7', color: receipt.status === 'Closed' ? '#475569' : '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                        {receipt.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Deposit Status:</span>
                      <span style={{
                        background: receipt.isBankDeposited ? '#dcfce7' : '#fef3c7',
                        color: receipt.isBankDeposited ? '#15803d' : '#b45309',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {receipt.isBankDeposited ? '✓ In Bank' : 'In Hand (Treasury Custody)'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button 
                      onClick={() => window.print()}
                      style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      🖨️ Print Receipt
                    </button>
                    {!receipt.isBankDeposited && receipt.repaymentId && (
                      <button
                        onClick={() => handleDepositSingleRepayment(receipt.repaymentId, receipt.amountPaid)}
                        disabled={depositLoading === receipt.repaymentId}
                        style={{ flex: 1.5, padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {depositLoading === receipt.repaymentId ? 'Depositing...' : '🏦 Deposit to Bank'}
                      </button>
                    )}
                    <button 
                      onClick={() => setShowModal(false)}
                      style={{ flex: 1, padding: '12px', background: '#0c382e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                selectedLoan && (
                  <form onSubmit={handleRecordRepayment}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                      <h6 style={{ margin: '0 0 10px 0', color: '#0f172a', fontSize: '0.95rem', fontWeight: 700 }}>
                        Installment #{installmentDueInfo?.currentInstallmentNumber || 1} of {installmentDueInfo?.totalTenureMonths || selectedLoan.tenureMonths}
                      </h6>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                        <span style={{ color: '#64748b' }}>Borrower Name:</span>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedLoan.memberName}</span>
                      </div>
                      {(installmentDueInfo?.fineAmount > 0 || selectedLoan?.fineAmount > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem', background: '#fef2f2', padding: '4px 8px', borderRadius: '4px' }}>
                          <span style={{ color: '#b91c1c', fontWeight: 600 }}>Missed Payment Fine (₹50/mo):</span>
                          <span style={{ fontWeight: 800, color: '#dc2626' }}>
                            ₹{(installmentDueInfo?.fineAmount ?? selectedLoan?.fineAmount ?? 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                        <span style={{ color: '#64748b' }}>Remaining Balance (Incl. Fine):</span>
                        <span style={{ fontWeight: 800, color: '#ef4444' }}>
                          ₹{(installmentDueInfo?.remainingBalance ?? selectedLoan.outstandingBalance ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                        <span style={{ color: '#64748b' }}>Fixed Principal Component:</span>
                        <span style={{ fontWeight: 600, color: '#059669' }}>
                          ₹{(installmentDueInfo?.fixedPrincipalDue ?? Math.round(selectedLoan.amountRequested / selectedLoan.tenureMonths)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span style={{ color: '#64748b' }}>Current Month 1% Interest Due:</span>
                        <span style={{ fontWeight: 700, color: '#d97706' }}>
                          ₹{(installmentDueInfo?.currentMonthInterestDue ?? Math.round(selectedLoan.outstandingBalance * 0.01)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    {/* Repayment Option Cards */}
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                        Select Collection Mode
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
                          <span style={{ fontSize: '0.7rem', color: '#78350f' }}>Interest Only</span>
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
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6d28d9', display: 'block' }}>⚡ Full Payoff</span>
                          <span style={{ fontSize: '0.7rem', color: '#5b21b6' }}>Early Payoff / Settle</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                        Amount Collected (₹)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '8px 0 0 8px', color: '#475569', fontWeight: 700 }}>₹</span>
                        <input 
                          type="number" 
                          min="1"
                          step="0.01"
                          value={amountPaid} 
                          onChange={(e) => setAmountPaid(e.target.value)} 
                          required 
                          style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '0 8px 8px 0', fontSize: '1rem', fontWeight: 700 }}
                        />
                      </div>

                      {/* Live Allocation Preview Box */}
                      {inputVal > 0 && (
                        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.83rem', color: '#166534', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Split: <strong>Principal ₹{principalSplit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                          <span><strong>1% Interest ₹{interestSplit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitting}
                      style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                    >
                      {submitting ? 'Processing Repayment...' : 'Confirm EMI Repayment'}
                    </button>
                  </form>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Repayment Schedule Modal */}
      <RepaymentScheduleModal
        loanId={scheduleLoanId}
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
    </div>
  );
};

export default TreasurerLoanOps;
