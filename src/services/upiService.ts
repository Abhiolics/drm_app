import apiClient from './apiClient';
import { ApiUpiAccount } from '../types';

export interface AddUpiPayload {
  upiId: string;
  accountHolderName: string;
  isPrimary?: boolean;
}

export const upiService = {
  // Fetch Saved UPI Accounts: GET /api/upi/my
  getMyUpiAccounts: async (): Promise<ApiUpiAccount[]> => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        count?: number;
        data: ApiUpiAccount[];
      }>('/upi/my');
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (error) {
      console.warn('Failed to fetch UPI accounts:', error);
      throw error;
    }
  },

  // Add New UPI Account: POST /api/upi
  addUpiAccount: async (
    payload: AddUpiPayload
  ): Promise<{ success: boolean; message?: string; data?: ApiUpiAccount }> => {
    const res = await apiClient.post<{
      success: boolean;
      message?: string;
      data?: ApiUpiAccount;
    }>('/upi', {
      upiId: payload.upiId.trim().toLowerCase(),
      accountHolderName: payload.accountHolderName.trim(),
      isPrimary: payload.isPrimary ?? false,
    });
    return res.data;
  },

  // Optional Delete UPI Account: DELETE /api/upi/:id
  deleteUpiAccount: async (id: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await apiClient.delete<{ success: boolean; message?: string }>(`/upi/${id}`);
      return res.data;
    } catch (error: any) {
      console.warn('Delete UPI failed:', error);
      throw error;
    }
  },
};
