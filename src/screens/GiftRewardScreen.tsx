import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Copy,
  Check,
  Gift,
  Sparkles,
  AlertCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { giftCodeService } from '../services/giftCodeService';
import { useAuth } from '../context/AuthContext';

interface GiftRewardScreenProps {
  onBack?: () => void;
}

interface ActivePromoCode {
  code: string;
  label: string;
  rewardAmount: number;
  expiryDate: string;
  limitText: string;
}

// Official DreamPay promotion vouchers
const activePromoCodes: ActivePromoCode[] = [
  {
    code: 'WELCOME100',
    label: 'Welcome Starter Bonus',
    rewardAmount: 100,
    expiryDate: '2026-12-31',
    limitText: 'One per new member',
  },
  {
    code: 'DREAMPAY50',
    label: 'Official Launch Incentive',
    rewardAmount: 50,
    expiryDate: '2026-11-30',
    limitText: 'All verified users',
  },
];

export const GiftRewardScreen: React.FC<GiftRewardScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [claimedAmount, setClaimedAmount] = useState<number>(0);
  const [claimedCodeName, setClaimedCodeName] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Custom Redeem Code State
  const [customCode, setCustomCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [claimedCodesList, setClaimedCodesList] = useState<string[]>([]);

  const handleCopyCode = (code: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }
    setCopiedCode(code);
    setCustomCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2200);
  };

  const handleRedeemCode = async (codeToRedeem: string) => {
    const trimmed = codeToRedeem.trim().toUpperCase();
    if (!trimmed) {
      setRedeemError('Please enter a valid gift code.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback
      }
      return;
    }

    try {
      setIsRedeeming(true);
      setRedeemError(null);
      setRedeemSuccess(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const res = await giftCodeService.redeem(trimmed);

      if (res?.success) {
        const rewardAmt = res.data?.rewardAmount || 100;
        setClaimedAmount(rewardAmt);
        setClaimedCodeName(trimmed);
        setClaimedCodesList((prev) => [...prev, trimmed]);
        setRedeemSuccess(res.message || `Successfully redeemed ₹${rewardAmt}!`);
        setCustomCode('');

        await refreshUser();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSuccessModal(true);
      } else {
        setRedeemError(res?.message || 'Failed to redeem gift code. Please check and try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired gift code.';
      setRedeemError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRedeeming(false);
    }
  };

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

        <Text style={styles.headerTitle}>Gift Reward</Text>

        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        {/* Redeem Custom Gift Code Box */}
        <View style={styles.redeemCard}>
          <View style={styles.redeemHeaderRow}>
            <View style={styles.redeemIconWrap}>
              <Gift size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.redeemTitle}>Redeem Gift Code</Text>
              <Text style={styles.redeemSubtitle}>
                Have a promotional or referral code? Enter it below to redeem instant wallet bonus.
              </Text>
            </View>
          </View>

          <View style={styles.redeemInputRow}>
            <TextInput
              style={styles.redeemInput}
              value={customCode}
              onChangeText={(txt) => {
                setCustomCode(txt);
                setRedeemError(null);
                setRedeemSuccess(null);
              }}
              placeholder="e.g. WELCOME100"
              placeholderTextColor="#5E5A6E"
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isRedeeming}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isRedeeming}
              onPress={() => handleRedeemCode(customCode)}
              style={[styles.redeemBtn, isRedeeming && { opacity: 0.6 }]}
            >
              {isRedeeming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.redeemBtnText}>Redeem</Text>
              )}
            </TouchableOpacity>
          </View>

          {redeemError && (
            <View style={styles.errorBox}>
              <AlertCircle size={15} color="#FF5C70" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{redeemError}</Text>
            </View>
          )}

          {redeemSuccess && (
            <View style={styles.successBox}>
              <Check size={15} color="#2ECC71" style={{ marginRight: 6 }} />
              <Text style={styles.successText}>{redeemSuccess}</Text>
            </View>
          )}
        </View>

        {/* Featured Promotion Vouchers */}
        <Text style={styles.sectionHeaderTitle}>Official Promo Vouchers</Text>

        {activePromoCodes.map((promo) => {
          const isAlreadyClaimed = claimedCodesList.includes(promo.code);
          return (
            <View key={promo.code} style={styles.rewardCard}>
              <Text style={styles.cardLabel}>{promo.label}</Text>

              {/* Gift Code Text & Copy Action */}
              <View style={styles.codeRow}>
                <Text style={styles.codeText} numberOfLines={1} adjustsFontSizeToFit>
                  {promo.code}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleCopyCode(promo.code)}
                  style={styles.copyBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {copiedCode === promo.code ? (
                    <Check size={18} color={Colors.success} />
                  ) : (
                    <Copy size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              {/* 2-Column Metrics: Reward & Usage */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.cardLabel}>Reward Amount</Text>
                  <Text style={styles.rewardAmountText}>₹ {promo.rewardAmount}.00</Text>
                </View>

                <View style={styles.metricColRight}>
                  <Text style={styles.cardLabel}>Eligibility</Text>
                  <Text style={styles.metricValueText}>{promo.limitText}</Text>
                </View>
              </View>

              {/* Expiry Date */}
              <Text style={[styles.cardLabel, { marginTop: 14 }]}>Valid Until</Text>
              <Text style={styles.expiryValueText}>{promo.expiryDate}</Text>

              {/* Claim CTA Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isAlreadyClaimed || isRedeeming}
                onPress={() => handleRedeemCode(promo.code)}
                style={[styles.claimBtn, isAlreadyClaimed && styles.claimedBtn]}
              >
                <Text
                  style={[
                    styles.claimBtnText,
                    isAlreadyClaimed && styles.claimedBtnText,
                  ]}
                >
                  {isAlreadyClaimed ? 'Claimed ✓' : 'Redeem Now'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Claim Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconCircle}>
              <Sparkles size={32} color="#FFA500" />
            </View>

            <Text style={styles.modalTitle}>Reward Claimed!</Text>
            <Text style={styles.modalAmount}>+ ₹ {claimedAmount}.00</Text>
            <Text style={styles.modalDesc}>
              Bonus voucher ({claimedCodeName}) has been validated by the DreamPay backend and credited to your main balance.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowSuccessModal(false)}
              style={styles.modalOkBtn}
            >
              <Text style={styles.modalOkText}>Awesome</Text>
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionHeaderTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 12,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },
  codeText: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  copyBtn: {
    padding: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  metricCol: {
    flex: 1,
  },
  metricColRight: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rewardAmountText: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  metricValueText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  expiryValueText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  claimBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  claimedBtn: {
    backgroundColor: Colors.surfaceMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  claimedBtnText: {
    color: Colors.textMuted,
  },
  redeemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  redeemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  redeemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  redeemSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  redeemInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  redeemInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  redeemBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: 'rgba(0, 168, 107, 0.3)',
  },
  successText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalAmount: {
    color: Colors.primary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 10,
  },
  modalDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalOkBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOkText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
