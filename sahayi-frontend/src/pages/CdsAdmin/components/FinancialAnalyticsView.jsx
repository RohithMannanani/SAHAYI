import React, { useState } from 'react';
import './FinancialAnalyticsView.css';

function FinancialAnalyticsView({
  cdsAnalytics,
  wardsList,
  selectedWardFilter,
  setSelectedWardFilter,
  isLoading
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('totalSavings');
  const [sortOrder, setSortOrder] = useState('desc');

  const overall = cdsAnalytics?.overall || {};
  const units = cdsAnalytics?.units || [];
  const wards = cdsAnalytics?.wards || [];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.wardFormatted.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.bankName && unit.bankName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (unit.accountNumber && unit.accountNumber.includes(searchTerm));

    const matchesWard = selectedWardFilter === 'ALL' || String(unit.wardId) === String(selectedWardFilter);

    return matchesSearch && matchesWard;
  }).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalCdsSavings = overall.cdsTotalSavings || 0;
  const totalCdsSavingsLakhs = overall.cdsSavingsLakhs || 0;
  const totalBankBalance = overall.cdsBankBalance || 0;
  const totalSavingsCollected = overall.cdsSavingsCollected || 0;
  const totalLoansDisbursed = overall.cdsLoansDisbursed || 0;
  const totalLoanRepayments = overall.cdsLoanRepayments || 0;
  const totalOutstanding = overall.cdsOutstandingBalance || 0;

  return (
    <div className="cds-fin-view">
      {/* Header */}
      <div className="cds-page-header">
        <div>
          <h1 className="cds-page-header__title">Financial Analytics Dashboard</h1>
          <p className="cds-page-header__sub">
            Real-time breakdown of total savings, bank balances, loan disbursements, and repayments across all units in the database.
          </p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="cds-fin-stats-grid">
        <div className="cds-fin-card cds-fin-card--savings">
          <div className="cds-fin-card__header">
            <div className="cds-fin-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <span className="cds-fin-card__tag">CDS Consolidated</span>
          </div>
          <div className="cds-fin-card__label">Total CDS Savings</div>
          <div className="cds-fin-card__value">₹{totalCdsSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="cds-fin-card__sub">₹{totalCdsSavingsLakhs} Lakhs across {overall.totalUnits || 0} units</div>
        </div>

        <div className="cds-fin-card cds-fin-card--bank">
          <div className="cds-fin-card__header">
            <div className="cds-fin-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <span className="cds-fin-card__tag">Bank Accounts</span>
          </div>
          <div className="cds-fin-card__label">Unit Bank Balances</div>
          <div className="cds-fin-card__value">₹{totalBankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="cds-fin-card__sub">Direct bank deposit balance</div>
        </div>

        <div className="cds-fin-card cds-fin-card--collected">
          <div className="cds-fin-card__header">
            <div className="cds-fin-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <span className="cds-fin-card__tag">Weekly Collections</span>
          </div>
          <div className="cds-fin-card__label">Savings Collected</div>
          <div className="cds-fin-card__value">₹{totalSavingsCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="cds-fin-card__sub">Recorded member weekly savings</div>
        </div>

        <div className="cds-fin-card cds-fin-card--loans">
          <div className="cds-fin-card__header">
            <div className="cds-fin-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="cds-fin-card__tag">Loan Portfolio</span>
          </div>
          <div className="cds-fin-card__label">Loans Disbursed</div>
          <div className="cds-fin-card__value">₹{totalLoansDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="cds-fin-card__sub">Repaid: ₹{totalLoanRepayments.toLocaleString('en-IN')} | Due: ₹{totalOutstanding.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Ward Financial Summary Section */}
      <div className="cds-fin-wards-section">
        <h2 className="cds-section-title">Ward Financial Aggregation</h2>
        <div className="cds-ward-grid">
          {wards.map(ward => (
            <div key={ward.wardId} className="cds-ward-card">
              <div className="cds-ward-card__header">
                <span className="cds-ward-card__badge">Ward {ward.wardNumber}</span>
                <span className="cds-ward-card__title">{ward.wardName}</span>
              </div>
              <div className="cds-ward-card__body">
                <div className="cds-ward-metric">
                  <span className="cds-ward-metric__label">Units:</span>
                  <span className="cds-ward-metric__value">{ward.unitCount}</span>
                </div>
                <div className="cds-ward-metric">
                  <span className="cds-ward-metric__label">Members:</span>
                  <span className="cds-ward-metric__value">{ward.memberCount}</span>
                </div>
                <div className="cds-ward-metric">
                  <span className="cds-ward-metric__label">Total Savings:</span>
                  <span className="cds-ward-metric__value cds-ward-metric__value--highlight">₹{ward.savingsLakhs}L</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unit Level Financial Table */}
      <div className="cds-table-container">
        <div className="cds-table-toolbar">
          <div className="cds-table-toolbar__title">
            <span>Unit Financial Ledgers & Total Savings ({filteredUnits.length})</span>
          </div>

          <div className="cds-table-toolbar__controls">
            {/* Search Box */}
            <div className="cds-search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search unit, ward, bank..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Ward Select */}
            <select
              className="cds-filter-select"
              value={selectedWardFilter}
              onChange={e => setSelectedWardFilter(e.target.value)}
            >
              <option value="ALL">All Wards</option>
              {wardsList.map(w => (
                <option key={w.wardId} value={w.wardId}>
                  Ward {w.wardNumber} - {w.wardName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="cds-loading-state">Loading financial analytics from database...</div>
        ) : filteredUnits.length === 0 ? (
          <div className="cds-empty-state">No financial records found matching your filters.</div>
        ) : (
          <table className="cds-data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('unitName')} style={{ cursor: 'pointer' }}>
                  Unit Name {sortField === 'unitName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th>Ward</th>
                <th>Bank Account</th>
                <th onClick={() => handleSort('bankBalance')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  Bank Balance {sortField === 'bankBalance' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('savingsCollected')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  Savings Collected {sortField === 'savingsCollected' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('totalSavings')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  Total Savings {sortField === 'totalSavings' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th onClick={() => handleSort('loansDisbursed')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  Loans Disbursed
                </th>
                <th onClick={() => handleSort('outstandingBalance')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  Loan Due
                </th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map(unit => (
                <tr key={unit.unitId}>
                  <td>
                    <div className="cds-unit-name-cell">
                      <span className="cds-unit-badge">{unit.unitName.substring(0, 2).toUpperCase()}</span>
                      <div>
                        <div className="cds-unit-name-text">{unit.unitName}</div>
                        <div className="cds-unit-sub-text">{unit.memberCount} Members</div>
                      </div>
                    </div>
                  </td>
                  <td>{unit.wardFormatted}</td>
                  <td>
                    <div className="cds-bank-cell">
                      <div className="cds-bank-name">{unit.bankName || 'State Bank of India'}</div>
                      <div className="cds-bank-acc">Acc: {unit.accountNumber || 'N/A'}</div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                    ₹{unit.bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: '#059669' }}>
                    ₹{unit.savingsCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                    ₹{unit.totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                      ₹{unit.savingsLakhs}L
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', color: '#3b82f6' }}>
                    ₹{unit.loansDisbursed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: unit.outstandingBalance > 0 ? '#ef4444' : '#6b7280' }}>
                    ₹{unit.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className={`cds-status-badge cds-status-badge--${unit.isActive ? 'active' : 'inactive'}`}>
                      <span className="cds-status-badge__dot" />
                      {unit.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default FinancialAnalyticsView;
