import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { walletService } from '../services/walletService';
import { notificationService } from '../services/notificationService';
import { ApiUser } from '../types';

interface AuthContextType {
  user: ApiUser | null;
  wallet: { balance: number; pendingBalance: number };
  unreadNotifications: number;
  isLoading: boolean;
  isLoggedIn: boolean;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  register: (
    fullName: string,
    phoneNumber: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [wallet, setWallet] = useState<{ balance: number; pendingBalance: number }>({
    balance: 0,
    pendingBalance: 0,
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const token = await authService.getToken();
      if (!token) {
        setIsLoggedIn(false);
        setUser(null);
        return;
      }

      const profile = await authService.getMe();
      if (profile) {
        setUser(profile);
        setIsLoggedIn(true);
        if (profile.wallet) {
          setWallet({
            balance: profile.wallet.balance || 0,
            pendingBalance: profile.wallet.pendingBalance || 0,
          });
        }
      }

      // Also fetch live wallet balance
      const liveWallet = await walletService.getBalance();
      setWallet(liveWallet);

      // Fetch unread count
      const count = await notificationService.getUnreadCount();
      setUnreadNotifications(count);
    } catch {
      // Fallback
    }
  }, []);

  // Initialize session on startup
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };
    init();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await authService.login(email, password);
      if (res.success && res.token) {
        setIsLoggedIn(true);
        await refreshUser();
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Invalid credentials',
      };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const res = await authService.verifyOtp(email, otp);
      if (res.success && res.token) {
        setIsLoggedIn(true);
        await refreshUser();
        return { success: true };
      }
      return { success: false, message: res.message || 'OTP verification failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Invalid OTP',
      };
    }
  };

  const register = async (
    fullName: string,
    phoneNumber: string,
    email: string,
    password: string
  ) => {
    try {
      const res = await authService.register(fullName, phoneNumber, email, password);
      if (res.success && res.token) {
        setIsLoggedIn(true);
        await refreshUser();
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Registration error',
      };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setWallet({ balance: 0, pendingBalance: 0 });
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        unreadNotifications,
        isLoading,
        isLoggedIn,
        refreshUser,
        login,
        verifyOtp,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
