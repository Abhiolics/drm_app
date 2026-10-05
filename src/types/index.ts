export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'reward';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface Transaction {
  id: string;
  orderCode: string;
  title: string;
  type: TransactionType;
  date: string;
  rawDate: string;
  amount: number;
  formattedAmount: string;
  isPositive: boolean;
  status: TransactionStatus;
  paymentMethod: string;
  fee: number;
  recipientOrSender: string;
}

export interface PaymentItem {
  id: string;
  orderCode: string;
  amount: number;
  currency: string;
  date: string;
  status: 'New' | 'Completed' | 'Processing';
  type: 'receive' | 'purchase';
  method: string;
  fee: number;
  terminalId: string;
  description?: string;
}

export type TaskCategory = 'newbie' | 'growth' | 'daily';
export type TaskStatus = 'not_started' | 'in_progress' | 'claimable' | 'completed';

export interface TaskItem {
  id: string;
  category: TaskCategory;
  tag: string;
  validUntil?: string;
  title: string;
  description: string;
  rewardPoints: number;
  rewardInr?: number;
  status: TaskStatus;
  progressPercent: number; // 0 - 100
  ctaText: string;
  steps?: { title: string; done: boolean }[];
  deadline?: string;
}

export interface StatsData {
  cashbackRate: number;
  balance: number;
  repaid: number;
  pending: number;
  notice: string;
}

export interface OfferItem {
  id: string;
  currency: string;
  badge: string;
  code: string;
  amount: number;
  income: number;
  tier: 'Top Picks' | '100-199' | '200-299' | '300-500';
  isClaimed: boolean;
}

export interface UserProfile {
  username: string;
  userId: string;
  avatarInitials: string;
  availableBalance: number;
  depositSum: number;
  withdrawalSum: number;
  unreadNotifications: number;
  email?: string;
  phoneNumber?: string;
  planName?: string;
}

export interface TeamLevelData {
  todayMembers: number;
  yesterdayMembers: number;
  currentDeposit: number;
  targetDeposit: number;
  commissionRate: string;
}

export interface TeamStats {
  totalCommissions: number;
  commissionsYesterday: number;
  totalTeamMembers: number;
  commissionsToday: number;
  totalTeamDeposit: number;
  invitationCode: string;
  invitationLink: string;
  levels: {
    'Level A': TeamLevelData;
    'Level B': TeamLevelData;
    'Level C': TeamLevelData;
  };
}

export interface ServiceChannel {
  id: string;
  name: string;
  role: string;
  handle: string;
  url: string;
  isOnline: boolean;
  type: 'channel' | 'support';
}

export interface UpiAccount {
  id: string;
  holderName: string;
  upiId: string;
  isPrimary?: boolean;
}

export interface GiftRewardItem {
  id: string;
  code: string;
  rewardAmount: number;
  usedCount: number;
  totalLimit: number;
  expiryDate: string;
  isClaimed: boolean;
}

// Backend API Types
export interface ApiPlan {
  _id: string;
  name: string;
  amount: number;
  description: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ApiPaymentMethods {
  qrCode: {
    enabled: boolean;
    imageUrl: string;
  };
  bankAccount: {
    enabled: boolean;
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
  };
}

export interface ApiTask {
  _id: string;
  title: string;
  description: string;
  rewardAmount: number;
  isActive: boolean;
  mySubmission?: {
    status: 'pending' | 'approved' | 'rejected';
    submittedAt?: string;
    proof?: string;
  } | null;
}

export interface ApiTransaction {
  _id: string;
  amount: number;
  type: 'credit' | 'debit';
  category: 'deposit' | 'withdrawal' | 'task_reward' | 'gift_code' | 'admin_adjustment' | string;
  status: 'completed' | 'pending' | 'failed' | string;
  description: string;
  createdAt: string;
}

export interface ApiNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiUser {
  _id: string;
  id?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isBlocked?: boolean;
  isActive?: boolean;
  isEmailVerified?: boolean;
  plan?: {
    _id: string;
    name: string;
    amount: number;
  } | null;
  wallet?: {
    balance: number;
    pendingBalance: number;
  };
  createdAt?: string;
}

export interface ApiContact {
  _id: string;
  type: string;
  label: string;
  value: string;
  isActive: boolean;
}
