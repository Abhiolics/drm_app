import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Bell,
  Award,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Bot,
  Gift,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { TransactionItem } from '../components/TransactionItem';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { NotificationModal } from '../components/NotificationModal';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/walletService';
import { depositService, DepositRecord } from '../services/depositService';
import { withdrawalService, WithdrawalRecord } from '../services/withdrawalService';
import { Transaction, TransactionType, TransactionStatus, ApiTransaction } from '../types';

interface HomeScreenProps {
  onNavigateToPayments?: () => void;
  onNavigateToStats?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToAssets?: () => void;
  onNavigateToTeams?: () => void;
  onNavigateToPlans?: () => void;
  onNavigateToWithdraw?: () => void;
}

const buildMergedTransactions = (
  rawTxs: ApiTransaction[] = [],
  deposits: DepositRecord[] = [],
  withdrawals: WithdrawalRecord[] = []
): Transaction[] => {
  const list: Transaction[] = [];
  const processedDepositIds = new Set<string>();
  const processedUtrs = new Set<string>();

  // 1. Map existing wallet transactions
  for (const tx of rawTxs) {
    const isPos = tx.type === 'credit';
    const dateObj = new Date(tx.createdAt);
    const formattedDate = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) +
        ' ' +
        dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : tx.createdAt;

    if (tx.referenceId) processedDepositIds.add(String(tx.referenceId));
    processedDepositIds.add(String(tx._id));

    list.push({
      id: tx._id,
      orderCode: tx._id.slice(-6).toUpperCase(),
      title:
        tx.description ||
        (tx.category === 'referral_bonus'
          ? 'Referral Bonus'
          : tx.category === 'deposit'
          ? 'Deposit INR'
          : tx.category === 'withdrawal'
          ? 'Withdrawal Payout'
          : 'Task Reward'),
      type: (isPos ? 'deposit' : 'withdrawal') as TransactionType,
      date: formattedDate,
      rawDate: tx.createdAt,
      amount: tx.amount,
      formattedAmount: `${isPos ? '+ ' : '- '}₹ ${Number(tx.amount).toFixed(2)}`,
      isPositive: isPos,
      status: (tx.status === 'completed'
        ? 'Completed'
        : tx.status === 'pending'
        ? 'Pending'
        : 'Failed') as TransactionStatus,
      paymentMethod:
        tx.category === 'referral_bonus'
          ? 'Referral Bonus'
          : tx.category === 'deposit'
          ? 'UPI Direct Deposit'
          : tx.category === 'withdrawal'
          ? 'Bank Payout'
          : 'Task Incentive',
      fee: 0,
      recipientOrSender: 'DreamPay Settlement Gateway',
    });
  }

  // 2. Merge Deposits (especially pending ones until admin verification)
  for (const dep of deposits) {
    if (processedDepositIds.has(String(dep._id))) continue;
    if (dep.transactionRef && processedUtrs.has(dep.transactionRef)) continue;
    if (dep.transactionRef) processedUtrs.add(dep.transactionRef);

    const dateObj = new Date(dep.createdAt);
    const formattedDate = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }) +
        ' ' +
        dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : dep.createdAt;

    const isPending = dep.status === 'pending';
    const isApproved = dep.status === 'approved';

    list.push({
      id: dep._id,
      orderCode: dep.transactionRef
        ? (dep.transactionRef.length > 8 ? dep.transactionRef.slice(-8).toUpperCase() : dep.transactionRef.toUpperCase())
        : dep._id.slice(-6).toUpperCase(),
      title: isPending ? 'Deposit INR (Pending)' : 'Deposit INR',
      type: 'deposit',
      date: formattedDate,
      rawDate: dep.createdAt,
      amount: Number(dep.amount),
      formattedAmount: `+ ₹ ${Number(dep.amount).toFixed(2)}`,
      isPositive: true,
      status: (isApproved ? 'Completed' : isPending ? 'Pending' : 'Failed') as TransactionStatus,
      paymentMethod: 'UPI Direct Deposit',
      fee: 0,
      recipientOrSender: 'DreamPay Settlement Gateway',
    });
  }

  // 3. Merge Withdrawals (pending ones)
  for (const w of withdrawals) {
    if (w.status === 'pending' && !processedDepositIds.has(String(w._id))) {
      const dateObj = new Date(w.createdAt);
      const formattedDate = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }) +
          ' ' +
          dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : w.createdAt;

      list.push({
        id: w._id,
        orderCode: w._id.slice(-6).toUpperCase(),
        title: 'Withdrawal Payout (Pending)',
        type: 'withdrawal',
        date: formattedDate,
        rawDate: w.createdAt,
        amount: Number(w.amount),
        formattedAmount: `- ₹ ${Number(w.amount).toFixed(2)}`,
        isPositive: false,
        status: 'Pending' as TransactionStatus,
        paymentMethod: 'Bank Payout',
        fee: 0,
        recipientOrSender: w.bankDetails?.upiId || 'UPI Direct',
      });
    }
  }

  // 4. Sort by rawDate descending (newest first)
  list.sort((a, b) => {
    const tA = new Date(a.rawDate).getTime();
    const tB = new Date(b.rawDate).getTime();
    return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
  });

  return list;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToPayments,
  onNavigateToStats,
  onNavigateToTasks,
  onNavigateToAssets,
  onNavigateToTeams,
  onNavigateToPlans,
  onNavigateToWithdraw,
}) => {
  const { user, wallet, unreadNotifications, refreshUser } = useAuth();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [depositSum, setDepositSum] = useState<number>(0);
  const [withdrawalSum, setWithdrawalSum] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const bottomNavPadding = useBottomNavPadding();

  useEffect(() => {
    let isCancelled = false;
    Promise.allSettled([
      walletService.getTransactions({ limit: 10 }),
      depositService.getDepositHistory(),
      withdrawalService.getWithdrawalHistory(),
    ]).then(([txRes, depRes, withRes]) => {
      if (isCancelled) return;
      if (depRes.status === 'fulfilled' && Array.isArray(depRes.value)) {
        const approvedDeposits = depRes.value
          .filter((d) => d.status === 'approved')
          .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        setDepositSum(approvedDeposits);
      }
      if (withRes.status === 'fulfilled' && Array.isArray(withRes.value)) {
        const approvedWithdrawals = withRes.value
          .filter((w) => w.status === 'approved')
          .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
        setWithdrawalSum(approvedWithdrawals);
      }

      const rawTxs = txRes.status === 'fulfilled' && txRes.value?.transactions ? txRes.value.transactions : [];
      const deposits = depRes.status === 'fulfilled' && Array.isArray(depRes.value) ? depRes.value : [];
      const withdrawals = withRes.status === 'fulfilled' && Array.isArray(withRes.value) ? withRes.value : [];
      const merged = buildMergedTransactions(rawTxs, deposits, withdrawals);
      setRecentTransactions(merged.slice(0, 5));
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    try {
      const [depRes, withRes, txRes] = await Promise.allSettled([
        depositService.getDepositHistory(),
        withdrawalService.getWithdrawalHistory(),
        walletService.getTransactions({ limit: 10 }),
      ]);
      if (depRes.status === 'fulfilled' && Array.isArray(depRes.value)) {
        const approvedDeposits = depRes.value
          .filter((d) => d.status === 'approved')
          .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        setDepositSum(approvedDeposits);
      }
      if (withRes.status === 'fulfilled' && Array.isArray(withRes.value)) {
        const approvedWithdrawals = withRes.value
          .filter((w) => w.status === 'approved')
          .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
        setWithdrawalSum(approvedWithdrawals);
      }

      const rawTxs = txRes.status === 'fulfilled' && txRes.value?.transactions ? txRes.value.transactions : [];
      const deposits = depRes.status === 'fulfilled' && Array.isArray(depRes.value) ? depRes.value : [];
      const withdrawals = withRes.status === 'fulfilled' && Array.isArray(withRes.value) ? withRes.value : [];
      const merged = buildMergedTransactions(rawTxs, deposits, withdrawals);
      setRecentTransactions(merged.slice(0, 5));

      await refreshUser();
    } catch {
      // Fallback
    } finally {
      setRefreshing(false);
    }
  };

  const quickActions = [
    { id: 'tasks', label: 'Tasks', icon: Award, action: onNavigateToTasks },
    { id: 'orders', label: 'Orders', icon: Receipt, action: onNavigateToPayments },
    { id: 'plan', label: 'Payments', icon: TrendingUp, action: onNavigateToPlans || onNavigateToStats },
    { id: 'teams', label: 'Refer & Earn', icon: Gift, action: onNavigateToTeams },
  ];

  const handleActionPress = (actionFn?: () => void) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    actionFn?.();
  };

  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0] : 'User');
  const displayId = (user?._id || user?.id) ? String(user?._id || user?.id).slice(-6).toUpperCase() : '------';
  const avatarLetter = (displayName || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNavigateToAssets}
          style={styles.profileRow}
        >
          <View style={styles.avatarBorder}>
            <Text style={styles.avatarInitial}>{avatarLetter}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[Typography.bodySemiBold, styles.username]}>
              {displayName}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                try {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch {
                  // Fallback
                }
              }}
              style={styles.idBadge}
            >
              <Text style={styles.userId}>ID: {displayId}</Text>
              <Copy size={11} color={Colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowNotifications(true)}
          style={styles.notificationBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Bell size={22} color={Colors.textPrimary} />
          {unreadNotifications > 0 && (
            <View style={styles.notificationDot} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavPadding }]}
      >
        {/* Sticky Balance Card & Metrics Container */}
        <View style={styles.stickyCardWrapper}>
          <View style={styles.stickyInnerContainer}>
            {/* Top Available Balance Card (Green Theme with Accents) */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={Colors.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCardGradient}
              >
                {/* Decorative Geometric Curves Matching Screenshot */}
                <View style={styles.decorYellowCircle} />
                <View style={styles.decorBlueCircle} />
                <View style={styles.decorGreenWave} />

                <View style={styles.heroContent}>
                  <View style={styles.balanceInfo}>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text
                      style={styles.balanceAmount}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      ₹ {wallet.balance.toLocaleString('en-IN', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onNavigateToPayments}
                    style={styles.detailPillBtn}
                  >
                    <Text style={styles.detailPillText}>Detail</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            {/* Deposit & Withdrawal Metrics Banner (Matching Screenshot) */}
            <View style={styles.metricsBanner}>
              <LinearGradient
                colors={['#009A62', '#00875A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.metricsBannerGradient}
              >
                {/* Subtle corner shapes like in screenshot */}
                <View style={styles.metricBlueAccent} />
                <View style={styles.metricGoldAccent} />

                {/* Left: Deposit */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onNavigateToPayments}
                  style={styles.metricBannerCol}
                >
                  <View style={styles.metricBannerTitleRow}>
                    <ArrowUpRight size={15} color="#34D399" />
                    <Text style={styles.metricBannerLabel}>Deposit</Text>
                  </View>
                  <Text style={styles.metricBannerValue}>
                    ₹ {depositSum.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </Text>
                </TouchableOpacity>

                <View style={styles.metricBannerDivider} />

                {/* Right: Withdrawal */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onNavigateToWithdraw || onNavigateToPayments}
                  style={styles.metricBannerCol}
                >
                  <View style={styles.metricBannerTitleRow}>
                    <ArrowDownLeft size={15} color="#F87171" />
                    <Text style={styles.metricBannerLabel}>Withdrawal</Text>
                  </View>
                  <Text style={styles.metricBannerValue}>
                    ₹ {withdrawalSum.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </View>

        {/* Scrollable Content Below Sticky Cards */}
        <View style={styles.scrollableContent}>
          <View style={styles.scrollableInnerContainer}>
            {/* 4 Quick Actions (Tasks, Money, Plan, Teams) */}
            <View style={styles.actionGrid}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.id}
                    activeOpacity={0.75}
                    onPress={() => handleActionPress(action.action)}
                    style={styles.actionItem}
                  >
                    <View style={styles.actionIconBox}>
                      <Icon size={24} color={Colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={[Typography.caption, styles.actionLabel]} numberOfLines={1}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Eye-Catching "Invite & Earn 2-Level Commission" Banner */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {
                  // Fallback
                }
                onNavigateToTeams?.();
              }}
              style={styles.referralBannerContainer}
            >
              <LinearGradient
                colors={['#065F46', '#047857', '#0F766E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.referralBannerGradient}
              >
                <View style={styles.bannerDecorCircle} />
                <View style={styles.bannerLeftContent}>
                  <View style={styles.bannerTagRow}>
                    <Sparkles size={11} color="#FDE047" />
                    <Text style={styles.bannerTagText}>REFER & EARN PROGRAM</Text>
                  </View>
                  <Text style={styles.bannerTitle}>
                    Invite & Earn 2-Level Commission
                  </Text>
                  <Text style={styles.bannerSubtitle}>
                    Earn 2% on Direct (L1) + 1% on Indirect (L2) team deposits automatically!
                  </Text>
                </View>

                <View style={styles.bannerRightAction}>
                  <View style={styles.bannerIconCircle}>
                    <Gift size={22} color="#FDE047" />
                  </View>
                  <View style={styles.bannerCtaPill}>
                    <Text style={styles.bannerCtaText}>Invite</Text>
                    <ArrowUpRight size={13} color="#065F46" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Transactions Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={[Typography.sectionTitle, styles.sectionTitleText]} numberOfLines={1}>
                Transactions
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onNavigateToPayments}
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {/* Transactions Card Container */}
            <View style={styles.transactionCardContainer}>
              {recentTransactions.length === 0 ? (
                <View style={styles.emptyTxBox}>
                  <Receipt size={32} color={Colors.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyTxText}>No transactions yet</Text>
                  <Text style={styles.emptyTxSub}>
                    Your deposits, withdrawals, and task earnings will appear here.
                  </Text>
                </View>
              ) : (
                recentTransactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onPress={(item) => setSelectedTx(item)}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Robot / Support Assistant Widget */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch {
            // Fallback
          }
          onNavigateToTeams?.();
        }}
        style={[styles.floatingBotBtn, { bottom: bottomNavPadding - 10 }]}
      >
        <LinearGradient
          colors={['#00C982', '#00A86B']}
          style={styles.floatingBotGradient}
        >
          <Bot size={22} color="#FFFFFF" strokeWidth={2.4} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Transaction Detail Modal */}
      <PaymentDetailModal
        visible={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        data={selectedTx}
      />

      {/* Notifications Modal */}
      <NotificationModal
        visible={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          refreshUser();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 18,
  },
  profileInfo: {
    marginLeft: 10,
  },
  username: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  userId: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '600',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  stickyCardWrapper: {
    width: '100%',
    backgroundColor: Colors.background,
    zIndex: 10,
    paddingTop: 2,
    paddingBottom: Spacing.sm,
  },
  stickyInnerContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  heroCardGradient: {
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'center',
  },
  decorYellowCircle: {
    position: 'absolute',
    top: -24,
    right: 32,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FBBF24',
    opacity: 0.85,
  },
  decorBlueCircle: {
    position: 'absolute',
    top: 20,
    right: -25,
    width: 105,
    height: 105,
    borderRadius: 55,
    backgroundColor: '#3B82F6',
    opacity: 0.75,
  },
  decorGreenWave: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    opacity: 0.4,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  balanceInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  detailPillBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  detailPillText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 14,
  },
  metricsBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  metricsBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  metricBlueAccent: {
    position: 'absolute',
    left: -15,
    top: -10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    opacity: 0.8,
  },
  metricGoldAccent: {
    position: 'absolute',
    right: -15,
    bottom: -15,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FBBF24',
    opacity: 0.8,
  },
  metricBannerCol: {
    flex: 1,
    alignItems: 'center',
    zIndex: 2,
  },
  metricBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricBannerLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  metricBannerValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  metricBannerDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    marginHorizontal: Spacing.xs,
    zIndex: 2,
  },
  scrollableContent: {
    width: '100%',
  },
  scrollableInnerContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.md,
    gap: 10,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  actionLabel: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
  },
  sectionTitleText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllBtn: {
    paddingVertical: 4,
  },
  seeAllText: {
    color: Colors.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  transactionCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: 4,
  },
  emptyTxBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyTxText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyTxSub: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  floatingBotBtn: {
    position: 'absolute',
    right: 18,
    width: 48,
    height: 48,
    borderRadius: 24,
    zIndex: 998,
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingBotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  referralBannerContainer: {
    marginBottom: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  referralBannerGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerDecorCircle: {
    position: 'absolute',
    top: -20,
    right: 40,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bannerLeftContent: {
    flex: 1,
    marginRight: 12,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  bannerTagText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
  bannerRightAction: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
  },
  bannerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  bannerCtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF08A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  bannerCtaText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '800',
  },
});
