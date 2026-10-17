import { apiClient } from './client';
import { Notification } from './types';
import { MOCK_NOTIFICATIONS } from './mockData';

let localNotifications = [...MOCK_NOTIFICATIONS];

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    try {
      return await apiClient<Notification[]>('/notifications');
    } catch {
      return localNotifications;
    }
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'POST' });
    } catch {
      const notif = localNotifications.find((n) => n.id === id);
      if (notif) notif.is_read = true;
    }
  },

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient('/notifications/mark-all-read', { method: 'POST' });
    } catch {
      localNotifications.forEach((n) => (n.is_read = true));
    }
  },
};
