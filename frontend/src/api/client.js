// API Client for Think Decision
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

class APIClient {
  // Auth is carried by the backend's httpOnly session cookie — never store
  // the access token in localStorage (or anywhere else JS can read it),
  // since that would defeat the httpOnly protection against XSS.
  async request(method, endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: options.body ? JSON.stringify(options.body) : undefined,
        ...options,
      });

      if (response.status === 401) {
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
