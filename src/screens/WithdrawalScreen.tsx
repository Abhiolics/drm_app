import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowUpFromLine,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  Star,
  Check,
  Receipt,
  User,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/Header';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { withdrawalService, WithdrawalRecord } from '../services/withdrawalService';
import { upiService } from '../services/upiService';
import { ApiUpiAccount } from '../types';
import { useAuth } from '../context/AuthContext';

interface WithdrawalScreenProps {
  onBack?: () => void;
  onNavigateToAddAccount?: () => void;
  onNavigateToHistory?: () => void;
}

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];
const MIN_WITHDRAWAL = 100;
const UPI_REGEX = /^[\w.-]+@[\w.-]+$/;

type ActiveTab = 'withdraw' | 'history';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'In Review', color: Colors.warning, bg: Colors.warningBg, icon: Clock },
  approved: { label: 'Approved', color: Colors.success, bg: Colors.successBg, icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: Colors.danger, bg: Colors.dangerBg, icon: XCircle },
};

export const WithdrawalScreen: React.FC<WithdrawalScreenProps> = ({
  onBack,
  onNavigateToAddAccount,
  onNavigateToHistory,
}) => {
  const { wallet, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('withdraw');
  const [amount, setAmount] = useState('');
  const [upiAccounts, setUpiAccounts] = useState<ApiUpiAccount[]>([]);
  const [selectedUpi, setSelectedUpi] = useState<ApiUpiAccount | null>(null);
  const [isLoadingUpi, setIsLoadingUpi] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState<number>(0);

  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // In-app Toast animation
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

  const balance = wallet?.balance ?? 0;
  const pendingSettlement = wallet?.pendingBalance ?? 0;

  // 1. Fetch saved UPI accounts on mount
  const loadUpiAccounts = useCallback(async () => {
    try {
      const data = await upiService.getMyUpiAccounts();
      setUpiAccounts(data);
      if (data.length > 0) {
        // Auto-select primary or first
        setSelectedUpi((prev) => {
          if (prev && data.some((a) => a._id === prev._id)) {
            return data.find((a) => a._id === prev._id) || prev;
          }
          return data.find((a) => a.isPrimary) || data[0];
        });
      } else {
        setSelectedUpi(null);
      }
    } catch (err) {
      console.warn('Failed to fetch UPI accounts for withdrawal:', err);
    } finally {
      setIsLoadingUpi(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    upiService
      .getMyUpiAccounts()
      .then((data) => {
        if (!isCancelled) {
          setUpiAccounts(data);
          if (data.length > 0) {
            setSelectedUpi((prev) => {
              if (prev && data.some((a) => a._id === prev._id)) {
                return data.find((a) => a._id === prev._id) || prev;
              }
              return data.find((a) => a.isPrimary) || data[0];
            });
          } else {
            setSelectedUpi(null);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch UPI accounts for withdrawal:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingUpi(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Fetch History on tab switch
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await withdrawalService.getWithdrawalHistory();
      setHistory(res);
    } catch (err) {
      console.warn('Failed to load withdrawal history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;
    if (activeTab === 'history') {
      withdrawalService
        .getWithdrawalHistory()
        .then((res) => {
          if (!isCancelled) {
            setHistory(res);
          }
        })
        .catch((err) => {
          console.warn('Failed to load withdrawal history:', err);
        })
        .finally(() => {
          if (!isCancelled) {
            setHistoryLoading(false);
          }
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    await Promise.allSettled([
      loadUpiAccounts(),
      refreshUser(),
      activeTab === 'history' ? loadHistory() : Promise.resolve(),
    ]);
    setIsRefreshing(false);
  };

  const handleSelectQuickAmount = (val: number) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Fallback
    }
    setAmount(String(val));
    setValidationError(null);
  };

  const handleSelectAll = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Fallback
    }
    setAmount(String(Math.floor(balance)));
    setValidationError(null);
  };

  // Submit Withdrawal Request: POST /api/withdrawals
  const handleSubmit = async () => {
    const numAmt = Number(amount);

    if (!numAmt || isNaN(numAmt) || numAmt <= 0) {
      setValidationError('Please enter a valid withdrawal amount.');
      return;
    }

    if (numAmt < MIN_WITHDRAWAL) {
      setValidationError(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}.`);
      return;
    }

    if (numAmt > balance) {
      setValidationError(`Insufficient wallet balance (Available: ₹${balance.toFixed(2)}).`);
      return;
    }

    if (!selectedUpi) {
      setValidationError('Please add or select a linked UPI account before proceeding.');
      return;
    }

    if (!selectedUpi.upiId || !UPI_REGEX.test(selectedUpi.upiId)) {
      setValidationError('Selected UPI ID is invalid. Please update your account details.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fallback
    }

    try {
      const res = await withdrawalService.submitWithdrawal(numAmt, {
        upiId: selectedUpi.upiId.trim().toLowerCase(),
        accountHolderName: selectedUpi.accountHolderName.trim(),
      });

      if (res.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Fallback
        }
        showToast('Withdrawal request submitted for admin review');
        setSubmittedAmount(numAmt);
        setShowSuccessModal(true);
        setAmount('');
        // Immediately refresh live balance
        await refreshUser();
      } else {
        setValidationError(res.message || 'Withdrawal request failed.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Error submitting withdrawal request. Please check your connection.';
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} • ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      <Header title="Withdraw Payout" showBack={true} onBack={onBack} centerTitle={true} />

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setActiveTab('withdraw');
            setValidationError(null);
          }}
          style={[styles.tabBtn, activeTab === 'withdraw' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'withdraw' && styles.tabBtnTextActive]}>
            Request Payout
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            setHistoryLoading(true);
            setActiveTab('history');
            setValidationError(null);
          }}
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
            Payout History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'withdraw' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Balance Hero Card */}
          <LinearGradient
            colors={['#065F46', '#047857', '#0F766E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <Text style={styles.heroLabel}>Available for Withdrawal</Text>
              <View style={styles.instantSettlementBadge}>
                <ShieldCheck size={12} color="#FEF08A" />
                <Text style={styles.instantSettlementText}>Admin Fast-Track</Text>
              </View>
            </View>

            <Text style={styles.heroBalance}>
              ₹ {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>

            <View style={styles.heroPendingRow}>
              <Clock size={12} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.heroPending}>
                In Review / Pending: ₹ {pendingSettlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </LinearGradient>

          {/* Amount Input */}
          <Text style={styles.sectionLabel}>Withdrawal Amount (INR)</Text>
          <View style={styles.amountInputBox}>
            <Text style={styles.amountCurrency}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => {
                setAmount(t.replace(/[^0-9]/g, ''));
                setValidationError(null);
              }}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          {/* Quick Amount Chips */}
          <View style={styles.chipsRow}>
            {QUICK_AMOUNTS.map((v) => (
              <TouchableOpacity
                key={v}
                activeOpacity={0.75}
                onPress={() => handleSelectQuickAmount(v)}
                style={[styles.chip, amount === String(v) && styles.chipActive]}
              >
                <Text style={[styles.chipText, amount === String(v) && styles.chipTextActive]}>
                  ₹{v.toLocaleString('en-IN')}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleSelectAll}
              style={[
                styles.chip,
                amount === String(Math.floor(balance)) && amount !== '' && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  amount === String(Math.floor(balance)) && amount !== '' && styles.chipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Beneficiary Destination Card */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Settlement Destination (UPI)</Text>
            {upiAccounts.length > 0 && onNavigateToAddAccount && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onNavigateToAddAccount}
                style={styles.addAccountLink}
              >
                <Plus size={13} color={Colors.primary} />
                <Text style={styles.addAccountLinkText}>Manage Accounts</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingUpi ? (
            <View style={styles.upiLoadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.upiLoadingText}>Loading linked accounts...</Text>
            </View>
          ) : upiAccounts.length === 0 ? (
            /* Warning: No Saved UPI */
            <View style={styles.noUpiCard}>
              <View style={styles.noUpiIconCircle}>
                <AlertCircle size={28} color="#D97706" />
              </View>
              <Text style={styles.noUpiTitle}>No UPI Account Linked</Text>
              <Text style={styles.noUpiSubtitle}>
                You must link a valid UPI ID (e.g. rahul@okaxis) before submitting your withdrawal request.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {
                    // Fallback
                  }
                  onNavigateToAddAccount?.();
                }}
                style={styles.addUpiFirstBtn}
              >
                <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addUpiFirstBtnText}>Add UPI Account First</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* User Has Linked UPI Accounts -> Selectable Card */
            <View style={styles.selectableUpiContainer}>
              {upiAccounts.map((account) => {
                const isSelected = selectedUpi?._id === account._id;
                return (
                  <TouchableOpacity
                    key={account._id}
                    activeOpacity={0.85}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {
                        // Fallback
                      }
                      setSelectedUpi(account);
                      setValidationError(null);
                    }}
                    style={[
                      styles.upiOptionCard,
                      isSelected && styles.upiOptionCardSelected,
                    ]}
                  >
                    <View style={styles.upiOptionLeft}>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>

                      <View style={styles.upiOptionInfo}>
                        <View style={styles.upiOptionTitleRow}>
                          <Text
                            style={[
                              styles.upiOptionVpa,
                              isSelected && { color: Colors.textPrimary },
                            ]}
                          >
                            {account.upiId}
                          </Text>
                          {account.isPrimary && (
                            <View style={styles.primaryPill}>
                              <Star size={9} color="#059669" />
                              <Text style={styles.primaryPillText}>Primary</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.holderNameRow}>
                          <User size={12} color={Colors.textMuted} />
                          <Text style={styles.holderNameText}>
                            {account.accountHolderName}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.checkIconWrap}>
                        <Check size={16} color="#059669" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          )}

          {/* Submit Withdrawal Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={isSubmitting || upiAccounts.length === 0}
            style={[
              styles.submitBtn,
              (isSubmitting || upiAccounts.length === 0) && { opacity: 0.65 },
            ]}
          >
            <LinearGradient
              colors={
                isSubmitting
                  ? ['#1B172B', '#141221']
                  : ['#065F46', '#047857']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <ArrowUpFromLine size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Request Instant Withdrawal</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Payout History Tab */
        <View style={styles.historyContainer}>
          {historyLoading ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loaderCenterText}>Loading payout records...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyCenter}>
              <View style={styles.emptyIconCircle}>
                <Receipt size={32} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Withdrawals Yet</Text>
              <Text style={styles.emptyDesc}>
                Your requested payouts and settlement statuses will appear here.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.historyListContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.primary}
                  colors={[Colors.primary]}
                />
              }
            >
              {history.map((item) => {
                const cfg = statusConfig[item.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                return (
                  <View key={item._id} style={styles.historyCard}>
                    <View style={styles.historyCardTop}>
                      <View>
                        <Text style={styles.historyAmount}>
                          ₹ {Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                        <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                      </View>

                      <View style={[styles.historyStatusBadge, { backgroundColor: cfg.bg }]}>
                        <StatusIcon size={12} color={cfg.color} />
                        <Text style={[styles.historyStatusText, { color: cfg.color }]}>
                          {cfg.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.historyCardDivider} />

                    <View style={styles.historyCardBottom}>
                      <View style={styles.historyDetailItem}>
                        <Text style={styles.historyDetailLabel}>Target UPI:</Text>
                        <Text style={styles.historyDetailValue}>
                          {item.bankDetails?.upiId || 'UPI Direct'}
                        </Text>
                      </View>

                      {item.bankDetails?.accountHolderName && (
                        <View style={styles.historyDetailItem}>
                          <Text style={styles.historyDetailLabel}>Holder:</Text>
                          <Text style={styles.historyDetailValue}>
                            {item.bankDetails.accountHolderName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Success Confirmation Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContainer}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={40} color="#10B981" />
            </View>

            <Text style={styles.successModalTitle}>Withdrawal Submitted!</Text>
            <Text style={styles.successModalDesc}>
              {`Your withdrawal request of ₹${submittedAmount.toFixed(2)} to ${selectedUpi?.upiId || 'your UPI ID'} has been submitted for admin review and instant clearance.`}
            </Text>

            <View style={styles.successDetailBox}>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Beneficiary:</Text>
                <Text style={styles.successRowVal}>{selectedUpi?.accountHolderName || 'User'}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>VPA ID:</Text>
                <Text style={styles.successRowVal}>{selectedUpi?.upiId || ''}</Text>
              </View>
              <View style={styles.successRow}>
                <Text style={styles.successRowLabel}>Status:</Text>
                <Text style={[styles.successRowVal, { color: Colors.warning }]}>In Admin Review</Text>
              </View>
            </View>

            <View style={styles.successActionsCol}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setShowSuccessModal(false);
                  setHistoryLoading(true);
                  setActiveTab('history');
                }}
                style={styles.viewHistoryBtn}
              >
                <Text style={styles.viewHistoryBtnText}>View Payout Records</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowSuccessModal(false);
                  onBack?.();
                }}
                style={styles.doneBtn}
              >
                <Text style={styles.doneBtnText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingHorizontal: Spacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: 18,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  instantSettlementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  instantSettlementText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '700',
  },
  heroBalance: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroPendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroPending: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: 8,
  },
  addAccountLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addAccountLinkText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  amountCurrency: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  upiLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upiLoadingText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  noUpiCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  noUpiIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  noUpiTitle: {
    color: '#92400E',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  noUpiSubtitle: {
    color: '#B45309',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: Spacing.md,
    maxWidth: 290,
  },
  addUpiFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: BorderRadius.full,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  addUpiFirstBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  selectableUpiContainer: {
    gap: 8,
    marginTop: 2,
  },
  upiOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  upiOptionCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  upiOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#059669',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  upiOptionInfo: {
    flex: 1,
  },
  upiOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  upiOptionVpa: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  primaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  primaryPillText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '700',
  },
  holderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  holderNameText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  checkIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.sm,
    padding: 10,
    marginTop: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  submitBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: Spacing.lg,
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitGradient: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  historyContainer: {
    flex: 1,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  loaderCenterText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.lg,
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
  emptyDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  historyListContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyAmount: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  historyDate: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  historyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  historyCardBottom: {
    gap: 4,
  },
  historyDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDetailLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  historyDetailValue: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  successModalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successModalTitle: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  successModalDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  successDetailBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 6,
    marginBottom: Spacing.lg,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successRowLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  successRowVal: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  successActionsCol: {
    width: '100%',
    gap: 8,
  },
  viewHistoryBtn: {
    backgroundColor: '#065F46',
    borderRadius: BorderRadius.full,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewHistoryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
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
