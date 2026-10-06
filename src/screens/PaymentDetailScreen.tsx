import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  CheckCircle2,
  Copy,
  Download,
  Share2,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { PaymentItem } from '../types';

interface PaymentDetailScreenProps {
  onBack?: () => void;
  paymentItem?: PaymentItem;
}

export const PaymentDetailScreen: React.FC<PaymentDetailScreenProps> = ({
  onBack,
  paymentItem,
}) => {
  if (!paymentItem) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
        <Header
          title="Payment Receipt"
          showBack={!!onBack}
          onBack={onBack}
          centerTitle
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transaction details available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const item: PaymentItem = paymentItem;

  const handleCopyCode = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      <Header
        title="Payment Receipt"
        showBack={!!onBack}
        onBack={onBack}
        centerTitle
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Hero Amount Card */}
        <View style={styles.heroCard}>
          <View style={styles.statusCircle}>
            <CheckCircle2 size={38} color={Colors.success} />
          </View>
          <Text
            style={[Typography.balance, styles.amountText]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {item.currency} {item.amount.toLocaleString('en-IN')}.00
          </Text>
          <Text style={[Typography.bodyMedium, styles.subtitle]}>
            Payment Received & Settled
          </Text>
          <Badge
            label={item.status}
            variant={item.status === 'Completed' ? 'success' : 'danger'}
            size="md"
            style={styles.badge}
          />
        </View>

        {/* Transaction Summary Card */}
        <View style={styles.infoCard}>
          <Text style={[Typography.sectionTitle, styles.cardTitle]}>
            Transaction Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Order Code</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCopyCode}
              style={styles.copyRow}
            >
              <Text style={styles.valueAccent}>{item.orderCode}</Text>
              <Copy size={13} color={Colors.primary} style={styles.copyIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Timestamp</Text>
            <Text style={styles.value}>{item.date}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>{item.method}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Settlement Node</Text>
            <Text style={styles.value}>{item.terminalId}</Text>
          </View>
        </View>

        {/* Fee & Breakdown Card */}
        <View style={styles.infoCard}>
          <Text style={[Typography.sectionTitle, styles.cardTitle]}>
            Breakdown
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Subtotal Amount</Text>
            <Text style={styles.value}>
              {item.currency} {item.amount.toLocaleString('en-IN')}.00
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Gateway Fee (GST 0%)</Text>
            <Text style={[styles.value, { color: Colors.success }]}>Free</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.labelTotal}>Net Credited to Wallet</Text>
            <Text style={styles.valueTotal}>
              {item.currency} {item.amount.toLocaleString('en-IN')}.00
            </Text>
          </View>
        </View>

        {/* Security Assurance */}
        <View style={styles.securityBox}>
          <ShieldCheck size={18} color={Colors.primary} />
          <Text style={styles.securityText}>
            Secured by 256-bit DreamPay Multi-Sig Ledger Protocol
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <View style={styles.actionCol}>
            <PrimaryButton
              title="Share"
              variant="secondary"
              size="md"
              icon={<Share2 size={16} color={Colors.textPrimary} />}
              onPress={handleCopyCode}
              fullWidth
            />
          </View>
          <View style={styles.actionCol}>
            <PrimaryButton
              title="Download"
              variant="primary"
              size="md"
              icon={<Download size={16} color="#FFFFFF" />}
              onPress={onBack || handleCopyCode}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 90,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  amountText: {
    color: Colors.textPrimary,
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: Spacing.xs,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    flexShrink: 1,
  },
  labelTotal: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  valueTotal: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '800',
    flexShrink: 0,
    textAlign: 'right',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueAccent: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  copyIcon: {
    marginLeft: 4,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    gap: Spacing.xs,
  },
  securityText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionCol: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
