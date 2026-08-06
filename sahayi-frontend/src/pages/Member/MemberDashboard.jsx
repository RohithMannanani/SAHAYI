import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemberDashboard.css';

// ── SVG Icon Helper ─────────────────────────────────────────
const Icon = ({ d, size = 18, stroke = 'currentColor', fill = 'none', strokeWidth = 2, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

function MemberDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem('member_active_tab') || 'dashboard';
  });

  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('member_active_tab', activeTab);
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login', { replace: true });
    window.location.replace('/login');
  };

  // Attendance calendar data: day number → 'present' | 'absent' | null
  const attendanceData = {
    1: 'present', 2: 'present', 3: 'present', 4: 'absent', 5: 'present',
    6: 'present', 7: 'present', 8: 'present', 9: 'present', 10: 'present',
    11: 'present', 12: 'present',
  };

  const repaymentRows = [
    { month: 'Nov 2024', principal: '₹1,000', interest: '₹200', total: '₹1,200', status: 'paid' },
    { month: 'Dec 2024', principal: '₹1,000', interest: '₹200', total: '₹1,200', status: 'pending' },
    { month: 'Jan 2025', principal: '₹1,000', interest: '₹200', total: '₹1,200', status: 'pending' },
  ];

  const notifications = [
    {
      id: 1,
      icon: 'meeting',
      title: 'Monthly Meeting Alert',
      time: '2 hours ago',
      body: 'Our next group meeting is scheduled for Saturday, Dec 7th at 10:00 AM in the Community Hall. Please bring your passbooks.',
      actions: ['Confirm Attendance', 'Remind Me'],
    },
    {
      id: 2,
      icon: 'loan',
      title: 'New Loan Policy Update',
      time: 'Yesterday',
      body: 'The group has approved a lower interest rate for education loans. Members can now apply at 6% per annum.',
      actions: ['Read Full Policy'],
    },
  ];

  return (
    <div className="mem-container">
      {/* ── Left Sidebar Navigation ── */}
      <aside className="mem-sidebar">
        <div>
          <div className="mem-sidebar__brand">SAHAYI</div>
          <nav className="mem-sidebar__nav">
            <div
              className={`mem-nav-item ${activeTab === 'dashboard' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Icon d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8v-10h-8v10zm0-18v6h8V3h-8z" size={17} />
              <span>Dashboard</span>
            </div>

            <div
              className={`mem-nav-item ${activeTab === 'members' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={17} />
              <span>Members</span>
            </div>

            <div
              className={`mem-nav-item ${activeTab === 'financials' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" size={17} />
              <span>Financials</span>
            </div>

            <div
              className={`mem-nav-item ${activeTab === 'meetings' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('meetings')}
            >
              <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" size={17} />
              <span>Meetings</span>
            </div>

            <div
              className={`mem-nav-item ${activeTab === 'reports' ? 'mem-nav-item--active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <Icon d="M18 20V10M12 20V4M6 20v-6" size={17} />
              <span>Reports</span>
            </div>
          </nav>
        </div>

        <div className="mem-sidebar__footer">
          <div className="mem-sidebar__divider" />

          <div
            className={`mem-nav-item ${activeTab === 'settings' ? 'mem-nav-item--active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" size={17} />
            <span>Settings</span>
          </div>

          <div className="mem-nav-item" onClick={handleLogout}>
            <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" size={17} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      {/* ── Main Layout ── */}
      <div className="mem-main">
        {/* ── Top Navbar ── */}
        <header className="mem-header">
          <div className="mem-header__brand">SAHAYI</div>

          <nav className="mem-header__nav">
            <span className="mem-header__nav-link mem-header__nav-link--active">Dashboard</span>
            <span className="mem-header__nav-link">My Group</span>
            <span className="mem-header__nav-link">Resources</span>
          </nav>

          <div className="mem-header__right">
            <div className="mem-header__divider" />
            <button className="mem-header__icon-btn" id="notification-btn">
              <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={17} />
              <span className="mem-header__badge" />
            </button>

            <button className="mem-header__icon-btn" id="help-btn">
              <Icon d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-10.5V13m0-4a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1z" size={17} />
            </button>

            <img
              src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=120"
              alt="Member Avatar"
              className="mem-user-avatar"
            />
          </div>
        </header>

        {/* ── Content ── */}
        <div className="mem-content">

          {/* ── Welcome Banner ── */}
          <div className="mem-banner">
            <div>
              <h1 className="mem-banner__title">Namaste, Meera Nair</h1>
              <p className="mem-banner__subtitle">Here is your community financial summary for November 2024.</p>
            </div>
            <div className="mem-banner__actions">
              <button className="mem-btn-outline" id="download-passbook-btn">
                <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" size={15} />
                <span>Download Passbook</span>
              </button>
              <button className="mem-btn-primary" id="apply-loan-btn">
                <Icon d="M12 5v14M5 12h14" size={15} stroke="#ffffff" />
                <span>Apply for Loan</span>
              </button>
            </div>
          </div>

          {/* ── Top Row: Savings + Loan Status ── */}
          <div className="mem-top-row">
            {/* Savings Card */}
            <div className="mem-savings-card">
              <div className="mem-savings-card__header">
                <div className="mem-savings-card__label">
                  <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" size={16} stroke="#1b432c" />
                  <span>Total Savings Balance</span>
                </div>
                <div className="mem-savings-card__badge">
                  <Icon d="M23 6l-9.5 9.5-5-5L1 18" size={12} stroke="#2e8b46" />
                  <span>+ ₹2,000 this month</span>
                </div>
              </div>

              <div className="mem-savings-card__amount">₹48,250.00</div>

              <div className="mem-savings-card__progress-section">
                <div className="mem-savings-card__progress-labels">
                  <span>Savings Goal: ₹1,00,000</span>
                  <span className="mem-savings-card__progress-pct">48% Achieved</span>
                </div>
                <div className="mem-progress-bar">
                  <div className="mem-progress-fill" style={{ width: '48%' }} />
                </div>
              </div>
            </div>

            {/* Active Loan Status */}
            <div className="mem-loan-card">
              <div className="mem-loan-card__header">
                <div className="mem-loan-card__label">
                  <Icon d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9zm2-4h16M12 12v4" size={16} stroke="#1b432c" />
                  <span>Active Loan Status</span>
                </div>
                <span className="mem-badge mem-badge--repayment">In Repayment</span>
              </div>

              <div className="mem-loan-card__amount">₹12,400</div>
              <div className="mem-loan-card__sublabel">Remaining Balance</div>

              <div className="mem-loan-card__divider" />

              <div className="mem-loan-card__detail-row">
                <span className="mem-loan-card__detail-key">Next Payment</span>
                <span className="mem-loan-card__detail-val">₹1,200</span>
              </div>
              <div className="mem-loan-card__detail-row">
                <span className="mem-loan-card__detail-key">Due Date</span>
                <span className="mem-loan-card__detail-val">15 Dec 2024</span>
              </div>
            </div>
          </div>

          {/* ── Middle Row: Repayment Schedule + Attendance ── */}
          <div className="mem-middle-row">
            {/* Repayment Schedule */}
            <div className="mem-card">
              <div className="mem-card__head">
                <h2 className="mem-card__title">Repayment Schedule</h2>
                <a className="mem-card__link" id="view-history-link">View History</a>
              </div>

              <table className="mem-repay-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {repaymentRows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.month}</td>
                      <td>{row.principal}</td>
                      <td>{row.interest}</td>
                      <td className="mem-repay-total">{row.total}</td>
                      <td>
                        {row.status === 'paid' ? (
                          <span className="mem-status mem-status--paid">
                            <Icon d="M20 6L9 17l-5-5" size={12} stroke="#1b6b3a" strokeWidth={2.5} />
                            Paid
                          </span>
                        ) : (
                          <span className="mem-status mem-status--pending">
                            <Icon d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={12} stroke="#b5681c" strokeWidth={2} />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Attendance Calendar */}
            <div className="mem-card">
              <div className="mem-card__head">
                <h2 className="mem-card__title">Attendance</h2>
                <div className="mem-attendance-legend">
                  <span className="mem-legend-dot mem-legend-dot--present" />Present
                  <span className="mem-legend-dot mem-legend-dot--absent" style={{ marginLeft: 10 }} />Absent
                </div>
              </div>

              {/* Day-of-week headers */}
              <div className="mem-calendar-dow">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>

              {/* Calendar grid: first row offset — Nov starts on Friday (index 4) */}
              <div className="mem-calendar-grid">
                {/* Empty cells for Mon–Thu */}
                <div className="mem-cal-cell mem-cal-cell--empty" />
                <div className="mem-cal-cell mem-cal-cell--empty" />
                <div className="mem-cal-cell mem-cal-cell--empty" />
                <div className="mem-cal-cell mem-cal-cell--empty" />

                {/* Days 1–12 */}
                {Array.from({ length: 12 }, (_, i) => i + 1).map(day => (
                  <div
                    key={day}
                    className={`mem-cal-cell ${
                      attendanceData[day] === 'present'
                        ? 'mem-cal-cell--present'
                        : attendanceData[day] === 'absent'
                        ? 'mem-cal-cell--absent'
                        : ''
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Attendance summary */}
              <div className="mem-attendance-summary">
                <div className="mem-attendance-pct">
                  <span className="mem-attendance-pct__val">94%</span>
                  <span className="mem-attendance-pct__label">Annual</span>
                </div>
                <div className="mem-attendance-record">
                  <div className="mem-attendance-record__title">Exemplary Record</div>
                  <div className="mem-attendance-record__sub">You've missed only 2 meetings this year.</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Notification Center ── */}
          <div className="mem-notif-card">
            <div className="mem-notif-card__head">
              <Icon d="M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-5 10H7m4-4H7m10 0h-3m3-4H7" size={16} stroke="#1b432c" />
              <h2 className="mem-notif-card__title">Notification Center</h2>
            </div>

            <div className="mem-notif-list">
              {notifications.map(n => (
                <div className="mem-notif-item" key={n.id}>
                  <div className={`mem-notif-icon ${n.icon === 'meeting' ? 'mem-notif-icon--meeting' : 'mem-notif-icon--loan'}`}>
                    {n.icon === 'meeting' ? (
                      <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={20} stroke="#647d6b" />
                    ) : (
                      <Icon d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" size={20} stroke="#b5681c" />
                    )}
                  </div>
                  <div className="mem-notif-body">
                    <div className="mem-notif-body__top">
                      <span className="mem-notif-body__title">{n.title}</span>
                      <span className="mem-notif-body__time">{n.time}</span>
                    </div>
                    <p className="mem-notif-body__text">{n.body}</p>
                    <div className="mem-notif-body__actions">
                      {n.actions.map((a, i) => (
                        <button key={i} className="mem-notif-action-btn">{a}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mem-notif-footer">
              <button className="mem-notif-view-all" id="view-all-notifications-btn">View All Notifications</button>
            </div>
          </div>

        </div>

        {/* ── Page Footer ── */}
        <footer className="mem-footer">
          <div className="mem-footer__left">
            <div className="mem-footer__brand">Ayalkoottam Connect</div>
            <div className="mem-footer__copy">© 2024 Ayalkoottam Management System. Empowering local communities.</div>
          </div>
          <div className="mem-footer__links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MemberDashboard;
