import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

function RegisterMemberModal({
  newMember,
  setNewMember,
  onSubmit,
  onClose
}) {
  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div
        className="sec-modal sec-modal--wide"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="sec-modal__header">
          <h3>Register New Member</h3>
          <button className="sec-modal__close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="sec-modal__form">
          <div className="sec-form-row">
            <div className="sec-form-group">
              <label>Member Name</label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newMember.name || ''}
                onChange={e => setNewMember({ ...newMember, name: e.target.value })}
              />
            </div>

            <div className="sec-form-group">
              <label>Age</label>
              <input
                type="number"
                min="18"
                max="100"
                required
                placeholder="Age (Min 18)"
                value={newMember.age || ''}
                onChange={e => setNewMember({ ...newMember, age: e.target.value })}
              />
            </div>
          </div>

          <div className="sec-form-row">
            <div className="sec-form-group">
              <label>Phone Number</label>
              <input
                type="text"
                required
                placeholder="+91 00000 00000"
                value={newMember.phone || ''}
                onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
              />
            </div>

            <div className="sec-form-group">
              <label>Designation / Role</label>
              <select
                value={newMember.role || 'Member'}
                onChange={e => setNewMember({ ...newMember, role: e.target.value })}
              >
                <option value="Member">Member</option>
                <option value="President">President</option>
                <option value="Secretary">Secretary</option>
                <option value="Treasurer">Treasurer</option>
              </select>
            </div>
          </div>

          <div className="sec-form-group">
            <label>House Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Hillview House"
              value={newMember.houseName || ''}
              onChange={e => setNewMember({ ...newMember, houseName: e.target.value })}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              fontSize: '0.825rem',
              color: '#166534',
              marginTop: '4px'
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0, color: '#15803d' }} />
            <span>
              Member login will be created automatically. Default password is <strong>Sahayi@123</strong>. Member will be required to change their password on first login.
            </span>
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
