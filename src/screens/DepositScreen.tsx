import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import {
  Copy,
  Check,
  Upload,
  CheckCircle2,
  FileCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/Header';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { OfferItem, ApiPaymentMethods } from '../types';
import { depositService } from '../services/depositService';
import { useAuth } from '../context/AuthContext';
import { getFullImageUrl } from '../utils/imageUrl';

interface DepositScreenProps {
  onBack?: () => void;
  offer?: OfferItem | null;
  onSuccess?: () => void;
}

const OFFICIAL_UPI_ID = '894738783@okaxis';



interface ProofAsset {
  uri: string;
  name: string;
  type: string;
  base64?: string | null;
}

export const DepositScreen: React.FC<DepositScreenProps> = ({
  onBack,
  offer,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const [amount, setAmount] = useState(offer?.amount ? String(offer.amount) : '500');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<ProofAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<ApiPaymentMethods | null>(null);

  useEffect(() => {
    depositService.getPaymentMethods().then((res) => {
      if (res) {
        setPaymentMethods(res);
      }
    });
  }, []);

  const activeUpiId = paymentMethods?.bankAccount?.upiId || OFFICIAL_UPI_ID;

  const handleCopyUPI = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleUploadScreenshot = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setValidationError('Gallery permission is required to upload receipt.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.3,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        let filename = asset.fileName;
        if (!filename) {
          const rawUri = asset.uri.split('?')[0];
          const parts = rawUri.split('/');
          filename = parts[parts.length - 1] || `receipt_${Date.now()}.jpg`;
        }

        filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        if (!filename.includes('.')) {
          filename += '.jpg';
        }

        const mimeType = asset.mimeType || (filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');

        setUploadedProof({
          uri: asset.uri,
          name: filename,
          type: mimeType,
          base64: asset.base64 ? `data:${mimeType};base64,${asset.base64}` : null,
        });
        setValidationError(null);
      }
    } catch {
      setValidationError('Failed to pick screenshot image.');
    }
  };

  const handleConfirmPayment = async () => {
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) {
      setValidationError('Please specify a valid deposit amount.');
      return;
    }

    if (!utrNumber.trim() || utrNumber.trim().length < 8) {
      setValidationError('Please enter a valid 12-digit UTR number from your payment receipt.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback
      }
      return;
    }

    if (!uploadedProof) {
      setValidationError('Please upload a screenshot proof of your payment.');
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
      const rawPlanId = (offer as any)?._id || (offer as any)?.planId || offer?.id;
      const validPlanId =
        rawPlanId && /^[0-9a-fA-F]{24}$/.test(String(rawPlanId).trim())
          ? String(rawPlanId).trim()
          : undefined;

      const res = await depositService.submitDeposit({
        amount,
        transactionRef: utrNumber.trim(),
        imageUri: uploadedProof.uri,
        fileName: uploadedProof.name,
        mimeType: uploadedProof.type,
        base64Data: uploadedProof.base64,
        planId: validPlanId,
      });

      setIsSubmitting(false);

      if (res.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Fallback
        }
        setShowSuccessModal(true);
        refreshUser();
        onSuccess?.();
      } else {
        setValidationError(res.message || 'Deposit submission failed.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setValidationError(
        err.response?.data?.message || err.message || 'Error submitting deposit request to DreamPay.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

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
        {/* Deposit Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountCardLabel}>Deposit Amount</Text>
          {offer ? (
            <View style={styles.amountFixedRow}>
              <Text style={styles.amountFixedCurrency}>₹</Text>
              <Text style={styles.amountFixedValue}>{offer.amount}</Text>
              {(offer as any).tier && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{(offer as any).tier}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.amountInputRow}>
              <Text style={styles.amountFixedCurrency}>₹</Text>
              <TextInput
                style={styles.amountInputText}
                value={amount}
                onChangeText={(txt) => {
                  setAmount(txt.replace(/[^0-9]/g, ''));
                  setValidationError(null);
                }}
                keyboardType="numeric"
                placeholder="Enter deposit amount"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          )}
        </View>

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
              {activeUpiId}
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

        {/* 2. QR Code Section */}
        <View style={styles.qrSectionWrapper}>
          <View style={styles.qrCodeCard}>
            {paymentMethods?.qrCode?.imageUrl ? (
              <Image
                source={{ uri: getFullImageUrl(paymentMethods.qrCode.imageUrl) }}
                style={{ width: 220, height: 220, borderRadius: 8 }}
                resizeMode="contain"
              />
            ) : (
              <QRCode
                value={`upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=DreamPay&cu=INR&am=${amount || ''}`}
                size={220}
                color="#09080D"
                backgroundColor="#FFFFFF"
                ecl="M"
              />
            )}
          </View>

          <Text style={styles.scanInstructionsText}>
            Scan & Pay and{'\n'}
            enter UTR no. & upload screenshot of payment{'\n'}
            for verification purpose
          </Text>

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
                    {uploadedProof.name}
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

  // Amount Card
  amountCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  amountCardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  amountFixedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountFixedCurrency: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  amountFixedValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  amountInputText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
    padding: 0,
    marginLeft: 4,
  },
  planBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  planBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
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
    borderColor: Colors.primary,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
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
