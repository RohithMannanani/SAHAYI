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
 * ProtectedRoute — renders children only when a JWT token exists in localStorage.
 * If not authenticated, immediately replaces the current history entry with /login
 * so the browser back button cannot return to a protected page after logout.
 */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
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

        {/* Protected dashboard routes */}
        <Route
          path="/cds-admin/dashboard"
          element={<ProtectedRoute><CdsAdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/president/dashboard"
          element={<ProtectedRoute><PresidentDashboard /></ProtectedRoute>}
        />
        <Route
          path="/secretary/dashboard"
          element={<ProtectedRoute><SecretaryDashboard /></ProtectedRoute>}
        />
        <Route
          path="/treasurer/dashboard"
          element={<ProtectedRoute><TreasurerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/member/dashboard"
          element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>}
        />

        {/*
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/cds/register" element={<ProtectedRoute><RegisterAyalkoottam /></ProtectedRoute>} />
        */}
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