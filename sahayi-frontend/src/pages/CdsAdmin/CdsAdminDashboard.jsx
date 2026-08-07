import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CdsAdminDashboard.css';
import RegisterUnitWizard from './components/RegisterUnitWizard';
import UnitDetails from './components/UnitDetails';
import CdsAdminSidebar from './components/CdsAdminSidebar';
import CdsAdminHeader from './components/CdsAdminHeader';
import SystemOverview from './components/SystemOverview';
import UnitRegistryView from './components/UnitRegistryView';
import PlaceholderView from './components/PlaceholderView';
import CdsAdminFooter from './components/CdsAdminFooter';
import { fetchShgUnits, toggleShgUnitStatus, fetchWardsList } from '../../services/api';

function CdsAdminDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState(() => {
    return sessionStorage.getItem('cds_admin_active_nav') || 'dashboard';
  });

  useEffect(() => {
    if (activeNav) {
      sessionStorage.setItem('cds_admin_active_nav', activeNav);
    }
  }, [activeNav]);

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
    localStorage.removeItem('role');
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login', { replace: true });
    window.location.replace('/login');
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
    { key: 'unit', label: 'Unit', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 010 7.75' },
    { key: 'financials', label: 'Financials', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
    { key: 'meetings', label: 'Meetings', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
    { key: 'reports', label: 'Reports', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
  ];

  const initials = user.fullName
    ? user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'CA';

  return (
    <div className="cds-root">
      {/* Sidebar */}
      <CdsAdminSidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        setSelectedUnit={setSelectedUnit}
        setIsRecordModalOpen={setIsRecordModalOpen}
        handleLogout={handleLogout}
        navItems={navItems}
      />

      {/* Main Content Area */}
      <div className="cds-main">
        {/* Header */}
        <CdsAdminHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          initials={initials}
          user={user}
        />

        {/* Dynamic Content Views */}
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
                <SystemOverview
                  totalUnitsCount={totalUnitsCount}
                  totalMembersCount={totalMembersCount}
                  activePercentage={activePercentage}
                  activeUnitsCount={activeUnitsCount}
                  totalSavingsLakhs={totalSavingsLakhs}
                  wardsList={wardsList}
                  selectedWard={selectedWard}
                  setSelectedWard={setSelectedWard}
                  wardDropdownOpen={wardDropdownOpen}
                  setWardDropdownOpen={setWardDropdownOpen}
                  ayalkoottamList={ayalkoottamList}
                  recentActivities={recentActivities}
                />
              )}

              {activeNav === 'unit' && (
                <UnitRegistryView
                  ayalkoottamList={ayalkoottamList}
                  activeUnitsCount={activeUnitsCount}
                  totalMembersCount={totalMembersCount}
                  unitWardFilter={unitWardFilter}
                  setUnitWardFilter={setUnitWardFilter}
                  wardsList={wardsList}
                  tableSearch={tableSearch}
                  setTableSearch={setTableSearch}
                  isLoading={isLoading}
                  filteredRows={filteredRows}
                  setSelectedUnit={setSelectedUnit}
                  handleToggleStatus={handleToggleStatus}
                />
              )}

              {(activeNav === 'financials' || activeNav === 'meetings' || activeNav === 'reports') && (
                <PlaceholderView
                  activeNav={activeNav}
                  setActiveNav={setActiveNav}
                />
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
        <CdsAdminFooter />
      </div>
    </div>
  );
}

export default CdsAdminDashboard;
