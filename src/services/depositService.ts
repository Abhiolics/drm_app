import apiClient, { API_URL } from './apiClient';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiPaymentMethods } from '../types';

import * as FileSystem from 'expo-file-system/legacy';
import { prepareImageForUpload } from '../utils/imageUploadHelper';

export interface SubmitDepositParams {
  amount: number | string;
  transactionRef: string;
  imageUri: string;
  fileName?: string;
  mimeType?: string;
  base64Data?: string | null;
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

  submitDeposit: async ({
    amount,
    transactionRef,
    imageUri,
    planId,
  }: SubmitDepositParams): Promise<{ success: boolean; message: string; data?: any }> => {
    const token = await AsyncStorage.getItem('user_token');

    if (Platform.OS === 'web') {
      try {
        const formData = new FormData();
        formData.append('amount', String(amount));
        formData.append('transactionRef', transactionRef.trim());
        if (planId && /^[0-9a-fA-F]{24}$/.test(String(planId).trim())) {
          formData.append('planId', String(planId).trim());
        }

        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], `deposit_${Date.now()}.jpg`, { type: 'image/jpeg' });
        formData.append('paymentProof', file);

        const res = await fetch(`${API_URL}/deposits`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return {
            success: res.ok,
            message: res.ok ? 'Deposit submitted successfully' : `Server error (${res.status})`,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Deposit submission failed. Please check your network connection.',
        };
      }
    }

    let prepared: { uri: string; mimeType: string; cleanup?: () => Promise<void> } | null = null;
    try {
      prepared = await prepareImageForUpload(imageUri, 'deposit_proof');

      const parameters: Record<string, string> = {
        amount: String(amount),
        transactionRef: transactionRef.trim(),
      };
      if (planId && /^[0-9a-fA-F]{24}$/.test(String(planId).trim())) {
        parameters.planId = String(planId).trim();
      }

      const uploadResult = await FileSystem.uploadAsync(`${API_URL}/deposits`, prepared.uri, {
        fieldName: 'paymentProof',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        mimeType: prepared.mimeType,
        parameters,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      let parsedData: any = null;
      try {
        if (uploadResult.body && typeof uploadResult.body === 'string') {
          parsedData = JSON.parse(uploadResult.body);
        }
      } catch {
        // Body was HTML or non-JSON
      }

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        if (parsedData) return parsedData;
        return {
          success: true,
          message: 'Deposit request submitted successfully',
        };
      }

      if (uploadResult.status === 413) {
        return {
          success: false,
          message: 'Receipt image is too large for the server. Please try a different screenshot.',
        };
      }

      if (uploadResult.status === 401) {
        return {
          success: false,
          message: 'Session expired. Please log in again.',
        };
      }

      if (parsedData?.message) {
        return {
          success: false,
          message: parsedData.message,
          data: parsedData.data,
        };
      }

      return {
        success: false,
        message: `Upload failed (Server status: ${uploadResult.status}). Please try again.`,
      };
    } catch (err: any) {
      console.error('[Deposit] Upload error:', err);
      return {
        success: false,
        message: err?.message || 'Network error occurred during deposit upload. Please check your connection.',
      };
    } finally {
      if (prepared?.cleanup) {
        prepared.cleanup().catch(() => {});
      }
    }
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
