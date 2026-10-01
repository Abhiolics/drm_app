import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AlertCircle, TrendingUp, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/Header';
import { TabSelector } from '../components/TabSelector';
import { OfferCard } from '../components/OfferCard';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { mockStatsData, mockOffers } from '../data/mockData';
import { OfferItem } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface StatsScreenProps {
  onBack?: () => void;
  showBack?: boolean;
  onNavigateToDeposit?: (offer?: OfferItem) => void;
}

type OfferTier = 'Top Picks' | '100-199' | '200-299' | '300-500';

export const StatsScreen: React.FC<StatsScreenProps> = ({
  onBack,
  showBack = false,
  onNavigateToDeposit,
}) => {
  const [activeTier, setActiveTier] = useState<OfferTier>('Top Picks');
  const [offersList, setOffersList] = useState<OfferItem[]>(mockOffers);
  const bottomNavPadding = useBottomNavPadding();

  const tierTabs: { id: OfferTier; label: string }[] = [
    { id: 'Top Picks', label: 'Top Picks' },
    { id: '100-199', label: '100-199' },
    { id: '200-299', label: '200-299' },
    { id: '300-500', label: '300-500' },
  ];

  const filteredOffers = offersList.filter((off) => off.tier === activeTier);

  const handleClaimOffer = (offer: OfferItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fallback
    }
    setOffersList((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, isClaimed: true } : o))
    );
    onNavigateToDeposit?.(offer);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      <Header title="Stats" showBack={showBack} onBack={onBack} centerTitle />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavPadding }]}
      >
        <View style={styles.contentContainer}>
          {/* Top Hero Cashback Card matching reference */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#241B4B', '#16132D', '#111019']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroTopLeft}>
                  <Text style={[Typography.caption, styles.heroLabel]}>
                    Cashback Rate
                  </Text>
                  <View style={styles.rateRow}>
                    <Text
                      style={[Typography.balance, styles.rateText]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {mockStatsData.cashbackRate}%
                    </Text>
                    <View style={styles.rateBadge}>
                      <TrendingUp size={12} color={Colors.success} />
                      <Text style={styles.rateBadgeText}>+0.4%</Text>
                    </View>
                  </View>
                </View>

                {/* Sparkline / Bar chart visual illustration */}
                <View style={styles.chartBarsContainer}>
                  <View style={[styles.chartBar, { height: 16 }]} />
                  <View style={[styles.chartBar, { height: 26 }]} />
                  <View style={[styles.chartBar, { height: 20 }]} />
                  <View style={[styles.chartBar, { height: 36, backgroundColor: Colors.primary }]} />
                  <View style={[styles.chartBar, { height: 44, backgroundColor: Colors.secondary }]} />
                </View>
              </View>

              {/* Metrics Row: Balance, Repaid, Pending */}
              <View style={styles.heroMetricsBox}>
                <View style={styles.heroMetricItem}>
                  <Text style={styles.metricName}>Balance</Text>
                  <Text
                    style={styles.metricVal}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    ₹ {mockStatsData.balance}
                  </Text>
                </View>

                <View style={styles.heroDivider} />

                <View style={styles.heroMetricItem}>
                  <Text style={styles.metricName}>Repaid</Text>
                  <Text
                    style={styles.metricVal}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    ₹ {mockStatsData.repaid}
                  </Text>
                </View>

                <View style={styles.heroDivider} />

                <View style={styles.heroMetricItem}>
                  <Text style={styles.metricName}>Pending</Text>
                  <Text
                    style={styles.metricVal}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    ₹ {mockStatsData.pending}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Warning / Announcement Banner matching reference */}
          <View style={styles.noticeBanner}>
            <View style={styles.noticeIconWrap}>
              <AlertCircle size={15} color={Colors.warning} />
            </View>
            <Text style={styles.noticeText}>{mockStatsData.notice}</Text>
          </View>

          {/* Available Offers Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={[Typography.sectionTitle, styles.sectionTitleText]} numberOfLines={1}>
                Available Offers
              </Text>
              <View style={styles.refreshesDailyBadge}>
                <Sparkles size={10} color={Colors.primary} />
                <Text style={styles.refreshesText}>Refreshes Daily</Text>
              </View>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterPillsContainer}>
            <TabSelector
              tabs={tierTabs}
              activeTab={activeTier}
              onSelectTab={(tier) => setActiveTier(tier)}
              variant="pills"
            />
          </View>

          {/* Offer Cards */}
          <View style={styles.offerList}>
            {filteredOffers.length > 0 ? (
              filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onClaim={handleClaimOffer}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No offers available in this tier right now.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
  },
  heroMetricItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metricName: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
    textAlign: 'center',
  },
  metricVal: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  heroDivider: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 4,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 176, 32, 0.08)',
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.25)',
    gap: Spacing.xs,
  },
  noticeIconWrap: {
    marginTop: 2,
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
  filterPillsContainer: {
    marginVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  offerList: {
    marginTop: 2,
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
