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
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress?.(payment)}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <Text
          style={[Typography.h2, styles.amount]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {payment.currency}
          {payment.amount}
          <Text style={styles.slash}>/-</Text>
        </Text>
        <Badge
          label={payment.status}
          variant={
            payment.status === 'New'
              ? 'danger'
              : payment.status === 'Completed'
              ? 'success'
              : 'warning'
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
