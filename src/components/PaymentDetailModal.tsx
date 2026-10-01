import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, X, Download, Share2, Copy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PaymentItem, Transaction } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { Badge } from './Badge';
import { PrimaryButton } from './PrimaryButton';

interface PaymentDetailModalProps {
  visible: boolean;
  onClose: () => void;
  data: PaymentItem | Transaction | null;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  visible,
  onClose,
  data,
}) => {
  const insets = useSafeAreaInsets();
  if (!data) return null;

  const isPaymentItem = 'currency' in data;
  const amountStr = isPaymentItem
    ? `${data.currency} ${data.amount.toLocaleString('en-IN')}.00`
    : data.formattedAmount;
  const orderCode = data.orderCode;
  const dateStr = data.date;
  const status = data.status;
  const method = isPaymentItem ? data.method : (data as Transaction).paymentMethod;
  const fee = isPaymentItem ? (data as PaymentItem).fee : (data as Transaction).fee;

  const handleCopy = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + Spacing.md, Spacing.xxl) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[Typography.h3, styles.headerTitle]}>
              Payment Details
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Status Hero */}
            <View style={styles.statusHero}>
              <View style={styles.checkCircle}>
                <CheckCircle2 size={36} color={Colors.success} />
              </View>
              <Text style={[Typography.balance, styles.amountText]}>
                {amountStr}
              </Text>
              <Badge
                label={status}
                variant={status === 'Completed' ? 'success' : 'danger'}
                size="md"
                style={styles.statusBadge}
              />
            </View>

            {/* Receipt Card */}
            <View style={styles.receiptCard}>
              <View style={styles.row}>
                <Text style={styles.label}>Order Code</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCopy}
                  style={styles.copyRow}
                >
                  <Text style={styles.valueHighlight}>{orderCode}</Text>
                  <Copy size={13} color={Colors.primary} style={styles.copyIcon} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Transaction Date</Text>
                <Text style={styles.value}>{dateStr}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Payment Channel</Text>
                <Text style={styles.value}>{method}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Network Fee</Text>
                <Text style={styles.value}>
                  {fee === 0 ? 'Free (₹ 0.00)' : `₹ ${fee}.00`}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>Settlement Node</Text>
                <Text style={styles.value}>DRM-V2-SECURE-NODE</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <View style={styles.actionCol}>
                <PrimaryButton
                  title="Share"
                  variant="secondary"
                  size="md"
                  icon={<Share2 size={16} color={Colors.textPrimary} />}
                  onPress={handleCopy}
                  fullWidth
                />
              </View>
              <View style={styles.actionCol}>
                <PrimaryButton
                  title="Receipt"
                  variant="primary"
                  size="md"
                  icon={<Download size={16} color="#FFFFFF" />}
                  onPress={onClose}
                  fullWidth
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: Spacing.lg,
  },
  statusHero: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  amountText: {
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  receiptCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.xs,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueHighlight: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  copyIcon: {
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionCol: {
    flex: 1,
  },
});
