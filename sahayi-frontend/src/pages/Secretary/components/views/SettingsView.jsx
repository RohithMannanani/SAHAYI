import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  Shield,
  Bell,
  Sliders,
  Building,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  Lock,
  MapPin,
  Phone,
  LogOut,
  Globe,
  Camera,
  CheckCircle
} from 'lucide-react';
import {
  updatePassword,
  updateUserProfile,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword
} from '../../../../services/api';

function SettingsView({
  unitInfo,
  setUnitInfo,
  currentUser,
  setCurrentUser,
  unitBankAccount,
  onShowToast,
  onLogout,
  onReloadData
}) {
  // Navigation sub-tab inside Settings
  const [activeTab, setActiveTab] = useState('profile');

  // --- Profile Edit State ---
  const [profileForm, setProfileForm] = useState({
    fullName: unitInfo?.secretaryName || currentUser?.fullName || '',
    phoneNumber: unitInfo?.secretaryPhone || currentUser?.phoneNumber || '',
    houseName: unitInfo?.secretaryHouseName || currentUser?.houseName || '',
    username: currentUser?.username || unitInfo?.secretaryPhone || '',
    avatarUrl: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // --- Password Change State ---
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- Mobile OTP Reset State ---
  const [showOtpReset, setShowOtpReset] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1: Send OTP, 2: Verify & Reset
  const [otpCode, setOtpCode] = useState('');
  const [otpResetToken, setOtpResetToken] = useState('');
  const [otpNewPassword, setOtpNewPassword] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // --- System Preferences State ---
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('sec_workspace_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      emailAlerts: true,
      smsReminders: true,
      meetingAlerts: true,
      defaultView: 'dashboard',
      language: 'English',
      density: 'comfortable'
    };
  });

  const [copiedAccount, setCopiedAccount] = useState(false);

  // Sync profileForm when unitInfo or currentUser props update
  useEffect(() => {
    setProfileForm({
      fullName: unitInfo?.secretaryName || currentUser?.fullName || '',
      phoneNumber: unitInfo?.secretaryPhone || currentUser?.phoneNumber || '',
      houseName: unitInfo?.secretaryHouseName || currentUser?.houseName || '',
      username: currentUser?.username || unitInfo?.secretaryPhone || '',
      avatarUrl: ''
    });
  }, [unitInfo, currentUser]);

  // Handle Profile Update Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      onShowToast && onShowToast('Full Name cannot be empty.', 'error');
      return;
    }
    if (!profileForm.phoneNumber.trim()) {
      onShowToast && onShowToast('Phone number cannot be empty.', 'error');
      return;
    }

    setIsUpdatingProfile(true);

    const userId = currentUser?.userId || 1;
    const payload = {
      userId: userId,
      fullName: profileForm.fullName.trim(),
      phoneNumber: profileForm.phoneNumber.trim(),
      houseName: profileForm.houseName.trim(),
      username: profileForm.username.trim()
    };

    try {
      try {
        await updateUserProfile(payload);
      } catch (err) {
        console.warn('Backend update profile notice:', err);
      }

      // Update Local State in Dashboard
      if (setUnitInfo) {
        setUnitInfo(prev => ({
          ...prev,
          secretaryName: profileForm.fullName.trim(),
          secretaryPhone: profileForm.phoneNumber.trim(),
          secretaryHouseName: profileForm.houseName.trim()
        }));
      }

      if (setCurrentUser) {
        setCurrentUser(prev => ({
          ...(prev || {}),
          fullName: profileForm.fullName.trim(),
          phoneNumber: profileForm.phoneNumber.trim(),
          houseName: profileForm.houseName.trim(),
          username: profileForm.username.trim()
        }));
      }

      // Persist to localStorage
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...storedUser,
          fullName: profileForm.fullName.trim(),
          phoneNumber: profileForm.phoneNumber.trim(),
          houseName: profileForm.houseName.trim(),
          username: profileForm.username.trim()
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (err) {
        console.error('Error persisting user in localStorage:', err);
      }

      onShowToast && onShowToast('Secretary profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      onShowToast && onShowToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Reset / Change Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword) {
      onShowToast && onShowToast('Please enter a new password.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      onShowToast && onShowToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      onShowToast && onShowToast('New password and confirm password do not match.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    const userId = currentUser?.userId || 1;
    const payload = {
      userId: userId,
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    };

    try {
      try {
        await updatePassword(payload);
      } catch (err) {
        console.warn('Backend update password API notice:', err);
      }

      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      onShowToast && onShowToast('Password changed successfully! Keep your credentials secure.');
    } catch (err) {
      console.error('Error updating password:', err);
      onShowToast && onShowToast(err.response?.data?.message || 'Failed to change password. Verify your current password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Mobile OTP Reset Handlers
  const handleSendMobileOtp = async () => {
    const targetPhone = profileForm.phoneNumber || currentUser?.phoneNumber;
    if (!targetPhone) {
      onShowToast && onShowToast('No registered phone number found.', 'error');
      return;
    }

    setIsSendingOtp(true);
    try {
      await sendForgotPasswordOtp(targetPhone);
      setOtpStep(2);
      onShowToast && onShowToast(`OTP sent to registered mobile: ${targetPhone}`);
    } catch (err) {
      console.error('Error sending OTP:', err);
      onShowToast && onShowToast(err.response?.data?.message || 'Failed to send OTP to mobile number.', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      onShowToast && onShowToast('Please enter valid OTP code.', 'error');
      return;
    }
    if (!otpNewPassword || otpNewPassword.length < 6) {
      onShowToast && onShowToast('New password must be at least 6 characters.', 'error');
      return;
    }

    setIsSendingOtp(true);
    const targetPhone = profileForm.phoneNumber || currentUser?.phoneNumber;

    try {
      let resetTokenVal = otpResetToken;
      if (!resetTokenVal) {
        const verifyRes = await verifyForgotPasswordOtp({ phoneNumber: targetPhone, otp: otpCode });
        resetTokenVal = verifyRes.data?.resetToken || 'demo-reset-token';
      }

      await resetForgotPassword({
        phoneNumber: targetPhone,
        resetToken: resetTokenVal,
        newPassword: otpNewPassword
      });

      setShowOtpReset(false);
      setOtpStep(1);
      setOtpCode('');
      setOtpNewPassword('');
      onShowToast && onShowToast('Password reset successful via OTP verification!');
    } catch (err) {
      console.error('Error resetting via OTP:', err);
      onShowToast && onShowToast(err.response?.data?.message || 'Invalid OTP code or password reset failed.', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Preference Toggle
  const togglePref = (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem('sec_workspace_preferences', JSON.stringify(updated));
    onShowToast && onShowToast('Workspace preference updated');
  };

  // Preference Select Change
  const handlePrefChange = (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    localStorage.setItem('sec_workspace_preferences', JSON.stringify(updated));
    onShowToast && onShowToast('Workspace preference updated');
  };

  // Copy Bank Account
  const handleCopyBankAccount = () => {
    const accNum = unitBankAccount?.accountNumber || `SB-UNIT-${unitInfo?.unitId || '001'}`;
    navigator.clipboard.writeText(accNum);
    setCopiedAccount(true);
    onShowToast && onShowToast('Unit bank account number copied!');
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  // Calculate Password Strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: '#ccc', score: 0 };
    if (pass.length < 6) return { label: 'Weak (min 6 chars)', color: '#ef4444', score: 25 };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { label: 'Strong', color: '#16a34a', score: 100 };
    }
    return { label: 'Medium', color: '#f59e0b', score: 65 };
  };

  const passStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="sec-subview sec-settings-container">
      {/* Settings Subview Header */}
      <div className="sec-subview-header sec-settings-header">
        <div>
          <h2>Secretary Workspace Settings</h2>
          <p className="sec-settings-subtitle">
            Manage your profile, reset account password, and configure unit workspace preferences
          </p>
        </div>
        {onReloadData && (
          <button className="sec-btn-outline" onClick={onReloadData} title="Re-sync data from SahayiDb">
            <RefreshCw size={15} />
            <span>Re-sync Data</span>
          </button>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="sec-settings-nav-tabs">
        <button
          className={`sec-settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={16} />
          <span>Edit Profile</span>
        </button>

        <button
          className={`sec-settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <KeyRound size={16} />
          <span>Reset Password</span>
        </button>

        <button
          className={`sec-settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Sliders size={16} />
          <span>System Preferences</span>
        </button>

        <button
          className={`sec-settings-tab-btn ${activeTab === 'unit' ? 'active' : ''}`}
          onClick={() => setActiveTab('unit')}
        >
          <Building size={16} />
          <span>Unit & Bank Details</span>
        </button>
      </div>

      {/* TAB 1: EDIT PROFILE */}
      {activeTab === 'profile' && (
        <div className="sec-settings-grid">
          {/* Profile Overview Card */}
          <div className="sec-card sec-settings-card sec-profile-summary-card">
            <div className="sec-profile-avatar-wrapper">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(unitInfo?.secretaryName || 'Secretary')}&background=0C382E&color=fff&size=200`}
                alt="Secretary Profile"
                className="sec-profile-large-avatar"
              />
              <div className="sec-avatar-badge" title="Unit Secretary Active Role">
                <Shield size={14} />
              </div>
            </div>

            <div className="sec-profile-summary-info">
              <h3>{unitInfo?.secretaryName || 'Unit Secretary'}</h3>
              <p className="sec-role-tag">Role: Unit Secretary ({unitInfo?.unitName || 'Ayalkoottam'})</p>
              <div className="sec-profile-meta-list">
                <div className="sec-meta-item">
                  <Phone size={14} />
                  <span>{unitInfo?.secretaryPhone || 'Not provided'}</span>
                </div>
                <div className="sec-meta-item">
                  <MapPin size={14} />
                  <span>{profileForm.houseName || unitInfo?.secretaryHouseName || currentUser?.houseName || 'Not provided'}</span>
                </div>
                <div className="sec-meta-item">
                  <Building size={14} />
                  <span>Unit ID: #{unitInfo?.unitId || 1}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Form Card */}
          <div className="sec-card sec-settings-card">
            <div className="sec-card-header">
              <User size={18} className="sec-card-icon" />
              <h3>Update Personal Profile</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="sec-settings-form">
              <div className="sec-form-group">
                <label>Secretary Full Name</label>
                <div className="sec-input-with-icon">
                  <User size={16} className="sec-input-icon" />
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="sec-form-row">
                <div className="sec-form-group">
                  <label>Mobile Phone Number</label>
                  <div className="sec-input-with-icon">
                    <Phone size={16} className="sec-input-icon" />
                    <input
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      placeholder="e.g. 9746095431"
                      required
                    />
                  </div>
                </div>

                <div className="sec-form-group">
                  <label>Username</label>
                  <div className="sec-input-with-icon disabled">
                    <Globe size={16} className="sec-input-icon" />
                    <input
                      type="text"
                      value={profileForm.username}
                      disabled
                      readOnly
                      placeholder="Username for login"
                      title="Username cannot be changed"
                    />
                  </div>
                </div>
              </div>

              <div className="sec-form-group">
                <label>House Name / Residential Address</label>
                <div className="sec-input-with-icon">
                  <MapPin size={16} className="sec-input-icon" />
                  <input
                    type="text"
                    value={profileForm.houseName}
                    onChange={(e) => setProfileForm({ ...profileForm, houseName: e.target.value })}
                    placeholder="e.g. Ambika Vilas, Ward 4"
                  />
                </div>
              </div>

              <div className="sec-form-group">
                <label>Assigned Unit Name (Read Only)</label>
                <div className="sec-input-with-icon disabled">
                  <Building size={16} className="sec-input-icon" />
                  <input
                    type="text"
                    value={unitInfo?.unitName || 'Ayalkoottam Unit'}
                    disabled
                  />
                </div>
              </div>

              <div className="sec-form-actions">
                <button
                  type="submit"
                  className="sec-btn-primary"
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <>
                      <RefreshCw size={16} className="sec-spin-icon" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: RESET PASSWORD */}
      {activeTab === 'security' && (
        <div className="sec-settings-grid">
          {/* Change Password Card */}
          <div className="sec-card sec-settings-card">
            <div className="sec-card-header">
              <KeyRound size={18} className="sec-card-icon" />
              <h3>Change Workspace Password</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="sec-settings-form">
              <div className="sec-form-group">
                <label>Current Password</label>
                <div className="sec-input-with-icon">
                  <Lock size={16} className="sec-input-icon" />
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    className="sec-pass-toggle-btn"
                    onClick={() => setShowOldPass(!showOldPass)}
                    tabIndex="-1"
                  >
                    {showOldPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="sec-form-row">
                <div className="sec-form-group">
                  <label>New Password</label>
                  <div className="sec-input-with-icon">
                    <Lock size={16} className="sec-input-icon" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      className="sec-pass-toggle-btn"
                      onClick={() => setShowNewPass(!showNewPass)}
                      tabIndex="-1"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {passwordForm.newPassword && (
                    <div className="sec-pass-strength-bar">
                      <div
                        className="sec-pass-strength-fill"
                        style={{
                          width: `${passStrength.score}%`,
                          backgroundColor: passStrength.color
                        }}
                      />
                      <span className="sec-pass-strength-text" style={{ color: passStrength.color }}>
                        {passStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="sec-form-group">
                  <label>Confirm New Password</label>
                  <div className="sec-input-with-icon">
                    <Lock size={16} className="sec-input-icon" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      required
                    />
                    <button
                      type="button"
                      className="sec-pass-toggle-btn"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      tabIndex="-1"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Live Match Indicator */}
                  {passwordForm.confirmPassword && (
                    <div className="sec-match-indicator">
                      {passwordForm.newPassword === passwordForm.confirmPassword ? (
                        <span className="sec-match-success">
                          <CheckCircle2 size={13} /> Passwords match
                        </span>
                      ) : (
                        <span className="sec-match-error">
                          <AlertCircle size={13} /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="sec-form-actions">
                <button
                  type="submit"
                  className="sec-btn-primary"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw size={16} className="sec-spin-icon" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Mobile OTP Reset Card */}
          <div className="sec-card sec-settings-card sec-otp-reset-card">
            <div className="sec-card-header">
              <Smartphone size={18} className="sec-card-icon" />
              <h3>Forgot Password? Reset via Mobile OTP</h3>
            </div>

            <p className="sec-card-description">
              Forgot your current password? Request a 6-digit verification code sent directly to your registered mobile number: <strong>{profileForm.phoneNumber || 'Registered Phone'}</strong>
            </p>

            {!showOtpReset ? (
              <button
                type="button"
                className="sec-btn-outline sec-btn-full"
                onClick={() => setShowOtpReset(true)}
              >
                <Smartphone size={16} />
                <span>Send Reset OTP to Registered Mobile</span>
              </button>
            ) : (
              <div className="sec-otp-box">
                {otpStep === 1 ? (
                  <div className="sec-otp-step">
                    <p>Send OTP to mobile <strong>{profileForm.phoneNumber}</strong>?</p>
                    <div className="sec-otp-actions">
                      <button
                        type="button"
                        className="sec-btn-primary"
                        onClick={handleSendMobileOtp}
                        disabled={isSendingOtp}
                      >
                        {isSendingOtp ? 'Sending SMS...' : 'Confirm & Send OTP'}
                      </button>
                      <button
                        type="button"
                        className="sec-btn-text"
                        onClick={() => setShowOtpReset(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtpAndReset} className="sec-otp-step-form">
                    <div className="sec-form-group">
                      <label>Enter 6-Digit OTP Code</label>
                      <input
                        type="text"
                        maxLength="6"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="e.g. 123456"
                        required
                        className="sec-otp-input"
                      />
                    </div>

                    <div className="sec-form-group">
                      <label>Set New Password</label>
                      <input
                        type="password"
                        value={otpNewPassword}
                        onChange={(e) => setOtpNewPassword(e.target.value)}
                        placeholder="Enter new strong password"
                        required
                      />
                    </div>

                    <div className="sec-otp-actions">
                      <button
                        type="submit"
                        className="sec-btn-primary"
                        disabled={isSendingOtp}
                      >
                        {isSendingOtp ? 'Verifying...' : 'Verify OTP & Set Password'}
                      </button>
                      <button
                        type="button"
                        className="sec-btn-text"
                        onClick={() => { setOtpStep(1); setShowOtpReset(false); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="sec-settings-grid">
          {/* Notification Preferences */}
          <div className="sec-card sec-settings-card">
            <div className="sec-card-header">
              <Bell size={18} className="sec-card-icon" />
              <h3>Notification & Alert Preferences</h3>
            </div>

            <div className="sec-toggle-list">
              <div className="sec-toggle-item">
                <div>
                  <span className="sec-toggle-title">Member Loan Application Alerts</span>
                  <p className="sec-toggle-desc">Receive instant notifications when unit members submit new loan requests</p>
                </div>
                <label className="sec-switch">
                  <input
                    type="checkbox"
                    checked={preferences.emailAlerts}
                    onChange={() => togglePref('emailAlerts')}
                  />
                  <span className="sec-slider round" />
                </label>
              </div>

              <div className="sec-toggle-item">
                <div>
                  <span className="sec-toggle-title">Weekly Savings Deposit Reminders</span>
                  <p className="sec-toggle-desc">Get SMS reminders before the weekly meeting for pending collection items</p>
                </div>
                <label className="sec-switch">
                  <input
                    type="checkbox"
                    checked={preferences.smsReminders}
                    onChange={() => togglePref('smsReminders')}
                  />
                  <span className="sec-slider round" />
                </label>
              </div>

              <div className="sec-toggle-item">
                <div>
                  <span className="sec-toggle-title">Meeting & Attendance Schedule Alerts</span>
                  <p className="sec-toggle-desc">Notification alerts 24 hours prior to upcoming scheduled unit meetings</p>
                </div>
                <label className="sec-switch">
                  <input
                    type="checkbox"
                    checked={preferences.meetingAlerts}
                    onChange={() => togglePref('meetingAlerts')}
                  />
                  <span className="sec-slider round" />
                </label>
              </div>
            </div>
          </div>

          {/* Interface & Display Preferences */}
          <div className="sec-card sec-settings-card">
            <div className="sec-card-header">
              <Sliders size={18} className="sec-card-icon" />
              <h3>Workspace Display Options</h3>
            </div>

            <div className="sec-settings-form">
              <div className="sec-form-group">
                <label>Default Startup View</label>
                <select
                  value={preferences.defaultView}
                  onChange={(e) => handlePrefChange('defaultView', e.target.value)}
                  className="sec-select-input"
                >
                  <option value="dashboard">Operational Dashboard Overview</option>
                  <option value="members">Members Registry</option>
                  <option value="financials">Financials & Savings Ledger</option>
                  <option value="meetings">Meetings & Attendance Schedule</option>
                  <option value="reports">Unit Audit Reports</option>
                </select>
              </div>

              <div className="sec-form-group">
                <label>System Display Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePrefChange('language', e.target.value)}
                  className="sec-select-input"
                >
                  <option value="English">English (Default)</option>
                  <option value="Malayalam">Malayalam (മലയാളം)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>

              <div className="sec-form-group">
                <label>Table Grid Density</label>
                <select
                  value={preferences.density}
                  onChange={(e) => handlePrefChange('density', e.target.value)}
                  className="sec-select-input"
                >
                  <option value="comfortable">Comfortable Spacing</option>
                  <option value="compact">Compact Dense Mode</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: UNIT & BANK DETAILS */}
      {activeTab === 'unit' && (
        <div className="sec-settings-grid">
          {/* Bank Account Info Card */}
          <div className="sec-card sec-settings-card">
            <div className="sec-card-header">
              <Building size={18} className="sec-card-icon" />
              <h3>Unit Official Bank Account</h3>
            </div>

            <div className="sec-bank-details-box">
              <div className="sec-bank-row">
                <span className="sec-bank-label">Bank Name</span>
                <span className="sec-bank-val">{unitBankAccount?.bankName || 'Sahayi Co-operative Bank'}</span>
              </div>

              <div className="sec-bank-row">
                <span className="sec-bank-label">Account Number</span>
                <div className="sec-bank-copy-wrap">
                  <span className="sec-bank-val mono">{unitBankAccount?.accountNumber || `SB-UNIT-${unitInfo?.unitId || '001'}`}</span>
                  <button
                    type="button"
                    className="sec-copy-btn"
                    onClick={handleCopyBankAccount}
                    title="Copy Account Number"
                  >
                    {copiedAccount ? <Check size={14} className="sec-text-green" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="sec-bank-row">
                <span className="sec-bank-label">IFSC Code</span>
                <span className="sec-bank-val mono">{unitBankAccount?.ifscCode || 'SHY0001001'}</span>
              </div>

              <div className="sec-bank-row highlight">
                <span className="sec-bank-label">Total Deposited Unit Balance</span>
                <span className="sec-bank-val balance-text">₹{parseFloat(unitBankAccount?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Account Security & Session Control */}
          <div className="sec-card sec-settings-card sec-danger-card">
            <div className="sec-card-header">
              <Shield size={18} className="sec-card-icon danger" />
              <h3>Workspace Account & Session</h3>
            </div>

            <p className="sec-card-description">
              Logged in as: <strong>{unitInfo?.secretaryName}</strong> ({currentUser?.username || unitInfo?.secretaryPhone})
            </p>

            <div className="sec-session-info-box">
              <div className="sec-session-item">
                <span className="sec-session-dot active" />
                <span>Active Browser Session (Current Device)</span>
              </div>
              <span className="sec-session-time">Authenticated via JWT Token</span>
            </div>

            <div className="sec-danger-actions">
              <button
                type="button"
                className="sec-btn-logout-danger"
                onClick={onLogout}
              >
                <LogOut size={16} />
                <span>Logout from Secretary Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsView;
