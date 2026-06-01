// API Client for Think Decision
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

class APIClient {
  constructor() {
    this.token = null;
    this.loadTokenFromStorage();
  }

  loadTokenFromStorage() {
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
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

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        ...options,
      });

      if (response.status === 401) {
        this.setToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || 'API Error');
        error.status = response.status;
        error.code = data.error?.code;
        error.details = data.error?.details;
        throw error;
      }

      return data;
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
window.apiClient = apiClient;
export default apiClient;
