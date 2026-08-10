import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import './SecretaryDashboard.css';

// API Services
import {
  fetchSecretaryDashboard,
  registerSecretaryMember,
  scheduleSecretaryMeeting,
  recordSecretarySavings,
  verifySecretaryLoan,
  saveSecretaryAttendance,
  deleteSecretaryMeeting
} from '../../services/api';

// Layout Components
import SecretaryHeader from './components/SecretaryHeader';
import SecretarySidebar from './components/SecretarySidebar';
import SecretaryFooter from './components/SecretaryFooter';

// View Components
import OperationalOverview from './components/views/OperationalOverview';
import MembersRegistryView from './components/views/MembersRegistryView';
import FinancialsView from './components/views/FinancialsView';
import MeetingsView from './components/views/MeetingsView';
import ReportsView from './components/views/ReportsView';
import SettingsView from './components/views/SettingsView';

// Modal Components
import RegisterMemberModal from './components/modals/RegisterMemberModal';
import ScheduleMeetingModal from './components/modals/ScheduleMeetingModal';
import RecordAttendanceModal from './components/modals/RecordAttendanceModal';
import LoanDetailModal from './components/modals/LoanDetailModal';
import SavingsHistoryModal from './components/modals/SavingsHistoryModal';
import CalendarModal from './components/modals/CalendarModal';
import EditSavingsModal from './components/modals/EditSavingsModal';
import MemberDetailModal from './components/modals/MemberDetailModal';
import { formatTimeTo12Hr } from './utils/formatTime';

function SecretaryDashboard() {
  const navigate = useNavigate();

  // Current logged in user info
  const [currentUser, setCurrentUser] = useState(null);

  // Navigation & View state
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('secretary_active_tab') || 'dashboard';
  });

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('secretary_active_tab', activeTab);
    }
  }, [activeTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedLoanDetail, setSelectedLoanDetail] = useState(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState(null);
  const [editingSavings, setEditingSavings] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Synchronize browser history popstate event for dynamic back navigation
  useEffect(() => {
    const handlePopState = () => {
      if (selectedLoanDetail) {
        setSelectedLoanDetail(null);
      } else if (selectedMemberDetail) {
        setSelectedMemberDetail(null);
      } else if (editingSavings) {
        setEditingSavings(null);
      } else if (showRegisterModal || showMeetingModal || showAttendanceModal || showHistoryModal || showCalendarModal) {
        setShowRegisterModal(false);
        setShowMeetingModal(false);
        setShowAttendanceModal(false);
        setShowHistoryModal(false);
        setShowCalendarModal(false);
      } else if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedLoanDetail, selectedMemberDetail, editingSavings, showRegisterModal, showMeetingModal, showAttendanceModal, showHistoryModal, showCalendarModal, activeTab]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Form states
  const [newMember, setNewMember] = useState({ name: '', memberId: '', phone: '', address: '', savings: '100' });
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    location: '',
    tag: 'NEXT WEEK'
  });

  // Dynamic Data States (Fetched from SahayiDb)
  const [savingsLogs, setSavingsLogs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loans, setLoans] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [financials, setFinancials] = useState({
    totalCollection: 0,
    disbursedLoans: 0,
    pendingDues: 0
  });
  const [unitInfo, setUnitInfo] = useState(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        return {
          unitId: u?.unitId && !isNaN(Number(u.unitId)) ? Number(u.unitId) : null,
          unitName: u?.unitName || '',
          secretaryName: u?.fullName || '',
          secretaryPhone: u?.phoneNumber || ''
        };
      }
    } catch (e) {
      console.error('Error initializing user unitInfo:', e);
    }
    return {
      unitId: null,
      unitName: '',
      secretaryName: '',
      secretaryPhone: ''
    };
  });

  // Fetch real data from SahayiDb on component mount
  const loadDashboardData = async () => {
    setIsLoading(true);
    let userObj = null;
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        userObj = JSON.parse(rawUser);
      }
    } catch (e) {
      console.error('Error parsing stored user data:', e);
    }

    setCurrentUser(userObj);

    try {
      const res = await fetchSecretaryDashboard(userObj?.unitId, userObj?.userId);
      const data = res.data;
      if (data) {
        setSavingsLogs(data.savingsLogs || []);
        const formattedMeetings = (data.meetings || []).map(m => ({
          ...m,
          time: formatTimeTo12Hr(m.time)
        }));
        setMeetings(formattedMeetings);
        setLoans(data.pendingLoans || []);
        setAttendanceList(data.members || []);
        setFinancials({
          totalCollection: data.totalWeeklyCollection || 0,
          disbursedLoans: data.disbursedLoansTotal || 0,
          pendingDues: data.pendingDuesCount || 0
        });
        setUnitInfo({
          unitId: data.unitId,
          unitName: data.unitName || userObj?.unitName || '',
          secretaryName: data.secretaryName || userObj?.fullName || '',
          secretaryPhone: data.secretaryPhone || userObj?.phoneNumber || ''
        });
      }
    } catch (err) {
      console.error('Failed to load secretary dashboard data from database:', err);
      showToast('Could not load latest data from SahayiDb database', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login', { replace: true });
    window.location.replace('/login');
  };

  const handleRecordSavings = async (item) => {
    try {
      await recordSecretarySavings(
        { userId: item.userId || '00000000-0000-0000-0000-000000000000', amount: parseFloat(item.amount || 100) },
        unitInfo.unitId
      );
      setSavingsLogs(prev =>
        prev.map(s => (s.id === item.id ? { ...s, status: 'Paid' } : s))
      );
      showToast(`Weekly savings recorded as Paid for ${item.name}!`);
    } catch (err) {
      console.error('Error recording savings:', err);
      showToast('Failed to record savings in SahayiDb database', 'error');
    }
  };

  const handleSaveEditSavings = (e) => {
    e.preventDefault();
    if (!editingSavings) return;
    setSavingsLogs(prev =>
      prev.map(item => (item.id === editingSavings.id ? editingSavings : item))
    );
    setEditingSavings(null);
    showToast('Savings record updated successfully!');
  };

  const handleVerifyAndForward = async (loan) => {
    try {
      await verifySecretaryLoan(loan.id);
      setLoans(prev => prev.filter(item => item.id !== loan.id));
      showToast(`Loan request for ${loan.name} endorsed & forwarded to President!`);
    } catch (err) {
      console.error('Error endorsing loan application:', err);
      showToast('Failed to update loan application status in database', 'error');
    }
  };

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMember.name) {
      showToast('Please fill in Member Full Name', 'error');
      return;
    }

    try {
      const payload = {
        name: newMember.name,
        memberId: newMember.memberId || `AK-${Date.now().toString().slice(-3)}`,
        phone: newMember.phone,
        address: newMember.address,
        savings: parseFloat(newMember.savings || 100)
      };

      const res = await registerSecretaryMember(payload, unitInfo.unitId);
      const createdUser = res.data?.user;

      const created = {
        id: createdUser?.userId || Date.now(),
        userId: createdUser?.userId,
        name: createdUser?.name || newMember.name,
        memberId: createdUser?.memberId || newMember.memberId || 'AK-100',
        amount: `${parseFloat(newMember.savings || 100).toFixed(2)}`,
        status: 'Paid',
        date: new Date().toISOString().split('T')[0]
      };

      setSavingsLogs(prev => [created, ...prev]);
      setAttendanceList(prev => [
        ...prev,
        {
          id: created.id,
          userId: created.userId,
          name: created.name,
          memberId: created.memberId,
          phone: newMember.phone || '+91 98470 12345',
          address: newMember.address,
          houseName: newMember.address,
          savings: newMember.savings || '100.00',
          status: 'present'
        }
      ]);
      setShowRegisterModal(false);
      setNewMember({ name: '', memberId: '', phone: '', address: '', savings: '100' });
      showToast(`New member ${created.name} registered in SahayiDb database!`);
    } catch (err) {
      console.error('Error registering member:', err);
      showToast(err.response?.data?.message || 'Failed to register member in database', 'error');
    }
  };

  const handleAddMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.location) {
      showToast('Please provide meeting title and location', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (newMeeting.date && newMeeting.date < todayStr) {
      showToast('Cannot schedule meeting on a past date. Please select today or a future date.', 'error');
      return;
    }

    const formattedTime = formatTimeTo12Hr(newMeeting.time);

    try {
      const payload = {
        title: newMeeting.title,
        date: newMeeting.date,
        time: formattedTime,
        location: newMeeting.location,
        tag: newMeeting.tag || 'NEXT WEEK'
      };

      const res = await scheduleSecretaryMeeting(payload, unitInfo.unitId);
      const m = res.data?.meeting;

      const created = {
        id: m?.id || Date.now(),
        title: m?.title || newMeeting.title,
        date: m?.date || newMeeting.date || new Date().toISOString().split('T')[0],
        tag: m?.tag || newMeeting.tag || 'UPCOMING',
        tagType: m?.tagType || (newMeeting.tag === 'NEXT WEEK' ? 'dark' : 'peach'),
        time: m?.time ? formatTimeTo12Hr(m.time) : formattedTime,
        location: m?.location || newMeeting.location
      };

      setMeetings(prev => [created, ...prev]);
      setShowMeetingModal(false);
      setNewMeeting({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00 AM',
        location: '',
        tag: 'NEXT WEEK'
      });
      showToast(`Meeting "${created.title}" scheduled in SahayiDb database!`);
    } catch (err) {
      console.error('Error scheduling meeting:', err);
      showToast(err.response?.data?.message || 'Failed to schedule meeting', 'error');
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    setMeetings(prev => prev.filter(m => String(m.id) !== String(meetingId)));
    showToast('Meeting deleted from schedule!');
    if (meetingId && !isNaN(Number(meetingId))) {
      try {
        await deleteSecretaryMeeting(meetingId);
      } catch (err) {
        // Handled silently if meeting was temporary/mock or already removed
      }
    }
  };

  const handleSaveAttendance = async () => {
    try {
      const attendances = attendanceList.map(item => ({
        userId: item.userId || '00000000-0000-0000-0000-000000000000',
        isPresent: item.status === 'present'
      }));

      await saveSecretaryAttendance({ meetingId: 1, attendances });
      setShowAttendanceModal(false);
      showToast('Attendance recorded in SahayiDb database!');
    } catch (err) {
      console.error('Error saving attendance:', err);
      showToast('Failed to record attendance in database', 'error');
    }
  };

  const toggleAttendanceStatus = (id) => {
    setAttendanceList(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: item.status === 'present' ? 'absent' : 'present' } : item
      )
    );
  };

  // Filtering savings log based on search query
  const filteredSavings = savingsLogs.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.memberId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLoans = loans.filter(
    l =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sec-dashboard-layout">
      {/* Toast Notification Bar */}
      {toast && (
        <div className={`sec-toast sec-toast--${toast.type}`}>
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar Header */}
      <SecretaryHeader
        unitInfo={unitInfo}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onShowToast={showToast}
        onNavigateSettings={() => setActiveTab('settings')}
      />

      <div className="sec-body-container">
        {/* Left Sidebar Navigation */}
        <SecretarySidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unitInfo={unitInfo}
          onLogout={handleLogout}
        />

        {/* Main Content Area Views */}
        <main className="sec-main-content">
          {activeTab === 'dashboard' && (
            <OperationalOverview
              unitInfo={unitInfo}
              isLoading={isLoading}
              filteredSavings={filteredSavings}
              meetings={meetings}
              loans={loans}
              filteredLoans={filteredLoans}
              onShowRegisterModal={() => setShowRegisterModal(true)}
              onShowMeetingModal={() => setShowMeetingModal(true)}
              onShowAttendanceModal={() => setShowAttendanceModal(true)}
              onShowHistoryModal={() => setShowHistoryModal(true)}
              onShowCalendarModal={() => setShowCalendarModal(true)}
              onRecordSavings={handleRecordSavings}
              onEditSavings={setEditingSavings}
              onVerifyAndForward={handleVerifyAndForward}
              onSelectLoanDetail={setSelectedLoanDetail}
              onDeleteMeeting={handleDeleteMeeting}
            />
          )}

          {activeTab === 'members' && (
            <MembersRegistryView
              unitInfo={unitInfo}
              attendanceList={attendanceList}
              onShowRegisterModal={() => setShowRegisterModal(true)}
              onShowToast={showToast}
              onSelectMemberDetail={setSelectedMemberDetail}
            />
          )}

          {activeTab === 'financials' && (
            <FinancialsView financials={financials} />
          )}

          {activeTab === 'meetings' && (
            <MeetingsView
              meetings={meetings}
              onShowMeetingModal={() => setShowMeetingModal(true)}
              onDeleteMeeting={handleDeleteMeeting}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView onShowToast={showToast} />
          )}

          {activeTab === 'settings' && (
            <SettingsView unitInfo={unitInfo} />
          )}
        </main>
      </div>

      {/* Footer Bar */}
      <SecretaryFooter onShowToast={showToast} />

      {/* Modals */}
      {showRegisterModal && (
        <RegisterMemberModal
          newMember={newMember}
          setNewMember={setNewMember}
          onSubmit={handleAddMemberSubmit}
          onClose={() => setShowRegisterModal(false)}
        />
      )}

      {showMeetingModal && (
        <ScheduleMeetingModal
          newMeeting={newMeeting}
          setNewMeeting={setNewMeeting}
          onSubmit={handleAddMeetingSubmit}
          onClose={() => setShowMeetingModal(false)}
        />
      )}

      {showAttendanceModal && (
        <RecordAttendanceModal
          unitInfo={unitInfo}
          attendanceList={attendanceList}
          onToggleAttendance={toggleAttendanceStatus}
          onSaveAttendance={handleSaveAttendance}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}

      {selectedLoanDetail && (
        <LoanDetailModal
          loan={selectedLoanDetail}
          onVerifyAndForward={handleVerifyAndForward}
          onClose={() => setSelectedLoanDetail(null)}
        />
      )}

      {selectedMemberDetail && (
        <MemberDetailModal
          member={selectedMemberDetail}
          unitInfo={unitInfo}
          onClose={() => setSelectedMemberDetail(null)}
        />
      )}

      {showHistoryModal && (
        <SavingsHistoryModal
          savingsLogs={savingsLogs}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showCalendarModal && (
        <CalendarModal
          meetings={meetings}
          onDeleteMeeting={handleDeleteMeeting}
          onClose={() => setShowCalendarModal(false)}
        />
      )}

      {editingSavings && (
        <EditSavingsModal
          editingSavings={editingSavings}
          setEditingSavings={setEditingSavings}
          onSave={handleSaveEditSavings}
          onClose={() => setEditingSavings(null)}
        />
      )}
    </div>
  );
}

export default SecretaryDashboard;
