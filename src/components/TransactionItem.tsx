import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { Transaction } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { Badge } from './Badge';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (tx: Transaction) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const isDeposit = transaction.type === 'deposit';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress?.(transaction)}
      style={styles.card}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDeposit
                ? Colors.successBg
                : Colors.dangerBg,
            },
          ]}
        >
          {isDeposit ? (
            <ArrowDownLeft size={18} color={Colors.success} />
          ) : (
            <ArrowUpRight size={18} color={Colors.danger} />
          )}
        </View>

        <View style={styles.details}>
          <Text style={[Typography.bodySemiBold, styles.title]} numberOfLines={1}>
            {transaction.title}
          </Text>
          <Text style={[Typography.captionSmall, styles.date]} numberOfLines={1}>
            {transaction.date}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text
          style={[
            Typography.bodySemiBold,
            styles.amount,
            { color: Colors.textPrimary },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {transaction.formattedAmount}
        </Text>
        <Badge
          label={transaction.status === 'Failed' ? 'Close' : transaction.status}
          variant={transaction.status === 'Completed' ? 'success' : transaction.status === 'Failed' ? 'danger' : 'neutral'}
          size="sm"
          style={styles.badge}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: Spacing.xs,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  date: {
    color: Colors.textMuted,
    marginTop: 2,
    fontSize: 11,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  amount: {
    fontWeight: '700',
    fontSize: 15,
  },
  badge: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.xs,
  },
});
