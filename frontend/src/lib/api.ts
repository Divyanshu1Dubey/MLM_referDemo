import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Prevent hanging requests and surface timeouts faster in dev
  timeout: 15000,
});

// Helper function to set the auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// API functions
export const authAPI = {
  register: async (data: {
    username: string;
    email: string;
    password: string;
    referrerCode?: string;
  }) => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  },
};

export const coursesAPI = {
  getAll: async () => {
    const response = await apiClient.get('/api/courses');
    return response.data;
  },
  getById: async (courseId: string) => {
    const response = await apiClient.get(`/api/courses/${courseId}`);
    return response.data;
  },
  purchase: async (
    courseId: string,
    data?: { applyReferralDiscount?: boolean; referralCode?: string }
  ) => {
    const response = await apiClient.post(`/api/courses/${courseId}/purchase`, data || {});
    return response.data;
  },
  purchaseWithCredits: async (courseId: string) => {
    const response = await apiClient.post(`/api/courses/${courseId}/purchase-with-credits`);
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async () => {
    const response = await apiClient.get('/api/dashboard/stats');
    return response.data;
  },
};

export const userAPI = {
  checkUsername: async (username: string) => {
    const response = await apiClient.post('/api/user/check-username', { username });
    return response.data;
  },
  updateUsername: async (username: string) => {
    const response = await apiClient.put('/api/user/username', { username });
    return response.data;
  },
  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.put('/api/user/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
  getProfile: async () => {
    const response = await apiClient.get('/api/user/profile');
    return response.data;
  },
  getPurchasedCourses: async () => {
    const response = await apiClient.get('/api/user/purchased-courses');
    return response.data;
  },
};

export const walletAPI = {
  getBalance: async () => {
    const response = await apiClient.get('/api/wallet/balance');
    return response.data;
  },
  withdraw: async (amount: number, upiId: string) => {
    const response = await apiClient.post('/api/wallet/withdraw', { amount, upiId });
    return response.data;
  },
  getTransactions: async () => {
    const response = await apiClient.get('/api/wallet/transactions');
    return response.data;
  },
};

export const adminAPI = {
  // User management
  getAllUsers: async () => {
    const response = await apiClient.get('/api/admin/users');
    return response.data;
  },
  toggleUserStatus: async (userId: string) => {
    const response = await apiClient.put(`/api/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  // Course management
  createCourse: async (data: { title: string; description: string; price: number; commissionPercent?: number; referralDiscount?: number }) => {
    const response = await apiClient.post('/api/admin/courses', data);
    return response.data;
  },
  updateCourse: async (courseId: string, data: { title?: string; description?: string; price?: number; commissionPercent?: number; referralDiscount?: number }) => {
    const response = await apiClient.put(`/api/admin/courses/${courseId}`, data);
    return response.data;
  },
  deleteCourse: async (courseId: string) => {
    const response = await apiClient.delete(`/api/admin/courses/${courseId}`);
    return response.data;
  },

  // Withdrawal management
  getWithdrawals: async () => {
    const response = await apiClient.get('/api/admin/withdrawals');
    return response.data;
  },
  processWithdrawal: async (withdrawalId: string, status: 'approved' | 'rejected') => {
    const response = await apiClient.put(`/api/admin/withdrawals/${withdrawalId}`, { status });
    return response.data;
  },

  // Stats and analytics
  getStats: async () => {
    const response = await apiClient.get('/api/admin/stats');
    return response.data;
  },
  getReferralStats: async () => {
    const response = await apiClient.get('/api/admin/referral-stats');
    return response.data;
  },
};
