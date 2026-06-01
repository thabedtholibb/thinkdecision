import apiClient from './client';

export const expertsService = {
  async getExpertDashboard() {
    const response = await apiClient.get('/experts/dashboard');
    return response.data;
  },

  async getExpertAnalytics() {
    const response = await apiClient.get('/experts/analytics');
    return response.data;
  },
};
