import React, { useState, useEffect, useRef } from 'react';
import { sendForgotPasswordOtp, verifyForgotPasswordOtp, resetForgotPassword } from '../../services/api';
import './ForgotPasswordModal.css';

function ForgotPasswordModal({ isOpen, onClose, onPasswordResetSuccess }) {
  const [step, setStep] = useState(1); // Step 1: Phone, Step 2: OTP, Step 3: New Password, Step 4: Success
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Resend Timer (60s)
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const otpInputRefs = useRef([]);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const resetState = () => {
    setStep(1);
    setPhoneNumber('');
    setOtpDigits(['', '', '', '', '', '']);
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    setTimer(60);
    setCanResend(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Step 1: Send OTP to Mobile Number
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter your registered mobile number.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await sendForgotPasswordOtp(phoneNumber.trim());
      setSuccessMsg(res.data.message || 'OTP sent successfully! Check server console log for dev environment.');
      setStep(2);
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please verify your mobile number.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP input digit change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto move to next input box
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter complete 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await verifyForgotPasswordOtp({
        phoneNumber: phoneNumber.trim(),
        otp: fullOtp
      });

      setResetToken(res.data.resetToken);
      setSuccessMsg('OTP verified successfully! Set your new password.');
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setError('');
    setSuccessMsg('');
    setOtpDigits(['', '', '', '', '', '']);

    try {
      const res = await sendForgotPasswordOtp(phoneNumber.trim());
      setSuccessMsg(res.data.message || 'New OTP sent successfully!');
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check again.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await resetForgotPassword({
        phoneNumber: phoneNumber.trim(),
        resetToken: resetToken,
        newPassword: newPassword
      });

      setSuccessMsg(res.data.message || 'Password reset successfully!');
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to reset password. Session may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fp-backdrop" onClick={handleClose}>
      <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fp-header">
          <div>
            <h2 className="fp-title">Forgot Password</h2>
            <p className="fp-subtitle">Reset your account password using Mobile OTP</p>
          </div>
          <button className="fp-close-btn" onClick={handleClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="fp-stepper">
          <div className={`fp-step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <div className="fp-step-circle">{step > 1 ? '✓' : '1'}</div>
            <span className="fp-step-label">Mobile</span>
          </div>
          <div className={`fp-step-line ${step > 1 ? 'filled' : ''}`} />
          <div className={`fp-step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
            <div className="fp-step-circle">{step > 2 ? '✓' : '2'}</div>
            <span className="fp-step-label">OTP Code</span>
          </div>
          <div className={`fp-step-line ${step > 2 ? 'filled' : ''}`} />
          <div className={`fp-step-item ${step === 3 ? 'active' : step === 4 ? 'completed' : ''}`}>
            <div className="fp-step-circle">{step === 4 ? '✓' : '3'}</div>
            <span className="fp-step-label">New Password</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="fp-body">
          {error && <div className="fp-alert fp-alert--error">⚠️ {error}</div>}
          {successMsg && <div className="fp-alert fp-alert--success">✓ {successMsg}</div>}

          {/* STEP 1: Phone Number Input */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="fp-form-group">
                <label className="fp-label">Registered Mobile Number</label>
                <div className="fp-input-wrap">
                  <span className="fp-input-icon">📱</span>
                  <input
                    type="tel"
                    className="fp-input"
                    placeholder="Enter 10-digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className="fp-btn-primary" disabled={isLoading}>
                {isLoading ? <span className="fp-spinner" /> : 'Send OTP to Mobile'}
              </button>
            </form>
          )}

          {/* STEP 2: Enter 6-digit OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div className="fp-form-group">
                <label className="fp-label">Enter 6-Digit OTP sent to {phoneNumber}</label>
                <div className="fp-otp-container">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="fp-otp-box"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="fp-resend-row">
                <span>Didn't receive code?</span>
                <button
                  type="button"
                  className="fp-resend-btn"
                  onClick={handleResendOtp}
                  disabled={!canResend || isLoading}
                >
                  {canResend ? 'Resend OTP' : `Resend in ${timer}s`}
                </button>
              </div>

              <button type="submit" className="fp-btn-primary" disabled={isLoading} style={{ marginTop: '1.25rem' }}>
                {isLoading ? <span className="fp-spinner" /> : 'Verify OTP'}
              </button>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="fp-form-group">
                <label className="fp-label">New Password</label>
                <div className="fp-input-wrap">
                  <span className="fp-input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="fp-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="fp-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="fp-form-group">
                <label className="fp-label">Confirm New Password</label>
                <div className="fp-input-wrap">
                  <span className="fp-input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="fp-input"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="fp-btn-primary" disabled={isLoading}>
                {isLoading ? <span className="fp-spinner" /> : 'Update Password'}
              </button>
            </form>
          )}

          {/* STEP 4: Success View */}
          {step === 4 && (
            <div className="fp-success-view">
              <div className="fp-success-icon">✓</div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>Password Reset Complete!</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>
                Your password has been successfully updated. You can now log in with your mobile number and new password.
              </p>
              <button
                type="button"
                className="fp-btn-primary"
                onClick={() => {
                  if (onPasswordResetSuccess) {
                    onPasswordResetSuccess(phoneNumber);
                  }
                  handleClose();
                }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
