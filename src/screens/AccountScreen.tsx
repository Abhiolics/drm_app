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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  X,
  CreditCard,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { UpiAccount } from '../types';
import { useAuth } from '../context/AuthContext';
import { withdrawalService } from '../services/withdrawalService';

interface AccountScreenProps {
  onBack?: () => void;
}

const STORAGE_KEY = '@dreampay_user_accounts';

export const AccountScreen: React.FC<AccountScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { user, wallet, refreshUser } = useAuth();
  const [accounts, setAccounts] = useState<UpiAccount[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);

  // Modal State for Add / Edit
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UpiAccount | null>(null);
  const [holderName, setHolderName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Delete Confirmation State
  const [accountToDelete, setAccountToDelete] = useState<UpiAccount | null>(null);

  // Quick Withdraw Modal State
  const [withdrawAccount, setWithdrawAccount] = useState<UpiAccount | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isCancelled) return;
      if (stored) {
        setAccounts(JSON.parse(stored));
      } else if (user?.fullName) {
        const defaultAccount: UpiAccount = {
          id: `acc-${Date.now()}`,
          holderName: user.fullName,
          upiId: `${user.phoneNumber || user.email?.split('@')[0]}@upi`,
          isPrimary: true,
        };
        setAccounts([defaultAccount]);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([defaultAccount]));
      }
      setIsLoadingStorage(false);
    }).catch(() => {
      if (!isCancelled) setIsLoadingStorage(false);
    });
    return () => {
      isCancelled = true;
    };
  }, [user]);

  const saveAccountsToStorage = async (newList: UpiAccount[]) => {
    setAccounts(newList);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('Failed to save accounts to storage:', e);
    }
  };

  const handleOpenAdd = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    setEditingAccount(null);
    setHolderName(user?.fullName || '');
    setUpiId('');
    setValidationError(null);
    setIsModalVisible(true);
  };

  const handleOpenEdit = (account: UpiAccount) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    setEditingAccount(account);
    setHolderName(account.holderName);
    setUpiId(account.upiId);
    setValidationError(null);
    setIsModalVisible(true);
  };

  const handleSaveAccount = () => {
    const trimmedName = holderName.trim();
    const trimmedUpi = upiId.trim();

    if (!trimmedName) {
      setValidationError('Please enter an account holder name.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback
      }
      return;
    }

    if (!trimmedUpi || !trimmedUpi.includes('@') || trimmedUpi.length < 5) {
      setValidationError('Please enter a valid UPI ID (e.g. name@upi).');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback
      }
      return;
    }

    setValidationError(null);

    let updatedList: UpiAccount[];
    if (editingAccount) {
      updatedList = accounts.map((acc) =>
        acc.id === editingAccount.id
          ? { ...acc, holderName: trimmedName, upiId: trimmedUpi }
          : acc
      );
    } else {
      const newAcc: UpiAccount = {
        id: `acc-${Date.now()}`,
        holderName: trimmedName,
        upiId: trimmedUpi,
        isPrimary: accounts.length === 0,
      };
      updatedList = [...accounts, newAcc];
    }

    saveAccountsToStorage(updatedList);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }

    setIsModalVisible(false);
    setEditingAccount(null);
  };

  const handleConfirmDelete = () => {
    if (!accountToDelete) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }

    const updated = accounts.filter((acc) => acc.id !== accountToDelete.id);
    saveAccountsToStorage(updated);
    setAccountToDelete(null);
  };

  const handleOpenWithdraw = (acc: UpiAccount) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    setWithdrawAccount(acc);
    setWithdrawAmount('');
    setWithdrawError(null);
  };

  const handleSubmitWithdrawal = async () => {
    if (!withdrawAccount) return;
    const num = parseFloat(withdrawAmount);
    const balance = wallet?.balance ?? user?.wallet?.balance ?? 0;

    if (isNaN(num) || num <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount.');
      return;
    }

    if (num > balance) {
      setWithdrawError(`Insufficient wallet balance (Available: ₹${balance.toFixed(2)}).`);
      return;
    }

    try {
      setIsWithdrawing(true);
      setWithdrawError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const res = await withdrawalService.submitWithdrawal(num, {
        accountHolderName: withdrawAccount.holderName,
        upiId: withdrawAccount.upiId,
      });

      if (res?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Withdrawal Initiated',
          `Your withdrawal of ₹${num.toFixed(2)} has been queued. Funds are debited immediately and settled to ${withdrawAccount.upiId}.`
        );
        await refreshUser();
        setWithdrawAccount(null);
      } else {
        setWithdrawError(res?.message || 'Withdrawal request failed.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Withdrawal request failed.';
      setWithdrawError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const currentBalance = wallet?.balance ?? user?.wallet?.balance ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

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
          <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Account Settings</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      {/* Accounts List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Balance Snapshot Card */}
        <View style={styles.balanceSnapshotCard}>
          <Text style={styles.balanceSnapshotLabel}>Settlement Wallet Balance</Text>
          <Text style={styles.balanceSnapshotAmount}>
            ₹ {currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <Text style={styles.sectionHeaderTitle}>Linked UPI Accounts</Text>

        {isLoadingStorage ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 20 }} />
        ) : accounts.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <CreditCard size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Account Added</Text>
            <Text style={styles.emptySubtitle}>
              {"You haven't linked any UPI accounts yet. Tap the button below to add your account for instant payouts and rewards."}
            </Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              {/* Top row: Label + Action Icons */}
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardLabel}>Account Holder</Text>

                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleOpenEdit(account)}
                    style={styles.actionBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Pencil size={18} color="#2ECC71" strokeWidth={2.2} />
                  </TouchableOpacity>

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
                    <Trash2 size={18} color="#FF5C70" strokeWidth={2.2} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Account Holder Name */}
              <Text style={styles.holderNameText}>{account.holderName}</Text>

              {/* UPI ID Section */}
              <Text style={[styles.cardLabel, { marginTop: 12 }]}>UPI ID</Text>
              <Text style={styles.upiIdText}>{account.upiId}</Text>

              {/* Quick Withdraw Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleOpenWithdraw(account)}
                style={styles.quickWithdrawBtn}
              >
                <ArrowUpRight size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.quickWithdrawBtnText}>Withdraw to this Account</Text>
              </TouchableOpacity>
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
          <Text style={styles.addAccountBtnText}>Add New Account</Text>
        </TouchableOpacity>
      </View>

      {/* Add / Edit Account Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAccount ? 'Edit Account' : 'Add Account'}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Enter your account holder details and verified UPI ID for settlements.
            </Text>

            {/* Input 1: Holder Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={holderName}
                  onChangeText={(val) => {
                    setHolderName(val);
                    setValidationError(null);
                  }}
                  placeholder="e.g. Amit Verma"
                  placeholderTextColor="#5E5A6E"
                />
              </View>
            </View>

            {/* Input 2: UPI ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>UPI ID</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={upiId}
                  onChangeText={(val) => {
                    setUpiId(val.toLowerCase().trim());
                    setValidationError(null);
                  }}
                  placeholder="e.g. amit@upi"
                  placeholderTextColor="#5E5A6E"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
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
                onPress={() => setIsModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveAccount}
                style={styles.modalSaveBtn}
              >
                <Text style={styles.modalSaveText}>
                  {editingAccount ? 'Save Changes' : 'Add Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={!!withdrawAccount}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setWithdrawAccount(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw Funds</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setWithdrawAccount(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Funds will be transferred directly to {withdrawAccount?.holderName} ({withdrawAccount?.upiId}).
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  value={withdrawAmount}
                  onChangeText={(val) => {
                    setWithdrawAmount(val);
                    setWithdrawError(null);
                  }}
                  placeholder="e.g. 500"
                  placeholderTextColor="#5E5A6E"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {withdrawError && (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color="#FF5C70" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{withdrawError}</Text>
              </View>
            )}

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setWithdrawAccount(null)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isWithdrawing}
                onPress={handleSubmitWithdrawal}
                style={[styles.modalSaveBtn, isWithdrawing && { opacity: 0.6 }]}
              >
                {isWithdrawing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Confirm Withdraw</Text>
                )}
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
          <View style={[styles.modalContainer, { maxWidth: 360 }]}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={[styles.modalSubtitle, { marginTop: 8 }]}>
              Are you sure you want to remove {accountToDelete?.holderName} ({accountToDelete?.upiId})?
            </Text>

            <View style={[styles.modalActionsRow, { marginTop: 24 }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setAccountToDelete(null)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmDelete}
                style={[styles.modalSaveBtn, { backgroundColor: Colors.danger }]}
              >
                <Text style={styles.modalSaveText}>Delete</Text>
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
    backgroundColor: '#09080D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  balanceSnapshotCard: {
    backgroundColor: '#151722',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  balanceSnapshotLabel: {
    color: '#8E92A4',
    fontSize: 12,
    fontWeight: '500',
  },
  balanceSnapshotAmount: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionHeaderTitle: {
    color: '#8E92A4',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  accountCard: {
    backgroundColor: '#151722',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#8E92A4',
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  actionBtn: {
    padding: 4,
  },
  holderNameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  upiIdText: {
    color: '#2ECC71',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  quickWithdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 92, 252, 0.15)',
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  quickWithdrawBtnText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#151722',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#8E92A4',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#09080D',
  },
  addAccountBtn: {
    backgroundColor: '#E5A93C',
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#E5A93C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  addAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#161522',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    color: '#8E92A4',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#8E92A4',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputBox: {
    backgroundColor: '#1C1B2A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 15,
    padding: 0,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 92, 112, 0.12)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 112, 0.3)',
  },
  errorText: {
    color: '#FF5C70',
    fontSize: 12,
    fontWeight: '500',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5A93C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
