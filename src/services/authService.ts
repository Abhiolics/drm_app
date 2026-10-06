import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiUser } from '../types';

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  data?: ApiUser;
}

export const authService = {
  // Login with Email & Password
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    if (res.data.success && res.data.token) {
      await AsyncStorage.setItem('user_token', res.data.token);
      if (res.data.data) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(res.data.data));
      }
    }
    return res.data;
  },

  // Register New Account
  register: async (
    fullName: string,
    phoneNumber: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
    if (res.data.success && res.data.token) {
      await AsyncStorage.setItem('user_token', res.data.token);
      if (res.data.data) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(res.data.data));
      }
    }
    return res.data;
  },

  // Send Login / Verification OTP
  sendOtp: async (email: string): Promise<{ success: boolean; message: string; otp?: string }> => {
    const res = await apiClient.post('/auth/send-otp', {
      email: email.trim().toLowerCase(),
    });
    return res.data;
  },

  // Verify OTP and Authenticate
  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/verify-otp', {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    });
    const token = res.data.token || (res.data as any).data?.token || (res.data as any).accessToken;
    if (res.data.success && token) {
      await AsyncStorage.setItem('user_token', token);
      const profile = res.data.data || (res.data as any).user;
      if (profile) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(profile));
      }
    }
    return {
      ...res.data,
      token: token || res.data.token,
    };
  },

  // Get Current Authenticated Profile with Wallet & Active Plan
  getMe: async (): Promise<ApiUser | null> => {
    try {
      const res = await apiClient.get<{ success: boolean; data: ApiUser }>('/auth/me');
      if (res.data.success && res.data.data) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(res.data.data));
        return res.data.data;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Update Profile
  updateProfile: async (
    fullName: string,
    phoneNumber: string
  ): Promise<{ success: boolean; message: string; data?: ApiUser }> => {
    const res = await apiClient.put('/auth/update-profile', {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
    });
    return res.data;
  },

  // Check stored token
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem('user_token');
    } catch {
      return null;
    }
  },

  // Get cached user profile
  getStoredUser: async (): Promise<ApiUser | null> => {
    try {
      const json = await AsyncStorage.getItem('user_profile');
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove(['user_token', 'user_profile']);
    } catch {
      // Fallback
    }
  },
};
