import apiClient from './apiClient';

export interface RedeemGiftCodeResponse {
  success: boolean;
  message: string;
  data?: {
    code: string;
    rewardAmount: number;
  };
}

export const giftCodeService = {
  // Redeem Voucher / Promo Code
  redeem: async (code: string): Promise<RedeemGiftCodeResponse> => {
    try {
      const res = await apiClient.post<RedeemGiftCodeResponse>('/gift-codes/redeem', {
        code: code.trim().toUpperCase(),
      });
      return res.data;
    } catch (err: any) {
      if (err.response?.data) {
        return err.response.data;
      }
      return {
        success: false,
        message: 'Failed to redeem gift code. Please check your connection.',
      };
    }
  },
};
