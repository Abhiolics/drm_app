import apiClient from './apiClient';
import { Platform } from 'react-native';
import { ApiPaymentMethods } from '../types';

export interface SubmitDepositParams {
  amount: number | string;
  transactionRef: string;
  imageUri: string;
  planId?: string;
}

export interface DepositRecord {
  _id: string;
  amount: number;
  transactionRef: string;
  paymentProof: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  plan?: {
    _id: string;
    name: string;
    amount: number;
  };
  createdAt: string;
}

export const depositService = {
  // Get Active Deposit Payment Methods (QR Code and Bank/UPI details)
  getPaymentMethods: async (): Promise<ApiPaymentMethods | null> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: ApiPaymentMethods }>('/payment-methods');
      if (res.data.success && res.data.data) {
        return res.data.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Submit Deposit with Screenshot Proof
  submitDeposit: async ({
    amount,
    transactionRef,
    imageUri,
    planId,
  }: SubmitDepositParams): Promise<{ success: boolean; message: string; data?: any }> => {
    const formData = new FormData();
    formData.append('amount', String(amount));
    formData.append('transactionRef', transactionRef.trim());
    if (planId) {
      formData.append('planId', planId);
    }

    const filename = imageUri.split('/').pop() || `deposit_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    formData.append('paymentProof', {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      name: filename,
      type,
    } as any);

    const res = await apiClient.post('/deposits', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
  },

  // Get User Deposit History
  getDepositHistory: async (): Promise<DepositRecord[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; count: number; data: DepositRecord[] }>('/deposits');
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },
};
