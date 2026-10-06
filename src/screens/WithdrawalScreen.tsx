import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowUpFromLine,
  Building2,
  User,
  Hash,
  CreditCard,
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/Header';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { withdrawalService, WithdrawalRecord } from '../services/withdrawalService';
import { useAuth } from '../context/AuthContext';

interface WithdrawalScreenProps {
  onBack?: () => void;
}

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

type ActiveTab = 'withdraw' | 'history';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:  { label: 'Pending',  color: Colors.warning,   bg: Colors.warningBg,  icon: Clock },
  approved: { label: 'Approved', color: Colors.success,   bg: Colors.successBg,  icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: Colors.danger,    bg: Colors.dangerBg,   icon: XCircle },
};

export const WithdrawalScreen: React.FC<WithdrawalScreenProps> = ({ onBack }) => {
  const { wallet, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('withdraw');
  const [amount, setAmount] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [history, setHistory] = useState<WithdrawalRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const balance = wallet?.balance ?? 0;
  const pendingSettlement = wallet?.pendingBalance ?? 0;

  useEffect(() => {
    let isMounted = true;
    if (activeTab === 'history') {
      const loadHistory = async () => {
        setHistoryLoading(true);
        try {
          const res = await withdrawalService.getWithdrawalHistory();
          if (isMounted) setHistory(res);
        } finally {
          if (isMounted) setHistoryLoading(false);
        }
      };
      loadHistory();
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleSelectQuickAmount = (val: number) => {
    try { Haptics.selectionAsync(); } catch {}
    setAmount(String(val));
    setValidationError(null);
  };

  const handleSelectAll = () => {
    try { Haptics.selectionAsync(); } catch {}
    setAmount(String(Math.floor(balance)));
    setValidationError(null);
  };

  const handleSubmit = async () => {
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) {
      setValidationError('Please enter a valid withdrawal amount.');
      return;
    }
    if (numAmt < 100) {
      setValidationError('Minimum withdrawal amount is Rs. 100.');
      return;
    }
    if (numAmt > balance) {
      setValidationError('Insufficient balance. Available: Rs.' + balance.toFixed(2));
      return;
    }
    if (!accountHolderName.trim()) {
      setValidationError('Please enter the account holder name.');
      return;
    }
    if (!accountNumber.trim() && !upiId.trim()) {
      setValidationError('Please enter an account number or UPI ID.');
      return;
    }
    if (accountNumber.trim() && !ifscCode.trim()) {
      setValidationError('Please enter the IFSC code for your bank account.');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

    try {
      const res = await withdrawalService.submitWithdrawal(numAmt, {
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() || undefined,
        upiId: upiId.trim(),
      });

      if (res.success) {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
        setShowSuccessModal(true);
        refreshUser();
        setAmount('');
        setAccountHolderName('');
        setAccountNumber('');
        setIfscCode('');
        setUpiId('');
      } else {
        setValidationError(res.message || 'Withdrawal request failed.');
      }
    } catch (err: any) {
      setValidationError(
        err?.response?.data?.message || err?.message || 'Error submitting withdrawal request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      <Header title="Withdraw" showBack={true} onBack={onBack} centerTitle={true} />

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('withdraw')}
          style={[styles.tabBtn, activeTab === 'withdraw' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'withdraw' && styles.tabBtnTextActive]}>
            Withdraw
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('history')}
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'withdraw' ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance Hero Card */}
          <LinearGradient
            colors={['#2D1B69', '#1A0E3F', '#0F0827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Text style={styles.heroLabel}>Available for Withdrawal</Text>
            <Text style={styles.heroBalance}>
              {'Rs. '}{balance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </Text>
            <Text style={styles.heroPending}>
              Pending Settlement: Rs. {pendingSettlement.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </Text>
          </LinearGradient>

          {/* Amount Input */}
          <Text style={styles.sectionLabel}>Withdrawal Amount (Rs.)</Text>
          <View style={styles.amountInputBox}>
            <Text style={styles.amountCurrency}>Rs.</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => {
                setAmount(t.replace(/[^0-9]/g, ''));
                setValidationError(null);
              }}
              placeholder=""
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
                  Rs.{v.toLocaleString('en-IN')}
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

          {/* Beneficiary Bank Account Card */}
          <View style={styles.bankCard}>
            <View style={styles.bankCardHeader}>
              <View style={styles.bankCardIconWrap}>
                <Building2 size={18} color={Colors.primary} />
              </View>
              <Text style={styles.bankCardTitle}>Beneficiary Bank Account</Text>
            </View>

            <Text style={styles.fieldLabel}>Account Holder Name</Text>
            <View style={styles.fieldBox}>
              <User size={16} color={Colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                value={accountHolderName}
                onChangeText={(t) => { setAccountHolderName(t); setValidationError(null); }}
                placeholder="Full name as per bank"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.fieldLabel}>Account Number</Text>
            <View style={styles.fieldBox}>
              <Hash size={16} color={Colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                value={accountNumber}
                onChangeText={(t) => { setAccountNumber(t.replace(/[^0-9]/g, '')); setValidationError(null); }}
                placeholder="Enter account number"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.fieldLabel}>IFSC Code</Text>
            <View style={styles.fieldBox}>
              <CreditCard size={16} color={Colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                value={ifscCode}
                onChangeText={(t) => { setIfscCode(t.toUpperCase()); setValidationError(null); }}
                placeholder="e.g. SBIN0001234"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />
            </View>

            <Text style={styles.fieldLabel}>UPI ID (Optional)</Text>
            <View style={styles.fieldBox}>
              <Smartphone size={16} color={Colors.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={styles.fieldInput}
                value={upiId}
                onChangeText={(t) => { setUpiId(t); setValidationError(null); }}
                placeholder="name@bank"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Validation Error */}
          {validationError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          )}

          {/* Submit CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submitBtn}
          >
            <LinearGradient
              colors={isSubmitting ? ['#1B172B', '#141221'] : ['#2D1B69', '#1A0E3F']}
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
        /* History Tab */
        <View style={styles.historyContainer}>
          {historyLoading ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyCenter}>
              <ArrowUpFromLine size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Withdrawals Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your withdrawal requests will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.historyList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const cfg = statusConfig[item.status] ?? statusConfig.pending;
                const IconComp = cfg.icon;
                const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                });
                return (
                  <View style={styles.historyCard}>
                    <View style={[styles.historyIconWrap, { backgroundColor: cfg.bg }]}>
                      <IconComp size={20} color={cfg.color} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyAmount}>
                        Rs.{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Text>
                      <Text style={styles.historyUpi} numberOfLines={1}>
                        {item.bankDetails?.upiId || item.bankDetails?.accountNumber || '-'}
                      </Text>
                      <Text style={styles.historyDate}>{date}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowSuccessModal(false); onBack?.(); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <CheckCircle2 size={36} color={Colors.success} />
              </View>
            </View>
            <Text style={[Typography.h2, styles.modalTitle]}>Request Submitted!</Text>
            <Text style={styles.modalSubtitle}>
              Your withdrawal request has been received and is being processed. Funds will be
              credited within 24 hours.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowSuccessModal(false);
                setActiveTab('history');
              }}
              style={styles.modalBtn}
            >
              <LinearGradient
                colors={Colors.accentGradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalBtnGradient}
              >
                <Text style={styles.modalBtnText}>View History</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxxl,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  heroBalance: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  heroPending: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  amountInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    marginBottom: Spacing.sm,
  },
  amountCurrency: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  bankCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  bankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  bankCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: Spacing.xs,
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 12,
    marginBottom: 2,
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    padding: 0,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  historyContainer: {
    flex: 1,
  },
  historyList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxxl,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  historyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
    minWidth: 0,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  historyUpi: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  successIconOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  modalBtn: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  modalBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
