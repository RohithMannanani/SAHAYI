import api from './api.js';

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

  payInstallment: async (loanId, payload) => {
    try {
      const data = typeof payload === 'number' ? { amountPaid: payload } : payload;
      const response = await api.post(`/member/pay-installment?loanId=${loanId}`, data);
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

  recordRepayment: async (loanId, payload) => {
    try {
      const data = typeof payload === 'number' ? { amountPaid: payload } : payload;
      const response = await api.post(`/treasurer/record-repayment?loanId=${loanId}`, data);
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

  getUnitLoanRepayments: async () => {
    try {
      const response = await api.get('/treasurer/unit-repayments');
      return response.data || [];
    } catch (error) {
      // Graceful fallback to monitor-loans if unit-repayments is 404 (e.g. pending backend rebuild/restart)
      try {
        const mon = await api.get('/president/monitor-loans');
        if (mon.data && Array.isArray(mon.data.loans)) {
          const flatRepayments = [];
          mon.data.loans.forEach(loan => {
            (loan.repayments || []).forEach(r => {
              flatRepayments.push({
                repaymentId: r.repaymentId,
                loanId: loan.loanId,
                borrowerName: loan.memberName,
                userId: loan.userId,
                amountPaid: r.amountPaid,
                principalComponent: r.principalComponent,
                interestComponent: r.interestComponent,
                repaymentDate: r.repaymentDate,
                receiptNumber: r.receiptNumber,
                recordedByName: r.recordedByName,
                paymentMode: r.paymentMode || 'Cash',
                isBankDeposited: r.isBankDeposited || (r.paymentMode || '').toLowerCase().includes('bank deposited')
              });
            });
          });
          return flatRepayments;
        }
      } catch (fallbackErr) {
        // Suppress and return empty array
      }
      return [];
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

  reviewSecretaryLoan: async (loanId, status, reason = null) => {
    try {
      const response = await api.post(`/president/review-secretary-loan/${loanId}`, { status, reason });
      return response.data;
    } catch {
      const fallback = await api.post(`/president/review-loan/${loanId}`, { status, reason });
      return fallback.data;
    }
  },

  presidentReviewLoan: async (loanId, status, reason = null) => {
    try {
      const response = await api.post(`/president/review-loan/${loanId}`, { status, reason });
      return response.data;
    } catch {
      const fallback = await api.post(`/treasurer/review-loan/${loanId}`, { status, reason });
      return fallback.data;
    }
  }
};

export default loanService;
