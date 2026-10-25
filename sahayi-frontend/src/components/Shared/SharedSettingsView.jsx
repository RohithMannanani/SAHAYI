import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  MapPin,
  Globe,
  Lock,
  Sliders,
  Bell
} from 'lucide-react';
import {
  updatePassword,
  updateUserProfile,
  uploadAvatar
} from '../../services/api';
import ProfileImageUpload from './ProfileImageUpload';

function SharedSettingsView({
  currentUser,
  setCurrentUser,
  onShowToast,
  onReloadData
}) {
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    fullName: currentUser?.fullName || '',
    phoneNumber: currentUser?.phoneNumber || '',
    houseName: currentUser?.houseName || '',
    username: currentUser?.username || currentUser?.phoneNumber || '',
    avatarUrl: currentUser?.avatarUrl || ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Preferences State
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('user_workspace_preferences');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return { emailAlerts: true, smsReminders: true, meetingAlerts: true };
  });

  useEffect(() => {
    setProfileForm({
      fullName: currentUser?.fullName || '',
      phoneNumber: currentUser?.phoneNumber || '',
      houseName: currentUser?.houseName || '',
      username: currentUser?.username || currentUser?.phoneNumber || '',
      avatarUrl: currentUser?.avatarUrl || ''
    });
  }, [currentUser]);

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
      username: (profileForm.username || profileForm.phoneNumber || currentUser?.phoneNumber || '').trim()
    };

    try {
      await updateUserProfile(payload);

      if (setCurrentUser) {
        setCurrentUser(prev => ({
          ...(prev || {}),
          ...payload
        }));
      }

      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...storedUser, ...payload };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (err) { }

      onShowToast && onShowToast('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      onShowToast && onShowToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarUpload = async (formData) => {
    try {
      const response = await uploadAvatar(formData);
      const newAvatarUrl = response.data.avatarUrl;

      setProfileForm(prev => ({ ...prev, avatarUrl: newAvatarUrl }));

      if (setCurrentUser) {
        setCurrentUser(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
      }

      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...storedUser, avatarUrl: newAvatarUrl }));
      } catch (err) { }

      onShowToast && onShowToast('Profile picture updated successfully!');
    } catch (error) {
      console.error('Avatar upload failed', error);
      onShowToast && onShowToast('Failed to upload profile picture.', 'error');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      onShowToast && onShowToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      onShowToast && onShowToast('Passwords do not match.', 'error');
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
      await updatePassword(payload);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      onShowToast && onShowToast('Password changed successfully!');
    } catch (err) {
      console.error('Error updating password:', err);
      onShowToast && onShowToast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const togglePref = (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    localStorage.setItem('user_workspace_preferences', JSON.stringify(updated));
    onShowToast && onShowToast('Preferences updated');
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: '#ccc', score: 0 };
    if (pass.length < 6) return { label: 'Weak (min 6 chars)', color: '#ef4444', score: 25 };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { label: 'Strong', color: '#16a34a', score: 100 };
    }
    return { label: 'Medium', color: '#f59e0b', score: 65 };
  };

  const passStrength = getPasswordStrength(passwordForm.newPassword);

  // We can reuse the Secretary styles if they are loaded globally, or use inline/new classes
  // The classes here match the SecretarySettingsView for UI consistency.
  return (
    <div className="sec-subview sec-settings-container">
      <div className="sec-subview-header sec-settings-header">
        <div>
          <h2>Workspace Settings</h2>
          <p className="sec-settings-subtitle">
            Manage your profile, reset password, and configure preferences
          </p>
        </div>
        {onReloadData && (
          <button className="sec-btn-outline" onClick={onReloadData}>
            <RefreshCw size={15} />
            <span>Re-sync Data</span>
          </button>
        )}
      </div>

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
          <span>Preferences</span>
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="sec-settings-grid">
          <div className="sec-card sec-settings-card sec-profile-summary-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ProfileImageUpload
              currentAvatarUrl={profileForm.avatarUrl}
              onAvatarUpload={handleAvatarUpload}
              userName={profileForm.fullName}
            />
            <div className="sec-profile-summary-info" style={{ textAlign: 'center' }}>
              <h3>{profileForm.fullName}</h3>
              <p className="sec-role-tag">Role: {currentUser?.roleName || 'Member'}</p>
              <div className="sec-profile-meta-list" style={{ justifyContent: 'center' }}>
                <div className="sec-meta-item">
                  <Phone size={14} />
                  <span>{profileForm.phoneNumber || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sec-card sec-settings-card">
            <div className="sec-card-header">
              <User size={18} className="sec-card-icon" />
              <h3>Update Personal Profile</h3>
            </div>

            <form onSubmit={handleProfileSubmit} className="sec-settings-form">
              <div className="sec-form-group">
                <label>Full Name</label>
                <div className="sec-input-with-icon">
                  <User size={16} className="sec-input-icon" />
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="sec-form-row">
                <div className="sec-form-group">
                  <label>Phone Number</label>
                  <div className="sec-input-with-icon">
                    <Phone size={16} className="sec-input-icon" />
                    <input
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="sec-form-group">
                  <label>Username </label>
                  <div className="sec-input-with-icon disabled">
                    <Globe size={16} className="sec-input-icon" />
                    <input
                      type="text"
                      value={profileForm.username || profileForm.phoneNumber || currentUser?.phoneNumber || ''}
                      disabled
                      readOnly
                      placeholder="Username for login"
                      title="Username cannot be changed"
                    />
                  </div>
                </div>
              </div>

              <div className="sec-form-group">
                <label>House Name / Address</label>
                <div className="sec-input-with-icon">
                  <MapPin size={16} className="sec-input-icon" />
                  <input
                    type="text"
                    value={profileForm.houseName}
                    onChange={(e) => setProfileForm({ ...profileForm, houseName: e.target.value })}
                  />
                </div>
              </div>

              <div className="sec-form-actions">
                <button type="submit" className="sec-btn-primary" disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? (
                    <><RefreshCw size={16} className="sec-spin-icon" /><span>Saving...</span></>
                  ) : (
                    <><Save size={16} /><span>Save Changes</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="sec-settings-grid">
          <div className="sec-card sec-settings-card">
            <div className="sec-card-header">
              <KeyRound size={18} className="sec-card-icon" />
              <h3>Change Password</h3>
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
                  />
                  <button type="button" className="sec-pass-toggle-btn" onClick={() => setShowOldPass(!showOldPass)} tabIndex="-1">
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
                      required
                    />
                    <button type="button" className="sec-pass-toggle-btn" onClick={() => setShowNewPass(!showNewPass)} tabIndex="-1">
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordForm.newPassword && (
                    <div className="sec-pass-strength-bar">
                      <div className="sec-pass-strength-fill" style={{ width: `${passStrength.score}%`, backgroundColor: passStrength.color }} />
                      <span className="sec-pass-strength-text" style={{ color: passStrength.color }}>{passStrength.label}</span>
                    </div>
                  )}
                </div>

                <div className="sec-form-group">
                  <label>Confirm Password</label>
                  <div className="sec-input-with-icon">
                    <Lock size={16} className="sec-input-icon" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      required
                    />
                    <button type="button" className="sec-pass-toggle-btn" onClick={() => setShowConfirmPass(!showConfirmPass)} tabIndex="-1">
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordForm.confirmPassword && (
                    <div className="sec-match-indicator">
                      {passwordForm.newPassword === passwordForm.confirmPassword ? (
                        <span className="sec-match-success"><CheckCircle2 size={13} /> Passwords match</span>
                      ) : (
                        <span className="sec-match-error"><AlertCircle size={13} /> Do not match</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="sec-form-actions">
                <button type="submit" className="sec-btn-primary" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? (
                    <><RefreshCw size={16} className="sec-spin-icon" /><span>Updating...</span></>
                  ) : (
                    <><KeyRound size={16} /><span>Update Password</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="sec-settings-grid">
          <div className="sec-card sec-settings-card">
            <div className="sec-card-header">
              <Bell size={18} className="sec-card-icon" />
              <h3>Notification & Alert Preferences</h3>
            </div>
            <div className="sec-toggle-list">
              <div className="sec-toggle-item">
                <div>
                  <span className="sec-toggle-title">System Alerts</span>
                  <p className="sec-toggle-desc">Receive instant notifications for important system events</p>
                </div>
                <label className="sec-switch">
                  <input type="checkbox" checked={preferences.emailAlerts} onChange={() => togglePref('emailAlerts')} />
                  <span className="sec-slider round" />
                </label>
              </div>
              <div className="sec-toggle-item">
                <div>
                  <span className="sec-toggle-title">Meeting Alerts</span>
                  <p className="sec-toggle-desc">Notification alerts for upcoming scheduled unit meetings</p>
                </div>
                <label className="sec-switch">
                  <input type="checkbox" checked={preferences.meetingAlerts} onChange={() => togglePref('meetingAlerts')} />
                  <span className="sec-slider round" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SharedSettingsView;
