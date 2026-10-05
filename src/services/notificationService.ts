import apiClient from './apiClient';
import { ApiNotification } from '../types';

export const notificationService = {
  // Get Notification List
  getNotifications: async (): Promise<ApiNotification[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; count: number; data: ApiNotification[] }>('/notifications');
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  // Get Unread Notification Count
  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await apiClient.get<{ success: boolean; unreadCount: number }>('/notifications/unread-count');
      return res.data.unreadCount || 0;
    } catch {
      return 0;
    }
  },

  // Mark All Notifications as Read
  markAllAsRead: async (): Promise<boolean> => {
    try {
      const res = await apiClient.patch<{ success: boolean; message: string }>('/notifications/read-all');
      return res.data.success;
    } catch {
      return false;
    }
  },

  // Mark Single Notification as Read
  markAsRead: async (id: string): Promise<boolean> => {
    try {
      const res = await apiClient.patch<{ success: boolean; message: string }>(`/notifications/${id}/read`);
      return res.data.success;
    } catch {
      return false;
    }
  },
};
