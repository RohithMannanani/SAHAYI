import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import LandingPage from './pages/Landing/LandingPage';
import Login from './pages/Auth/Login';

import './App.css';

function AppRoutes() {
  const location = useLocation();

  return (
    <>
   

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/*
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/cds/register" element={<RegisterAyalkoottam />} />
        <Route path="/dashboard" element={<Dashboard />} />
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