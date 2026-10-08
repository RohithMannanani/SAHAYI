import React, { useState, useEffect } from 'react';
import loanService from '../../../services/loanService';
import RejectLoanModal from './RejectLoanModal';

const PresidentLoanMonitor = () => {
  const [summaryData, setSummaryData] = useState(null);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModalLoan, setRejectModalLoan] = useState(null);
  const [isRejectingLoan, setIsRejectingLoan] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [monitorData, pLoans] = await Promise.all([
        loanService.monitorLoans(),
        loanService.getPresidentPendingLoans()
      ]);
      setSummaryData(monitorData);
      setPendingLoans(pLoans || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch loan monitor data.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewLoan = async (loanId, status) => {
    try {
      setActionLoading(loanId);
      const res = await loanService.presidentReviewLoan(loanId, status);
      if (res?.message) {
        // notification
      }
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to review loan application.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReject = (loan) => {
    setRejectModalLoan(loan);
  };

  const handleConfirmReject = async (loanId, reason) => {
    try {
      setIsRejectingLoan(true);
      const res = await loanService.presidentReviewLoan(loanId, 'Rejected', reason);
      setRejectModalLoan(null);
      alert(res?.message || 'Loan application rejected and SMS notification dispatched!');
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to reject loan application.');
    } finally {
      setIsRejectingLoan(false);
    }
  };

  const getStatusBadge = (status) => {
    let bg = '#f1f5f9';
    let color = '#475569';
    if (status === 'Approved') { bg = '#dcfce7'; color = '#15803d'; }
    if (status === 'Pending') { bg = '#fef3c7'; color = '#b45309'; }
    if (status === 'Disbursed') { bg = '#e0f2fe'; color = '#0369a1'; }
    if (status === 'Closed') { bg = '#e2e8f0'; color = '#334155'; }
    if (status === 'Rejected') { bg = '#fee2e2'; color = '#b91c1c'; }

    return (
      <span style={{ display: 'inline-block', padding: '4px 10px', background: bg, color: color, borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0', padding: '60px', textAlign: 'center', color: '#64748b' }}>
        Loading loan data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0', padding: '24px' }}>
        <div style={{ padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ background: 'white', borderRadius: '12px', border: '2px solid #10b981', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ background: '#ecfdf5', padding: '16px 24px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h5 style={{ margin: 0, fontSize: '1.1rem', color: '#065f46', fontWeight: 700 }}>
              📋 Pending Member Loan Applications (Require President Approval)
            </h5>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#047857' }}>
              Review and grant presidential approval for unit member loan applications.
            </p>
          </div>
          <span style={{ background: '#10b981', color: 'white', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
            {pendingLoans.length} Pending
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {pendingLoans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
              <p style={{ margin: 0, fontWeight: 600 }}>All pending loan applications have been reviewed!</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr style={{ textAlign: 'left', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Applicant</th>
                  <th style={{ padding: '16px 16px', fontWeight: 600 }}>Amount Requested</th>
                  <th style={{ padding: '16px 16px', fontWeight: 600 }}>Purpose</th>
                  <th style={{ padding: '16px 16px', fontWeight: 600 }}>Tenure</th>
                  <th style={{ padding: '16px 16px', fontWeight: 600 }}>Applied On</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLoans.map(loan => (
                  <tr key={loan.loanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{loan.memberName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Member ID: AK-{loan.userId}</div>
                    </td>
                    <td style={{ padding: '16px 16px', fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                      ₹{loan.amountRequested.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 16px', color: '#334155' }}>{loan.purpose}</td>
                    <td style={{ padding: '16px 16px', color: '#334155' }}>{loan.tenureMonths} Months</td>
                    <td style={{ padding: '16px 16px', color: '#334155' }}>{new Date(loan.appliedDate).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          style={{ padding: '6px 16px', border: '1px solid #f87171', background: 'white', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                          disabled={actionLoading === loan.loanId}
                          onClick={() => handleOpenReject(loan)}
                        >
                          Reject
                        </button>
                        <button 
                          style={{ padding: '6px 16px', border: 'none', background: '#10b981', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                          disabled={actionLoading === loan.loanId}
                          onClick={() => handleReviewLoan(loan.loanId, 'Approved')}
                        >
                          {actionLoading === loan.loanId ? '...' : 'Approve'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: '#3b82f6', color: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h6 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#bfdbfe', fontWeight: 500 }}>Total Loans Disbursed</h6>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>₹{summaryData?.totalDisbursed?.toLocaleString() || 0}</h3>
        </div>
        <div style={{ background: '#0ea5e9', color: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h6 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#bae6fd', fontWeight: 500 }}>Total Outstanding Balance</h6>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>₹{summaryData?.totalOutstandingBalance?.toLocaleString() || 0}</h3>
        </div>
        <div style={{ background: '#10b981', color: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h6 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#a7f3d0', fontWeight: 500 }}>Total Interest Collected</h6>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>₹{summaryData?.totalInterestCollected?.toLocaleString() || 0}</h3>
        </div>
        <div style={{ background: '#64748b', color: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h6 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>Total Loan Count</h6>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>{summaryData?.totalLoans || 0}</h3>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h5 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>Unit Loan Ledger (Read-Only)</h5>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead style={{ background: 'white' }}>
              <tr style={{ textAlign: 'left', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Member Name</th>
                <th style={{ padding: '16px 16px', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '16px 16px', fontWeight: 600 }}>Outstanding</th>
                <th style={{ padding: '16px 16px', fontWeight: 600 }}>Interest Paid</th>
                <th style={{ padding: '16px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {summaryData?.loans && summaryData.loans.length > 0 ? (
                summaryData.loans.map(loan => (
                  <tr key={loan.loanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#0f172a' }}>{loan.memberName}</td>
                    <td style={{ padding: '16px 16px', color: '#334155' }}>₹{loan.amountRequested.toLocaleString()}</td>
                    <td style={{ padding: '16px 16px', fontWeight: 700, color: loan.status === 'Disbursed' ? '#ef4444' : '#64748b' }}>
                      {loan.status === 'Disbursed' ? `₹${loan.outstandingBalance.toLocaleString()}` : '-'}
                    </td>
                    <td style={{ padding: '16px 16px', fontWeight: 600, color: '#10b981' }}>₹{loan.totalInterestPaid.toLocaleString()}</td>
                    <td style={{ padding: '16px 16px' }}>{getStatusBadge(loan.status)}</td>
                    <td style={{ padding: '16px 24px', color: '#334155' }}>{new Date(loan.appliedDate).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No loans found in this unit.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Reject Loan Application Modal (SMS Reason) ── */}
      <RejectLoanModal
        isOpen={Boolean(rejectModalLoan)}
        loan={rejectModalLoan}
        onClose={() => setRejectModalLoan(null)}
        onConfirm={handleConfirmReject}
        isSubmitting={isRejectingLoan}
      />
    </div>
  );
};

export default PresidentLoanMonitor;
