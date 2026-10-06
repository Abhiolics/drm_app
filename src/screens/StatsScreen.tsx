import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { TrendingUp, Sparkles, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/Header';
import { OfferCard } from '../components/OfferCard';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { useAuth } from '../context/AuthContext';
import { planService } from '../services/planService';
import { withdrawalService } from '../services/withdrawalService';
import { ApiPlan } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface StatsScreenProps {
  onBack?: () => void;
  showBack?: boolean;
  onNavigateToDeposit?: (plan?: any) => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({
  onBack,
  showBack = false,
  onNavigateToDeposit,
}) => {
  const { user, wallet, refreshUser } = useAuth();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomNavPadding = useBottomNavPadding();

  useEffect(() => {
    let isCancelled = false;
    Promise.allSettled([
      planService.getPlans(),
      withdrawalService.getWithdrawalHistory(),
    ]).then(([plansRes, withdrawalsRes]) => {
      if (isCancelled) return;
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value)) {
        setPlans(plansRes.value);
      }
      if (withdrawalsRes.status === 'fulfilled' && Array.isArray(withdrawalsRes.value)) {
        const approvedSum = withdrawalsRes.value
          .filter((w: any) => w.status === 'approved')
          .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);
        setTotalWithdrawn(approvedSum);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!isCancelled) setIsLoading(false);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [plansRes, withdrawalsRes] = await Promise.allSettled([
        planService.getPlans(),
        withdrawalService.getWithdrawalHistory(),
      ]);

      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value)) {
        setPlans(plansRes.value);
      }

      if (withdrawalsRes.status === 'fulfilled' && Array.isArray(withdrawalsRes.value)) {
        const approvedSum = withdrawalsRes.value
          .filter((w: any) => w.status === 'approved')
          .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);
        setTotalWithdrawn(approvedSum);
      }

      await refreshUser();
    } catch (error) {
      console.warn('Failed to load stats data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleActivatePlan = (selectedItem: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fallback
    }
    onNavigateToDeposit?.(selectedItem);
  };

  const currentPlanId = user?.plan?._id;
  const balance = wallet?.balance ?? user?.wallet?.balance ?? 0;
  const pendingBalance = wallet?.pendingBalance ?? user?.wallet?.pendingBalance ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <Header title="VIP Stats" showBack={showBack} onBack={onBack} centerTitle />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching membership stats...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavPadding }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          <View style={styles.contentContainer}>
            {/* Top Hero Card with Live Balances */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={Colors.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroTopLeft}>
                    <Text style={[Typography.caption, styles.heroLabel]}>
                      Active Membership
                    </Text>
                    <View style={styles.rateRow}>
                      <Text
                        style={[Typography.balance, styles.rateText]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {user?.plan?.name || 'Standard Tier'}
                      </Text>
                      <View style={styles.rateBadge}>
                        <TrendingUp size={12} color={Colors.success} />
                        <Text style={styles.rateBadgeText}>Active</Text>
                      </View>
                    </View>
                  </View>

                  {/* Sparkline Visual Illustration */}
                  <View style={styles.chartBarsContainer}>
                    <View style={[styles.chartBar, { height: 16 }]} />
                    <View style={[styles.chartBar, { height: 26 }]} />
                    <View style={[styles.chartBar, { height: 20 }]} />
                    <View style={[styles.chartBar, { height: 36, backgroundColor: Colors.primary }]} />
                    <View style={[styles.chartBar, { height: 44, backgroundColor: Colors.secondary }]} />
                  </View>
                </View>

                {/* Metrics Row: Balance, Repaid (Withdrawn), Pending */}
                <View style={styles.heroMetricsBox}>
                  <View style={styles.heroMetricItem}>
                    <Text style={styles.metricName}>Live Balance</Text>
                    <Text
                      style={styles.metricVal}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>

                  <View style={styles.heroDivider} />

                  <View style={styles.heroMetricItem}>
                    <Text style={styles.metricName}>Settled Out</Text>
                    <Text
                      style={styles.metricVal}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      ₹ {totalWithdrawn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>

                  <View style={styles.heroDivider} />

                  <View style={styles.heroMetricItem}>
                    <Text style={styles.metricName}>In Review</Text>
                    <Text
                      style={styles.metricVal}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      ₹ {pendingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Official Notice Banner */}
            <View style={styles.noticeBanner}>
              <View style={styles.noticeIconWrap}>
                <ShieldCheck size={16} color={Colors.primary} />
              </View>
              <Text style={styles.noticeText}>
                Active VIP tiers unlock high-yield daily tasks and instant zero-fee payout settlements.
              </Text>
            </View>

            {/* Available Plans Section */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={[Typography.sectionTitle, styles.sectionTitleText]} numberOfLines={1}>
                  Membership Plans
                </Text>
                <View style={styles.refreshesDailyBadge}>
                  <Sparkles size={10} color={Colors.primary} />
                  <Text style={styles.refreshesText}>Instant Activation</Text>
                </View>
              </View>
            </View>

            {/* Plan Cards */}
            <View style={styles.offerList}>
              {plans.length > 0 ? (
                plans.map((plan) => (
                  <OfferCard
                    key={plan._id}
                    plan={plan}
                    isUserCurrentPlan={currentPlanId === plan._id}
                    onClaim={handleActivatePlan}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No plans available right now. Please check back later.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  heroCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  heroGradient: {
    padding: Spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroTopLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.sm,
  },
  heroLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  rateText: {
    color: Colors.textPrimary,
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 2,
  },
  rateBadgeText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 48,
    gap: 4,
    flexShrink: 0,
  },
  chartBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroMetricsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  heroMetricItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metricName: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginBottom: 2,
    textAlign: 'center',
  },
  metricVal: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  heroDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 4,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    gap: Spacing.xs,
  },
  noticeIconWrap: {
    flexShrink: 0,
  },
  noticeText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  sectionTitleText: {
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  refreshesDailyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    flexShrink: 0,
  },
  refreshesText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  offerList: {
    marginTop: 6,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
