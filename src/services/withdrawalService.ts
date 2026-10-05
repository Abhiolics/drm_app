import apiClient from './apiClient';

export interface BankDetails {
  accountHolderName: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId: string;
}

export interface WithdrawalRecord {
  _id: string;
  amount: number;
  bankDetails: BankDetails;
  status: 'pending' | 'approved' | 'rejected' | string;
  createdAt: string;
}

export const withdrawalService = {
  // Submit Withdrawal Request
  submitWithdrawal: async (
    amount: number,
    bankDetails: BankDetails
  ): Promise<{ success: boolean; message: string; data?: WithdrawalRecord }> => {
    const res = await apiClient.post('/withdrawals', {
      amount,
      bankDetails,
    });
    return res.data;
  },

  // Get User Withdrawal History
  getWithdrawalHistory: async (): Promise<WithdrawalRecord[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; count: number; data: WithdrawalRecord[] }>('/withdrawals');
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },
};
