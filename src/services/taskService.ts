import apiClient, { API_URL } from './apiClient';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiTask } from '../types';

import * as FileSystem from 'expo-file-system/legacy';
import { prepareImageForUpload } from '../utils/imageUploadHelper';

export interface TaskSubmissionRecord {
  _id: string;
  task: {
    _id: string;
    title: string;
    rewardAmount: number;
  };
  rewardAmount: number;
  proof: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  createdAt: string;
}

export const taskService = {
  // Get Active Tasks with User Submission Status
  getTasks: async (): Promise<ApiTask[]> => {
    try {
      const res = await apiClient.get<{ success: boolean; count: number; data: ApiTask[] }>('/tasks');
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },

  // Submit Task Completion Proof
  submitTaskProof: async (
    taskId: string,
    imageUri: string
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    const token = await AsyncStorage.getItem('user_token');

    if (Platform.OS === 'web') {
      try {
        const formData = new FormData();
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const file = new File([blob], `task_proof_${Date.now()}.jpg`, { type: 'image/jpeg' });
        formData.append('proof', file);

        const res = await fetch(`${API_URL}/tasks/${taskId}/submit`, {
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
            message: res.ok ? 'Task proof submitted successfully' : `Server error (${res.status})`,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          message: err?.message || 'Error submitting task proof',
        };
      }
    }

    let prepared: { uri: string; mimeType: string; cleanup?: () => Promise<void> } | null = null;
    try {
      prepared = await prepareImageForUpload(imageUri, 'task_proof');

      const uploadResult = await FileSystem.uploadAsync(`${API_URL}/tasks/${taskId}/submit`, prepared.uri, {
        fieldName: 'proof',
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        mimeType: prepared.mimeType,
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
          message: 'Task proof submitted successfully',
        };
      }

      if (uploadResult.status === 413) {
        return {
          success: false,
          message: 'Screenshot file is too large for the server. Please select a smaller image.',
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
        message: `Task submission failed (Server status: ${uploadResult.status}). Please try again.`,
      };
    } catch (err: any) {
      console.error('[Task] Upload error:', err);
      return {
        success: false,
        message: err?.message || 'Error submitting task proof. Please check your network connection.',
      };
    } finally {
      if (prepared?.cleanup) {
        prepared.cleanup().catch(() => {});
      }
    }
  },

  // Get User's Task Submission History
  getTaskSubmissions: async (): Promise<TaskSubmissionRecord[]> => {
    try {
      const res = await apiClient.get<{
        success: boolean;
        count: number;
        data: TaskSubmissionRecord[];
      }>('/tasks/submissions');
      if (res.data.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },
};
