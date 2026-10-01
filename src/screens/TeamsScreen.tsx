import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Gift,
  Share2,
  ArrowRight,
  Copy,
  Check,
  Users,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/Header';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { mockTeamStats } from '../data/mockData';

type LevelTier = 'Level A' | 'Level B' | 'Level C';

interface TeamsScreenProps {
  onBack?: () => void;
}

export const TeamsScreen: React.FC<TeamsScreenProps> = ({ onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<LevelTier>('Level B');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const teamData = mockTeamStats;
  const currentLevelData = teamData.levels[selectedLevel];
  const progressPercent = Math.min(
    100,
    Math.round((currentLevelData.currentDeposit / currentLevelData.targetDeposit) * 100)
  );

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        message: `Join my team on PayApp and start earning commissions! Use my invite link: ${teamData.invitationLink} (Code: ${teamData.invitationCode})`,
        title: 'PayApp Team Invitation',
      });
    } catch {
      // Fallback
    }
  };

  const handleCopyLink = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />

      {/* Screen Header matching reference */}
      <Header
        title="Teams"
        showBack={true}
        onBack={onBack}
        centerTitle={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Hero Commission Card matching reference with existing theme */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={['#2D1B68', '#1E1446', '#120F26']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.heroCardGradient}
          >
            {/* Ambient decorative glow elements */}
            <View style={styles.heroGlowCircle} />

            <Text style={[Typography.bodyMedium, styles.heroCommissionLabel]}>
              My Total Commissions
            </Text>

            <Text
              style={[Typography.balance, styles.heroCommissionAmount]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              +₹{teamData.totalCommissions.toFixed(2)}/-
            </Text>

            {/* 2x2 Metric Cards Grid */}
            <View style={styles.metricGrid}>
              {/* Box 1: Commissions Yesterday */}
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel} numberOfLines={1}>
                  Commissions Yesterday
                </Text>
                <Text style={styles.metricCardValue}>
                  +{teamData.commissionsYesterday.toFixed(2)}
                </Text>
              </View>

              {/* Box 2: Total Team Members */}
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel} numberOfLines={1}>
                  Total Team Members
                </Text>
                <Text style={styles.metricCardValue}>
                  +{teamData.totalTeamMembers}
                </Text>
              </View>

              {/* Box 3: Commissions Today */}
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel} numberOfLines={1}>
                  Commissions Today
                </Text>
                <Text style={styles.metricCardValue}>
                  +{teamData.commissionsToday.toFixed(2)}
                </Text>
              </View>

              {/* Box 4: Total Team Deposit */}
              <View style={styles.metricCard}>
                <Text style={styles.metricCardLabel} numberOfLines={1}>
                  Total Team Deposit
                </Text>
                <Text style={styles.metricCardValue}>
                  +{teamData.totalTeamDeposit.toFixed(2)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 2. Invitation Card */}
        <View style={styles.invitationCard}>
          <View style={styles.invitationLeft}>
            <View style={styles.invitationIconBox}>
              <Gift size={22} color={Colors.primary} />
            </View>
            <View style={styles.invitationTextContainer}>
              <Text style={[Typography.bodySemiBold, styles.invitationTitle]}>
                Invitation
              </Text>
              <Text style={[Typography.caption, styles.invitationSubtitle]}>
                Share the Link to Invite
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleShare}
            style={styles.shareButton}
          >
            <LinearGradient
              colors={Colors.accentGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shareGradient}
            >
              <Share2 size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.shareButtonText}>Share</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Level Switcher Chips (Level A, Level B, Level C) */}
        <View style={styles.levelSelectorContainer}>
          {(['Level A', 'Level B', 'Level C'] as LevelTier[]).map((lvl) => {
            const isSelected = selectedLevel === lvl;
            return (
              <TouchableOpacity
                key={lvl}
                activeOpacity={0.75}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {
                    // Fallback
                  }
                  setSelectedLevel(lvl);
                }}
                style={[
                  styles.levelChip,
                  isSelected && styles.levelChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.levelChipText,
                    isSelected && styles.levelChipTextActive,
                  ]}
                >
                  {lvl}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. New Team Members Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={[Typography.bodySemiBold, styles.sectionCardTitle]}>
              New Team Members
            </Text>
          </View>
          <View style={styles.sectionCardDivider} />
          <View style={styles.sectionCardBody}>
            <Text style={[Typography.h3, styles.levelSubheading]}>
              {selectedLevel}
            </Text>

            <View style={styles.dataRow}>
              <Text style={styles.dataRowLabel}>Today:</Text>
              <Text style={styles.dataRowValue}>
                {currentLevelData.todayMembers}
              </Text>
            </View>

            <View style={[styles.dataRow, { marginTop: 10 }]}>
              <Text style={styles.dataRowLabel}>Yesterday:</Text>
              <Text style={styles.dataRowValue}>
                {currentLevelData.yesterdayMembers}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Commissions/Deposit Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionCardHeader}>
            <Text style={[Typography.bodySemiBold, styles.sectionCardTitle]}>
              Commissions/Deposit
            </Text>
          </View>
          <View style={styles.sectionCardDivider} />
          <View style={styles.sectionCardBody}>
            <Text style={[Typography.h3, styles.levelSubheading]}>
              {selectedLevel}
            </Text>

            <View style={styles.depositRow}>
              <Text style={styles.depositAmountText}>
                {currentLevelData.currentDeposit.toFixed(2)}/
                {currentLevelData.targetDeposit.toFixed(2)}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDetailsModal(true)}
                style={styles.viewDetailsLink}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.viewDetailsText}>View Details</Text>
                <ArrowRight size={14} color={Colors.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* Subtle Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.max(5, progressPercent)}%` },
                ]}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Sparkles size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={[Typography.h3, { color: Colors.textPrimary }]}>
                  {selectedLevel} Details
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatLabel}>Deposit Progress</Text>
                <Text style={[Typography.h2, { color: Colors.textPrimary, marginVertical: 4 }]}>
                  ₹{currentLevelData.currentDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[Typography.caption, { color: Colors.textSecondary }]}>
                  Target: ₹{currentLevelData.targetDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({progressPercent}%)
                </Text>

                <View style={[styles.progressBarTrack, { marginTop: 12 }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.max(5, progressPercent)}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.modalInfoRow}>
                <TrendingUp size={16} color={Colors.success} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySemiBold, { color: Colors.textPrimary }]}>
                    Commission Rate: {currentLevelData.commissionRate}
                  </Text>
                  <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: 2 }]}>
                    Earn direct rebate from every deposit and transaction of {selectedLevel} members.
                  </Text>
                </View>
              </View>

              <View style={styles.modalInfoRow}>
                <Users size={16} color={Colors.secondary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.bodySemiBold, { color: Colors.textPrimary }]}>
                    Referral Link & Code
                  </Text>
                  <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: 2 }]}>
                    Code: {teamData.invitationCode}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCopyLink}
                style={styles.copyLinkBtn}
              >
                {copiedLink ? (
                  <>
                    <Check size={16} color={Colors.success} style={{ marginRight: 6 }} />
                    <Text style={[Typography.button, { color: Colors.success }]}>
                      Link Copied!
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={[Typography.button, { color: '#FFFFFF' }]}>
                      Copy Invite Link
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxxl,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },

  // 1. Hero Card
  heroCardContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.45)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCardGradient: {
    padding: Spacing.md,
    position: 'relative',
  },
  heroGlowCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(124, 92, 252, 0.2)',
  },
  heroCommissionLabel: {
    color: 'rgba(255, 255, 255, 0.78)',
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 13,
  },
  heroCommissionAmount: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: 'rgba(9, 8, 14, 0.76)',
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricCardLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricCardValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // 2. Invitation Card
  invitationCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invitationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invitationIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  invitationTextContainer: {
    flex: 1,
  },
  invitationTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  invitationSubtitle: {
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  shareButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginLeft: Spacing.sm,
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Level Selector Chips
  levelSelectorContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    gap: 8,
  },
  levelChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  levelChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  levelChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // 3 & 4. Section Cards (New Team Members, Commissions/Deposit)
  sectionCard: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    overflow: 'hidden',
  },
  sectionCardHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  sectionCardTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
  },
  sectionCardDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  sectionCardBody: {
    padding: Spacing.md,
  },
  levelSubheading: {
    color: Colors.primary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataRowLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  dataRowValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },

  // Commissions/Deposit Row
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  depositAmountText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  viewDetailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalContent: {
    gap: Spacing.md,
  },
  modalStatBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  modalStatLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
});
