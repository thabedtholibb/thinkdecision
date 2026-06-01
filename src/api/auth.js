import apiClient from './client';

export const authService = {
  async registerCreator(data) {
    const response = await apiClient.post('/auth/register', {
      name: data.name,
      institution: data.institution,
      email: data.email,
      password: data.password,
      defaultMethod: data.defaultMethod || 'AHP',
    });
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response.data;
  },

  async loginCreator(email, password) {
    const response = await apiClient.post('/auth/login/creator', { email, password });
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response.data;
  },

  async loginExpert(email, password) {
    const response = await apiClient.post('/auth/login/expert', { email, password });
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      apiClient.setToken(null);
    }
  },

  async getMe() {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
};
