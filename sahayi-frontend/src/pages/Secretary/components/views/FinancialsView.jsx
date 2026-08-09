import React from 'react';

function FinancialsView({ financials }) {
  return (
    <div className="sec-subview">
      <div className="sec-subview-header">
        <h2>Financial Ledger & Dues Summary</h2>
      </div>
      <div className="sec-stats-row">
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
        <div className="sec-stat-card">
          <span className="sec-stat-label">Pending Collection Dues</span>
          <h3 className="sec-stat-value">{financials.pendingDues} Records</h3>
          <span className="sec-stat-sub">Pending Weekly Deposits</span>
        </div>
      </div>
    </div>
  );
}

export default FinancialsView;
