import apiClient from './apiClient';
import { ApiContact } from '../types';

export interface AppSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  forceUpdate: boolean;
  updateMessage: string;
  currentVersion: string;
}

export const appService = {
  // Check Health
  pingHealth: async (): Promise<boolean> => {
    try {
      const res = await apiClient.get('/health', { baseURL: 'https://drmpbackend.vercel.app' });
      return res.status === 200;
    } catch {
      return false;
    }
  },

  // Get App Settings & Maintenance
  getSettings: async (): Promise<AppSettings | null> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: AppSettings }>('/app/settings');
      if (res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Get Customer Support Contacts
  getContacts: async (): Promise<ApiContact[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; count: number; data: ApiContact[] }>('/contacts');
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },
};
