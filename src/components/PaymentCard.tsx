import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PaymentItem } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { Badge } from './Badge';

interface PaymentCardProps {
  payment: PaymentItem;
  onPress?: (payment: PaymentItem) => void;
}

export const PaymentCard: React.FC<PaymentCardProps> = ({ payment, onPress }) => {
  const isReferral =
    payment.method.toLowerCase().includes('referral') ||
    payment.description?.toLowerCase().includes('referral');

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress?.(payment)}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text
          style={[
            Typography.h2,
            styles.amount,
            isReferral && { color: Colors.success },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {isReferral ? '+ ' : ''}
          {payment.currency}
          {payment.amount}
          <Text style={styles.slash}>/-</Text>
        </Text>
        <Badge
          label={
            isReferral
              ? 'Referral Bonus'
              : payment.status === 'Processing'
              ? 'Pending'
              : payment.status
          }
          variant={
            isReferral || payment.status === 'Completed'
              ? 'success'
              : payment.status === 'Failed'
              ? 'danger'
              : payment.status === 'Pending' || payment.status === 'Processing'
              ? 'warning'
              : 'neutral'
          }
          size="sm"
        />
      </View>

      <View style={styles.bottomRow}>
        <Text style={[Typography.caption, styles.orderCode]} numberOfLines={1}>
          Order Code: <Text style={styles.codeText}>{payment.orderCode}</Text>
        </Text>
        <Text style={[Typography.captionSmall, styles.date]} numberOfLines={1}>
          {payment.date}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  amount: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 20,
    flexShrink: 1,
  },
  slash: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 4,
  },
  orderCode: {
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  codeText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  date: {
    color: Colors.textMuted,
    flexShrink: 0,
  },
});
