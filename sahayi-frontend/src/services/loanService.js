import api from './api';

const loanService = {
  // --- Member & Bearer Endpoints ---
  
  applyForLoan: async (loanData) => {
    try {
      const response = await api.post('/member/apply-loan', loanData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getMyLoans: async () => {
    try {
      const response = await api.get('/member/my-loans');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  payInstallment: async (loanId, amountPaid) => {
    try {
      const response = await api.post(`/member/pay-installment?loanId=${loanId}`, { amountPaid });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // --- Treasurer Endpoints ---

  getPendingLoans: async () => {
    try {
      const response = await api.get('/treasurer/pending-loans');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  reviewLoan: async (loanId, status) => {
    try {
      const response = await api.post(`/treasurer/review-loan/${loanId}`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // --- Treasurer Endpoints ---

  getApprovedLoans: async () => {
    try {
      const response = await api.get('/treasurer/approved-loans');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  disburseLoan: async (loanId) => {
    try {
      const response = await api.post(`/treasurer/disburse-loan/${loanId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  recordRepayment: async (loanId, amountPaid) => {
    try {
      const response = await api.post(`/treasurer/record-repayment?loanId=${loanId}`, { amountPaid });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getLoanInstallmentDue: async (loanId) => {
    try {
      const response = await api.get(`/treasurer/loan-installment-due/${loanId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRepaymentSchedule: async (loanId) => {
    try {
      const response = await api.get(`/loan/${loanId}/repayment-schedule`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // --- President Endpoints ---

  monitorLoans: async () => {
    try {
      const response = await api.get('/president/monitor-loans');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPendingSecretaryLoans: async () => {
    try {
      const response = await api.get('/president/pending-loans');
      return response.data;
    } catch {
      const fallback = await api.get('/treasurer/pending-loans');
      return fallback.data;
    }
  },

  getPresidentPendingLoans: async () => {
    try {
      const response = await api.get('/president/pending-loans');
      return response.data;
    } catch {
      const fallback = await api.get('/treasurer/pending-loans');
      return fallback.data;
    }
  },

  reviewSecretaryLoan: async (loanId, status) => {
    try {
      const response = await api.post(`/president/review-loan/${loanId}`, { status });
      return response.data;
    } catch {
      const fallback = await api.post(`/treasurer/review-loan/${loanId}`, { status });
      return fallback.data;
    }
  },

  presidentReviewLoan: async (loanId, status) => {
    try {
      const response = await api.post(`/president/review-loan/${loanId}`, { status });
      return response.data;
    } catch {
      const fallback = await api.post(`/treasurer/review-loan/${loanId}`, { status });
      return fallback.data;
    }
  }
};

export default loanService;
