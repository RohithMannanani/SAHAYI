import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  HelpCircle,
  UserPlus,
  PlusCircle,
  UserCheck,
  PiggyBank,
  Pencil,
  Calendar,
  MapPin,
  Shield,
  Landmark,
  Store,
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  X,
  CheckCircle2,
  FileText
} from 'lucide-react';
import './SecretaryDashboard.css';

function SecretaryDashboard() {
  const navigate = useNavigate();

  // Navigation & View state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedLoanDetail, setSelectedLoanDetail] = useState(null);
  const [editingSavings, setEditingSavings] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Form states
  const [newMember, setNewMember] = useState({ name: '', memberId: '', phone: '', address: '', savings: '100' });
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '2024-12-20', time: '10:00 AM', location: '', tag: 'NEXT WEEK' });

  // Weekly Savings Log Data
  const [savingsLogs, setSavingsLogs] = useState([
    { id: 1, name: 'Saritha Devi', memberId: 'AK-024', amount: '100.00', status: 'Paid', date: '2024-12-10' },
    { id: 2, name: 'Meera Raghavan', memberId: 'AK-112', amount: '100.00', status: 'Pending', date: '2024-12-10' },
    { id: 3, name: 'Anjali Nair', memberId: 'AK-089', amount: '100.00', status: 'Paid', date: '2024-12-10' },
  ]);

  // Upcoming Meetings Data
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      title: 'Monthly General Body',
      tag: 'NEXT WEEK',
      tagType: 'dark',
      time: '10:00 AM',
      location: 'Community Hall, Block B'
    },
    {
      id: 2,
      title: 'Loan Committee Meet',
      tag: 'FINANCIAL REVIEW',
      tagType: 'peach',
      time: '04:00 PM',
      location: 'Office Room 1'
    }
  ]);

  // Pending Loan Requests
  const [loans, setLoans] = useState([
    {
      id: 1,
      name: 'Sunitha Prakash',
      amount: '₹15,000',
      purpose: 'Education Loan (College Fees)',
      iconType: 'bank',
      applicantId: 'AK-045',
      trustScore: '9.4',
      membershipYears: '4 Years',
      existingDues: '₹0',
      status: 'pending'
    },
    {
      id: 2,
      name: 'Latha Kumaran',
      amount: '₹25,000',
      purpose: 'Small Business (Tailoring Unit)',
      iconType: 'store',
      applicantId: 'AK-078',
      trustScore: '8.9',
      membershipYears: '3 Years',
      existingDues: '₹1,200',
      status: 'pending'
    }
  ]);

  // Member Attendance List for Modal
  const [attendanceList, setAttendanceList] = useState([
    { id: 1, name: 'Saritha Devi', memberId: 'AK-024', status: 'present' },
    { id: 2, name: 'Meera Raghavan', memberId: 'AK-112', status: 'present' },
    { id: 3, name: 'Anjali Nair', memberId: 'AK-089', status: 'absent' },
    { id: 4, name: 'Sunitha Prakash', memberId: 'AK-045', status: 'present' },
    { id: 5, name: 'Latha Kumaran', memberId: 'AK-078', status: 'present' },
  ]);

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

  const handleRecordSavings = (id) => {
    setSavingsLogs(prev =>
      prev.map(item => item.id === id ? { ...item, status: 'Paid' } : item)
    );
    showToast('Weekly savings recorded as Paid!');
  };

  const handleSaveEditSavings = (e) => {
    e.preventDefault();
    if (!editingSavings) return;
    setSavingsLogs(prev =>
      prev.map(item => item.id === editingSavings.id ? editingSavings : item)
    );
    setEditingSavings(null);
    showToast('Savings record updated successfully!');
  };

  const handleVerifyAndForward = (loan) => {
    setLoans(prev => prev.filter(item => item.id !== loan.id));
    showToast(`Loan request for ${loan.name} endorsed & forwarded to President!`);
  };

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.memberId) {
      showToast('Please fill in Member Name and ID', 'error');
      return;
    }
    const created = {
      id: Date.now(),
      name: newMember.name,
      memberId: newMember.memberId,
      amount: `${parseFloat(newMember.savings || 100).toFixed(2)}`,
      status: 'Paid',
      date: new Date().toISOString().split('T')[0]
    };
    setSavingsLogs([created, ...savingsLogs]);
    setShowRegisterModal(false);
    setNewMember({ name: '', memberId: '', phone: '', address: '', savings: '100' });
    showToast(`New member ${created.name} registered successfully!`);
  };

  const handleAddMeetingSubmit = (e) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.location) {
      showToast('Please provide meeting title and location', 'error');
      return;
    }
    const created = {
      id: Date.now(),
      title: newMeeting.title,
      tag: newMeeting.tag || 'UPCOMING',
      tagType: newMeeting.tag === 'NEXT WEEK' ? 'dark' : 'peach',
      time: newMeeting.time,
      location: newMeeting.location
    };
    setMeetings([created, ...meetings]);
    setShowMeetingModal(false);
    setNewMeeting({ title: '', date: '2024-12-20', time: '10:00 AM', location: '', tag: 'NEXT WEEK' });
    showToast(`Meeting "${created.title}" scheduled!`);
  };

  const handleSaveAttendance = () => {
    setShowAttendanceModal(false);
    showToast('Attendance recorded for current session!');
  };

  const toggleAttendanceStatus = (id) => {
    setAttendanceList(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: item.status === 'present' ? 'absent' : 'present' } : item
      )
    );
  };

  // Filtering savings log based on search query
  const filteredSavings = savingsLogs.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.memberId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLoans = loans.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.purpose.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sec-dashboard-layout">
      {/* ── Toast Notification Bar ── */}
      {toast && (
        <div className={`sec-toast sec-toast--${toast.type}`}>
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Top Navbar ── */}
      <header className="sec-navbar">
        <div className="sec-navbar__brand">SAHAYI</div>

        <div className="sec-navbar__search-container">
          <Search size={18} className="sec-navbar__search-icon" />
          <input
            type="text"
            className="sec-navbar__search-input"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="sec-navbar__actions">
          <button
            className="sec-navbar__icon-btn"
            title="Notifications"
            onClick={() => showToast('No new notifications')}
          >
            <Bell size={20} />
            <span className="sec-navbar__badge-dot" />
          </button>
          <button
            className="sec-navbar__icon-btn"
            title="Help & Support"
            onClick={() => showToast('Help Center: Contact CDS Admin for assistance.')}
          >
            <HelpCircle size={20} />
          </button>
          <div
            className="sec-navbar__avatar"
            title="Secretary Profile"
            onClick={() => setActiveTab('settings')}
          >
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
              alt="Secretary Profile"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://ui-avatars.com/api/?name=Secretary&background=0C382E&color=fff';
              }}
            />
          </div>
        </div>
      </header>

      <div className="sec-body-container">
        {/* ── Left Sidebar Navigation ── */}
        <aside className="sec-sidebar">
          <div className="sec-sidebar__top">
            <div className="sec-sidebar__header">
              <h2 className="sec-sidebar__title">Dashboard</h2>
              <p className="sec-sidebar__subtitle">Secretary Workspace</p>
            </div>

            <nav className="sec-sidebar__nav">
              <button
                className={`sec-nav-item ${activeTab === 'dashboard' ? 'sec-nav-item--active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <div className="sec-nav-item__left">
                  <LayoutDashboard size={19} />
                  <span>Dashboard</span>
                </div>
              </button>

              <button
                className={`sec-nav-item ${activeTab === 'members' ? 'sec-nav-item--active' : ''}`}
                onClick={() => setActiveTab('members')}
              >
                <div className="sec-nav-item__left">
                  <Users size={19} />
                  <span>Members</span>
                </div>
              </button>

              <button
                className={`sec-nav-item ${activeTab === 'financials' ? 'sec-nav-item--active' : ''}`}
                onClick={() => setActiveTab('financials')}
              >
                <div className="sec-nav-item__left">
                  <CreditCard size={19} />
                  <span>Financials</span>
                </div>
              </button>

              <button
                className={`sec-nav-item ${activeTab === 'meetings' ? 'sec-nav-item--active' : ''}`}
                onClick={() => setActiveTab('meetings')}
              >
                <div className="sec-nav-item__left">
                  <Calendar size={19} />
                  <span>Meetings</span>
                </div>
              </button>

              <button
                className={`sec-nav-item ${activeTab === 'reports' ? 'sec-nav-item--active' : ''}`}
                onClick={() => setActiveTab('reports')}
              >
                <div className="sec-nav-item__left">
                  <BarChart3 size={19} />
                  <span>Reports</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="sec-sidebar__bottom">
            <div className="sec-sidebar__divider" />
            <button
              className={`sec-nav-item ${activeTab === 'settings' ? 'sec-nav-item--active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <div className="sec-nav-item__left">
                <Settings size={19} />
                <span>Settings</span>
              </div>
            </button>

            <button className="sec-nav-item sec-nav-item--logout" onClick={handleLogout}>
              <div className="sec-nav-item__left">
                <LogOut size={19} />
                <span>Logout</span>
              </div>
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="sec-main-content">
          {activeTab === 'dashboard' && (
            <div className="sec-dashboard-view">
              {/* Operational Overview Header */}
              <div className="sec-overview-header">
                <div>
                  <h1 className="sec-overview-title">Operational Overview</h1>
                  <p className="sec-overview-subtitle">
                    Manage daily administrative tasks and community growth.
                  </p>
                </div>
                <div className="sec-session-badge">
                  <span className="sec-session-label">CURRENT SESSION</span>
                  <span className="sec-session-date">Dec 12, 2024</span>
                </div>
              </div>

              {/* 3 Action Pill Buttons Row */}
              <div className="sec-actions-row">
                <button
                  className="sec-action-btn sec-action-btn--primary"
                  onClick={() => setShowRegisterModal(true)}
                >
                  <UserPlus size={18} />
                  <span>Register Member</span>
                </button>

                <button
                  className="sec-action-btn sec-action-btn--secondary"
                  onClick={() => setShowMeetingModal(true)}
                >
                  <PlusCircle size={18} />
                  <span>New Meeting</span>
                </button>

                <button
                  className="sec-action-btn sec-action-btn--tertiary"
                  onClick={() => setShowAttendanceModal(true)}
                >
                  <UserCheck size={18} />
                  <span>Record Attendance</span>
                </button>
              </div>

              {/* Middle Grid: Savings Log (Left) & Upcoming Meetings (Right) */}
              <div className="sec-middle-grid">
                {/* Weekly Savings Log */}
                <div className="sec-card sec-card--savings">
                  <div className="sec-card__header">
                    <div className="sec-card__title-group">
                      <div className="sec-card__icon-wrapper sec-card__icon-wrapper--bronze">
                        <PiggyBank size={20} />
                      </div>
                      <h3 className="sec-card__title">Weekly Savings Log</h3>
                    </div>
                    <button
                      className="sec-card__link-btn"
                      onClick={() => setShowHistoryModal(true)}
                    >
                      View History
                    </button>
                  </div>

                  <div className="sec-table-container">
                    <table className="sec-savings-table">
                      <thead>
                        <tr>
                          <th>Member Name</th>
                          <th>ID</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th className="sec-text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSavings.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="sec-table-empty">
                              No member savings logs found.
                            </td>
                          </tr>
                        ) : (
                          filteredSavings.map((item) => (
                            <tr key={item.id}>
                              <td className="sec-font-medium">{item.name}</td>
                              <td className="sec-text-muted">{item.memberId}</td>
                              <td className="sec-font-semibold">₹{item.amount}</td>
                              <td>
                                <span className={`sec-status-badge sec-status-badge--${item.status.toLowerCase()}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="sec-text-right">
                                {item.status === 'Paid' ? (
                                  <button
                                    className="sec-icon-action-btn"
                                    title="Edit record"
                                    onClick={() => setEditingSavings(item)}
                                  >
                                    <Pencil size={16} />
                                  </button>
                                ) : (
                                  <button
                                    className="sec-table-btn-record"
                                    onClick={() => handleRecordSavings(item.id)}
                                  >
                                    Record
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Upcoming Meetings */}
                <div className="sec-card sec-card--meetings">
                  <div className="sec-card__header">
                    <div className="sec-card__title-group">
                      <div className="sec-card__icon-wrapper sec-card__icon-wrapper--bronze">
                        <Calendar size={20} />
                      </div>
                      <h3 className="sec-card__title">Upcoming Meetings</h3>
                    </div>
                  </div>

                  <div className="sec-meetings-list">
                    {meetings.map((m) => (
                      <div className="sec-meeting-item" key={m.id}>
                        <div className="sec-meeting-item__top">
                          <span className={`sec-tag sec-tag--${m.tagType}`}>
                            {m.tag}
                          </span>
                          <span className="sec-meeting-item__time">{m.time}</span>
                        </div>
                        <h4 className="sec-meeting-item__title">{m.title}</h4>
                        <div className="sec-meeting-item__location">
                          <MapPin size={14} />
                          <span>{m.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    className="sec-calendar-view-btn"
                    onClick={() => setShowCalendarModal(true)}
                  >
                    Calendar View
                  </button>
                </div>
              </div>

              {/* Bottom Card: Loan Application Review */}
              <div className="sec-card sec-card--loans">
                <div className="sec-card__header sec-card__header--loans">
                  <div>
                    <h3 className="sec-card__title">Loan Application Review</h3>
                    <p className="sec-card__subtitle">
                      Pending Secretary endorsement for Presidential approval.
                    </p>
                  </div>
                  <div className="sec-watermark-badge">
                    <Shield size={36} className="sec-watermark-icon" />
                    <div className="sec-watermark-text">
                      <span className="sec-watermark-label">PENDING</span>
                      <span className="sec-watermark-count">
                        {loans.length < 10 ? `0${loans.length}` : loans.length} Requests
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sec-loans-grid">
                  {filteredLoans.length === 0 ? (
                    <div className="sec-empty-loans">
                      <CheckCircle2 size={32} color="#0C382E" />
                      <p>All loan applications reviewed & endorsed!</p>
                    </div>
                  ) : (
                    filteredLoans.map((loan) => (
                      <div className="sec-loan-card" key={loan.id}>
                        <div className="sec-loan-card__header">
                          <div className="sec-loan-card__icon-wrap">
                            {loan.iconType === 'bank' ? (
                              <Landmark size={22} />
                            ) : (
                              <Store size={22} />
                            )}
                          </div>
                          <div className="sec-loan-card__info">
                            <h4 className="sec-loan-card__name">{loan.name}</h4>
                            <p className="sec-loan-card__purpose">
                              Purpose: {loan.purpose}
                            </p>
                          </div>
                          <div className="sec-loan-card__amount">{loan.amount}</div>
                        </div>

                        <div className="sec-loan-card__actions">
                          <button
                            className="sec-btn-verify"
                            onClick={() => handleVerifyAndForward(loan)}
                          >
                            Verify & Forward
                          </button>
                          <button
                            className="sec-btn-detail"
                            onClick={() => setSelectedLoanDetail(loan)}
                          >
                            Detail
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Members Sub-View */}
          {activeTab === 'members' && (
            <div className="sec-subview">
              <div className="sec-subview-header">
                <h2>Ayalkoottam Members Registry</h2>
                <button
                  className="sec-action-btn sec-action-btn--primary"
                  onClick={() => setShowRegisterModal(true)}
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
                    {attendanceList.map((mem) => (
                      <tr key={mem.id}>
                        <td className="sec-font-medium">{mem.name}</td>
                        <td className="sec-text-muted">{mem.memberId}</td>
                        <td>+91 98470 {10000 + mem.id * 123}</td>
                        <td>
                          <span className="sec-status-badge sec-status-badge--paid">
                            Active
                          </span>
                        </td>
                        <td className="sec-text-right">
                          <button
                            className="sec-card__link-btn"
                            onClick={() => showToast(`Viewing details for ${mem.name}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financials Sub-View */}
          {activeTab === 'financials' && (
            <div className="sec-subview">
              <div className="sec-subview-header">
                <h2>Financial Ledger & Dues Summary</h2>
              </div>
              <div className="sec-stats-row">
                <div className="sec-stat-card">
                  <span className="sec-stat-label">Total Weekly Collection</span>
                  <h3 className="sec-stat-value">₹32,500.00</h3>
                  <span className="sec-stat-trend">↑ 12% vs last month</span>
                </div>
                <div className="sec-stat-card">
                  <span className="sec-stat-label">Loans Disbursed</span>
                  <h3 className="sec-stat-value">₹1,40,000.00</h3>
                  <span className="sec-stat-sub">Active in 8 accounts</span>
                </div>
                <div className="sec-stat-card">
                  <span className="sec-stat-label">Pending Collection Dues</span>
                  <h3 className="sec-stat-value">₹100.00</h3>
                  <span className="sec-stat-sub">1 member pending</span>
                </div>
              </div>
            </div>
          )}

          {/* Meetings Sub-View */}
          {activeTab === 'meetings' && (
            <div className="sec-subview">
              <div className="sec-subview-header">
                <h2>Meetings & Minutes Recorder</h2>
                <button
                  className="sec-action-btn sec-action-btn--primary"
                  onClick={() => setShowMeetingModal(true)}
                >
                  <PlusCircle size={18} />
                  <span>Schedule Meeting</span>
                </button>
              </div>

              <div className="sec-card">
                <h3 className="sec-card__title" style={{ marginBottom: '1rem' }}>
                  Scheduled Sessions
                </h3>
                {meetings.map((m) => (
                  <div className="sec-meeting-item" style={{ marginBottom: '1rem' }} key={m.id}>
                    <div className="sec-meeting-item__top">
                      <span className={`sec-tag sec-tag--${m.tagType}`}>{m.tag}</span>
                      <span className="sec-meeting-item__time">{m.time}</span>
                    </div>
                    <h4 className="sec-meeting-item__title">{m.title}</h4>
                    <div className="sec-meeting-item__location">
                      <MapPin size={14} />
                      <span>{m.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Sub-View */}
          {activeTab === 'reports' && (
            <div className="sec-subview">
              <div className="sec-subview-header">
                <h2>Monthly Administrative Reports</h2>
              </div>
              <div className="sec-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <FileText size={48} color="#0C382E" style={{ marginBottom: '1rem' }} />
                <h3>Generate Secretary Monthly Statement</h3>
                <p style={{ color: '#666', margin: '0.5rem 0 1.5rem' }}>
                  Download official attendance, loan endorsement, and savings reconciliation PDF report.
                </p>
                <button
                  className="sec-action-btn sec-action-btn--primary"
                  style={{ display: 'inline-flex' }}
                  onClick={() => showToast('Generating Monthly PDF Report...')}
                >
                  Download Report (PDF)
                </button>
              </div>
            </div>
          )}

          {/* Settings Sub-View */}
          {activeTab === 'settings' && (
            <div className="sec-subview">
              <div className="sec-subview-header">
                <h2>Secretary Workspace Settings</h2>
              </div>
              <div className="sec-card">
                <div className="sec-profile-box">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"
                    alt="Profile"
                    className="sec-profile-img"
                  />
                  <div>
                    <h3>Anu Radhakrishnan</h3>
                    <p style={{ color: '#666' }}>Role: Unit Secretary (Akshaya Unit #104)</p>
                    <p style={{ color: '#666', fontSize: '13px' }}>Email: secretary.akshaya@sahayi.org</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Footer Bar ── */}
      <footer className="sec-footer">
        <div className="sec-footer__brand">
          <strong>Ayalkoottam</strong> © 2024 Management System
        </div>
        <div className="sec-footer__links">
          <a href="#privacy" onClick={(e) => { e.preventDefault(); showToast('Privacy Policy'); }}>
            Privacy Policy
          </a>
          <span>·</span>
          <a href="#terms" onClick={(e) => { e.preventDefault(); showToast('Terms of Service'); }}>
            Terms of Service
          </a>
          <span>·</span>
          <a href="#support" onClick={(e) => { e.preventDefault(); showToast('Support contact: support@sahayi.org'); }}>
            Contact Support
          </a>
        </div>
      </footer>

      {/* ── MODALS ── */}

      {/* 1. Register Member Modal */}
      {showRegisterModal && (
        <div className="sec-modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="sec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sec-modal__header">
              <h3>Register New Member</h3>
              <button className="sec-modal__close" onClick={() => setShowRegisterModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMemberSubmit} className="sec-modal__form">
              <div className="sec-form-group">
                <label>Member Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Radhika Menon"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>

              <div className="sec-form-group">
                <label>Member ID (e.g., AK-120) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AK-120"
                  value={newMember.memberId}
                  onChange={(e) => setNewMember({ ...newMember, memberId: e.target.value })}
                />
              </div>

              <div className="sec-form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                />
              </div>

              <div className="sec-form-group">
                <label>Initial Weekly Savings Deposit (₹)</label>
                <input
                  type="number"
                  value={newMember.savings}
                  onChange={(e) => setNewMember({ ...newMember, savings: e.target.value })}
                />
              </div>

              <div className="sec-modal__actions">
                <button
                  type="button"
                  className="sec-btn-cancel"
                  onClick={() => setShowRegisterModal(false)}
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
      )}

      {/* 2. New Meeting Modal */}
      {showMeetingModal && (
        <div className="sec-modal-overlay" onClick={() => setShowMeetingModal(false)}>
          <div className="sec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sec-modal__header">
              <h3>Schedule New Meeting</h3>
              <button className="sec-modal__close" onClick={() => setShowMeetingModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddMeetingSubmit} className="sec-modal__form">
              <div className="sec-form-group">
                <label>Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Budget Planning"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                />
              </div>

              <div className="sec-form-row">
                <div className="sec-form-group">
                  <label>Time</label>
                  <input
                    type="text"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                  />
                </div>
                <div className="sec-form-group">
                  <label>Badge Tag</label>
                  <select
                    value={newMeeting.tag}
                    onChange={(e) => setNewMeeting({ ...newMeeting, tag: e.target.value })}
                  >
                    <option value="NEXT WEEK">NEXT WEEK</option>
                    <option value="FINANCIAL REVIEW">FINANCIAL REVIEW</option>
                    <option value="SPECIAL ASSEMBLY">SPECIAL ASSEMBLY</option>
                  </select>
                </div>
              </div>

              <div className="sec-form-group">
                <label>Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Community Hall, Block B"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                />
              </div>

              <div className="sec-modal__actions">
                <button
                  type="button"
                  className="sec-btn-cancel"
                  onClick={() => setShowMeetingModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sec-btn-submit">
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Record Attendance Modal */}
      {showAttendanceModal && (
        <div className="sec-modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="sec-modal sec-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="sec-modal__header">
              <div>
                <h3>Record Session Attendance</h3>
                <p style={{ fontSize: '13px', color: '#666' }}>Current Session: Dec 12, 2024</p>
              </div>
              <button className="sec-modal__close" onClick={() => setShowAttendanceModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="sec-attendance-list">
              {attendanceList.map((mem) => (
                <div className="sec-attendance-item" key={mem.id}>
                  <div>
                    <strong className="sec-attendance-name">{mem.name}</strong>
                    <span className="sec-attendance-id"> ({mem.memberId})</span>
                  </div>
                  <button
                    className={`sec-attendance-pill ${
                      mem.status === 'present' ? 'sec-attendance-pill--present' : 'sec-attendance-pill--absent'
                    }`}
                    onClick={() => toggleAttendanceStatus(mem.id)}
                  >
                    {mem.status === 'present' ? 'Present' : 'Absent'}
                  </button>
                </div>
              ))}
            </div>

            <div className="sec-modal__actions">
              <button
                type="button"
                className="sec-btn-cancel"
                onClick={() => setShowAttendanceModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="sec-btn-submit"
                onClick={handleSaveAttendance}
              >
                Save Attendance Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Loan Application Detail Modal */}
      {selectedLoanDetail && (
        <div className="sec-modal-overlay" onClick={() => setSelectedLoanDetail(null)}>
          <div className="sec-modal sec-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="sec-modal__header">
              <div>
                <h3>Loan Application Details</h3>
                <p style={{ fontSize: '13px', color: '#666' }}>
                  Applicant: {selectedLoanDetail.name} ({selectedLoanDetail.applicantId})
                </p>
              </div>
              <button className="sec-modal__close" onClick={() => setSelectedLoanDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="sec-loan-detail-body">
              <div className="sec-detail-row">
                <span className="sec-detail-label">Requested Amount:</span>
                <span className="sec-detail-value sec-text-bold">{selectedLoanDetail.amount}</span>
              </div>
              <div className="sec-detail-row">
                <span className="sec-detail-label">Stated Purpose:</span>
                <span className="sec-detail-value">{selectedLoanDetail.purpose}</span>
              </div>
              <div className="sec-detail-row">
                <span className="sec-detail-label">Trust Score / Credit Rating:</span>
                <span className="sec-detail-value sec-trust-badge">
                  {selectedLoanDetail.trustScore} / 10
                </span>
              </div>
              <div className="sec-detail-row">
                <span className="sec-detail-label">Membership Tenure:</span>
                <span className="sec-detail-value">{selectedLoanDetail.membershipYears}</span>
              </div>
              <div className="sec-detail-row">
                <span className="sec-detail-label">Existing Outstanding Dues:</span>
                <span className="sec-detail-value">{selectedLoanDetail.existingDues}</span>
              </div>
            </div>

            <div className="sec-modal__actions">
              <button
                type="button"
                className="sec-btn-cancel"
                onClick={() => setSelectedLoanDetail(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="sec-btn-submit"
                onClick={() => {
                  handleVerifyAndForward(selectedLoanDetail);
                  setSelectedLoanDetail(null);
                }}
              >
                Verify & Endorse Loan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Savings History Modal */}
      {showHistoryModal && (
        <div className="sec-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="sec-modal sec-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="sec-modal__header">
              <h3>Weekly Savings Audit Log</h3>
              <button className="sec-modal__close" onClick={() => setShowHistoryModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="sec-table-container">
              <table className="sec-savings-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsLogs.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date || '2024-12-10'}</td>
                      <td className="sec-font-medium">{item.name}</td>
                      <td>{item.memberId}</td>
                      <td>₹{item.amount}</td>
                      <td>
                        <span className={`sec-status-badge sec-status-badge--${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sec-modal__actions">
              <button
                type="button"
                className="sec-btn-cancel"
                onClick={() => setShowHistoryModal(false)}
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Calendar View Modal */}
      {showCalendarModal && (
        <div className="sec-modal-overlay" onClick={() => setShowCalendarModal(false)}>
          <div className="sec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sec-modal__header">
              <h3>Ayalkoottam Calendar Schedule</h3>
              <button className="sec-modal__close" onClick={() => setShowCalendarModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="sec-calendar-preview">
              <div className="sec-calendar-month-header">December 2024</div>
              <div className="sec-calendar-grid">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <span className="sec-cal-day-head" key={i}>{d}</span>
                ))}
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <span
                    className={`sec-cal-day ${day === 12 ? 'sec-cal-day--active' : ''} ${
                      day === 20 ? 'sec-cal-day--event' : ''
                    }`}
                    key={day}
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>

            <div className="sec-modal__actions">
              <button
                type="button"
                className="sec-btn-cancel"
                onClick={() => setShowCalendarModal(false)}
              >
                Close Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Edit Savings Modal */}
      {editingSavings && (
        <div className="sec-modal-overlay" onClick={() => setEditingSavings(null)}>
          <div className="sec-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sec-modal__header">
              <h3>Edit Savings Record</h3>
              <button className="sec-modal__close" onClick={() => setEditingSavings(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditSavings} className="sec-modal__form">
              <div className="sec-form-group">
                <label>Member Name</label>
                <input type="text" disabled value={editingSavings.name} />
              </div>
              <div className="sec-form-group">
                <label>Amount (₹)</label>
                <input
                  type="text"
                  value={editingSavings.amount}
                  onChange={(e) => setEditingSavings({ ...editingSavings, amount: e.target.value })}
                />
              </div>
              <div className="sec-form-group">
                <label>Status</label>
                <select
                  value={editingSavings.status}
                  onChange={(e) => setEditingSavings({ ...editingSavings, status: e.target.value })}
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div className="sec-modal__actions">
                <button
                  type="button"
                  className="sec-btn-cancel"
                  onClick={() => setEditingSavings(null)}
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
      )}
    </div>
  );
}

export default SecretaryDashboard;
