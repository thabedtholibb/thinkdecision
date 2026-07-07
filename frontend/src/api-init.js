// API Client initialization - exposed to window for Babel JSX
const BASE_URL = 'http://localhost:3000/api/v1';

class APIClient {
  constructor() {
    this.token = null; // Store token in memory for Authorization header
  }

  setToken(token) {
    this.token = token;
    console.log('[API] Token stored:', token ? 'yes' : 'no');
  }

  normalizeResponse(rawData, status = 200) {
    // Normalize response to consistent format: { success, data, message?, error? }
    if (!rawData) {
      return { success: status < 400, data: null };
    }

    // If response already has 'success' field, use as-is
    if (typeof rawData.success === 'boolean') {
      return rawData;
    }

    // If response has 'data' field, it's already wrapped
    if (rawData.data !== undefined) {
      return {
        success: status < 400,
        data: rawData.data,
        message: rawData.message,
        error: rawData.error
      };
    }

    // If response has 'error' field, it's an error response
    if (rawData.error) {
      return {
        success: false,
        data: null,
        error: rawData.error,
        message: rawData.message || rawData.error.message
      };
    }

    // Otherwise, treat entire response as data
    return {
      success: status < 400,
      data: rawData,
      message: rawData.message
    };
  }

  async request(method, endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const body = options.body ? JSON.stringify(options.body) : undefined;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        credentials: 'include', // Send cookies with every request
      });

      const rawData = await response.json();
      const normalized = this.normalizeResponse(rawData, response.status);

      if (response.status === 401) {
        // Try to refresh token before failing
        if (normalized.error?.code === 'TOKEN_EXPIRED') {
          try {
            const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });

            if (refreshResponse.ok) {
              // Token refreshed, retry original request
              return this.request(method, endpoint, options);
            }
          } catch (refreshError) {
            console.error('[API] Token refresh failed:', refreshError);
          }
        }

        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: { code: normalized.error?.code, message: normalized.message }
        }));
      }

      if (!response.ok) {
        console.warn(`[API Error] ${response.status}:`, normalized.message, normalized);
        const error = new Error(normalized.message || 'API Error');
        error.status = response.status;
        error.code = normalized.error?.code;
        error.details = normalized.error?.details;
        throw error;
      }

      return normalized;
    } catch (error) {
      console.error(`[API] ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  get(endpoint, options) {
    return this.request('GET', endpoint, options);
  }

  post(endpoint, body, options) {
    return this.request('POST', endpoint, { ...options, body });
  }

  patch(endpoint, body, options) {
    return this.request('PATCH', endpoint, { ...options, body });
  }

  delete(endpoint, options) {
    return this.request('DELETE', endpoint, options);
  }
}

const apiClient = new APIClient();

// Auth Service
const authService = {
  // Auth is carried entirely by the httpOnly session cookie the backend
  // sets on these responses (sent automatically via `credentials: 'include'`
  // in request()) — there is no token in the response body to store.
  async registerCreator(data) {
    return apiClient.post('/auth/register', {
      name: data.name,
      institution: data.institution,
      email: data.email,
      password: data.password,
      defaultMethod: data.defaultMethod || 'AHP',
    });
  },

  async loginCreator(email, password) {
    return apiClient.post('/auth/login/creator', { email, password });
  },

  async loginExpert(email, password) {
    return apiClient.post('/auth/login/expert', { email, password });
  },

  async logout() {
    await apiClient.post('/auth/logout', {});
  },

  async getMe() {
    const response = await apiClient.get('/users/me');
    return response;
  },
};

// Cases Service
const casesService = {
  async createCase(caseData) {
    const response = await apiClient.post('/cases', caseData);
    return response;
  },

  async getCases(filters = {}) {
    let endpoint = '/cases';
    if (Object.keys(filters).length > 0) {
      const params = new URLSearchParams(filters).toString();
      endpoint += `?${params}`;
    }
    const response = await apiClient.get(endpoint);
    return response;
  },

  async getCaseById(caseId) {
    const response = await apiClient.get(`/cases/${caseId}`);
    return response;
  },

  async publishCase(caseData) {
    // Save case with all details (info, criteria, alternatives, experts)
    const response = await apiClient.post('/cases/publish', caseData);
    return response;
  },

  async deleteCase(caseId) {
    const response = await apiClient.delete(`/cases/${caseId}`);
    return response;
  },
};

// Experts Service
const expertsService = {
  async getExpertDashboard() {
    const response = await apiClient.get('/experts/dashboard');
    return response;
  },

  async inviteExpert(email) {
    const response = await apiClient.post('/experts/invite', { email });
    return response;
  },

  async getAllExperts() {
    const response = await apiClient.get('/experts');
    return response;
  },

  async createExpert(expertData) {
    const response = await apiClient.post('/experts', expertData);
    return response;
  },

  async getActiveExperts() {
    const response = await apiClient.get('/experts/active');
    return response;
  },

  async resetPassword(expertId) {
    const response = await apiClient.post(`/experts/${expertId}/reset-password`, {});
    return response;
  },
};

// Judgments Service
const judgmentsService = {
  async saveJudgment(caseId, levelId, judgments, notes) {
    const response = await apiClient.post(`/cases/${caseId}/judgments/${levelId}`, {
      judgments,
      notes,
    });
    return response;
  },

  async saveDraft(caseId, levelId, comparisons) {
    const response = await apiClient.request('PUT', `/judgments/${levelId}`, {
      body: { caseId, levelId, comparisons }
    });
    return response;
  },

  async submitJudgments(expertId, caseId) {
    const response = await apiClient.post(`/judgments/${expertId}/submit`, { caseId });
    return response;
  },

  async getProgress(expertId, caseId) {
    const response = await apiClient.get(`/judgments/${expertId}/${caseId}/progress`);
    return response;
  },
};

// Results Service
const resultsService = {
  async getResults(caseId, method = 'AIJ') {
    const response = await apiClient.get(`/results/${caseId}?method=${method}`);
    return response;
  },
};

// Add method to cases service too for convenience
casesService.getResults = async (caseId, method = 'AIJ') => {
  const response = await apiClient.get(`/results/${caseId}?method=${method}`);
  return response;
};

casesService.getDiscrepancy = async (caseId) => {
  const response = await apiClient.get(`/results/${caseId}/discrepancy`);
  return response;
};

// Notifications Service
const notificationsService = {
  async getNotifications(page = 1, limit = 20) {
    const response = await apiClient.get(`/notifications?page=${page}&limit=${limit}`);
    return response;
  },

  async getRecentNotifications(limit = 10) {
    const response = await apiClient.get(`/notifications?limit=${limit}`);
    return response;
  },

  async markAsRead(notificationId) {
    const response = await apiClient.patch(`/notifications/${notificationId}`, { read: true });
    return response;
  },

  async markAllAsRead() {
    const response = await apiClient.post('/notifications/mark-all-read', {});
    return response;
  },
};

// Analytics Service
const analyticsService = {
  async getCreatorAnalytics() {
    const response = await apiClient.get('/analytics/dashboard');
    return response;
  },
};

// Expose all services to window
Object.assign(window, {
  apiClient,
  authService,
  casesService,
  expertsService,
  judgmentsService,
  resultsService,
  notificationsService,
  analyticsService,
});
