import React, { useState, useEffect } from 'react';
import loanService from '../../../services/loanService';


const SecretaryLoanReview = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  const currentUser = React.useMemo(() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchPendingLoans();
  }, []);

  const fetchPendingLoans = async () => {
    try {
      setLoading(true);
      const data = await loanService.getPendingLoans();
      setLoans(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load pending loans.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (loanId, status) => {
    try {
      setActionLoading(loanId);
      await loanService.reviewLoan(loanId, status);
      // Remove from list after action
      setLoans(loans.filter(l => l.loanId !== loanId));
    } catch (err) {
      alert(err.message || 'Failed to review loan.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', margin: '20px 0' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h5 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 600 }}>Pending Loan Applications</h5>
        <span style={{ background: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
          {loans.length} Pending
        </span>
      </div>
      
      <div style={{ padding: '0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            Loading...
          </div>
        ) : error ? (
          <div style={{ margin: '20px', padding: '16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px' }}>
            {error}
          </div>
        ) : loans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.2 }}>📁</div>
            <p style={{ margin: 0, fontSize: '1.1rem' }}>No pending loan applications to review.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr style={{ textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 600 }}>Applicant</th>
                  <th style={{ padding: '16px 16px', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '16px 16px', fontWeight: 600 }}>Purpose</th>
                  <th style={{ padding: '16px 16px', fontWeight: 600 }}>Tenure</th>
                  <th style={{ padding: '16px 16px', fontWeight: 600 }}>Applied On</th>
                  <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => {
                  const isSelf = currentUser && currentUser.userId === loan.userId;

                  return (
                    <tr key={loan.loanId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{loan.memberName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {loan.userId}</div>
                      </td>
                      <td style={{ padding: '16px 16px', fontWeight: 700, color: '#0f172a' }}>
                        ₹{loan.amountRequested.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 16px', color: '#334155' }}>{loan.purpose}</td>
                      <td style={{ padding: '16px 16px', color: '#334155' }}>{loan.tenureMonths} mo</td>
                      <td style={{ padding: '16px 16px', color: '#334155' }}>
                        {new Date(loan.appliedDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        {isSelf ? (
                          <span style={{ display: 'inline-block', padding: '6px 12px', background: '#f1f5f9', color: '#475569', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 500 }}>
                            Needs President Review
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              style={{ padding: '6px 16px', border: '1px solid #f87171', background: 'white', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
                              disabled={actionLoading === loan.loanId}
                              onClick={() => handleReview(loan.loanId, 'Rejected')}
                            >
                              Reject
                            </button>
                            <button 
                              style={{ padding: '6px 16px', border: 'none', background: '#10b981', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
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
        )}
      </div>
    </div>
  );
};

export default SecretaryLoanReview;
