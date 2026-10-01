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
