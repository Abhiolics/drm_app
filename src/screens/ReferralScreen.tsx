import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Gift,
  Share2,
  Copy,
  Users,
  Wallet,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Globe,
  ExternalLink,
} from 'lucide-react-native';
import { Header } from '../components/Header';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { useAuth } from '../context/AuthContext';
import { referralService } from '../services/referralService';
import { ApiReferralStats, ApiTeamMember } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';

interface ReferralScreenProps {
  onBack?: () => void;
  showBack?: boolean;
}

type FilterLevel = 'all' | '1' | '2';

export const ReferralScreen: React.FC<ReferralScreenProps> = ({
  onBack,
  showBack = false,
}) => {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<ApiReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterLevel>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAnim] = useState(new Animated.Value(0));
  const bottomNavPadding = useBottomNavPadding();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  }, [toastAnim]);

  useEffect(() => {
    let isCancelled = false;
    referralService
      .getStats()
      .then((data) => {
        if (!isCancelled && data) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.warn('Error fetching referral stats:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    try {
      const data = await referralService.getStats();
      if (data) {
        setStats(data);
      }
      await refreshUser();
    } catch (err) {
      console.warn('Error refreshing referral stats:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const referralCode =
    stats?.referralCode ||
    user?.referralCode ||
    (user?._id ? user._id.slice(-6).toUpperCase() : 'DRMPAY');

  // Official DreamPay Web Portal Invite Link
  const referralLink = `https://dreampay.info/?invite=${referralCode}`;

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Referral Code "${referralCode}" copied!`);
    } catch {
      showToast('Copied to clipboard');
    }
  };

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(referralLink);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Referral link copied to clipboard!');
    } catch {
      showToast('Link copied');
    }
  };

  const handleOpenLink = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const supported = await Linking.canOpenURL(referralLink);
      if (supported) {
        await Linking.openURL(referralLink);
      } else {
        await Linking.openURL('https://dreampay.info/');
      }
    } catch (err) {
      console.warn('Could not open invite link:', err);
      showToast('Opening dreampay.info...');
      try {
        await Linking.openURL('https://dreampay.info/');
      } catch {
        // Fallback
      }
    }
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share(
        Platform.OS === 'ios'
          ? {
              title: 'DreamPay Refer & Earn Invitation',
              url: referralLink,
              message: `🚀 Join my team on DreamPay and start earning daily income!\n\nUse my invite code: ${referralCode}\nSign up link: ${referralLink}\n\nEarn 2% Level-1 and 1% Level-2 commission on all deposits automatically!`,
            }
          : {
              title: 'DreamPay Refer & Earn Invitation',
              message: `🚀 Join my team on DreamPay and start earning daily income!\n\nUse my invite code: ${referralCode}\nSign up link: ${referralLink}\n\nEarn 2% Level-1 and 1% Level-2 commission on all deposits automatically!`,
            }
      );
    } catch {
      // Fallback
    }
  };

  // Helper to mask phone & email for privacy
  const maskPhone = (phone?: string) => {
    if (!phone) return '••••••••••';
    const clean = phone.trim();
    if (clean.length < 6) return clean;
    return `${clean.slice(0, 3)}••••${clean.slice(-3)}`;
  };

  const maskEmail = (email?: string) => {
    if (!email) return '••••@••••';
    const parts = email.split('@');
    if (parts.length < 2) return email;
    const name = parts[0];
    const domain = parts[1];
    const maskedName =
      name.length <= 2 ? `${name[0]}*` : `${name.slice(0, 2)}***${name.slice(-1)}`;
    return `${maskedName}@${domain}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Team members list filtering
  const allMembers: ApiTeamMember[] = stats?.teamMembers || [];
  const filteredMembers = allMembers.filter((m) => {
    if (selectedFilter === 'all') return true;
    return String(m.level) === selectedFilter;
  });

  const level1Count = stats?.level1Count ?? allMembers.filter((m) => m.level === 1).length;
  const level2Count = stats?.level2Count ?? allMembers.filter((m) => m.level === 2).length;
  const totalMembersCount = stats?.totalMembers ?? allMembers.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <Header
        title="Refer & Earn"
        showBack={showBack}
        onBack={onBack}
        centerTitle
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching referral dashboard...</Text>
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
            {/* 1. Top Share Card */}
            <View style={styles.shareCardContainer}>
              <LinearGradient
                colors={['#0F766E', '#065F46', '#044E3D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shareCardGradient}
              >
                {/* Decorative Glowing Elements */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />

                {/* Top Badge: 2-Level Commission */}
                <View style={styles.commissionPill}>
                  <Sparkles size={12} color="#FDE047" />
                  <Text style={styles.commissionPillText}>
                    Earn 2% on Direct (Level 1) + 1% on Indirect (Level 2) Deposits
                  </Text>
                </View>

                {/* Referral Code Display & Quick Copy */}
                <View style={styles.codeBlock}>
                  <Text style={styles.codeSubtitle}>YOUR EXCLUSIVE REFERRAL CODE</Text>
                  <View style={styles.codeRow}>
                    <Text
                      style={styles.codeText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {referralCode}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleCopyCode}
                      style={styles.copyCodeBtn}
                    >
                      <Copy size={15} color="#065F46" />
                      <Text style={styles.copyCodeBtnText}>Copy Code</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Referral / Invite Link Display */}
                <View style={styles.linkBlock}>
                  <Text style={styles.codeSubtitle}>OFFICIAL INVITE LINK</Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleOpenLink}
                    style={styles.linkRow}
                  >
                    <Globe size={14} color="#A7F3D0" style={{ marginRight: 6 }} />
                    <Text style={styles.linkText} numberOfLines={1}>
                      {referralLink}
                    </Text>
                    <ExternalLink size={13} color="#FDE047" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>

                {/* Action Buttons: Share Sheet, Copy Link & Open Website */}
                <View style={styles.shareActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleShare}
                    style={styles.shareSheetBtn}
                  >
                    <Share2 size={15} color="#065F46" />
                    <Text style={styles.shareSheetBtnText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleCopyLink}
                    style={styles.copyLinkPillBtn}
                  >
                    <Copy size={14} color="#FFFFFF" />
                    <Text style={styles.copyLinkPillBtnText}>Copy Link</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleOpenLink}
                    style={styles.openWebBtn}
                  >
                    <ExternalLink size={14} color="#065F46" />
                    <Text style={styles.openWebBtnText}>Open Web</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>

            {/* 2. Earnings Summary Grid (3 Cards) */}
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeaderTitle}>Earnings Summary</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveBadgeText}>Live Ledger</Text>
              </View>
            </View>

            <View style={styles.earningsGrid}>
              {/* Total Commission */}
              <View style={[styles.earningsCard, styles.earningsCardPrimary]}>
                <View style={styles.cardIconHeader}>
                  <Wallet size={16} color="#0D9488" />
                  <Text style={styles.earningsCardBadge}>All-Time</Text>
                </View>
                <Text style={styles.earningsCardLabel}>Total Commission</Text>
                <Text
                  style={styles.earningsCardValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  ₹{(stats?.totalCommission || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>

              {/* Today's Commission */}
              <View style={styles.earningsCard}>
                <View style={styles.cardIconHeader}>
                  <ArrowUpRight size={16} color="#10B981" />
                  <Text style={styles.earningsCardBadge}>Today</Text>
                </View>
                <Text style={styles.earningsCardLabel}>{"Today's Earnings"}</Text>
                <Text
                  style={[styles.earningsCardValue, { color: Colors.success }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  ₹{(stats?.todayCommission || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>

              {/* Yesterday's Commission */}
              <View style={styles.earningsCard}>
                <View style={styles.cardIconHeader}>
                  <Calendar size={16} color="#6366F1" />
                  <Text style={styles.earningsCardBadge}>Yesterday</Text>
                </View>
                <Text style={styles.earningsCardLabel}>{"Yesterday's"}</Text>
                <Text
                  style={styles.earningsCardValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  ₹{(stats?.yesterdayCommission || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            {/* 3. Team Analytics Grid (2x2 Cards) */}
            <View style={[styles.sectionTitleRow, { marginTop: Spacing.lg }]}>
              <Text style={styles.sectionHeaderTitle}>Team Analytics</Text>
              <ShieldCheck size={16} color={Colors.primary} />
            </View>

            <View style={styles.analyticsGrid}>
              {/* Card 1: Team Members */}
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsHeader}>
                  <Users size={18} color={Colors.primary} />
                  <Text style={styles.analyticsLabel}>Total Team Members</Text>
                </View>
                <Text style={styles.analyticsNumber}>{totalMembersCount}</Text>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownTag}>Level 1 (Direct):</Text>
                    <Text style={styles.breakdownVal}>{level1Count}</Text>
                  </View>
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownTag}>Level 2 (Indirect):</Text>
                    <Text style={styles.breakdownVal}>{level2Count}</Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Team Deposits */}
              <View style={styles.analyticsCard}>
                <View style={styles.analyticsHeader}>
                  <Wallet size={18} color="#059669" />
                  <Text style={styles.analyticsLabel}>Total Team Deposit</Text>
                </View>
                <Text style={styles.analyticsNumber}>
                  ₹{(stats?.totalTeamDeposit || 0).toLocaleString('en-IN')}
                </Text>
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownTag}>L1 Deposits:</Text>
                    <Text style={styles.breakdownVal}>
                      ₹{(stats?.level1TeamDeposit || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.breakdownDivider} />
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownTag}>L2 Deposits:</Text>
                    <Text style={styles.breakdownVal}>
                      ₹{(stats?.level2TeamDeposit || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 4. Team Members List & Filters */}
            <View style={[styles.sectionTitleRow, { marginTop: Spacing.lg }]}>
              <Text style={styles.sectionHeaderTitle}>Team Members</Text>
              <Text style={styles.memberCountBadge}>{filteredMembers.length} Joined</Text>
            </View>

            {/* Segmented Filter Chips */}
            <View style={styles.filterChipsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {
                    // Fallback
                  }
                  setSelectedFilter('all');
                }}
                style={[
                  styles.filterChip,
                  selectedFilter === 'all' && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === 'all' && styles.filterChipTextActive,
                  ]}
                >
                  All ({totalMembersCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {
                    // Fallback
                  }
                  setSelectedFilter('1');
                }}
                style={[
                  styles.filterChip,
                  selectedFilter === '1' && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === '1' && styles.filterChipTextActive,
                  ]}
                >
                  Level 1 (Direct) ({level1Count})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {
                    // Fallback
                  }
                  setSelectedFilter('2');
                }}
                style={[
                  styles.filterChip,
                  selectedFilter === '2' && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilter === '2' && styles.filterChipTextActive,
                  ]}
                >
                  Level 2 (Indirect) ({level2Count})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Members List Items */}
            <View style={styles.membersListContainer}>
              {filteredMembers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Users size={32} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>No Members Found</Text>
                  <Text style={styles.emptySubtitle}>
                    {selectedFilter === 'all'
                      ? 'Invite your friends to start earning 2-level commissions on every deposit!'
                      : `No members currently registered under Level ${selectedFilter}. Share your referral link to expand your network.`}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleShare}
                    style={styles.emptyInviteBtn}
                  >
                    <Gift size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyInviteBtnText}>Invite Friends Now</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredMembers.map((member) => (
                  <View key={member.id} style={styles.memberCard}>
                    <View style={styles.memberLeft}>
                      <View
                        style={[
                          styles.memberAvatar,
                          member.level === 1
                            ? styles.memberAvatarL1
                            : styles.memberAvatarL2,
                        ]}
                      >
                        <Text
                          style={[
                            styles.memberAvatarInitial,
                            member.level === 1
                              ? styles.memberAvatarInitialL1
                              : styles.memberAvatarInitialL2,
                          ]}
                        >
                          {(member.name || 'M').charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.memberDetails}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.name || 'DreamPay Member'}
                          </Text>
                          <View
                            style={[
                              styles.levelBadge,
                              member.level === 1
                                ? styles.levelBadgeL1
                                : styles.levelBadgeL2,
                            ]}
                          >
                            <Text
                              style={[
                                styles.levelBadgeText,
                                member.level === 1
                                  ? styles.levelBadgeTextL1
                                  : styles.levelBadgeTextL2,
                              ]}
                            >
                              Level {member.level}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.memberContact} numberOfLines={1}>
                          {maskPhone(member.phone)} • {maskEmail(member.email)}
                        </Text>

                        {member.registrationDate && (
                          <Text style={styles.memberDate}>
                            Joined: {formatDate(member.registrationDate)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.memberRight}>
                      <Text style={styles.depositLabel}>Total Deposit</Text>
                      <Text style={styles.depositAmount} numberOfLines={1}>
                        ₹{(Number(member.totalDeposit) || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastContainer,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.toastPill}>
            <CheckCircle2 size={16} color="#34D399" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </Animated.View>
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
    paddingTop: Spacing.xs,
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
  shareCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#047857',
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: Spacing.md,
  },
  shareCardGradient: {
    padding: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(253, 224, 71, 0.12)',
  },
  commissionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 12,
  },
  commissionPillText: {
    color: '#FEF08A',
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  codeBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    padding: 12,
    marginBottom: 12,
  },
  codeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1.5,
    flex: 1,
  },
  copyCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  copyCodeBtnText: {
    color: '#065F46',
    fontWeight: '700',
    fontSize: 12,
  },
  linkBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    padding: 10,
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  linkText: {
    color: '#E0E7FF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  shareActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareSheetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FEF08A',
    paddingVertical: 11,
    borderRadius: BorderRadius.full,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shareSheetBtnText: {
    color: '#065F46',
    fontWeight: '800',
    fontSize: 12,
  },
  copyLinkPillBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 11,
    borderRadius: BorderRadius.full,
  },
  copyLinkPillBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  openWebBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    borderRadius: BorderRadius.full,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  openWebBtnText: {
    color: '#065F46',
    fontWeight: '800',
    fontSize: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sectionHeaderTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  liveBadgeText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  earningsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  earningsCardPrimary: {
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
  },
  cardIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  earningsCardBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  earningsCardLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  earningsCardValue: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  analyticsGrid: {
    gap: 10,
    marginTop: 4,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  analyticsLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  analyticsNumber: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  breakdownItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  breakdownDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  breakdownTag: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  breakdownVal: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  memberCountBadge: {
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 10,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  filterChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  membersListContainer: {
    marginBottom: Spacing.xl,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  memberAvatarL1: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  memberAvatarL2: {
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  memberAvatarInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  memberAvatarInitialL1: {
    color: '#059669',
  },
  memberAvatarInitialL2: {
    color: '#4F46E5',
  },
  memberDetails: {
    flex: 1,
    minWidth: 0,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  memberName: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    flexShrink: 1,
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  levelBadgeL1: {
    backgroundColor: '#D1FAE5',
  },
  levelBadgeL2: {
    backgroundColor: '#E0E7FF',
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  levelBadgeTextL1: {
    color: '#059669',
  },
  levelBadgeTextL2: {
    color: '#4F46E5',
  },
  memberContact: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  memberDate: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  memberRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  depositLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  depositAmount: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
    maxWidth: 280,
  },
  emptyInviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#065F46',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyInviteBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 1000,
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
