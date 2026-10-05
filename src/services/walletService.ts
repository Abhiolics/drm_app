import apiClient from './apiClient';
import { ApiTransaction } from '../types';

export interface WalletBalanceData {
  _id: string;
  user: string;
  balance: number;
  pendingBalance: number;
}

export const walletService = {
  // Get Live Wallet Balance
  getBalance: async (): Promise<{ balance: number; pendingBalance: number }> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: WalletBalanceData }>('/wallet');
      if (res.data.success && res.data.data) {
        return {
          balance: res.data.data.balance || 0,
          pendingBalance: res.data.data.pendingBalance || 0,
        };
      }
      return { balance: 0, pendingBalance: 0 };
    } catch {
      return { balance: 0, pendingBalance: 0 };
    }
  },

  // Get Transaction History (Passbook)
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    type?: 'credit' | 'debit';
    category?: string;
  }): Promise<{ transactions: ApiTransaction[]; total: number }> => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        count: number;
        total: number;
        data: ApiTransaction[];
      }>('/wallet/transactions', { params });

      if (res.data.success && Array.isArray(res.data.data)) {
        return {
          transactions: res.data.data,
          total: res.data.total || res.data.data.length,
        };
      }
      return { transactions: [], total: 0 };
    } catch {
      return { transactions: [], total: 0 };
    }
  },
};
