import apiClient from './client';

export const expertsService = {
  async getExpertDashboard() {
    const response = await apiClient.get('/experts/dashboard');
    return response.data;
  },
};
