import React from 'react';
import { X } from 'lucide-react';

function EditSavingsModal({
  editingSavings,
  setEditingSavings,
  onSave,
  onClose
}) {
  if (!editingSavings) return null;

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal" onClick={e => e.stopPropagation()}>
        <div className="sec-modal__header">
          <h3>Edit Savings Record</h3>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSave} className="sec-modal__form">
          <div className="sec-form-group">
            <label>Member Name</label>
            <input type="text" disabled value={editingSavings.name} />
          </div>
          <div className="sec-form-group">
            <label>Amount (₹)</label>
            <input
              type="text"
              value={editingSavings.amount}
              onChange={e => setEditingSavings({ ...editingSavings, amount: e.target.value })}
            />
          </div>
          <div className="sec-form-group">
            <label>Status</label>
            <select
              value={editingSavings.status}
              onChange={e => setEditingSavings({ ...editingSavings, status: e.target.value })}
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSavingsModal;
