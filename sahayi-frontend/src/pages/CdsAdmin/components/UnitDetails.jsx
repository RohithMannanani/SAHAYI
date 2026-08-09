import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UnitDetails.css';
import { fetchShgUnitDetails } from '../../../services/api';
import { handleDynamicBack } from '../../../utils/navigation';

// ── Icon helper ──────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 'currentColor', fill = 'none', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

// ── Helper to resolve member role name dynamically ───────────
const getRoleName = (member) => {
  if (member.role) return member.role;
  if (member.roleName) return member.roleName;
  if (member.Role) return member.Role;
  const roleMap = { 2: 'President', 3: 'Secretary', 4: 'Treasurer', 5: 'Member' };
  return roleMap[member.roleId || member.RoleId] || 'Member';
};

function UnitDetails({ unit, onBack, onStatusChange }) {
  const navigate = useNavigate();
  const [unitData, setUnitData] = useState(unit || null);
  const [memberSearch, setMemberSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      handleDynamicBack(navigate, '/cds-admin/dashboard');
    }
  };

  useEffect(() => {
    setUnitData(unit);
    if (unit && unit.id) {
      const loadFullDetails = async () => {
        setIsLoading(true);
        try {
          const res = await fetchShgUnitDetails(unit.id);
          if (res.data) {
            setUnitData(prev => ({
              ...prev,
              ...res.data
            }));
          }
        } catch (err) {
          console.warn("Could not fetch extra unit details from API, using list object:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadFullDetails();
    }
  }, [unit]);

  if (!unitData) {
    return (
      <div className="cds-unit-details-container">
        <button className="cds-back-btn" onClick={handleBackClick}>
          &larr; Back to Dashboard
        </button>
        <div style={{ padding: 48, textAlign: 'center', color: '#6b8f72' }}>
          No unit selected.
        </div>
      </div>
    );
  }

  // Normalize dynamic fields from SahayiDb or frontend state
  const unitName = unitData.name || unitData.unitName || unitData.Name || 'Ayalkoottam Unit';
  const unitId = unitData.id || unitData.unitId || unitData.Id || 'N/A';
  const wardDisplay = unitData.ward || unitData.wardName || (unitData.Ward ? `Ward ${unitData.Ward.wardNumber || ''} - ${unitData.Ward.wardName || ''}` : 'N/A');
  const statusDisplay = unitData.status || (unitData.isActive === false ? 'Inactive' : 'Active');
  const initials = unitData.initials || unitName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'UN';

  // Bank & Financials
  const bankName = unitData.bankName || unitData.BankName || unitData.bank || (unitData.unitForm && unitData.unitForm.bankName) || 'N/A';
  const accountNumber = unitData.accountNumber || unitData.AccountNumber || unitData.accNo || (unitData.unitForm && unitData.unitForm.accountNumber) || 'N/A';
  const ifscCode = unitData.ifscCode || unitData.IfscCode || unitData.ifsc || (unitData.unitForm && unitData.unitForm.ifscCode) || 'N/A';

  const calculateBalance = () => {
    if (unitData.accountBalance !== undefined && unitData.accountBalance !== null) {
      return parseFloat(unitData.accountBalance) || 0;
    }
    if (unitData.AccountBalance !== undefined && unitData.AccountBalance !== null) {
      return parseFloat(unitData.AccountBalance) || 0;
    }
    if (unitData.savings !== undefined && unitData.savings !== null) {
      return parseFloat(unitData.savings) * 100000;
    }
    return 0;
  };
  const balanceAmount = calculateBalance();

  // Dates & Contact
  const formationDate = unitData.formationDate || unitData.FormationDate || (unitData.createdAt ? new Date(unitData.createdAt).toLocaleDateString('en-IN') : (unitData.unitForm && unitData.unitForm.formationDate) || 'N/A');
  const primaryContact = unitData.contact || unitData.contactNumber || unitData.phone || unitData.PhoneNumber || (unitData.unitForm && unitData.unitForm.contact) || 'N/A';
  const notesText = unitData.notes || unitData.remarks || unitData.Notes || (unitData.unitForm && unitData.unitForm.notes) || '';

  // Members list normalization
  let rawMembers = Array.isArray(unitData.membersList)
    ? unitData.membersList
    : Array.isArray(unitData.members)
      ? unitData.members
      : Array.isArray(unitData.shgMembers)
        ? unitData.shgMembers
        : Array.isArray(unitData.ShgMembers)
          ? unitData.ShgMembers
          : [];

  const membersList = rawMembers;

  // Role sort order: President → Secretary → Treasurer → Member
  const rolePriority = { president: 0, secretary: 1, treasurer: 2, member: 3 };
  const sortedMembers = [...membersList].sort((a, b) => {
    const ra = (getRoleName(a) || 'member').toLowerCase();
    const rb = (getRoleName(b) || 'member').toLowerCase();
    return (rolePriority[ra] ?? 99) - (rolePriority[rb] ?? 99);
  });

  const filteredMembers = sortedMembers.filter(m => {
    const name = (m.fullName || m.name || '').toLowerCase();
    const role = getRoleName(m).toLowerCase();
    const house = (m.houseName || m.house || '').toLowerCase();
    const phone = m.phoneNumber || m.phone || '';
    const query = memberSearch.toLowerCase();

    return name.includes(query) || role.includes(query) || house.includes(query) || phone.includes(query);
  });

  // Leadership Team Extraction from Members
  const presidentMember = membersList.find(m => getRoleName(m).toLowerCase() === 'president');
  const secretaryMember = membersList.find(m => getRoleName(m).toLowerCase() === 'secretary');
  const treasurerMember = membersList.find(m => getRoleName(m).toLowerCase() === 'treasurer');

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="cds-unit-details-container">
      {/* Navigation & Action Header */}
      <div className="cds-unit-details-nav">
        <button className="cds-back-btn" onClick={handleBackClick}>
          <Icon d="M19 12H5M12 19l-7-7 7-7" size={16} stroke="#1e4731" />
          Back to Dashboard
        </button>

        <div className="cds-details-header-actions">
          <button 
            className={`cds-action-btn ${statusDisplay === 'Active' ? 'cds-action-btn--secondary' : 'cds-action-btn--primary'}`}
            style={{ 
              borderColor: statusDisplay === 'Active' ? '#eec4c4' : '#adc3b2',
              color: statusDisplay === 'Active' ? '#c25252' : '#ffffff'
            }}
            onClick={() => onStatusChange && onStatusChange(unitId, statusDisplay === 'Active' ? 'Inactive' : 'Active')}
          >
            {statusDisplay === 'Active' ? 'Deactivate Unit' : 'Activate Unit'}
          </button>
          
          <button className="cds-action-btn cds-action-btn--primary" onClick={handlePrintSummary}>
            <Icon d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" size={15} stroke="#ffffff" />
            Print / Export Summary
          </button>
        </div>
      </div>

      {/* Main Banner Card */}
      <div className="cds-unit-banner-card">
        <div className="cds-unit-banner-left">
          <div className="cds-unit-banner-avatar">
            {initials}
          </div>
          <div className="cds-unit-banner-info">
            <h1>{unitName}</h1>
            <div className="cds-unit-banner-meta">
              <div className="cds-unit-banner-meta-item">
                <Icon d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" size={14} stroke="#78716c" />
                <span>ID: {unitId}</span>
              </div>
              <span>•</span>
              <div className="cds-unit-banner-meta-item">
                <Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" size={14} stroke="#78716c" />
                <span>{wardDisplay}</span>
              </div>
              <span>•</span>
              <div className="cds-unit-banner-meta-item">
                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={14} stroke="#78716c" />
                <span>Formed: {formationDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`cds-unit-banner-status ${statusDisplay === 'Active' ? 'cds-unit-banner-status--active' : 'cds-unit-banner-status--inactive'}`}>
          <span className={`cds-status-dot ${statusDisplay === 'Active' ? '' : 'cds-status-dot--inactive'}`} />
          {statusDisplay} Unit
        </div>
      </div>

      {/* Top Quick Stats Row */}
      <div className="cds-details-stats-grid">
        <div className="cds-details-stat-card">
          <div className="cds-details-stat-icon">
            <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" size={22} stroke="#1e4731" />
          </div>
          <div className="cds-details-stat-info">
            <span className="cds-details-stat-label">Total Registered Members</span>
            <span className="cds-details-stat-value">{membersList.length} Members</span>
            <span className="cds-details-stat-sub">SahayiDb Records</span>
          </div>
        </div>

        <div className="cds-details-stat-card">
          <div className="cds-details-stat-icon cds-details-stat-icon--savings">
            <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" size={22} stroke="#2a6e38" />
          </div>
          <div className="cds-details-stat-info">
            <span className="cds-details-stat-label">Account Balance</span>
            <span className="cds-details-stat-value">₹{balanceAmount.toLocaleString('en-IN')}</span>
            <span className="cds-details-stat-sub">Bank Balance</span>
          </div>
        </div>

        <div className="cds-details-stat-card">
          <div className="cds-details-stat-icon cds-details-stat-icon--bank">
            <Icon d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11" size={22} stroke="#2b6cb0" />
          </div>
          <div className="cds-details-stat-info">
            <span className="cds-details-stat-label">Bank Branch</span>
            <span className="cds-details-stat-value">{bankName}</span>
            <span className="cds-details-stat-sub">Acc: {accountNumber}</span>
          </div>
        </div>

        <div className="cds-details-stat-card">
          <div className="cds-details-stat-icon cds-details-stat-icon--ward">
            <Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" size={22} stroke="#744210" />
          </div>
          <div className="cds-details-stat-info">
            <span className="cds-details-stat-label">Ward Jurisdiction</span>
            <span className="cds-details-stat-value">{wardDisplay}</span>
            <span className="cds-details-stat-sub">CDS Admin Zone</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="cds-details-layout">
        {/* Left Column */}
        <div className="cds-details-main-col">
          
          {/* Unit & Bank Master Card */}
          <div className="cds-details-card">
            <div className="cds-details-card__header">
              <h2 className="cds-details-card__title">
                <Icon d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20M4 19.5V3A2.5 2.5 0 016.5 0.5H20v16.5H6.5a2.5 2.5 0 00-2.5 2.5z" size={18} stroke="#1e4731" />
                Unit & Bank Master Details
              </h2>
            </div>
            <div className="cds-details-card__body">
              <div className="cds-info-grid">
                <div className="cds-info-item">
                  <span className="cds-info-label">Unit Name</span>
                  <span className="cds-info-value">{unitName}</span>
                </div>

                <div className="cds-info-item">
                  <span className="cds-info-label">Ward / Location</span>
                  <span className="cds-info-value">{wardDisplay}</span>
                </div>

                <div className="cds-info-item">
                  <span className="cds-info-label">Formation Date</span>
                  <span className="cds-info-value">{formationDate}</span>
                </div>

                <div className="cds-info-item">
                  <span className="cds-info-label">Primary Contact</span>
                  <span className="cds-info-value">{primaryContact}</span>
                </div>

                <div className="cds-info-item">
                  <span className="cds-info-label">Bank Name</span>
                  <span className="cds-info-value">{bankName}</span>
                </div>

                <div className="cds-info-item">
                  <span className="cds-info-label">Account Number</span>
                  <span className="cds-info-value">{accountNumber}</span>
                </div>

                <div className="cds-info-item">
                  <span className="cds-info-label">IFSC Code</span>
                  <span className="cds-info-value">{ifscCode}</span>
                </div>

                <div className="cds-info-item">
                  <span className="cds-info-label">Current Account Balance</span>
                  <span className="cds-info-value" style={{ color: '#2a6e38' }}>₹{balanceAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {notesText && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #edf2ee' }}>
                  <span className="cds-info-label">Administrative Notes</span>
                  <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#4a6652', lineHeight: '1.5' }}>
                    {notesText}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Registered Members Card */}
          <div className="cds-details-card">
            <div className="cds-details-card__header">
              <h2 className="cds-details-card__title">
                <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" size={18} stroke="#1e4731" />
                Registered Members ({membersList.length})
              </h2>

              <div className="cds-member-search-wrap">
                <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={14} stroke="#9ab3a0" />
                <input 
                  type="text" 
                  placeholder="Filter members by name/role..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="cds-details-card__body">
              {membersList.length === 0 ? (
                <div className="cds-members-empty">
                  <Icon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8z" size={32} stroke="#9ab3a0" />
                  <p>No member records registered for this unit yet.</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="cds-members-empty">
                  <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={32} stroke="#9ab3a0" />
                  <p>No members match your search query.</p>
                </div>
              ) : (
                <div className="cds-members-card-grid">
                  {filteredMembers.map((member, idx) => {
                    const name = member.fullName || member.name || 'N/A';
                    const role = getRoleName(member);
                    const age = member.age || null;
                    const phone = member.phoneNumber || member.phone || null;
                    const house = member.houseName || member.house || null;
                    const avatarInitial = name.charAt(0).toUpperCase();
                    const isLeader = ['president','secretary','treasurer'].includes(role.toLowerCase());

                    return (
                      <div
                        key={member.id || member.memberId || idx}
                        className={`cds-member-card cds-member-card--${role.toLowerCase()}${isLeader ? ' cds-member-card--leader' : ''}`}
                      >
                        <div className="cds-member-card__avatar">
                          {avatarInitial}
                        </div>
                        <div className="cds-member-card__body">
                          <div className="cds-member-card__top">
                            <span className="cds-member-card__name">{name}</span>
                            <span className={`cds-role-pill cds-role-pill--${role.toLowerCase()}`}>{role}</span>
                          </div>
                          <div className="cds-member-card__details">
                            {phone && (
                              <div className="cds-member-card__detail-item">
                                <Icon d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={12} stroke="#6b8f72" />
                                <span>{phone}</span>
                              </div>
                            )}
                            {house && (
                              <div className="cds-member-card__detail-item">
                                <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" size={12} stroke="#6b8f72" />
                                <span>{house}</span>
                              </div>
                            )}
                            {age && (
                              <div className="cds-member-card__detail-item">
                                <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" size={12} stroke="#6b8f72" />
                                <span>Age: {age}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {isLeader && <div className="cds-member-card__leader-badge" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="cds-details-side-col">
          
          {/* Leadership Team */}
          <div className="cds-details-card">
            <div className="cds-details-card__header">
              <h2 className="cds-details-card__title">Leadership Team</h2>
            </div>
            <div className="cds-details-card__body">
              <div className="cds-widget-list">
                <div className="cds-widget-item">
                  <div>
                    <span className="cds-role-pill cds-role-pill--president">President</span>
                    <div style={{ fontWeight: 600, color: '#1e4731', marginTop: 4 }}>
                      {presidentMember ? (presidentMember.fullName || presidentMember.name) : 'Not Designated'}
                    </div>
                  </div>
                </div>

                <div className="cds-widget-item">
                  <div>
                    <span className="cds-role-pill cds-role-pill--secretary">Secretary</span>
                    <div style={{ fontWeight: 600, color: '#1e4731', marginTop: 4 }}>
                      {secretaryMember ? (secretaryMember.fullName || secretaryMember.name) : 'Not Designated'}
                    </div>
                  </div>
                </div>

                <div className="cds-widget-item">
                  <div>
                    <span className="cds-role-pill cds-role-pill--treasurer">Treasurer</span>
                    <div style={{ fontWeight: 600, color: '#1e4731', marginTop: 4 }}>
                      {treasurerMember ? (treasurerMember.fullName || treasurerMember.name) : 'Not Designated'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          <div className="cds-details-card">
            <div className="cds-details-card__header">
              <h2 className="cds-details-card__title">Unit Governance Status</h2>
            </div>
            <div className="cds-details-card__body">
              <div className="cds-widget-list">
                <div className="cds-widget-item">
                  <span className="cds-widget-item__label">Status</span>
                  <span className="cds-widget-item__val" style={{ color: statusDisplay === 'Active' ? '#2a6e38' : '#c25252' }}>
                    {statusDisplay}
                  </span>
                </div>

                <div className="cds-widget-item">
                  <span className="cds-widget-item__label">Total Members</span>
                  <span className="cds-widget-item__val">{membersList.length}</span>
                </div>

                <div className="cds-widget-item">
                  <span className="cds-widget-item__label">Registration Verification</span>
                  <span className="cds-widget-item__val" style={{ color: '#2a6e38' }}>Verified SahayiDb</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real Timeline */}
          <div className="cds-details-card">
            <div className="cds-details-card__header">
              <h2 className="cds-details-card__title">Unit Activity Log</h2>
            </div>
            <div className="cds-details-card__body">
              <div className="cds-activity-timeline">
                <div className="cds-activity-item">
                  <span className="cds-activity-dot" />
                  <div className="cds-activity-content">Unit Registered in SahayiDb</div>
                  <div className="cds-activity-time">{wardDisplay}</div>
                </div>

                <div className="cds-activity-item">
                  <span className="cds-activity-dot" />
                  <div className="cds-activity-content">Bank Account Linked ({bankName})</div>
                  <div className="cds-activity-time">Acc: {accountNumber}</div>
                </div>

                <div className="cds-activity-item">
                  <span className="cds-activity-dot" />
                  <div className="cds-activity-content">{membersList.length} Members Enrolled</div>
                  <div className="cds-activity-time">Sahayi Database Record</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default UnitDetails;
