import React, { useState, useEffect } from 'react';
import './RejectLoanModal.css';

const PRESET_REASONS = [
  'Insufficient unit group savings balance',
  'Applicant has an active prior loan commitment',
  'Requested loan amount exceeds current eligibility limit',
  'Incomplete income or repayment verification details',
  'Tenure period requested exceeds allowable SHG guidelines'
];

const RejectLoanModal = ({ isOpen, loan, onClose, onConfirm, isSubmitting = false }) => {
  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setSelectedPreset('');
      setError('');
    }
  }, [isOpen, loan]);

  if (!isOpen || !loan) return null;

  const applicantName = loan.memberName || loan.name || 'Member';
  const loanAmount = loan.amountRequested !== undefined ? loan.amountRequested : (loan.amount || 0);
  const purpose = loan.purpose || 'General';
  const tenure = loan.tenureMonths || loan.tenure || 12;
  const phoneNumber = loan.phoneNumber || loan.phone || '';

  const handleSelectPreset = (preset) => {
    if (selectedPreset === preset) {
      setSelectedPreset('');
      setReason('');
    } else {
      setSelectedPreset(preset);
      setReason(preset);
      setError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError('Please provide a reason for rejecting this loan application.');
      return;
    }
    if (cleanReason.length < 5) {
      setError('Rejection reason must be at least 5 characters long.');
      return;
    }

    const loanId = loan.loanId || loan.id;
    onConfirm(loanId, cleanReason);
  };

  return (
    <div className="reject-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="reject-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="reject-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="reject-modal-header-icon">⚠️</div>
            <div>
              <h3 className="reject-modal-title">Reject Loan Application</h3>
              <p className="reject-modal-subtitle">
                Provide a reason. An automated SMS notification will be sent to the applicant.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="reject-modal-close-btn" 
            onClick={onClose} 
            disabled={isSubmitting}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="reject-modal-body">
            {/* Applicant Loan Summary */}
            <div className="reject-loan-summary">
              <div className="reject-summary-item">
                <span className="reject-summary-label">Applicant Name</span>
                <span className="reject-summary-value">{applicantName}</span>
              </div>
              <div className="reject-summary-item">
                <span className="reject-summary-label">Amount Requested</span>
                <span className="reject-summary-value highlight-amount">
                  ₹{Number(loanAmount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="reject-summary-item">
                <span className="reject-summary-label">Purpose</span>
                <span className="reject-summary-value">{purpose}</span>
              </div>
              <div className="reject-summary-item">
                <span className="reject-summary-label">Tenure</span>
                <span className="reject-summary-value">{tenure} Months</span>
              </div>
            </div>

            {/* Quick Reason Presets */}
            <div className="reject-presets-section">
              <span className="reject-presets-title">
                <span>⚡</span> Quick Reason Presets (Click to autofill):
              </span>
              <div className="reject-preset-chips">
                {PRESET_REASONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`reject-preset-chip ${selectedPreset === preset ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset)}
                    disabled={isSubmitting}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div className="reject-input-group">
              <label htmlFor="rejection-reason" className="reject-input-label">
                <span>
                  Rejection Reason <span className="required">*</span>
                </span>
                <span className="reject-char-count">{reason.length}/300</span>
              </label>
              <textarea
                id="rejection-reason"
                className="reject-textarea"
                rows={3}
                maxLength={300}
                placeholder="State clearly why this application cannot be approved at this time..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                disabled={isSubmitting}
                autoFocus
              />
              {error && (
                <div style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: 600 }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="reject-modal-footer">
            <button
              type="button"
              className="reject-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="reject-btn-confirm"
              disabled={isSubmitting || !reason.trim()}
            >
              {isSubmitting ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                  Sending SMS & Rejecting...
                </>
              ) : (
                <>
                  <span>✉️</span> Confirm Rejection & Send SMS
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectLoanModal;
