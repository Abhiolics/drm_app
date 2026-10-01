import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  User,
  Wallet,
  Sparkles,
  Headphones,
  Mail,
  ShieldCheck,
  Sliders,
  Percent,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  LogOut,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Header } from '../components/Header';
import { PrimaryButton } from '../components/PrimaryButton';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { mockUserProfile, mockAssetServiceGrid } from '../data/mockData';

interface AssetsScreenProps {
  onBack?: () => void;
  showBack?: boolean;
  onNavigateToHome?: () => void;
  onNavigateToService?: () => void;
  onLogout?: () => void;
}

export const AssetsScreen: React.FC<AssetsScreenProps> = ({
  onBack,
  showBack = false,
  onNavigateToHome,
  onNavigateToService,
  onLogout,
}) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const bottomNavPadding = useBottomNavPadding();

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Wallet':
        return Wallet;
      case 'Sparkles':
        return Sparkles;
      case 'Headphones':
        return Headphones;
      case 'Mail':
        return Mail;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Sliders':
      default:
        return Sliders;
    }
  };

  const handleTilePress = (title: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    Alert.alert(title, `Opening ${title} management center.`);
  };

  const handleLogoutPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fallback
    }
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Fallback
    }
    setShowLogoutModal(false);
    onLogout?.();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

      <Header
        title="My Asset"
        showBack={showBack}
        onBack={onBack}
        centerTitle
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomNavPadding }]}
      >
        <View style={styles.contentContainer}>
          {/* User Identity Avatar Ring */}
        <View style={styles.userHero}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatarCircle}>
              <User size={30} color={Colors.primary} />
            </View>
          </View>
          <Text style={[Typography.h3, styles.userTitle]}>
            {mockUserProfile.username}
          </Text>
          <Text style={[Typography.captionSmall, styles.userSub]}>
            Account ID: {mockUserProfile.userId} • Verified Tier 2
          </Text>
        </View>

        {/* Commission Card matching reference */}
        <View style={styles.commissionCard}>
          <View style={styles.commissionLeft}>
            <View style={styles.metricIconWrap}>
              <Percent size={18} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.metricLabel}>Commission</Text>
              <Text style={[Typography.bodySemiBold, styles.metricValue]}>
                ₹ 0.00
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.commissionAction}
            onPress={() => handleTilePress('Commission Rules')}
          >
            <Text style={styles.rulesText}>Rules</Text>
            <ChevronRight size={14} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Deposit & Withdraw 2-column card matching reference */}
        <View style={styles.twoColRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => handleTilePress('Deposit Ledger')}
            style={styles.halfCard}
          >
            <View style={styles.metricIconWrap}>
              <ArrowDownToLine size={16} color={Colors.success} />
            </View>
            <Text style={styles.metricLabel}>Deposit</Text>
            <Text style={[Typography.bodySemiBold, styles.metricValue]}>
              ₹ 0.00
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => handleTilePress('Withdrawal Ledger')}
            style={styles.halfCard}
          >
            <View style={styles.metricIconWrap}>
              <ArrowUpFromLine size={16} color={Colors.danger} />
            </View>
            <Text style={styles.metricLabel}>Withdraw</Text>
            <Text style={[Typography.bodySemiBold, styles.metricValue]}>
              ₹ 0.00
            </Text>
          </TouchableOpacity>
        </View>

        {/* Service Action Grid (3x2 tiles) matching reference */}
        <View style={styles.gridContainer}>
          {mockAssetServiceGrid.map((item) => {
            const IconComp = getServiceIcon(item.icon);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() => {
                  if (item.id === 'service') {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {
                      // Fallback
                    }
                    onNavigateToService?.();
                  } else {
                    handleTilePress(item.title);
                  }
                }}
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

        {/* Prominent Logout Button matching reference */}
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

      {/* Logout Confirmation Pop-up Modal */}
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
              Log Out of PayApp?
            </Text>
            <Text style={styles.logoutModalDesc}>
              Are you sure you want to end your session? You will need to verify your email via OTP to sign back in.
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
    backgroundColor: 'rgba(124, 92, 252, 0.12)',
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
    color: Colors.textSecondary,
    fontSize: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 112, 0.35)',
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
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
});
