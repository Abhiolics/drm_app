import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://drmpbackend.vercel.app';
export const API_URL = `${BASE_URL}/api`;

// eslint-disable-next-line import/no-named-as-default-member
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
  },
});

// Automatic JWT Bearer token injection
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Fallback
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove(['user_token', 'user_profile']);
      } catch {
        // Fallback
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
