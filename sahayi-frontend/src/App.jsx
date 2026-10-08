import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import LandingPage from './pages/Landing/LandingPage';
import Login from './pages/Auth/Login';
import CdsAdminDashboard from './pages/CdsAdmin/CdsAdminDashboard';
import PresidentDashboard from './pages/President/PresidentDashboard';
import SecretaryDashboard from './pages/Secretary/SecretaryDashboard';
import TreasurerDashboard from './pages/Treasurer/TreasurerDashboard';
import MemberDashboard from './pages/Member/MemberDashboard';

import './App.css';

/**
 * ProtectedRoute — renders children only when a JWT token exists in localStorage
 * AND the user's roleId matches the allowedRoleIds for this route.
 * If not authenticated, or if the user's role does not match, it removes the session
 * and redirects to /login immediately without rendering the page.
 */
function ProtectedRoute({ children, allowedRoleIds }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoleIds && allowedRoleIds.length > 0) {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userRoleId = Number(storedUser.roleId);

      if (!allowedRoleIds.includes(userRoleId)) {
        // Role mismatch: clear session and redirect to /login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return <Navigate to="/login" replace />;
      }
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* Protected dashboard routes with strict role enforcement */}
        <Route
          path="/cds-admin/dashboard"
          element={
            <ProtectedRoute allowedRoleIds={[1]}>
              <CdsAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/president/dashboard"
          element={
            <ProtectedRoute allowedRoleIds={[2]}>
              <PresidentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/secretary/dashboard"
          element={
            <ProtectedRoute allowedRoleIds={[3]}>
              <SecretaryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treasurer/dashboard"
          element={
            <ProtectedRoute allowedRoleIds={[4]}>
              <TreasurerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/dashboard"
          element={
            <ProtectedRoute allowedRoleIds={[5]}>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
