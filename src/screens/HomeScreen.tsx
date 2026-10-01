import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import {
  mockUserProfile,
  mockTransactions,
} from '../data/mockData';
import { Transaction } from '../types';

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
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const bottomNavPadding = useBottomNavPadding();

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
              <Text style={styles.avatarInitial}>
                {mockUserProfile.avatarInitials}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[Typography.bodySemiBold, styles.username]}>
              {mockUserProfile.username}
            </Text>
            <Text style={[Typography.captionSmall, styles.userId]}>
              ID: {mockUserProfile.userId}
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
          {mockUserProfile.unreadNotifications > 0 && (
            <View style={styles.notificationDot} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavPadding }]}
      >
        {/* Sticky Big Balance Card Container */}
        <View style={styles.stickyCardWrapper}>
          <View style={styles.stickyInnerContainer}>
            {/* Main Balance Card matching reference */}
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
                  ₹ {mockUserProfile.availableBalance.toLocaleString('en-IN', {
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
                    ₹ {mockUserProfile.depositSum.toLocaleString('en-IN')}
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
                    ₹ {mockUserProfile.withdrawalSum.toLocaleString('en-IN')}
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
              {mockTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onPress={(item) => setSelectedTx(item)}
                />
              ))}
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
        onClose={() => setShowNotifications(false)}
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
    marginTop: 2,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  stickyCardWrapper: {
    width: '100%',
    backgroundColor: Colors.background,
    zIndex: 100,
    elevation: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  stickyInnerContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  scrollableContent: {
    width: '100%',
  },
  scrollableInnerContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  balanceCard: {
    marginTop: 0,
    padding: Spacing.md,
  },
  balanceLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 1,
    fontSize: 11,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  balanceAmount: {
    color: Colors.textPrimary,
  },
  viewDetailsBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
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
    marginRight: 4,
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  metricItem: {
    flex: 1,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  metricItemLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  metricItemValue: {
    color: Colors.textPrimary,
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: Spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconBox: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  actionLabel: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  sectionTitleText: {
    color: Colors.textPrimary,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  transactionList: {
    marginTop: 4,
  },
});
