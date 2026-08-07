import React from 'react';

function SystemOverview({
  totalUnitsCount,
  totalMembersCount,
  activePercentage,
  activeUnitsCount,
  totalSavingsLakhs,
  wardsList,
  selectedWard,
  setSelectedWard,
  wardDropdownOpen,
  setWardDropdownOpen,
  ayalkoottamList,
  recentActivities
}) {
  const selectedWardObj = wardsList.find(w => `Ward ${w.wardNumber}` === selectedWard);
  const wardUnits = selectedWardObj
    ? ayalkoottamList.filter(u => u.wardId === selectedWardObj.wardId)
    : [];

  const totalAyalkoottams = wardUnits.length;
  const totalMembers = wardUnits.reduce((s, u) => s + (u.members || 0), 0);
  const totalSavings = wardUnits.reduce((s, u) => s + (u.savings || 0), 0).toFixed(2);
  const wardLocation = selectedWardObj ? selectedWardObj.wardName : "Unknown Region";

  return (
    <>
      {/* Page Header */}
      <div className="cds-page-header">
        <div>
          <h1 className="cds-page-header__title">System Overview</h1>
          <p className="cds-page-header__sub">Real-time monitoring of all community clusters and financial activities.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="cds-stats-row">
        <div className="cds-stat-card">
          <div className="cds-stat-card__top">
            <div className="cds-stat-card__icon cds-stat-card__icon--green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2a6e38" strokeWidth="2" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="cds-stat-card__badge cds-stat-card__badge--green">Live Sync</span>
          </div>
          <div className="cds-stat-card__label">Total Ayalkoottams</div>
          <div className="cds-stat-card__value">{totalUnitsCount}</div>
        </div>

        <div className="cds-stat-card">
          <div className="cds-stat-card__top">
            <div className="cds-stat-card__icon cds-stat-card__icon--orange">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b85010" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <span className="cds-stat-card__badge cds-stat-card__badge--orange">Live Sync</span>
          </div>
          <div className="cds-stat-card__label">Total Members</div>
          <div className="cds-stat-card__value">{totalMembersCount}</div>
        </div>

        <div className="cds-stat-card">
          <div className="cds-stat-card__top">
            <div className="cds-stat-card__icon cds-stat-card__icon--blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <span className="cds-stat-card__badge cds-stat-card__badge--blue">{activePercentage}% Active</span>
          </div>
          <div className="cds-stat-card__label">Active Units</div>
          <div className="cds-stat-card__value">{activeUnitsCount}</div>
        </div>

        <div className="cds-stat-card">
          <div className="cds-stat-card__top">
            <div className="cds-stat-card__icon cds-stat-card__icon--teal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2a6e5a" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" /><path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>
          <div className="cds-stat-card__label">Total Savings Progress</div>
          <div className="cds-stat-card__value cds-stat-card__value--rupee">₹{totalSavingsLakhs.toFixed(2)}L</div>
          <div className="cds-stat-progress">
            <div className="cds-stat-progress__bar">
              <div className="cds-stat-progress__fill" style={{ width: `${Math.min(100, (totalSavingsLakhs / 50.0) * 100)}%` }} />
            </div>
            <div className="cds-stat-progress__label">₹{totalSavingsLakhs.toFixed(2)}L of ₹50.00L goal</div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="cds-bottom-row">
        {/* Ward Selector Panel */}
        <div className="cds-ward-panel">
          <div className="cds-ward-panel__header">
            <span className="cds-ward-panel__title">Ward Overview</span>

            <div className="cds-ward-dropdown" onBlur={() => setWardDropdownOpen(false)} tabIndex={0}>
              <button
                className="cds-ward-dropdown__trigger"
                onClick={() => setWardDropdownOpen(o => !o)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {selectedWard || 'Select Ward'}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points={wardDropdownOpen ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                </svg>
              </button>

              {wardDropdownOpen && (
                <div className="cds-ward-dropdown__menu">
                  {wardsList.map(w => {
                    const wLabel = `Ward ${w.wardNumber}`;
                    return (
                      <button
                        key={w.wardId}
                        className={`cds-ward-dropdown__item${selectedWard === wLabel ? ' active' : ''}`}
                        onMouseDown={() => { setSelectedWard(wLabel); setWardDropdownOpen(false); }}
                      >
                        {selectedWard === wLabel && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        {wLabel}
                        <span className="cds-ward-dropdown__item-sub">{w.wardName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="cds-ward-stats">
            <div className="cds-ward-stat">
              <div className="cds-ward-stat__icon cds-ward-stat__icon--green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a6e38" strokeWidth="2" strokeLinecap="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div>
                <div className="cds-ward-stat__value">{totalAyalkoottams}</div>
                <div className="cds-ward-stat__label">Ayalkoottams</div>
              </div>
            </div>
            <div className="cds-ward-stat">
              <div className="cds-ward-stat__icon cds-ward-stat__icon--orange">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b85010" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div>
                <div className="cds-ward-stat__value">{totalMembers}</div>
                <div className="cds-ward-stat__label">Total Members</div>
              </div>
            </div>
            <div className="cds-ward-stat">
              <div className="cds-ward-stat__icon cds-ward-stat__icon--teal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a6e5a" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div>
                <div className="cds-ward-stat__value">₹{totalSavings}L</div>
                <div className="cds-ward-stat__label">Total Savings</div>
              </div>
            </div>
          </div>

          <div className="cds-ward-units">
            <div className="cds-ward-units__header">
              <span>Ayalkoottam Units in {selectedWard || 'Selected Ward'}</span>
              <span style={{ color: '#8fa896', fontSize: 12 }}>{wardLocation}</span>
            </div>
            <table className="cds-ward-table">
              <thead>
                <tr>
                  <th>Unit Name</th>
                  <th>Members</th>
                  <th>Savings (₹L)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {wardUnits.map(unit => (
                  <tr key={unit.id}>
                    <td>
                      <div className="cds-ward-unit-name">{unit.name}</div>
                      <div className="cds-ward-unit-id">{unit.id}</div>
                    </td>
                    <td>{unit.members}</td>
                    <td>₹{unit.savings.toFixed(2)}L</td>
                    <td>
                      <span className={`cds-status-badge cds-status-badge--${unit.status === 'Active' ? 'active' : unit.status === 'Pending Audit' ? 'pending' : 'inactive'
                        }`}>
                        <span className="cds-status-badge__dot" />
                        {unit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="cds-activity-card">
          <div className="cds-activity-card__header">
            <span className="cds-activity-card__title">Recent Actions</span>
          </div>

          <div className="cds-activity-list">
            {recentActivities.length === 0 ? (
              <div style={{ padding: '24px', color: '#6b8f72', fontSize: '13px', textAlign: 'center' }}>
                No recent activities recorded.
              </div>
            ) : (
              recentActivities.map((a, i) => (
                <div key={i} className="cds-activity-item">
                  <div className={`cds-activity-dot cds-activity-dot--${a.dot}`} />
                  <div className="cds-activity-body">
                    <div className="cds-activity-type">{a.type}</div>
                    <div className="cds-activity-desc">{a.desc}</div>
                    <div className="cds-activity-time">{a.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="cds-activity-footer">
            <button className="cds-view-all-btn">View All Activity</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SystemOverview;
