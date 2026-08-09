import React from 'react';
import { X } from 'lucide-react';

function LoanDetailModal({
  loan,
  onVerifyAndForward,
  onClose
}) {
  if (!loan) return null;

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal sec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <div>
            <h3>Loan Application Details</h3>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Applicant: {loan.name} ({loan.applicantId})
            </p>
          </div>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sec-loan-detail-body">
          <div className="sec-detail-row">
            <span className="sec-detail-label">Requested Amount:</span>
            <span className="sec-detail-value sec-text-bold">{loan.amount}</span>
          </div>
          <div className="sec-detail-row">
            <span className="sec-detail-label">Stated Purpose:</span>
            <span className="sec-detail-value">{loan.purpose}</span>
          </div>
          <div className="sec-detail-row">
            <span className="sec-detail-label">Trust Score / Credit Rating:</span>
            <span className="sec-detail-value sec-trust-badge">
              {loan.trustScore} / 10
            </span>
          </div>
          <div className="sec-detail-row">
            <span className="sec-detail-label">Membership Tenure:</span>
            <span className="sec-detail-value">{loan.membershipYears}</span>
          </div>
          <div className="sec-detail-row">
            <span className="sec-detail-label">Existing Outstanding Dues:</span>
            <span className="sec-detail-value">{loan.existingDues}</span>
          </div>
        </div>

        <div className="sec-modal__actions">
          <button
            type="button"
            className="sec-btn-cancel"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="sec-btn-submit"
            onClick={() => {
              onVerifyAndForward(loan);
              onClose();
            }}
          >
            Verify & Endorse Loan
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoanDetailModal;
