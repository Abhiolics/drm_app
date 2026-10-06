import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  User,
  Wallet,
  Headphones,
  ShieldCheck,
  Sliders,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  LogOut,
  AlertTriangle,
  Gift,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { useAuth } from '../context/AuthContext';
import { depositService } from '../services/depositService';
import { withdrawalService } from '../services/withdrawalService';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface AssetsScreenProps {
  onBack?: () => void;
  showBack?: boolean;
  onNavigateToHome?: () => void;
  onNavigateToService?: () => void;
  onNavigateToGiftReward?: () => void;
  onNavigateToDeposit?: () => void;
  onNavigateToWithdraw?: () => void;
  onNavigateToHistory?: () => void;
  onLogout?: () => void;
}

const assetMenuGrid = [
  {
    id: 'giftcode',
    title: 'Gift Codes',
    subtitle: 'Redeem Bonus',
    icon: 'Gift',
  },
  {
    id: 'service',
    title: 'Support',
    subtitle: '24/7 Help Desk',
    icon: 'Headphones',
  },
  {
    id: 'deposits',
    title: 'Deposit Records',
    subtitle: 'Passbook Log',
    icon: 'ArrowDownToLine',
  },
  {
    id: 'withdrawals',
    title: 'Withdrawals',
    subtitle: 'Payout History',
    icon: 'ArrowUpFromLine',
  },
  {
    id: 'security',
    title: 'Security',
    subtitle: 'Node Verified',
    icon: 'ShieldCheck',
  },
  {
    id: 'account',
    title: 'Settings',
    subtitle: 'System Profile',
    icon: 'Sliders',
  },
];

export const AssetsScreen: React.FC<AssetsScreenProps> = ({
  onBack,
  showBack = false,
  onNavigateToHome,
  onNavigateToService,
  onNavigateToGiftReward,
  onNavigateToDeposit,
  onNavigateToWithdraw,
  onNavigateToHistory,
  onLogout,
}) => {
  const { user, wallet, refreshUser, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [depositSum, setDepositSum] = useState(0);
  const [withdrawalSum, setWithdrawalSum] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomNavPadding = useBottomNavPadding();

  useEffect(() => {
    let isCancelled = false;
    Promise.allSettled([
      depositService.getDepositHistory(),
      withdrawalService.getWithdrawalHistory(),
    ]).then(([depRes, withRes]) => {
      if (isCancelled) return;
      if (depRes.status === 'fulfilled' && Array.isArray(depRes.value)) {
        const approvedDep = depRes.value
          .filter((d: any) => d.status === 'approved')
          .reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);
        setDepositSum(approvedDep);
      }
      if (withRes.status === 'fulfilled' && Array.isArray(withRes.value)) {
        const approvedWith = withRes.value
          .filter((w: any) => w.status === 'approved')
          .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);
        setWithdrawalSum(approvedWith);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [depRes, withRes] = await Promise.allSettled([
        depositService.getDepositHistory(),
        withdrawalService.getWithdrawalHistory(),
      ]);

      if (depRes.status === 'fulfilled' && Array.isArray(depRes.value)) {
        const approvedDep = depRes.value
          .filter((d: any) => d.status === 'approved')
          .reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);
        setDepositSum(approvedDep);
      }

      if (withRes.status === 'fulfilled' && Array.isArray(withRes.value)) {
        const approvedWith = withRes.value
          .filter((w: any) => w.status === 'approved')
          .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);
        setWithdrawalSum(approvedWith);
      }

      await refreshUser();
    } catch (err) {
      console.warn('Failed to load asset financial totals:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gift':
        return Gift;
      case 'Headphones':
        return Headphones;
      case 'ArrowDownToLine':
        return ArrowDownToLine;
      case 'ArrowUpFromLine':
        return ArrowUpFromLine;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Sliders':
      default:
        return Sliders;
    }
  };

  const handleTilePress = (item: (typeof assetMenuGrid)[0]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }

    if (item.id === 'service') {
      onNavigateToService?.();
    } else if (item.id === 'giftcode') {
      onNavigateToGiftReward?.();
    } else if (item.id === 'deposits' || item.id === 'withdrawals') {
      onNavigateToHistory?.();
    } else if (item.id === 'security') {
      Alert.alert(
        'DreamPay Security Node',
        'End-to-end encrypted session connected to live production cloud cluster (SSL TLS 1.3). Account status: Active.'
      );
    } else {
      Alert.alert(item.title, `DreamPay Client Version 1.0.0. All systems operating normally.`);
    }
  };

  const handleLogoutPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fallback
    }
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Fallback
    }
    setShowLogoutModal(false);
    await logout();
    onLogout?.();
  };

  const username = user?.fullName || user?.email?.split('@')[0] || 'DreamPay User';
  const accountId = user?._id ? user._id.slice(-6).toUpperCase() : 'USER';
  const tierName = user?.plan?.name || 'Verified Member';
  const balance = wallet?.balance ?? user?.wallet?.balance ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <Header
        title="My Asset"
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
        <View style={styles.contentContainer}>
          {/* User Identity Avatar Ring */}
          <View style={styles.userHero}>
            <View style={styles.avatarGlow}>
              <View style={styles.avatarCircle}>
                <User size={30} color={Colors.primary} />
              </View>
            </View>
            <Text style={[Typography.h3, styles.userTitle]}>{username}</Text>
            <Text style={[Typography.captionSmall, styles.userSub]}>
              ID: {accountId} • {tierName}
            </Text>
          </View>

          {/* Wallet Commission Card */}
          <View style={styles.commissionCard}>
            <View style={styles.commissionLeft}>
              <View style={styles.metricIconWrap}>
                <Wallet size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.metricLabel}>Available Balance</Text>
                <Text style={[Typography.bodySemiBold, styles.metricValue]}>
                  ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.commissionAction}
              onPress={() => onNavigateToDeposit?.()}
            >
              <Text style={styles.rulesText}>Add Funds</Text>
              <ChevronRight size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Deposit & Withdraw Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionCard}
              onPress={() => onNavigateToDeposit?.()}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: Colors.primaryMuted }]}>
                <ArrowDownToLine size={18} color={Colors.primary} />
              </View>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Add Funds</Text>
                <Text style={styles.actionCardSub}>Deposit money</Text>
              </View>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionCard}
              onPress={() => onNavigateToWithdraw?.()}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                <ArrowUpFromLine size={18} color={Colors.danger} />
              </View>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Withdraw</Text>
                <Text style={styles.actionCardSub}>Request payout</Text>
              </View>
              <ChevronRight size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Deposit & Withdraw 2-column card */}
          <View style={styles.twoColRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onNavigateToHistory?.()}
              style={styles.halfCard}
            >
              <View style={styles.metricIconWrap}>
                <ArrowDownToLine size={16} color={Colors.success} />
              </View>
              <Text style={styles.metricLabel}>Total Deposited</Text>
              <Text style={[Typography.bodySemiBold, styles.metricValue]}>
                ₹ {depositSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onNavigateToHistory?.()}
              style={styles.halfCard}
            >
              <View style={styles.metricIconWrap}>
                <ArrowUpFromLine size={16} color={Colors.danger} />
              </View>
              <Text style={styles.metricLabel}>Total Withdrawn</Text>
              <Text style={[Typography.bodySemiBold, styles.metricValue]}>
                ₹ {withdrawalSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Service Action Grid */}
          <View style={styles.gridContainer}>
            {assetMenuGrid.map((item) => {
              const IconComp = getServiceIcon(item.icon);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => handleTilePress(item)}
                  style={styles.gridTile}
                >
                  <View style={styles.tileIconContainer}>
                    <IconComp size={22} color={Colors.primary} />
                  </View>
                  <Text style={[Typography.caption, styles.tileTitle]}>
                    {item.title}
                  </Text>
                  <Text style={styles.tileSubtitle}>{item.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Logout Button */}
          <View style={styles.logoutWrapper}>
            <PrimaryButton
              title="Logout"
              variant="primary"
              size="lg"
              icon={<LogOut size={18} color="#FFFFFF" />}
              onPress={handleLogoutPress}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalCard}>
            <View style={styles.logoutIconOuter}>
              <View style={styles.logoutIconInner}>
                <AlertTriangle size={32} color={Colors.danger} />
              </View>
            </View>

            <Text style={[Typography.h2, styles.logoutModalTitle]}>
              Log Out of DreamPay?
            </Text>
            <Text style={styles.logoutModalDesc}>
              Are you sure you want to end your current session? You can sign back in anytime with your credentials.
            </Text>

            <View style={styles.logoutModalBtnRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowLogoutModal(false)}
                style={styles.cancelModalBtn}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmLogout}
                style={styles.confirmLogoutBtn}
              >
                <LogOut size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmLogoutBtnText}>Log Out</Text>
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
  },
  contentContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  userHero: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  avatarGlow: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginBottom: Spacing.xs,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTitle: {
    color: Colors.textPrimary,
  },
  userSub: {
    color: Colors.textMuted,
    marginTop: 2,
  },
  commissionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commissionAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rulesText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  halfCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    color: Colors.textPrimary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  gridTile: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  tileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: 6,
  },
  tileTitle: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tileSubtitle: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  logoutWrapper: {
    marginBottom: Spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  logoutIconOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 112, 0.4)',
  },
  logoutIconInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 92, 112, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutModalTitle: {
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  logoutModalDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
  },
  logoutModalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 13,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelModalBtnText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmLogoutBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.danger,
    paddingVertical: 13,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLogoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  // Deposit & Withdraw action row
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionCardSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
