import apiClient from './client';

export const analyticsService = {
  async getCreatorAnalytics(period = '6m') {
    const response = await apiClient.get(`/analytics/dashboard?period=${period}`);
    return response.data;
  },
};
