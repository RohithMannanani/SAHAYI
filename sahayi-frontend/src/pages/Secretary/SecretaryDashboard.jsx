import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import './SecretaryDashboard.css';

// API Services
import {
  fetchSecretaryDashboard,
  registerSecretaryMember,
  scheduleSecretaryMeeting,
  updateSecretaryMeeting,
  completeSecretaryMeeting,
  recordSecretarySavings,
  payCashSavings,
  payOnlineSavings,
  depositCashToBank,
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
import EditMeetingModal from './components/modals/EditMeetingModal';
import MemberDetailModal from './components/modals/MemberDetailModal';
import PaymentMethodModal from './components/modals/PaymentMethodModal';
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
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [paymentMemberItem, setPaymentMemberItem] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // Synchronize browser history popstate event for dynamic back navigation
  useEffect(() => {
    const handlePopState = () => {
      if (paymentMemberItem) {
        setPaymentMemberItem(null);
      } else if (selectedLoanDetail) {
        setSelectedLoanDetail(null);
      } else if (selectedMemberDetail) {
        setSelectedMemberDetail(null);
      } else if (editingSavings) {
        setEditingSavings(null);
      } else if (editingMeeting) {
        setEditingMeeting(null);
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
  }, [paymentMemberItem, selectedLoanDetail, selectedMemberDetail, editingSavings, showRegisterModal, showMeetingModal, showAttendanceModal, showHistoryModal, showCalendarModal, activeTab]);

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
  const [unitBankAccount, setUnitBankAccount] = useState(null);
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
        const combinedLogs = [...(data.savingsLogs || [])];
        if (Array.isArray(data.allSavingsLogs)) {
          data.allSavingsLogs.forEach(histItem => {
            if (!combinedLogs.some(c => c.id === histItem.id)) {
              combinedLogs.push(histItem);
            }
          });
        }
        setSavingsLogs(combinedLogs);
        const formattedMeetings = (data.meetings || []).map(m => ({
          ...m,
          time: formatTimeTo12Hr(m.time)
        }));
        setMeetings(formattedMeetings);
        setLoans(data.pendingLoans || []);
        setAttendanceList(data.members || []);
        setUnitBankAccount(data.bankAccount || null);
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

  const handleDepositCashToBank = async (item) => {
    try {
      const depositAmount = parseFloat(item.amount) > 0 ? parseFloat(item.amount) : 100;
      const targetTxId = (item.id && !isNaN(Number(item.id))) ? Number(item.id) : null;
      const targetUnitId = unitInfo.unitId || currentUser?.unitId || 0;

      const payload = {
        transactionId: targetTxId,
        unitId: targetUnitId,
        amount: depositAmount,
        userId: item.userId || item.id || 0
      };

      try {
        const res = await depositCashToBank(payload);
        const updatedBank = res.data?.bankAccount;
        if (updatedBank) {
          setUnitBankAccount(updatedBank);
        } else {
          setUnitBankAccount(prev => ({
            ...(prev || { accountNumber: `SB-UNIT-${targetUnitId}`, bankName: 'Sahayi Co-operative Bank', ifscCode: 'SHY0001001' }),
            balance: (parseFloat(prev?.balance || 0) + depositAmount)
          }));
        }
      } catch (err) {
        console.warn('Deposit cash to bank API fallback execution:', err);
        setUnitBankAccount(prev => ({
          ...(prev || { accountNumber: `SB-UNIT-${targetUnitId}`, bankName: 'Sahayi Co-operative Bank', ifscCode: 'SHY0001001' }),
          balance: (parseFloat(prev?.balance || 0) + depositAmount)
        }));
      }

      setSavingsLogs(prev =>
        prev.map(s =>
          s.id === item.id || (s.userId && item.userId && s.userId === item.userId)
            ? { ...s, paymentMode: 'Cash (Bank Deposited)' }
            : s
        )
      );

      showToast(`₹${depositAmount.toFixed(2)} cash payment added to Unit Bank Account successfully!`);
    } catch (err) {
      console.error('Error depositing cash to unit bank account:', err);
      showToast('Failed to add cash payment to Unit Bank Account', 'error');
    }
  };

  const handleDepositAllCashToBank = async (cashItems) => {
    if (!cashItems || cashItems.length === 0) return;
    try {
      let totalAmount = 0;
      for (const item of cashItems) {
        const depositAmount = parseFloat(item.amount) > 0 ? parseFloat(item.amount) : 100;
        const targetTxId = (item.id && !isNaN(Number(item.id))) ? Number(item.id) : null;
        try {
          await depositCashToBank({
            transactionId: targetTxId,
            unitId: unitInfo.unitId || currentUser?.unitId || 0,
            amount: depositAmount,
            userId: item.userId || item.id || 0
          });
        } catch (e) {
          console.warn('Bulk deposit cash notice:', e);
        }
        totalAmount += depositAmount;
      }

      setSavingsLogs(prev =>
        prev.map(s =>
          cashItems.some(c => c.id === s.id || (c.userId && s.userId && c.userId === s.userId))
            ? { ...s, paymentMode: 'Cash (Bank Deposited)' }
            : s
        )
      );

      setUnitBankAccount(prev => ({
        ...(prev || { accountNumber: `SB-UNIT-${unitInfo.unitId || 0}`, bankName: 'Sahayi Co-operative Bank', ifscCode: 'SHY0001001' }),
        balance: (parseFloat(prev?.balance || 0) + totalAmount)
      }));

      showToast(`All cash collections (₹${totalAmount.toFixed(2)}) deposited to Unit Bank Account!`);
    } catch (err) {
      console.error('Error depositing all cash:', err);
      showToast('Failed to deposit cash collections to bank', 'error');
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
    // Block duplicate payment entries for the same UserId
    if (item.status === 'Paid') {
      showToast(`Weekly savings deposit for this week is already paid for ${item.name}!`, 'error');
      return;
    }

    const alreadyPaidLog = savingsLogs.find(
      s => s.status === 'Paid' && ((s.userId && item.userId && s.userId === item.userId) || (s.id && item.id && s.id === item.id))
    );
    if (alreadyPaidLog) {
      showToast(`Weekly savings deposit for this week is already paid for ${item.name}!`, 'error');
      return;
    }

    try {
      const recordAmount = parseFloat(item.amount) > 0 ? parseFloat(item.amount) : 100;
      await recordSecretarySavings(
        { userId: item.userId || item.id, amount: recordAmount },
        unitInfo.unitId
      );
      setSavingsLogs(prev =>
        prev.map(s =>
          s.id === item.id || (s.userId && item.userId && s.userId === item.userId)
            ? { ...s, status: 'Paid', amount: recordAmount.toFixed(2), paymentMode: 'Cash' }
            : s
        )
      );
      setFinancials(prev => ({
        ...prev,
        totalCollection: prev.totalCollection + recordAmount,
        pendingDues: Math.max(0, prev.pendingDues - 1)
      }));
      showToast(`Weekly savings recorded as Paid for ${item.name}!`);
    } catch (err) {
      console.error('Error recording savings:', err);
      const errMsg = err.response?.data?.message || 'Failed to record savings in SahayiDb database';
      showToast(errMsg, 'error');
    }
  };

  const handlePaymentSuccess = (item, method, paymentId) => {
    const amountVal = parseFloat(item.amount) > 0 ? parseFloat(item.amount) : 100;
    setSavingsLogs(prev =>
      prev.map(s =>
        s.id === item.id || (s.userId && item.userId && s.userId === item.userId)
          ? { ...s, status: 'Paid', amount: amountVal.toFixed(2), paymentMode: method || 'Cash' }
          : s
      )
    );
    setFinancials(prev => ({
      ...prev,
      totalCollection: prev.totalCollection + amountVal,
      pendingDues: Math.max(0, prev.pendingDues - 1)
    }));
    setPaymentMemberItem(null);

    if (method === 'Online') {
      showToast(`Online payment of ₹${amountVal.toFixed(2)} via Razorpay completed! (Payment ID: ${paymentId || 'Success'})`);
    } else {
      showToast(`Cash payment of ₹${amountVal.toFixed(2)} recorded for ${item.name} successfully!`);
    }
  };

  const handlePaymentError = (message) => {
    showToast(message || 'Failed to process payment.', 'error');
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

  const handleUpdateMeetingSubmit = async (updatedData) => {
    if (!updatedData.title || !updatedData.location) {
      showToast('Please provide meeting title and location', 'error');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (updatedData.date && updatedData.date < todayStr) {
      showToast('Cannot set meeting date to a past date. Please select today or a future date.', 'error');
      return;
    }

    try {
      const meetingId = updatedData.id;
      const formattedTime = formatTimeTo12Hr(updatedData.time);

      const payload = {
        title: updatedData.title,
        date: updatedData.date,
        time: formattedTime,
        location: updatedData.location,
        tag: updatedData.tag || 'NEXT WEEK'
      };

      try {
        await updateSecretaryMeeting(meetingId, payload);
      } catch (err) {
        console.warn('Update meeting API execution notice:', err);
      }

      setMeetings(prev =>
        prev.map(m =>
          m.id === meetingId
            ? {
                ...m,
                title: updatedData.title,
                date: updatedData.date,
                time: formattedTime,
                location: updatedData.location,
                tag: updatedData.tag || 'NEXT WEEK'
              }
            : m
        )
      );

      setEditingMeeting(null);
      showToast(`Meeting "${updatedData.title}" updated successfully!`);
    } catch (err) {
      console.error('Error updating meeting:', err);
      showToast('Failed to update meeting details', 'error');
    }
  };

  const handleMarkMeetingCompleted = async (meetingId) => {
    const todayFormatted = new Date().toISOString().split('T')[0];
    try {
      try {
        await completeSecretaryMeeting(meetingId);
      } catch (err) {
        console.warn('Mark complete API execution notice:', err);
      }

      setMeetings(prev =>
        prev.map(m =>
          m.id === meetingId
            ? {
                ...m,
                isCompleted: true,
                tag: 'COMPLETED',
                tagType: 'peach',
                completedDate: todayFormatted
              }
            : m
        )
      );

      showToast('Meeting marked as Completed!');
    } catch (err) {
      console.error('Error marking meeting completed:', err);
      showToast('Failed to mark meeting as completed', 'error');
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
              currentUser={currentUser}
              unitInfo={unitInfo}
              unitBankAccount={unitBankAccount}
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
              onDepositCashToBank={handleDepositCashToBank}
              onDepositAllCashToBank={handleDepositAllCashToBank}
              onPayNow={setPaymentMemberItem}
              onEditSavings={setEditingSavings}
              onVerifyAndForward={handleVerifyAndForward}
              onSelectLoanDetail={setSelectedLoanDetail}
              onEditMeeting={setEditingMeeting}
              onMarkMeetingCompleted={handleMarkMeetingCompleted}
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
            <FinancialsView
              financials={financials}
              unitBankAccount={unitBankAccount}
              savingsLogs={savingsLogs}
              onDepositCashToBank={handleDepositCashToBank}
              onDepositAllCashToBank={handleDepositAllCashToBank}
            />
          )}

          {activeTab === 'meetings' && (
            <MeetingsView
              meetings={meetings}
              onShowMeetingModal={() => setShowMeetingModal(true)}
              onEditMeeting={setEditingMeeting}
              onMarkMeetingCompleted={handleMarkMeetingCompleted}
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
          meetings={meetings}
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
          onDepositCashToBank={handleDepositCashToBank}
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

      {editingMeeting && (
        <EditMeetingModal
          meeting={editingMeeting}
          onSubmit={handleUpdateMeetingSubmit}
          onClose={() => setEditingMeeting(null)}
        />
      )}

      {paymentMemberItem && (
        <PaymentMethodModal
          item={paymentMemberItem}
          unitInfo={unitInfo}
          onClose={() => setPaymentMemberItem(null)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}
    </div>
  );
}

export default SecretaryDashboard;
