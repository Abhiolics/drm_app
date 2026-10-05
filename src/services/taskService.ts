import apiClient from './apiClient';
import { Platform } from 'react-native';
import { ApiTask } from '../types';

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
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || `task_proof_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    formData.append('proof', {
      uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
      name: filename,
      type,
    } as any);

    const res = await apiClient.post(`/tasks/${taskId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data;
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
