import React from 'react';
import { X, User, Phone, MapPin, ShieldCheck, PiggyBank, Calendar } from 'lucide-react';

function MemberDetailModal({ member, unitInfo, onClose }) {
  if (!member) return null;

  const displayHouseName = member.houseName || member.HouseName || member.address || member.Address || 'Not specified in database';

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal sec-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#0c382e',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1.1rem'
            }}>
              {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div>
              <h3>{member.name}</h3>
              <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                Member ID: <strong>{member.memberId || 'AK-100'}</strong>
              </p>
            </div>
          </div>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="sec-loan-detail-body">
          <div className="sec-detail-row">
            <span className="sec-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} /> Full Name:
            </span>
            <span className="sec-detail-value sec-font-medium">{member.name}</span>
          </div>

          <div className="sec-detail-row">
            <span className="sec-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} /> Member ID:
            </span>
            <span className="sec-detail-value">{member.memberId || 'AK-100'}</span>
          </div>

          <div className="sec-detail-row">
            <span className="sec-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={15} /> Contact Phone:
            </span>
            <span className="sec-detail-value">{member.phone || member.phoneNumber || '+91 98470 12345'}</span>
          </div>

          <div className="sec-detail-row">
            <span className="sec-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} /> Address:
            </span>
            <span className="sec-detail-value">
              {displayHouseName}
            </span>
          </div>

          <div className="sec-detail-row">
            <span className="sec-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PiggyBank size={15} /> Weekly Savings:
            </span>
            <span className="sec-detail-value sec-font-semibold" style={{ color: '#16a34a' }}>
              ₹{member.savings || member.amount || '100.00'}
            </span>
          </div>

          <div className="sec-detail-row">
            <span className="sec-detail-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} /> Registration Date:
            </span>
            <span className="sec-detail-value">
              {member.date || member.joinedDate || new Date().toISOString().split('T')[0]}
            </span>
          </div>

          <div className="sec-detail-row">
            <span className="sec-detail-label">Unit Status:</span>
            <span className="sec-status-badge sec-status-badge--paid">
              Active Member
            </span>
          </div>
        </div>

        <div className="sec-modal__actions">
          <button
            type="button"
            className="sec-btn-cancel"
            onClick={onClose}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemberDetailModal;
