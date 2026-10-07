import apiClient from './apiClient';
import { ApiReferralStats } from '../types';

export const referralService = {
  getStats: async (): Promise<ApiReferralStats | null> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: ApiReferralStats }>('/referral/stats');
      if (res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.warn('Failed to fetch referral stats:', error);
      throw error;
    }
  },
};
