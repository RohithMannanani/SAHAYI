import axios from 'axios';

// Update port to match your ASP.NET Core API endpoint
const API_BASE_URL = 'https://localhost:7123/api';

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

// Login API
export const loginUser = async (credentials) => {
  return await api.post('/auth/login', credentials);
};

// Change Password API
export const updatePassword = async (payload) => {
  return await api.post('/auth/change-password', payload);
};

export default api;