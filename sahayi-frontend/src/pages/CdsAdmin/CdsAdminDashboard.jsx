import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CdsAdminDashboard.css';
import RegisterUnitWizard from './components/RegisterUnitWizard';
import UnitDetails from './components/UnitDetails';
import { fetchShgUnits, toggleShgUnitStatus, fetchWardsList } from '../../services/api';

// ── Icon helpers ─────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = 'currentColor', fill = 'none', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function CdsAdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [wardDropdownOpen, setWardDropdownOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // Lists state
  const [ayalkoottamList, setAyalkoottamList] = useState([]);
  const [wardsList, setWardsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Wizard state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Helper to construct dynamic initials and colors for units
  const getUnitInitialsAndClass = (name) => {
    const initials = name
      ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : 'UN';
    const classes = ['sv', 'nj', 'pk', 'rm'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const cls = classes[Math.abs(hash) % classes.length];
    return { initials, cls };
  };

  // Fetch real data from SahayiDb
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [wardsRes, unitsRes] = await Promise.all([
        fetchWardsList(),
        fetchShgUnits()
      ]);

      setWardsList(wardsRes.data);
      
      // Set default selected ward to first ward in database if any
      if (wardsRes.data && wardsRes.data.length > 0) {
        const firstWard = wardsRes.data[0];
        setSelectedWard(`Ward ${firstWard.wardNumber}`);
      }

      const mappedUnits = unitsRes.data.map(unit => {
        const { initials, cls } = getUnitInitialsAndClass(unit.name);
        return {
          ...unit,
          initials,
          cls
        };
      });
      setAyalkoottamList(mappedUnits);
    } catch (err) {
      console.error("Failed to load dashboard data from database:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterSuccess = (newUnit) => {
    const { initials, cls } = getUnitInitialsAndClass(newUnit.name);
    const enrichedUnit = { ...newUnit, initials, cls };
    setAyalkoottamList(prev => [enrichedUnit, ...prev]);
  };

  const handleToggleStatus = async (id, newStatus) => {
    try {
      const isActive = newStatus === 'Active';
      await toggleShgUnitStatus(id, isActive);
      setAyalkoottamList(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, status: newStatus };
        }
        return item;
      }));
    } catch (err) {
      console.error("Failed to toggle status in backend database:", err);
      alert("Failed to update status on server.");
    }
  };





  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  const [unitWardFilter, setUnitWardFilter] = useState('ALL');

  const filteredRows = ayalkoottamList.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      a.ward.toLowerCase().includes(tableSearch.toLowerCase());
    
    const matchesWard = unitWardFilter === 'ALL' || 
      String(a.wardId) === String(unitWardFilter) ||
      a.ward.toLowerCase().includes(`ward ${unitWardFilter}`.toLowerCase());

    return matchesSearch && matchesWard;
  });

  const totalUnitsCount = ayalkoottamList.length;
  const totalMembersCount = ayalkoottamList.reduce((sum, unit) => sum + (unit.members || 0), 0);
  const activeUnitsCount = ayalkoottamList.filter(unit => unit.status === 'Active').length;
  const activePercentage = totalUnitsCount > 0 ? Math.round((activeUnitsCount / totalUnitsCount) * 100) : 0;
  const totalSavingsLakhs = ayalkoottamList.reduce((sum, unit) => sum + (unit.savings || 0), 0);

  const recentActivities = ayalkoottamList.slice(0, 4).map(unit => ({
    dot: unit.status === 'Active' ? 'green' : 'red',
    type: 'New Unit Registered',
    desc: `'${unit.name}' group added under ${unit.ward}.`,
    time: 'Recently'
  }));

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
    { key: 'unit', label: 'Unit', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
    { key: 'financials', label: 'Financials', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
    { key: 'meetings', label: 'Meetings', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
    { key: 'reports', label: 'Reports', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
  ];

  const initials = user.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'CA';



  return (
    <div className="cds-root">
      {/* ══ SIDEBAR ══ */}
      <aside className="cds-sidebar">
        <div className="cds-sidebar__brand">
          <div className="cds-sidebar__logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="white" />
            </svg>
          </div>
          <div className="cds-sidebar__brand-text">
            <span className="cds-sidebar__role">CDS Admin</span>
            <span className="cds-sidebar__subrole">Community Growth</span>
          </div>
        </div>

        <nav className="cds-sidebar__nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`cds-nav-item${activeNav === item.key ? ' active' : ''}`}
              onClick={() => {
                setActiveNav(item.key);
                setSelectedUnit(null);
              }}
            >
              <Icon d={item.icon} size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button className="cds-sidebar__new-btn" onClick={() => setIsRecordModalOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          <span>New Record</span>
        </button>

        <div className="cds-sidebar__bottom">
          <button className="cds-nav-item" onClick={() => { }}>
            <Icon d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" size={16} />
            <span>Settings</span>
          </button>
          <button className="cds-nav-item" onClick={handleLogout}>
            <Icon d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className="cds-main">
        {/* Header */}
        <header className="cds-header">
          <span className="cds-header__logo">SAHAYI</span>

          <div className="cds-header__search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ab3a0" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search systems..."
            />
          </div>

          <div className="cds-header__spacer" />

          <div className="cds-header__actions">
            <button className="cds-header__icon-btn" title="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>
            <button className="cds-header__icon-btn" title="Help">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
              </svg>
            </button>
            <div className="cds-header__user">
              <div className="cds-header__avatar">{initials}</div>
              <span className="cds-header__username">{user.fullName || 'CDS Admin'}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="cds-content">
          {selectedUnit ? (
            <UnitDetails
              unit={selectedUnit}
              onBack={() => setSelectedUnit(null)}
              onStatusChange={(id, newStatus) => {
                handleToggleStatus(id, newStatus);
                setSelectedUnit(prev => prev ? { ...prev, status: newStatus } : null);
              }}
            />
          ) : (
            <>
              {activeNav === 'dashboard' && (
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

              {/* Ayalkoottam Registry */}
              <div className="cds-section">
                <div className="cds-section__header">
                  <span className="cds-section__title">Ayalkoottam Registry</span>
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
                        placeholder="Filter by name, ward, or status..."
                        value={tableSearch}
                        onChange={e => setTableSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="cds-table-wrap">
                  <table className="cds-table">
                    <thead>
                      <tr>
                        <th>Ayalkoottam Name</th>
                        <th>Ward / Location</th>
                        <th>Members</th>
                        <th>Status</th>
                        <th>Last Audit</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="cds-ayalkoottam-cell">
                              <div className={`cds-ayalkoottam-avatar cds-ayalkoottam-avatar--${row.cls}`}>
                                {row.initials}
                              </div>
                              <div>
                                <div className="cds-ayalkoottam-name">{row.name}</div>
                                <div className="cds-ayalkoottam-id">ID: {row.id}</div>
                              </div>
                            </div>
                          </td>
                          <td>{row.ward}</td>
                          <td>{row.members} Members</td>
                          <td>
                            <span className={`cds-status-badge cds-status-badge--${row.status === 'Active' ? 'active' : row.status === 'Pending Approval' ? 'pending' : 'inactive'
                              }`}>
                              <span className="cds-status-badge__dot" />
                              {row.status}
                            </span>
                          </td>
                          <td style={{ color: row.lastAudit === 'Overdue' ? '#c25252' : undefined, fontWeight: row.lastAudit === 'Overdue' ? 600 : 400 }}>
                            {row.lastAudit}
                          </td>
                          <td>
                            <div className="cds-table-actions">
                              <button className="cds-action-btn cds-action-btn--primary" onClick={() => setSelectedUnit(row)}>View</button>
                              <button className="cds-action-btn">Audit</button>
                              {row.status === 'Active' || row.status === 'Pending Audit' ? (
                                <button
                                  className="cds-action-btn"
                                  style={{ color: '#c25252', borderColor: '#eec4c4' }}
                                  onClick={() => handleToggleStatus(row.id, 'Inactive')}
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  className="cds-action-btn"
                                  style={{ color: '#2a6e38', borderColor: '#b8d9bc' }}
                                  onClick={() => handleToggleStatus(row.id, 'Active')}
                                >
                                  Activate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="cds-pagination">
                  <span className="cds-pagination__info">Showing 1–{filteredRows.length} of {ayalkoottamList.length} groups</span>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="cds-bottom-row">
                {/* Ward Selector Panel */}
                {(() => {
                  const selectedWardObj = wardsList.find(w => `Ward ${w.wardNumber}` === selectedWard);
                  const wardUnits = selectedWardObj 
                    ? ayalkoottamList.filter(u => u.wardId === selectedWardObj.wardId)
                    : [];

                  const totalAyalkoottams = wardUnits.length;
                  const totalMembers = wardUnits.reduce((s, u) => s + (u.members || 0), 0);
                  const totalSavings = wardUnits.reduce((s, u) => s + (u.savings || 0), 0).toFixed(2);
                  const wardLocation = selectedWardObj ? selectedWardObj.wardName : "Unknown Region";

                  return (
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
                                  <span className={`cds-status-badge cds-status-badge--${
                                    unit.status === 'Active' ? 'active' : unit.status === 'Pending Audit' ? 'pending' : 'inactive'
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
                  );
                })()}

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
          )}

          {activeNav === 'unit' && (
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
                      <div key={row.id} className={`cds-unit-card ${row.status !== 'Active' ? 'cds-unit-card--inactive' : ''}`}>
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
                        <div className="cds-unit-card__actions">
                          <button 
                            className="cds-action-btn cds-action-btn--primary" 
                            style={{ flex: 1, minWidth: '110px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '7px 12px', fontSize: '12px' }} 
                            onClick={() => setSelectedUnit(row)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                            View Details
                          </button>

                          <button
                            className={`cds-unit-toggle-btn ${row.status === 'Active' ? 'cds-unit-toggle-btn--deactivate' : 'cds-unit-toggle-btn--activate'}`}
                            onClick={() => handleToggleStatus(row.id, row.status === 'Active' ? 'Inactive' : 'Active')}
                          >
                            {row.status === 'Active' ? (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
                                </svg>
                                Deactivate
                              </>
                            ) : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          )}

          {(activeNav === 'financials' || activeNav === 'meetings' || activeNav === 'reports') && (
            <div className="cds-placeholder-view">
              <div className="cds-placeholder-card">
                <h2>{activeNav.charAt(0).toUpperCase() + activeNav.slice(1)} Module</h2>
                <p>This module is currently being optimized. Real-time data and analytics will be available shortly.</p>
                <button className="cds-action-btn cds-action-btn--primary" style={{ marginTop: 16 }} onClick={() => setActiveNav('dashboard')}>
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
            </>
          )}

          <RegisterUnitWizard
            isRecordModalOpen={isRecordModalOpen}
            setIsRecordModalOpen={setIsRecordModalOpen}
            activeNav={activeNav}
            setActiveNav={setActiveNav}
            onRegisterSuccess={handleRegisterSuccess}
          />
        </main>

        {/* Footer */}
        <footer className="cds-footer">
          <div>
            <div className="cds-footer__brand">SAHAYI</div>
            <div className="cds-footer__sub">© 2024 Ayalkoottam Management System. Empowering local communities.</div>
          </div>
          <div className="cds-footer__links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </footer>
      </div>


    </div>
  );
}

export default CdsAdminDashboard;
