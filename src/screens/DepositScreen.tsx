import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Rect, Path, G } from 'react-native-svg';
import {
  Copy,
  Check,
  Upload,
  CheckCircle2,
  FileCheck,
  Smartphone,
  ExternalLink,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/Header';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { OfferItem } from '../types';

interface DepositScreenProps {
  onBack?: () => void;
  offer?: OfferItem | null;
  onSuccess?: () => void;
}

const OFFICIAL_UPI_ID = '894738783@okaxis';

// Vector QR Code Component (UPI Intent for PayApp)
const SvgQRCode = ({ size = 200 }: { size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* Background White */}
      <Rect x="0" y="0" width="120" height="120" fill="#FFFFFF" rx="8" />

      {/* Top Left Finder Pattern */}
      <Rect x="10" y="10" width="30" height="30" fill="#09080D" rx="4" />
      <Rect x="16" y="16" width="18" height="18" fill="#FFFFFF" rx="2" />
      <Rect x="20" y="20" width="10" height="10" fill="#09080D" rx="1" />

      {/* Top Right Finder Pattern */}
      <Rect x="80" y="10" width="30" height="30" fill="#09080D" rx="4" />
      <Rect x="86" y="16" width="18" height="18" fill="#FFFFFF" rx="2" />
      <Rect x="90" y="20" width="10" height="10" fill="#09080D" rx="1" />

      {/* Bottom Left Finder Pattern */}
      <Rect x="10" y="80" width="30" height="30" fill="#09080D" rx="4" />
      <Rect x="16" y="86" width="18" height="18" fill="#FFFFFF" rx="2" />
      <Rect x="20" y="90" width="10" height="10" fill="#09080D" rx="1" />

      {/* Alignment Matrix Pattern (Simulated authentic QR data cells) */}
      <G fill="#09080D">
        {/* Timing Lines */}
        <Rect x="44" y="22" width="4" height="4" />
        <Rect x="52" y="22" width="4" height="4" />
        <Rect x="60" y="22" width="4" height="4" />
        <Rect x="68" y="22" width="4" height="4" />
        <Rect x="22" y="44" width="4" height="4" />
        <Rect x="22" y="52" width="4" height="4" />
        <Rect x="22" y="60" width="4" height="4" />
        <Rect x="22" y="68" width="4" height="4" />

        {/* Central Data Clusters */}
        <Rect x="48" y="48" width="10" height="10" rx="2" />
        <Rect x="64" y="48" width="8" height="6" />
        <Rect x="78" y="48" width="6" height="8" />
        <Rect x="48" y="64" width="8" height="8" />
        <Rect x="62" y="62" width="10" height="6" />
        <Rect x="76" y="62" width="8" height="8" />
        <Rect x="92" y="48" width="6" height="6" />
        <Rect x="92" y="58" width="8" height="6" />
        <Rect x="48" y="78" width="6" height="10" />
        <Rect x="60" y="78" width="8" height="8" />
        <Rect x="74" y="76" width="6" height="10" />
        <Rect x="86" y="78" width="8" height="6" />
        <Rect x="98" y="78" width="8" height="8" />

        {/* Outer Data Cells */}
        <Rect x="10" y="46" width="6" height="6" />
        <Rect x="10" y="56" width="8" height="6" />
        <Rect x="10" y="66" width="6" height="8" />
        <Rect x="44" y="10" width="6" height="6" />
        <Rect x="54" y="10" width="8" height="6" />
        <Rect x="66" y="10" width="6" height="8" />
        <Rect x="80" y="44" width="8" height="6" />
        <Rect x="104" y="44" width="6" height="8" />
        <Rect x="44" y="94" width="6" height="8" />
        <Rect x="54" y="94" width="8" height="6" />
        <Rect x="66" y="94" width="6" height="8" />
        <Rect x="76" y="94" width="8" height="6" />
        <Rect x="88" y="94" width="6" height="8" />
        <Rect x="98" y="94" width="8" height="8" />
        <Rect x="44" y="106" width="8" height="6" />
        <Rect x="58" y="106" width="6" height="6" />
        <Rect x="70" y="106" width="8" height="6" />
        <Rect x="84" y="106" width="6" height="6" />
        <Rect x="96" y="106" width="8" height="6" />
      </G>

      {/* PayApp Center Watermark / Logo Shield */}
      <Rect x="52" y="52" width="16" height="16" fill="#7C5CFC" rx="4" />
      <Path
        d="M57 63 L60 55 L63 63 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
};

export const DepositScreen: React.FC<DepositScreenProps> = ({
  onBack,
  offer,
  onSuccess,
}) => {
  const amount = offer ? String(offer.amount) : '1000';
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCopyUPI = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleOpenUPI = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const payAmount = amount || '500';
      const upiUrl = `upi://pay?pa=${OFFICIAL_UPI_ID}&pn=PayApp&am=${payAmount}&cu=INR`;
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        await Linking.openURL(upiUrl);
      } else {
        handleCopyUPI();
      }
    } catch {
      handleCopyUPI();
    }
  };

  const handleUploadScreenshot = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Simulate receipt attachment
      setUploadedProof(`payment_receipt_${Date.now().toString().slice(-6)}.jpg`);
      setValidationError(null);
    } catch {
      // Fallback
    }
  };

  const handleConfirmPayment = () => {
    // Validation
    if (!utrNumber.trim() || utrNumber.trim().length < 10) {
      setValidationError('Please enter a valid 12-digit UTR number from your payment receipt.');
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessModal(true);
      onSuccess?.();
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />

      {/* Screen Header */}
      <Header
        title="Deposit"
        showBack={true}
        onBack={onBack}
        centerTitle={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* UPI ID Row matching reference */}
        <View style={styles.upiRow}>
          <View style={styles.upiPill}>
            <Text style={styles.upiLabelText}>UPI ID: </Text>
            <Text
              style={styles.upiValueText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {OFFICIAL_UPI_ID}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleCopyUPI}
            style={styles.copyBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {copiedUpi ? (
              <Check size={18} color={Colors.success} />
            ) : (
              <Copy size={18} color={Colors.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {/* 2. QR Code Section matching reference */}
        <View style={styles.qrSectionWrapper}>
          <View style={styles.qrCodeCard}>
            <SvgQRCode size={220} />
          </View>

          <Text style={styles.scanInstructionsText}>
            Scan & Pay and{'\n'}
            enter UTR no. & upload screenshot of payment{'\n'}
            for verification purpose
          </Text>

          {/* Quick Pay Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenUPI}
            style={styles.openUpiBtn}
          >
            <Smartphone size={16} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.openUpiBtnText}>Pay with GPay / PhonePe / Paytm</Text>
            <ExternalLink size={13} color={Colors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* 3. Enter UTR Number Input matching reference */}
        <View style={styles.formGroup}>
          <View
            style={[
              styles.inputBox,
              utrNumber.length === 12 && styles.inputBoxValid,
            ]}
          >
            <TextInput
              style={styles.textInput}
              value={utrNumber}
              onChangeText={(txt) => {
                setUtrNumber(txt.replace(/[^0-9]/g, ''));
                setValidationError(null);
              }}
              placeholder="Enter UTR Number"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={12}
            />
            {utrNumber.length === 12 && (
              <CheckCircle2 size={18} color={Colors.success} style={{ marginLeft: 8 }} />
            )}
          </View>
        </View>

        {/* 4. Upload Screenshot Button matching reference */}
        <View style={styles.formGroup}>
          <View style={styles.uploadRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUploadScreenshot}
              style={[
                styles.uploadPlaceholderBtn,
                uploadedProof ? styles.uploadBtnActive : null,
              ]}
            >
              {uploadedProof ? (
                <View style={styles.uploadedFileContent}>
                  <FileCheck size={16} color={Colors.success} style={{ marginRight: 6 }} />
                  <Text style={styles.uploadedFileName} numberOfLines={1}>
                    {uploadedProof}
                  </Text>
                </View>
              ) : (
                <Text style={styles.uploadPlaceholderText}>
                  Upload Screenshot here
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleUploadScreenshot}
              style={styles.uploadIconBtn}
            >
              <Upload size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Validation Error Message */}
        {validationError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{validationError}</Text>
          </View>
        )}

        {/* 5. Confirm Payment CTA matching reference */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleConfirmPayment}
          disabled={isSubmitting}
          style={styles.confirmBtn}
        >
          <LinearGradient
            colors={isSubmitting ? ['#1B172B', '#141221'] : ['#1E1738', '#110D20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.confirmGradient}
          >
            <Text style={styles.confirmBtnText}>
              {isSubmitting ? 'Verifying Transaction...' : 'Confirm Payment'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Success Confirmation Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          onBack?.();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <CheckCircle2 size={36} color={Colors.success} />
              </View>
            </View>

            <Text style={[Typography.h2, styles.modalSuccessTitle]}>
              Payment Submitted!
            </Text>
            <Text style={styles.modalSuccessSubtitle}>
              Your deposit of ₹{Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} has been received for verification.
            </Text>

            <View style={styles.modalReceiptCard}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Deposit Amount</Text>
                <Text style={[Typography.bodySemiBold, { color: Colors.textPrimary }]}>
                  ₹{Number(amount || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>UTR Number</Text>
                <Text style={styles.receiptValue}>{utrNumber}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Method</Text>
                <Text style={styles.receiptValue}>UPI Direct Pay</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Estimated Credit</Text>
                <Text style={[styles.receiptValue, { color: Colors.success }]}>
                  2 - 5 Minutes
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowSuccessModal(false);
                onBack?.();
              }}
              style={styles.modalCloseBtn}
            >
              <LinearGradient
                colors={Colors.accentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalCloseGradient}
              >
                <Text style={styles.modalCloseText}>Done & Return</Text>
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
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxxl,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },

  // UPI Row
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  upiPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  upiLabelText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 0,
  },
  upiValueText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  copyBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // QR Code Section
  qrSectionWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  qrCodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  scanInstructionsText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  openUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginTop: 6,
  },
  openUpiBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // Form Fields
  formGroup: {
    marginBottom: 12,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
  },
  inputBoxValid: {
    borderColor: Colors.success,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },

  // Upload Row
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadPlaceholderBtn: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  uploadBtnActive: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(57, 217, 138, 0.08)',
  },
  uploadPlaceholderText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  uploadedFileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedFileName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  uploadIconBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Error Box
  errorBox: {
    backgroundColor: 'rgba(255, 92, 112, 0.12)',
    borderRadius: BorderRadius.sm,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Confirm Button
  confirmBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.4)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    padding: Spacing.xl,
    alignItems: 'center',
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(57, 217, 138, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successIconInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(57, 217, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSuccessTitle: {
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSuccessSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  modalReceiptCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginBottom: Spacing.lg,
    gap: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  receiptValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalCloseBtn: {
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  modalCloseGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
