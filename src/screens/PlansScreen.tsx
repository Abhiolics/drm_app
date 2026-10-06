import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  X,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { useAuth } from '../context/AuthContext';
import { planService } from '../services/planService';
import { taskService } from '../services/taskService';
import { ApiPlan } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface PlansScreenProps {
  onBack?: () => void;
  showBack?: boolean;
  onNavigateToDeposit?: (plan?: any) => void;
}

interface PlanOffer {
  id: string;
  currency: string;
  code: string;
  amount: number;
  income: number;
  bonus: string;
  tier: 'Top Picks' | '100-199' | '200-299' | '300-599' | '1000-1999' | '2000+';
  isClaimed?: boolean;
}

const FILTER_TABS = [
  'Top Picks',
  '100-199',
  '200-299',
  '300-599',
  '1000-1999',
  '2000+',
] as const;

type FilterTab = typeof FILTER_TABS[number];

export const PlansScreen: React.FC<PlansScreenProps> = ({
  onBack,
  showBack = false,
  onNavigateToDeposit,
}) => {
  const { wallet, refreshUser } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('Top Picks');
  const [offersList, setOffersList] = useState<PlanOffer[]>([]);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<PlanOffer | null>(null);
  const [claimedPlans, setClaimedPlans] = useState<Record<string, boolean>>({});
  const [rewardBalance, setRewardBalance] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const bottomNavPadding = useBottomNavPadding();
  const [rawBackendPlans, setRawBackendPlans] = useState<ApiPlan[]>([]);

  const mapBackendPlans = (apiPlans: ApiPlan[]): PlanOffer[] => {
    return apiPlans.map((p) => {
      let tier: PlanOffer['tier'] = 'Top Picks';
      if (p.amount >= 100 && p.amount <= 199) tier = '100-199';
      else if (p.amount >= 200 && p.amount <= 299) tier = '200-299';
      else if (p.amount >= 300 && p.amount <= 599) tier = '300-599';
      else if (p.amount >= 1000 && p.amount <= 1999) tier = '1000-1999';
      else if (p.amount >= 2000) tier = '2000+';

      const incomeEst = Number((p.amount * 0.058).toFixed(2));
      return {
        id: p._id,
        currency: 'INR',
        code: p._id.slice(-6).toUpperCase(),
        amount: p.amount,
        income: incomeEst,
        bonus: `₹${Math.max(3, Math.round(p.amount * 0.01))}.0`,
        tier,
      };
    });
  };

  useEffect(() => {
    let isCancelled = false;
    Promise.allSettled([
      planService.getPlans(),
      taskService.getTaskSubmissions(),
    ]).then(([apiPlansRes, submissionsRes]) => {
      if (isCancelled) return;
      if (apiPlansRes.status === 'fulfilled' && Array.isArray(apiPlansRes.value)) {
        setRawBackendPlans(apiPlansRes.value);
        setOffersList(mapBackendPlans(apiPlansRes.value));
      }
      if (submissionsRes.status === 'fulfilled' && Array.isArray(submissionsRes.value)) {
        const approvedSum = submissionsRes.value
          .filter((s) => s.status === 'approved')
          .reduce((sum, s) => sum + (Number(s.rewardAmount) || 0), 0);
        setRewardBalance(approvedSum);
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
      const [apiPlansRes, submissionsRes] = await Promise.allSettled([
        planService.getPlans(),
        taskService.getTaskSubmissions(),
        refreshUser(),
      ]);

      if (apiPlansRes.status === 'fulfilled' && Array.isArray(apiPlansRes.value)) {
        setRawBackendPlans(apiPlansRes.value);
        setOffersList(mapBackendPlans(apiPlansRes.value));
      }

      if (submissionsRes.status === 'fulfilled' && Array.isArray(submissionsRes.value)) {
        const approvedSum = submissionsRes.value
          .filter((s) => s.status === 'approved')
          .reduce((sum, s) => sum + (Number(s.rewardAmount) || 0), 0);
        setRewardBalance(approvedSum);
      }
    } catch {
      // Fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClaimPress = (plan: PlanOffer) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fallback
    }
    setSelectedPlanForModal(plan);
  };

  const handleConfirmClaim = (plan: PlanOffer) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }
    setClaimedPlans((prev) => ({ ...prev, [plan.id]: true }));
    setSelectedPlanForModal(null);

    // Ensure we only pass a valid 24-character hexadecimal MongoDB ObjectId
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(plan.id);
    const matchedBackendPlan = rawBackendPlans.find(
      (bp) => Math.abs(bp.amount - plan.amount) <= 50 || bp._id === plan.id
    );

    const safePlanId = isMongoId ? plan.id : (matchedBackendPlan ? matchedBackendPlan._id : undefined);

    const safeOffer = {
      ...plan,
      id: safePlanId || '',
      _id: safePlanId,
      planId: safePlanId,
    };

    onNavigateToDeposit?.(safeOffer);
  };

  // Filter plans based on selected tab
  const filteredOffers = offersList.filter((item) => {
    if (selectedFilter === 'Top Picks') {
      return true; // Show all verified plans in Top Picks
    }
    if (selectedFilter === '100-199') {
      return item.amount >= 100 && item.amount <= 199;
    }
    if (selectedFilter === '200-299') {
      return item.amount >= 200 && item.amount <= 299;
    }
    if (selectedFilter === '300-599') {
      return item.amount >= 300 && item.amount <= 599;
    }
    if (selectedFilter === '1000-1999') {
      return item.amount >= 1000 && item.amount <= 1999;
    }
    if (selectedFilter === '2000+') {
      return item.amount >= 2000;
    }
    return true;
  });

  const balance = Number(wallet?.balance || 0);
  const pendingBalance = Number(wallet?.pendingBalance || 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <Header
        title="Payments"
        showBack={showBack}
        onBack={onBack}
        centerTitle
      />

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
        {/* ================= HERO CARD (Emerald Green & Light Theme) ================= */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={Colors.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Background geometric accents */}
            <View style={styles.heroCircleAccent1} />
            <View style={styles.heroCircleAccent2} />

            {/* Cashback Header */}
            <View style={styles.heroHeader}>
              <Text style={styles.cashbackLabel}>Cashback</Text>
              <Text style={styles.cashbackValue}>4%</Text>
            </View>

            {/* Balance & Sub-Stats Row */}
            <View style={styles.heroCardsRow}>
              {/* Left Large Card: Balance */}
              <View style={styles.balanceBox}>
                <Text style={styles.balanceBoxLabel}>Balance</Text>
                <Text
                  style={styles.balanceBoxValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  ₹{balance.toFixed(2)}
                </Text>
              </View>

              {/* Right Column: Reward & Pending */}
              <View style={styles.sideStatsCol}>
                <View style={styles.miniStatBox}>
                  <Text style={styles.rewardLabel}>Reward</Text>
                  <Text style={styles.miniStatValue}>₹{rewardBalance.toFixed(0)}</Text>
                </View>

                <View style={styles.miniStatBox}>
                  <Text style={styles.pendingLabel}>Pending</Text>
                  <Text style={styles.miniStatValue}>₹{pendingBalance.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ================= CATEGORY FILTER PILLS ================= */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsContent}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = selectedFilter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.8}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {
                      // Fallback
                    }
                    setSelectedFilter(tab);
                  }}
                  style={[
                    styles.filterPill,
                    isActive && styles.filterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive && styles.filterPillTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ================= PLAN CARDS LIST ================= */}
        <View style={styles.plansListSection}>
          {isLoading && !isRefreshing ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loaderText}>Loading membership payments...</Text>
            </View>
          ) : filteredOffers.length > 0 ? (
            filteredOffers.map((item) => {
              const isClaimed = claimedPlans[item.id];
              return (
                <View key={item.id} style={styles.planCard}>
                  {/* Top Row: Currency Title + CODE Pill */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.currencyTitle}>{item.currency}</Text>

                    <View style={styles.codeBadge}>
                      <View style={styles.codeTag}>
                        <Text style={styles.codeTagText}>CODE</Text>
                      </View>
                      <Text style={styles.codeValueText}>{item.code}</Text>
                    </View>
                  </View>

                  {/* Body Row: Amount & Income on Left, Claim Button on Right */}
                  <View style={styles.cardBodyRow}>
                    <View style={styles.cardDetailsCol}>
                      {/* Amount Row */}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Amount: </Text>
                        <Text style={styles.amountValue}>₹{item.amount}</Text>
                      </View>

                      {/* Income Row */}
                      <View style={[styles.detailRow, { marginTop: 6 }]}>
                        <Text style={styles.detailLabel}>Income: </Text>
                        <Text style={styles.incomeValue}>₹{item.income.toFixed(2)}</Text>
                        <View style={styles.bonusCapsule}>
                          <Text style={styles.bonusCapsuleText}>+{item.bonus}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Claim Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleClaimPress(item)}
                      style={[
                        styles.claimButton,
                        isClaimed && styles.claimButtonActive,
                      ]}
                    >
                      <Text style={styles.claimButtonText}>
                        {isClaimed ? 'Active' : 'Claim'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No payments found in this range</Text>
              <Text style={styles.emptySubtitle}>
                Select another filter or check back later for newly added packages.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================= CLAIM CONFIRMATION MODAL ================= */}
      {selectedPlanForModal && (
        <Modal
          visible={!!selectedPlanForModal}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPlanForModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleRow}>
                  <ShieldCheck size={20} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.modalTitle}>Activate Payment</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedPlanForModal(null)}
                  style={styles.modalCloseBtn}
                >
                  <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalAmountBox}>
                  <Text style={styles.modalAmountLabel}>Payment Investment</Text>
                  <Text style={styles.modalAmountValue}>
                    ₹{selectedPlanForModal.amount.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.modalCodeText}>Code: {selectedPlanForModal.code}</Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Estimated Daily Income</Text>
                  <Text style={styles.modalInfoValue}>
                    ₹{selectedPlanForModal.income.toFixed(2)} + {selectedPlanForModal.bonus}
                  </Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Cashback Rate</Text>
                  <Text style={[styles.modalInfoValue, { color: Colors.primary }]}>
                    4% Guaranteed
                  </Text>
                </View>

                <View style={styles.modalNoticeBox}>
                  <TrendingUp size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.modalNoticeText}>
                    Upon activation, income rewards will be calculated and credited to your balance daily.
                  </Text>
                </View>
              </View>

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setSelectedPlanForModal(null)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={() => handleConfirmClaim(selectedPlanForModal)}
                >
                  <LinearGradient
                    colors={Colors.heroGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalConfirmGradient}
                  >
                    <Text style={styles.modalConfirmText}>Confirm Claim</Text>
                    <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingTop: Spacing.sm,
  },

  // Hero Card Styles
  heroContainer: {
    marginBottom: Spacing.md,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  heroGradient: {
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  heroCircleAccent1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroCircleAccent2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroHeader: {
    marginBottom: Spacing.md,
  },
  cashbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.2,
  },
  cashbackValue: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  heroCardsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  balanceBox: {
    flex: 1.2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 16,
    padding: Spacing.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  balanceBoxLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FEF08A', // Warm golden yellow as in reference
    letterSpacing: 0.2,
  },
  balanceBoxValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  sideStatsCol: {
    flex: 1,
    gap: 8,
  },
  miniStatBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FEF08A',
    marginBottom: 2,
  },
  pendingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FED7AA',
    marginBottom: 2,
  },
  miniStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Category Filter Pills
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterTabsContent: {
    gap: 8,
    paddingVertical: 4,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Plans List Section
  plansListSection: {
    gap: 12,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  currencyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  codeTag: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginRight: 6,
  },
  codeTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  codeValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDetailsCol: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '800',
  },
  incomeValue: {
    fontSize: 15,
    color: '#EF4444',
    fontWeight: '700',
  },
  bonusCapsule: {
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bonusCapsuleText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  claimButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  claimButtonActive: {
    backgroundColor: '#059669',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Loader & Empty
  loaderWrap: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loaderText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...Typography.captionSmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: Spacing.lg,
  },
  modalAmountBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  modalAmountLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  modalAmountValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalCodeText: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalInfoLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  modalInfoValue: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  modalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    marginTop: Spacing.md,
  },
  modalNoticeText: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    ...Typography.bodySemiBold,
    color: Colors.textSecondary,
  },
  modalConfirmBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalConfirmGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    ...Typography.bodySemiBold,
    color: '#FFFFFF',
  },
});
