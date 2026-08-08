import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetForgotPassword,
} from '../../services/api';
import './ForceChangePasswordModal.css';

// ── Password strength helper ──────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return null;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return 'weak';
  if (score === 2) return 'medium';
  return 'strong';
}

const ROLE_ROUTES = {
  1: '/cds-admin/dashboard',
  2: '/president/dashboard',
  3: '/secretary/dashboard',
  4: '/treasurer/dashboard',
  5: '/member/dashboard',
};

// Steps: 1=OTP sent/entry, 2=New password, 3=Success
const STEPS = [
  { id: 1, label: 'Verify Identity' },
  { id: 2, label: 'New Password' },
  { id: 3, label: 'Done' },
];

/**
 * ForceChangePasswordModal
 *
 * Non-dismissable 3-step modal shown immediately after login
 * when isPasswordChanged === 0.
 *
 * Step 1 — OTP sent automatically to the user's phone; user enters it.
 * Step 2 — User sets and confirms a new password (with strength meter).
 * Step 3 — Success screen; navigates to the correct dashboard.
 *
 * Props:
 *   isOpen    {boolean} — controls visibility
 *   userData  {object}  — full login response (phoneNumber, roleId, …)
 */
function ForceChangePasswordModal({ isOpen, userData }) {
  const navigate = useNavigate();

  // ── Step state ──
  const [step, setStep] = useState(1);

  // OTP step
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [resetToken, setResetToken] = useState(''); // from verifyForgotPasswordOtp
  const otpRefs = useRef([]);

  // ── Password step ──
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Shared ──
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Auto-send OTP as soon as the modal opens
  useEffect(() => {
    if (isOpen && userData?.phoneNumber) {
      sendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (step !== 1) return;
    if (timer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  if (!isOpen) return null;

  const phone = userData?.phoneNumber || '';
  const maskedPhone = phone.length >= 4
    ? `XXXXXX${phone.slice(-4)}`
    : phone;

  // ── Step helpers ──────────────────────────────────────────

  const sendOtp = async () => {
    setOtpSending(true);
    setError('');
    setInfo('');
    try {
      // Reuses the existing forgot-password OTP endpoint.
      // Phone comes from the login response (userData), no user input needed.
      await sendForgotPasswordOtp(phone);
      setInfo(`OTP sent to ${maskedPhone}`);
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to send OTP. Please try again.'
      );
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const digits = [...otpDigits];
    digits[index] = value.slice(-1);
    setOtpDigits(digits);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = [...otpDigits];
    pasted.split('').forEach((ch, i) => { digits[i] = ch; });
    setOtpDigits(digits);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // verifyForgotPasswordOtp returns a resetToken — save it for the next step
      const res = await verifyForgotPasswordOtp({ phoneNumber: phone, otp: fullOtp });
      setResetToken(res.data.resetToken || '');
      setStep(2);
      setError('');
      setInfo('');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Invalid or expired OTP. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    setIsLoading(true);
    try {
      // Reuse resetForgotPassword — same endpoint the ForgotPasswordModal uses
      await resetForgotPassword({
        phoneNumber: phone,
        resetToken: resetToken,
        newPassword: newPassword,
      });
      // Mark password as changed in localStorage so the redirect guard is satisfied
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      stored.isPasswordChanged = 1;
      localStorage.setItem('user', JSON.stringify(stored));
      setStep(3);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to update password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    const route = ROLE_ROUTES[userData?.roleId] || '/';
    navigate(route);
  };

  const strength = getStrength(newPassword);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="fcp-backdrop">
      <div className="fcp-modal" role="dialog" aria-modal="true" aria-labelledby="fcp-title">

        {/* ── Warning Banner ── */}
        <div className="fcp-warning-banner">
          <div className="fcp-warning-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#1a1a1a" />
            </svg>
          </div>
          <div className="fcp-warning-text">
            <p className="fcp-welcome">
              Welcome, {userData?.fullName || 'User'}
            </p>
            <h2 id="fcp-title">Password Change Required</h2>
            <p>Complete OTP verification to set your new password.</p>
          </div>
        </div>

        {/* ── Step Indicator ── */}
        <div className="fcp-stepper">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className={`fcp-step-item${step === s.id ? ' active' : step > s.id ? ' completed' : ''}`}>
                <div className="fcp-step-circle">
                  {step > s.id ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : s.id}
                </div>
                <span className="fcp-step-label">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`fcp-step-line${step > s.id ? ' filled' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Notice Strip ── */}
        <div className="fcp-notice" role="alert">
          ⚠️ Your account uses a temporary password. Verify your identity and set a new one.
        </div>

        {/* ── Body ── */}
        <div className="fcp-body">

          {/* Alerts */}
          {error && (
            <div className="fcp-alert fcp-alert--error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}
          {info && !error && (
            <div className="fcp-alert fcp-alert--info" role="status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {info}
            </div>
          )}

          {/* ════ STEP 1 — OTP Verification ════ */}
          {step === 1 && (
            <form onSubmit={handleVerifyOtp} className="fcp-form">
              <div className="fcp-field">
                <label className="fcp-label">
                  Enter 6-Digit OTP sent to {maskedPhone}
                </label>

                {/* OTP boxes */}
                <div className="fcp-otp-container" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      id={`fcp-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="fcp-otp-box"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                      aria-label={`OTP digit ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Resend row */}
                <div className="fcp-resend-row">
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    className="fcp-resend-btn"
                    onClick={sendOtp}
                    disabled={!canResend || otpSending}
                  >
                    {otpSending
                      ? 'Sending…'
                      : canResend
                        ? 'Resend OTP'
                        : `Resend in ${timer}s`}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="fcp-verify-otp-btn"
                className="fcp-btn-submit"
                disabled={isLoading || otpDigits.join('').length !== 6}
              >
                {isLoading ? (
                  <span className="fcp-spinner" aria-hidden="true" />
                ) : (
                  <>
                    Verify OTP
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ════ STEP 2 — New Password ════ */}
          {step === 2 && (
            <form onSubmit={handleSetPassword} className="fcp-form" noValidate>

              {/* New Password */}
              <div className="fcp-field">
                <label className="fcp-label" htmlFor="fcp-new-password">New Password</label>
                <div className="fcp-input-wrap">
                  <span className="fcp-input-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#9ca3af" />
                    </svg>
                  </span>
                  <input
                    id="fcp-new-password"
                    type={showNew ? 'text' : 'password'}
                    className={`fcp-input${strength ? ` fcp-input--${strength}` : ''}`}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                    required
                    minLength={6}
                  />
                  <button type="button" className="fcp-eye-btn" onClick={() => setShowNew(v => !v)}
                    aria-label={showNew ? 'Hide' : 'Show'}>
                    {showNew
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2" /></svg>}
                  </button>
                </div>
                {newPassword && (
                  <>
                    <div className="fcp-strength-bar" aria-hidden="true">
                      {[0, 1, 2].map(i => {
                        const filled = { weak: 1, medium: 2, strong: 3 }[strength] || 0;
                        return <div key={i} className={`fcp-strength-segment${i < filled ? ` ${strength}` : ''}`} />;
                      })}
                    </div>
                    <span className={`fcp-strength-label ${strength}`}>
                      {strength === 'weak' && 'Weak — add uppercase, numbers or symbols'}
                      {strength === 'medium' && 'Medium — getting better!'}
                      {strength === 'strong' && 'Strong password ✓'}
                    </span>
                  </>
                )}
              </div>

              {/* Confirm Password */}
              <div className="fcp-field">
                <label className="fcp-label" htmlFor="fcp-confirm-password">Confirm New Password</label>
                <div className="fcp-input-wrap">
                  <span className="fcp-input-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#9ca3af" />
                    </svg>
                  </span>
                  <input
                    id="fcp-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    className="fcp-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="fcp-eye-btn" onClick={() => setShowConfirm(v => !v)}
                    aria-label={showConfirm ? 'Hide' : 'Show'}>
                    {showConfirm
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2" /></svg>}
                  </button>
                </div>
              </div>

              <button type="submit" id="fcp-submit-btn" className="fcp-btn-submit" disabled={isLoading}>
                {isLoading
                  ? <span className="fcp-spinner" aria-hidden="true" />
                  : <>Set New Password <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></>}
              </button>
            </form>
          )}

          {/* ════ STEP 3 — Success ════ */}
          {step === 3 && (
            <div className="fcp-success-view">
              <div className="fcp-success-icon" aria-hidden="true">✓</div>
              <h3>All Done!</h3>
              <p>Your identity was verified and your password has been updated successfully. You're all set.</p>
              <button
                type="button"
                id="fcp-continue-btn"
                className="fcp-btn-submit"
                onClick={handleContinue}
              >
                Continue to Dashboard
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ForceChangePasswordModal;
