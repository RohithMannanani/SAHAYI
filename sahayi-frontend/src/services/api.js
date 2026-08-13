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

// Fetch / Download Registration Receipt PDF for a Unit
export const fetchShgUnitReceipt = async (id) => {
  return await api.get(`/shg/${id}/receipt`, {
    responseType: 'blob',
  });
};

// ========================================================
// FORGOT PASSWORD VIA MOBILE OTP APIs
// ========================================================
// FORGOT PASSWORD VIA MOBILE OTP APIs (unauthenticated)
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

// ========================================================
// FORCE CHANGE PASSWORD OTP APIs (authenticated — uses JWT)
// Used when isPasswordChanged === 0 right after login
// ========================================================

// 1. Request OTP sent to the authenticated user's registered phone
export const sendForceChangeOtp = async () => {
  return await api.post('/auth/change-password/send-otp');
};

// 2. Verify the 6-digit OTP for the authenticated user
export const verifyForceChangeOtp = async (otp) => {
  return await api.post('/auth/change-password/verify-otp', { otp });
};

// ========================================================
// SECRETARY DASHBOARD & OPERATIONS APIs (SahayiDb)
// ========================================================

// 1. Fetch Secretary Dashboard Summary & Operational Data
export const fetchSecretaryDashboard = async (unitId, userId) => {
  const params = {};
  if (unitId && !isNaN(Number(unitId))) params.unitId = Number(unitId);
  if (userId && !isNaN(Number(userId))) params.userId = Number(userId);
  return await api.get('/secretary/dashboard', { params });
};

// 2. Register New Ayalkoottam Member
export const registerSecretaryMember = async (data, unitId) => {
  const params = (unitId && !isNaN(Number(unitId))) ? { unitId: Number(unitId) } : {};
  return await api.post('/secretary/members', data, { params });
};

// 3. Schedule New Meeting
export const scheduleSecretaryMeeting = async (data, unitId) => {
  const params = (unitId && !isNaN(Number(unitId))) ? { unitId: Number(unitId) } : {};
  return await api.post('/secretary/meetings', data, { params });
};

// 4. Record / Update Weekly Savings Deposit
export const recordSecretarySavings = async (data, unitId) => {
  const params = (unitId && !isNaN(Number(unitId))) ? { unitId: Number(unitId) } : {};
  return await api.post('/secretary/savings/record', data, { params });
};

// 4a. Pay Cash Endpoint (POST /api/savings/pay-cash)
export const payCashSavings = async (data, unitId) => {
  const params = (unitId && !isNaN(Number(unitId))) ? { unitId: Number(unitId) } : {};
  try {
    return await api.post('/savings/pay-cash', data, { params });
  } catch (err) {
    return await api.post('/secretary/savings/record', data, { params });
  }
};

// 4b. Pay Online Endpoint (POST /api/savings/pay-online)
export const payOnlineSavings = async (data, unitId) => {
  const params = (unitId && !isNaN(Number(unitId))) ? { unitId: Number(unitId) } : {};
  try {
    return await api.post('/savings/pay-online', data, { params });
  } catch (err) {
    return await api.post('/secretary/savings/record', { ...data, paymentMode: 'Online', paymentMethod: 'Online' }, { params });
  }
};

// 4c. Deposit Cash to Unit Bank Account (POST /api/savings/deposit-cash-to-bank)
export const depositCashToBank = async (data) => {
  try {
    return await api.post('/savings/deposit-cash-to-bank', data);
  } catch (err) {
    if (err.response && (err.response.status === 404 || err.response.status === 405)) {
      return await api.post('/secretary/savings/record', {
        ...data,
        paymentMode: 'Cash (Bank Deposited)',
        paymentMethod: 'Cash (Bank Deposited)'
      });
    }
    throw err;
  }
};

// 4d. Fetch Unit Bank Account Details (GET /api/savings/unit-bank-account/{unitId})
export const fetchUnitBankAccount = async (unitId) => {
  return await api.get(`/savings/unit-bank-account/${unitId}`);
};

// 5. Verify & Endorse Loan Application to President
export const verifySecretaryLoan = async (loanId) => {
  return await api.post(`/secretary/loans/${loanId}/verify`);
};

// 6. Save Member Attendance Record
export const saveSecretaryAttendance = async (data) => {
  return await api.post('/secretary/attendance', data);
};

// 7. Delete Scheduled Meeting
export const deleteSecretaryMeeting = async (meetingId) => {
  try {
    return await api.delete(`/secretary/meetings/${meetingId}`);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return { data: { message: 'Meeting deleted locally' } };
    }
    throw err;
  }
};

// ========================================================
// RAZORPAY PAYMENT CHECKOUT APIs
// ========================================================

// 1. Create Razorpay Order (POST /api/create-order)
export const createRazorpayOrder = async (payload) => {
  try {
    return await api.post('/create-order', payload);
  } catch (err) {
    return await api.post('/payment/create-order', payload);
  }
};

// 2. Verify Razorpay Payment Signature (POST /api/verify-payment)
export const verifyRazorpayPayment = async (payload) => {
  try {
    return await api.post('/verify-payment', payload);
  } catch (err) {
    return await api.post('/payment/verify-payment', payload);
  }
};

// ========================================================
// MEMBER DASHBOARD APIs
// ========================================================

// 1. Fetch Member Dashboard Data from SahayiDb (GET /api/member/dashboard)
export const fetchMemberDashboard = async (userId, unitId) => {
  const params = {};
  if (userId && !isNaN(Number(userId))) params.userId = Number(userId);
  if (unitId && !isNaN(Number(unitId))) params.unitId = Number(unitId);
  return await api.get('/member/dashboard', { params });
};

// 2. Apply for Member Loan (POST /api/member/apply-loan)
export const applyMemberLoan = async (payload) => {
  return await api.post('/member/apply-loan', payload);
};

// 3. Clear All Savings Transactions & Reset Unit Bank Accounts (POST /api/secretary/clear-savings-data)
export const clearSavingsData = async () => {
  return await api.post('/secretary/clear-savings-data');
};

export default api;