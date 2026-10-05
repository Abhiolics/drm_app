import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronRight,
  Award,
  Banknote,
  TrendingUp,
  Users,
  Receipt,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { GlassCard } from '../components/GlassCard';
import { TransactionItem } from '../components/TransactionItem';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { NotificationModal } from '../components/NotificationModal';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { useAuth } from '../context/AuthContext';
import { walletService } from '../services/walletService';
import { depositService } from '../services/depositService';
import { withdrawalService } from '../services/withdrawalService';
import { Transaction, TransactionType, TransactionStatus, ApiTransaction } from '../types';

interface HomeScreenProps {
  onNavigateToPayments?: () => void;
  onNavigateToStats?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToAssets?: () => void;
  onNavigateToTeams?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateToPayments,
  onNavigateToStats,
  onNavigateToTasks,
  onNavigateToAssets,
  onNavigateToTeams,
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
      walletService.getTransactions({ limit: 5 }),
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
      if (txRes.status === 'fulfilled' && txRes.value?.transactions) {
        const mapped: Transaction[] = txRes.value.transactions.map((tx: ApiTransaction) => {
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

          return {
            id: tx._id,
            orderCode: tx._id.slice(-6).toUpperCase(),
            title:
              tx.description ||
              (tx.category === 'deposit'
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
              tx.category === 'deposit'
                ? 'UPI Direct Deposit'
                : tx.category === 'withdrawal'
                ? 'Bank Payout'
                : 'Task Incentive',
            fee: 0,
            recipientOrSender: 'DreamPay Settlement Gateway',
          };
        });
        setRecentTransactions(mapped);
      }
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
        walletService.getTransactions({ limit: 5 }),
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
      if (txRes.status === 'fulfilled' && txRes.value?.transactions) {
        const mapped: Transaction[] = txRes.value.transactions.map((tx: ApiTransaction) => {
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

          return {
            id: tx._id,
            orderCode: tx._id.slice(-6).toUpperCase(),
            title:
              tx.description ||
              (tx.category === 'deposit'
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
              tx.category === 'deposit'
                ? 'UPI Direct Deposit'
                : tx.category === 'withdrawal'
                ? 'Bank Payout'
                : 'Task Incentive',
            fee: 0,
            recipientOrSender: 'DreamPay Settlement Gateway',
          };
        });
        setRecentTransactions(mapped);
      }
      await refreshUser();
    } catch {
      // Fallback
    } finally {
      setRefreshing(false);
    }
  };

  const quickActions = [
    { id: 'tasks', label: 'Tasks', icon: Award, action: onNavigateToTasks },
    { id: 'money', label: 'Money', icon: Banknote, action: onNavigateToPayments },
    { id: 'plan', label: 'Plan', icon: TrendingUp, action: onNavigateToStats },
    { id: 'teams', label: 'Teams', icon: Users, action: onNavigateToTeams },
  ];

  const handleActionPress = (actionFn?: () => void) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    actionFn?.();
  };

  const displayName = user?.fullName || 'DreamPay User';
  const displayId = (user?._id || user?.id || '21833').slice(-6).toUpperCase();
  const avatarLetter = (displayName || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onNavigateToAssets}
          style={styles.profileRow}
        >
          <View style={styles.avatarBorder}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitial}>{avatarLetter}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[Typography.bodySemiBold, styles.username]}>
              {displayName}
            </Text>
            <Text style={[Typography.captionSmall, styles.userId]}>
              ID: {displayId}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowNotifications(true)}
          style={styles.notificationBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Bell size={20} color={Colors.textPrimary} />
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
        {/* Sticky Big Balance Card Container */}
        <View style={styles.stickyCardWrapper}>
          <View style={styles.stickyInnerContainer}>
            {/* Main Balance Card */}
            <GlassCard elevated borderAccent style={styles.balanceCard}>
              <Text style={[Typography.captionSmall, styles.balanceLabel]}>
                AVAILABLE BALANCE
              </Text>

              <View style={styles.balanceRow}>
                <Text
                  style={[Typography.balance, styles.balanceAmount]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  ₹ {wallet.balance.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onNavigateToPayments}
                style={styles.viewDetailsBtn}
              >
                <LinearGradient
                  colors={Colors.accentGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.viewDetailsGradient}
                >
                  <Text style={[Typography.button, styles.viewDetailsText]}>
                    View Details
                  </Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Deposit & Withdrawal lower box */}
              <View style={styles.metricsBox}>
                <View style={styles.metricItem}>
                  <View style={styles.metricTitleRow}>
                    <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                    <Text style={styles.metricItemLabel}>Deposit</Text>
                  </View>
                  <Text
                    style={[Typography.bodySemiBold, styles.metricItemValue]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    ₹ {depositSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.metricDivider} />

                <View style={styles.metricItem}>
                  <View style={styles.metricTitleRow}>
                    <View style={[styles.statusDot, { backgroundColor: Colors.danger }]} />
                    <Text style={styles.metricItemLabel}>Withdrawal</Text>
                  </View>
                  <Text
                    style={[Typography.bodySemiBold, styles.metricItemValue]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    ₹ {withdrawalSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </View>

        {/* Scrollable Content Below Sticky Card */}
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
                      <Icon size={22} color={Colors.primary} />
                    </View>
                    <Text style={[Typography.caption, styles.actionLabel]} numberOfLines={1}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Recent Transactions Section */}
            <View style={styles.sectionHeader}>
              <Text style={[Typography.sectionTitle, styles.sectionTitleText]} numberOfLines={1}>
                Recent Transactions
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onNavigateToPayments}
                style={styles.seeAllBtn}
              >
                <Text style={styles.seeAllText}>See All</Text>
                <ChevronRight size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.transactionList}>
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
    paddingVertical: Spacing.sm,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    padding: 2,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  profileInfo: {
    marginLeft: Spacing.sm,
  },
  username: {
    color: Colors.textPrimary,
  },
  userId: {
    color: Colors.textMuted,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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
    borderColor: Colors.surfaceElevated,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stickyCardWrapper: {
    width: '100%',
    backgroundColor: Colors.background,
    zIndex: 10,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  stickyInnerContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
  },
  balanceCard: {
    padding: Spacing.lg,
    width: '100%',
  },
  balanceLabel: {
    color: Colors.textMuted,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  balanceAmount: {
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewDetailsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
  },
  viewDetailsText: {
    color: '#FFFFFF',
    marginRight: 6,
    fontWeight: '700',
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  metricItemLabel: {
    ...Typography.captionSmall,
    color: Colors.textMuted,
  },
  metricItemValue: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
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
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitleText: {
    color: Colors.textPrimary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  seeAllText: {
    ...Typography.caption,
    color: Colors.primary,
    marginRight: 2,
    fontWeight: '600',
  },
  transactionList: {
    gap: 8,
  },
  emptyTxBox: {
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginVertical: Spacing.md,
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
});
