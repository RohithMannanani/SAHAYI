import React from 'react';
import { X } from 'lucide-react';

function RegisterMemberModal({
  newMember,
  setNewMember,
  onSubmit,
  onClose
}) {
  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <h3>Register New Member</h3>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="sec-modal__form">
          <div className="sec-form-group">
            <label>Member Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Radhika Menon"
              value={newMember.name}
              onChange={e => setNewMember({ ...newMember, name: e.target.value })}
            />
          </div>

          <div className="sec-form-group">
            <label>Member ID (e.g., AK-120)</label>
            <input
              type="text"
              placeholder="e.g. AK-120"
              value={newMember.memberId}
              onChange={e => setNewMember({ ...newMember, memberId: e.target.value })}
            />
          </div>

          <div className="sec-form-group">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="+91 9876543210"
              value={newMember.phone}
              onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
            />
          </div>

          <div className="sec-form-group">
            <label>Initial Weekly Savings Deposit (₹)</label>
            <input
              type="number"
              value={newMember.savings}
              onChange={e => setNewMember({ ...newMember, savings: e.target.value })}
            />
          </div>

          <div className="sec-modal__actions">
            <button
              type="button"
              className="sec-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="sec-btn-submit">
              Register Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterMemberModal;
