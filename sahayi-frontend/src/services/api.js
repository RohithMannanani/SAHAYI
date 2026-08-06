import axios from 'axios';

// Update port to match your ASP.NET Core API endpoint
const API_BASE_URL = 'https://localhost:7151/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to attach JWT token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Ayalkoottam Registration (returns PDF Blob)
export const registerShgUnit = async (data) => {
  return await api.post('/shg/register', data, {
    responseType: 'blob', // Crucial for receiving PDF streams
  });
};

// Fetch Wards List from DB
export const fetchWardsList = async () => {
  return await api.get('/shg/wards');
};


// Login API
export const loginUser = async (credentials) => {
  return await api.post('/auth/login', credentials);
};

// Change Password API
export const updatePassword = async (payload) => {
  return await api.post('/auth/change-password', payload);
};

// Fetch all Ayalkoottam Units
export const fetchShgUnits = async () => {
  return await api.get('/shg');
};

// Toggle status of an Ayalkoottam Unit
export const toggleShgUnitStatus = async (id, isActive) => {
  return await api.post(`/shg/${id}/toggle-status`, { isActive });
};

// Fetch single Ayalkoottam Unit details
export const fetchShgUnitDetails = async (id) => {
  return await api.get(`/shg/${id}`);
};

// ========================================================
// FORGOT PASSWORD VIA MOBILE OTP APIs
// ========================================================

// 1. Request OTP for mobile number (checks if in database)
export const sendForgotPasswordOtp = async (phoneNumber) => {
  return await api.post('/auth/forgot-password/send-otp', { phoneNumber });
};

// 2. Verify 6-digit OTP code
export const verifyForgotPasswordOtp = async (data) => {
  return await api.post('/auth/forgot-password/verify-otp', data);
};

// 3. Reset password using resetToken
export const resetForgotPassword = async (data) => {
  return await api.post('/auth/forgot-password/reset-password', data);
};

export default api;