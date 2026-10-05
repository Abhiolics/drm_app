import apiClient from './apiClient';
import { ApiPlan } from '../types';

export const planService = {
  // Get Active Membership Plans
  getPlans: async (): Promise<ApiPlan[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; count: number; data: ApiPlan[] }>('/plans');
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },
};
