import React from 'react';
import { Landmark, CheckCircle2 } from 'lucide-react';

function FinancialsView({ financials, unitBankAccount, savingsLogs = [], onDepositAllCashToBank }) {
  const undepositedCashList = savingsLogs.filter(s =>
    s.status === 'Paid' && (s.paymentMode === 'Cash' || (!s.paymentMode || s.paymentMode === '-'))
  );
  const undepositedTotal = undepositedCashList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const onlineAndDepositedTotalFromLogs = savingsLogs
    .filter(s => s.status === 'Paid' && (
      (s.paymentMode || '').toLowerCase().includes('online') ||
      (s.paymentMode || '').toLowerCase().includes('bank deposited') ||
      (s.paymentMode || '').toLowerCase().includes('in bank')
    ))
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const effectiveBankBalance = Math.max(
    parseFloat(unitBankAccount?.balance || 0),
    onlineAndDepositedTotalFromLogs
  );

  return (
    <div className="sec-subview">
      <div className="sec-subview-header">
        <h2>Financial Ledger & Dues Summary</h2>
      </div>

      <div className="sec-stats-row">
        <div className="sec-stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="sec-stat-label">Unit Bank Account Balance</span>
          <h3 className="sec-stat-value" style={{ color: '#0C382E' }}>
            ₹{effectiveBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="sec-stat-sub">
            {unitBankAccount?.bankName || 'Sahayi Co-operative Bank'} &bull; {unitBankAccount?.accountNumber || 'A/C Active'}
          </span>
        </div>

        <div className="sec-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="sec-stat-label">Cash Collected (In Hand)</span>
          <h3 className="sec-stat-value" style={{ color: '#d97706' }}>
            ₹{undepositedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="sec-stat-sub">
            {undepositedCashList.length} cash payments pending bank deposit
          </span>
          {undepositedCashList.length > 0 && onDepositAllCashToBank && (
            <button
              type="button"
              onClick={() => onDepositAllCashToBank(undepositedCashList)}
              style={{
                marginTop: '0.5rem',
                backgroundColor: '#0C382E',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Landmark size={13} />
              <span>Deposit All Cash to Bank</span>
            </button>
          )}
        </div>

        <div className="sec-stat-card">
          <span className="sec-stat-label">Total Weekly Collection</span>
          <h3 className="sec-stat-value">
            ₹{financials.totalCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="sec-stat-trend">↑ Live SahayiDb Ledger</span>
        </div>

        <div className="sec-stat-card">
          <span className="sec-stat-label">Loans Disbursed</span>
          <h3 className="sec-stat-value">
            ₹{financials.disbursedLoans.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
          <span className="sec-stat-sub">Active Unit Accounts</span>
        </div>
      </div>
    </div>
  );
}

export default FinancialsView;
