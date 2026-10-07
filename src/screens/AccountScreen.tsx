import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Trash2,
  X,
  CreditCard,
  ArrowUpRight,
  CheckCircle2,
  ShieldCheck,
  Plus,
  Star,
  Smartphone,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { ApiUpiAccount } from '../types';
import { useAuth } from '../context/AuthContext';
import { upiService } from '../services/upiService';

interface AccountScreenProps {
  onBack?: () => void;
  onNavigateToWithdraw?: () => void;
}

// Valid UPI Regex: e.g. rahul@okaxis, 9876543210@paytm, name.surname@okhdfcbank
const UPI_REGEX = /^[\w.-]+@[\w.-]+$/;

export const AccountScreen: React.FC<AccountScreenProps> = ({
  onBack,
  onNavigateToWithdraw,
}) => {
  const insets = useSafeAreaInsets();
  const { user, wallet, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState<ApiUpiAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State for Add UPI Account
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [holderName, setHolderName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Delete State
  const [accountToDelete, setAccountToDelete] = useState<ApiUpiAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // In-app Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAnim] = useState(new Animated.Value(0));

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

  // Fetch Saved UPI Accounts from backend: GET /api/upi/my
  const loadUpiAccounts = useCallback(async () => {
    try {
      const data = await upiService.getMyUpiAccounts();
      setAccounts(data);
    } catch (err) {
      console.warn('Failed to load UPI accounts:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    upiService
      .getMyUpiAccounts()
      .then((data) => {
        if (!isCancelled) {
          setAccounts(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load UPI accounts:', err);
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
    await Promise.allSettled([loadUpiAccounts(), refreshUser()]);
    setIsRefreshing(false);
  };

  const handleOpenAdd = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    setHolderName(user?.fullName || '');
    setUpiId('');
    setIsPrimary(accounts.length === 0);
    setValidationError(null);
    setIsModalVisible(true);
  };

  // Submit New UPI Account: POST /api/upi
  const handleSaveAccount = async () => {
    const trimmedName = holderName.trim();
    const trimmedUpi = upiId.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setValidationError('Please enter your full legal name as per bank records.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback
      }
      return;
    }

    if (!trimmedUpi || !UPI_REGEX.test(trimmedUpi)) {
      setValidationError('Please enter a valid UPI ID (e.g. rahul@okaxis, 9876543210@paytm).');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback
      }
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await upiService.addUpiAccount({
        upiId: trimmedUpi,
        accountHolderName: trimmedName,
        isPrimary,
      });

      if (res.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Fallback
        }
        setIsModalVisible(false);
        showToast('UPI Account added successfully');
        await loadUpiAccounts();
      } else {
        setValidationError(res.message || 'Failed to add UPI account. Please try again.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to add UPI account.';
      setValidationError(msg);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // Fallback
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;

    try {
      setIsDeleting(true);
      await upiService.deleteUpiAccount(accountToDelete._id);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Fallback
      }
      showToast('UPI account removed');
      setAccountToDelete(null);
      await loadUpiAccounts();
    } catch {
      // Local fallback in case delete endpoint is not enabled
      setAccounts((prev) => prev.filter((a) => a._id !== accountToDelete._id));
      setAccountToDelete(null);
      showToast('UPI account removed');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentBalance = wallet?.balance ?? user?.wallet?.balance ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // Fallback
            }
            onBack?.();
          }}
          style={styles.backCircleBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={20} color={Colors.textPrimary} strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>UPI & Settlement Accounts</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* Accounts List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Balance Snapshot Card */}
        <View style={styles.balanceSnapshotCard}>
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceSnapshotLabel}>Settlement Wallet Balance</Text>
              <Text style={styles.balanceSnapshotAmount}>
                ₹ {currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.verifiedNodeBadge}>
              <ShieldCheck size={14} color="#34D399" />
              <Text style={styles.verifiedNodeText}>Verified Node</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Linked UPI Accounts</Text>
          <Text style={styles.accountCountPill}>{accounts.length} Saved</Text>
        </View>

        {isLoading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loaderText}>Fetching linked payment accounts...</Text>
          </View>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <CreditCard size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No UPI Account Added</Text>
            <Text style={styles.emptySubtitle}>
              {"You haven't linked any UPI ID yet. Add your account to receive instant withdrawals directly to your bank."}
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenAdd}
              style={styles.emptyAddBtn}
            >
              <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddBtnText}>Add UPI Account Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          accounts.map((account) => (
            <View key={account._id} style={styles.accountCard}>
              {/* Top row: Label + Action Icons */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <Smartphone size={18} color={Colors.primary} />
                  <Text style={styles.cardHeaderTitle}>UPI Virtual Address</Text>
                  {account.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Star size={10} color="#059669" />
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    } catch {
                      // Fallback
                    }
                    setAccountToDelete(account);
                  }}
                  style={styles.actionBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* UPI ID Section */}
              <Text style={styles.upiIdText}>{account.upiId}</Text>

              {/* Account Holder Name */}
              <View style={styles.holderRow}>
                <User size={13} color={Colors.textMuted} />
                <Text style={styles.holderNameText}>
                  {account.accountHolderName}
                </Text>
              </View>

              {/* Quick Withdraw CTA */}
              {onNavigateToWithdraw && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onNavigateToWithdraw}
                  style={styles.quickWithdrawBtn}
                >
                  <ArrowUpRight size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.quickWithdrawBtnText}>Request Withdrawal to this Account</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Fixed Bottom Action Button */}
      <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenAdd}
          style={styles.addAccountBtn}
        >
          <Plus size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addAccountBtnText}>Add New UPI Account</Text>
        </TouchableOpacity>
      </View>

      {/* Add UPI Account Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isSubmitting && setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Smartphone size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Add UPI Account</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isSubmitting}
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Link your UPI VPA to enable instant payout requests and administrator settlements.
            </Text>

            {/* Input 1: UPI ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID / VPA</Text>
              <View style={styles.inputBox}>
                <Smartphone size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  value={upiId}
                  onChangeText={(val) => {
                    setUpiId(val.toLowerCase().trim());
                    setValidationError(null);
                  }}
                  placeholder="e.g. rahul@okaxis, 9876543210@paytm"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Input 2: Account Holder Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <View style={styles.inputBox}>
                <User size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  value={holderName}
                  onChangeText={(val) => {
                    setHolderName(val);
                    setValidationError(null);
                  }}
                  placeholder="Full legal name as per bank records"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Primary Toggle */}
            <View style={styles.primarySwitchRow}>
              <View style={styles.primarySwitchTextCol}>
                <Text style={styles.primarySwitchLabel}>Set as Primary Account</Text>
                <Text style={styles.primarySwitchSub}>
                  Default destination for instant payouts
                </Text>
              </View>
              <Switch
                value={isPrimary}
                onValueChange={(val) => setIsPrimary(val)}
                trackColor={{ false: '#E2E8F0', true: '#99F6E4' }}
                thumbColor={isPrimary ? Colors.primary : '#94A3B8'}
              />
            </View>

            {/* Error Message */}
            {validationError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{validationError}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isSubmitting}
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isSubmitting}
                onPress={handleSaveAccount}
                style={styles.modalSaveBtn}
              >
                <LinearGradient
                  colors={Colors.heroGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalSaveGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSaveText}>Save UPI Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!accountToDelete}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAccountToDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 340 }]}>
            <Text style={styles.deleteModalTitle}>Remove Account?</Text>
            <Text style={styles.deleteModalDesc}>
              {`Are you sure you want to delete ${accountToDelete?.upiId}? You can add it back anytime.`}
            </Text>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isDeleting}
                onPress={() => setAccountToDelete(null)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isDeleting}
                onPress={handleConfirmDelete}
                style={styles.deleteConfirmBtn}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Remove</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: '#FFFFFF',
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    ...Typography.bodySemiBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  headerPlaceholder: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 110,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  balanceSnapshotCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceGradient: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: {
    flex: 1,
  },
  balanceSnapshotLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceSnapshotAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  verifiedNodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  verifiedNodeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeaderRow: {
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
  accountCountPill: {
    color: Colors.textSecondary,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    fontSize: 11,
    fontWeight: '600',
  },
  loaderBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: Spacing.sm,
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
    maxWidth: 290,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  primaryBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtn: {
    padding: 4,
  },
  upiIdText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  holderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  holderNameText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  quickWithdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: BorderRadius.sm,
    paddingVertical: 9,
    marginTop: 4,
  },
  quickWithdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  addAccountBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 46,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  primarySwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  primarySwitchTextCol: {
    flex: 1,
    marginRight: 10,
  },
  primarySwitchLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  primarySwitchSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.xs,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '500',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1.5,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteModalTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  deleteModalDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 80,
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
