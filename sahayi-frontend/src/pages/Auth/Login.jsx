import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { loginUser } from '../../services/api';
import ForgotPasswordModal from '../../components/Auth/ForgotPasswordModal';
import './Login.css';

// Role → route map (mirrors the switch in handleSubmit)
const ROLE_ROUTES = {
  1: '/cds-admin/dashboard',
  2: '/president/dashboard',
  3: '/secretary/dashboard',
  4: '/treasurer/dashboard',
  5: '/member/dashboard',
};

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // If already logged in, redirect immediately to the correct dashboard
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const route = ROLE_ROUTES[storedUser.roleId];
      if (route) return <Navigate to={route} replace />;
    } catch {
      // corrupted storage — fall through to show the login form
    }
  }



  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await loginUser({ usernameOrPhone: username, password });
      const data = response.data;

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        userId: data.userId,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        roleName: data.roleName,
        roleId: data.roleId,
        unitId: data.unitId,
        unitName: data.unitName,
        isPasswordChanged: data.isPasswordChanged
      }));

      // Route based on RoleId:
      // RoleId = 1 -> CDS_Admin
      // RoleId = 2 -> President
      // RoleId = 3 -> Secretary
      // RoleId = 4 -> Treasurer
      // RoleId = 5 -> Member
      switch (data.roleId) {
        case 1:
          navigate('/cds-admin/dashboard');
          break;
        case 2:
          navigate('/president/dashboard');
          break;
        case 3:
          navigate('/secretary/dashboard');
          break;
        case 4:
          navigate('/treasurer/dashboard');
          break;
        case 5:
          navigate('/member/dashboard');
          break;
        default:
          setError('Unknown user role. Contact administrator.');
          break;
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Home Button */}
      <Link to="/" className="login-home-btn" aria-label="Go to Homepage">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span></span>
      </Link>

      {/* Decorative blobs */}
      <div className="login-blob login-blob--tl" aria-hidden="true" />
      <div className="login-blob login-blob--br" aria-hidden="true" />

      <main className="login-center">
        {/* Brand */}
        <header className="login-brand">
          <div className="login-brand__icon" aria-label="Sahayi logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="white" />
            </svg>
          </div>
          <h1 className="login-brand__name">SAHAYI</h1>
          <p className="login-brand__tagline">Empowering community growth together</p>
        </header>

        {/* Card */}
        <section className="login-card" aria-label="Login form">
          <form id="login-form" className="login-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="login-error-message">{error}</div>}
            {/* Username */}
            <div className="login-field">
              <label htmlFor="login-username" className="login-field__label">Phone_Number</label>
              <div className="login-field__input-wrap">
                <span className="login-field__icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="#9ca3af" />
                  </svg>
                </span>
                <input
                  id="login-username"
                  type="text"
                  className="login-field__input"
                  placeholder="Enter your phone_number"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <div className="login-field__label-row">
                <label htmlFor="login-password" className="login-field__label">Password</label>
                <button
                  type="button"
                  id="forgot-password-link"
                  className="login-field__forgot"
                  onClick={() => setIsForgotModalOpen(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="login-field__input-wrap">
                <span className="login-field__icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#9ca3af" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-field__input login-field__input--password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  id="toggle-password-btn"
                  className="login-field__eye"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="secure-login-btn"
              type="submit"
              className={`login-submit${isLoading ? ' login-submit--loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="login-submit__spinner" aria-hidden="true" />
              ) : (
                <>
                  Login
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <hr className="login-divider" />


        </section>

        {/* Footer note */}
        <p className="login-contact">
          Don't have an account?{' '}
          <a href="mailto:admin@sahayi.org" id="contact-admin-link" className="login-contact__link">
            Contact your administrator
          </a>
        </p>

        {/* Copyright */}
        <footer className="login-footer">
          © 2026 Ayalkoottam Management System. Empowering local communities.
        </footer>
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onPasswordResetSuccess={(resetPhone) => {
          setUsername(resetPhone);
        }}
      />
    </div>
  );
}

export default Login;
