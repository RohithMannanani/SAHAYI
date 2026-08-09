import React from 'react';
import { UserPlus } from 'lucide-react';

function MembersRegistryView({
  unitInfo,
  attendanceList,
  onShowRegisterModal,
  onShowToast,
  onSelectMemberDetail
}) {
  return (
    <div className="sec-subview">
      <div className="sec-subview-header">
        <h2>{unitInfo.unitName} Members Registry</h2>
        <button
          className="sec-action-btn sec-action-btn--primary"
          onClick={onShowRegisterModal}
        >
          <UserPlus size={18} />
          <span>Add New Member</span>
        </button>
      </div>

      <div className="sec-card">
        <table className="sec-savings-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Member ID</th>
              <th>Phone</th>
              <th>Status</th>
              <th className="sec-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attendanceList.length === 0 ? (
              <tr>
                <td colSpan="5" className="sec-table-empty">
                  No members registered in this unit yet.
                </td>
              </tr>
            ) : (
              attendanceList.map(mem => (
                <tr key={mem.id}>
                  <td className="sec-font-medium">{mem.name}</td>
                  <td className="sec-text-muted">{mem.memberId}</td>
                  <td>{mem.phone || '+91 98470 12345'}</td>
                  <td>
                    <span className="sec-status-badge sec-status-badge--paid">
                      Active
                    </span>
                  </td>
                  <td className="sec-text-right">
                    <button
                      className="sec-card__link-btn"
                      onClick={() => onSelectMemberDetail && onSelectMemberDetail(mem)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MembersRegistryView;
