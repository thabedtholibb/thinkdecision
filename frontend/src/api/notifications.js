import apiClient from './client';

export const notificationsService = {
  async getNotifications(limit = 10, offset = 0) {
    const response = await apiClient.get(
      `/notifications?limit=${limit}&offset=${offset}`
    );
    return response.data;
  },

  async markAsRead(notificationId) {
    const response = await apiClient.patch(
      `/notifications/${notificationId}`,
      { read: true }
    );
    return response.data;
  },

  async markAllAsRead() {
    const response = await apiClient.post('/notifications/mark-all-read', {});
    return response.data;
  },
};
