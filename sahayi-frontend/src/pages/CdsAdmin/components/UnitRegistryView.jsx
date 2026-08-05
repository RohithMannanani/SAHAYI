import React from 'react';

function UnitRegistryView({
  ayalkoottamList,
  activeUnitsCount,
  totalMembersCount,
  unitWardFilter,
  setUnitWardFilter,
  wardsList,
  tableSearch,
  setTableSearch,
  isLoading,
  filteredRows,
  setSelectedUnit,
  handleToggleStatus
}) {
  return (
    <>
      <div className="cds-page-header">
        <div>
          <h1 className="cds-page-header__title">Ayalkoottam Units Registry</h1>
          <p className="cds-page-header__sub">View and manage all registered Ayalkoottam units in this CDS.</p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="cds-unit-strip">
        <div className="cds-unit-strip__item">
          <span className="cds-unit-strip__value">{ayalkoottamList.length}</span>
          <span className="cds-unit-strip__label">Total Units</span>
        </div>
        <div className="cds-unit-strip__divider" />
        <div className="cds-unit-strip__item">
          <span className="cds-unit-strip__value">{activeUnitsCount}</span>
          <span className="cds-unit-strip__label">Active</span>
        </div>
        <div className="cds-unit-strip__divider" />
        <div className="cds-unit-strip__item">
          <span className="cds-unit-strip__value">{ayalkoottamList.length - activeUnitsCount}</span>
          <span className="cds-unit-strip__label">Inactive</span>
        </div>
        <div className="cds-unit-strip__divider" />
        <div className="cds-unit-strip__item">
          <span className="cds-unit-strip__value">{totalMembersCount}</span>
          <span className="cds-unit-strip__label">Total Members</span>
        </div>
      </div>

      <div className="cds-section">
        <div className="cds-section__header">
          <span className="cds-section__title">All Active/Pending Groups</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={unitWardFilter}
              onChange={e => setUnitWardFilter(e.target.value)}
              className="cds-ward-filter-select"
            >
              <option value="ALL">All Wards</option>
              {wardsList.map(w => (
                <option key={w.wardId} value={w.wardId}>
                  Ward {w.wardNumber} - {w.wardName}
                </option>
              ))}
            </select>

            <div className="cds-section__search">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ab3a0" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Filter groups..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b8f72' }}>Loading units...</div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#6b8f72', fontSize: '14px' }}>
            No units found. Register your first Ayalkoottam unit using the <strong>+ New Record</strong> button.
          </div>
        ) : (
          <div className="cds-unit-grid">
            {filteredRows.map((row) => (
              <div 
                key={row.id} 
                className={`cds-unit-card ${row.status !== 'Active' ? 'cds-unit-card--inactive' : ''}`}
                onClick={() => setSelectedUnit(row)}
                style={{ cursor: 'pointer' }}
              >
                {/* Card top glow bar */}
                <div className={`cds-unit-card__bar cds-unit-card__bar--${row.cls}`} />

                {/* Avatar + Name */}
                <div className="cds-unit-card__head">
                  <div className={`cds-unit-card__avatar cds-ayalkoottam-avatar--${row.cls}`}>
                    {row.initials}
                  </div>
                  <div className="cds-unit-card__identity">
                    <div className="cds-unit-card__name">{row.name}</div>
                    <div className="cds-unit-card__id">ID: {row.id.toString().slice(0, 8)}…</div>
                  </div>
                  <span className={`cds-status-badge cds-status-badge--${row.status === 'Active' ? 'active' : 'inactive'}`}>
                    <span className="cds-status-badge__dot" />
                    {row.status}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="cds-unit-card__stats">
                  <div className="cds-unit-card__stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>{row.members} Members</span>
                  </div>
                  <div className="cds-unit-card__stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span>{row.ward}</span>
                  </div>
                  <div className="cds-unit-card__stat">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                    <span>₹{((row.savings || 0) * 100000).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="cds-unit-card__divider" />

                {/* Actions */}
                <div className="cds-unit-card__actions" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="cds-unit-card__view-btn" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUnit(row);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    View Details
                  </button>

                  <button
                    className={`cds-unit-toggle-btn ${row.status === 'Active' ? 'cds-unit-toggle-btn--deactivate' : 'cds-unit-toggle-btn--activate'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(row.id, row.status === 'Active' ? 'Inactive' : 'Active');
                    }}
                  >
                    {row.status === 'Active' ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                        Deactivate
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                        Activate
                      </>
                    )}
                  </button>
                </div>

                {/* Deactivation warning note */}
                {row.status !== 'Active' && (
                  <div className="cds-unit-card__warning">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Unit and all {row.members} members are deactivated
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default UnitRegistryView;
