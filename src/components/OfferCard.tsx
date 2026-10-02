import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OfferItem } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { Badge } from './Badge';
import { PrimaryButton } from './PrimaryButton';

interface OfferCardProps {
  offer: OfferItem;
  onClaim: (offer: OfferItem) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onClaim }) => {
  return (
    <View style={styles.card}>
      <View style={styles.leftIconContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.currencySymbol}>{offer.currency}</Text>
        </View>
      </View>

      <View style={styles.centerContent}>
        <View style={styles.badgeRow}>
          <Badge
            label={offer.badge}
            variant="outline"
            size="sm"
            style={styles.specialBadge}
            textStyle={{ color: Colors.primary, fontSize: 9 }}
          />
          <Text style={[Typography.captionSmall, styles.codeText]} numberOfLines={1}>
            Code: <Text style={styles.codeBold}>{offer.code}</Text>
          </Text>
        </View>

        <View style={styles.numbersRow}>
          <View style={styles.statCol}>
            <Text style={[Typography.captionSmall, styles.metaLabel]}>Amount</Text>
            <Text
              style={[Typography.bodySemiBold, styles.metaValue]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              ₹{offer.amount}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={[Typography.captionSmall, styles.metaLabel]}>Income</Text>
            <Text
              style={[
                Typography.bodySemiBold,
                styles.metaValue,
                { color: Colors.success },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              +{offer.income}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightAction}>
        <PrimaryButton
          title={offer.isClaimed ? 'Claimed' : 'Claim'}
          onPress={() => onClaim(offer)}
          size="sm"
          variant={offer.isClaimed ? 'secondary' : 'primary'}
          disabled={offer.isClaimed}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftIconContainer: {
    marginRight: Spacing.sm,
    flexShrink: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerContent: {
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.xs,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  specialBadge: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.borderAccent,
    paddingVertical: 1,
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  codeText: {
    color: Colors.textMuted,
    fontSize: 10,
    flexShrink: 1,
  },
  codeBold: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 2,
  },
  statCol: {
    flexDirection: 'column',
  },
  metaLabel: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  metaValue: {
    color: Colors.textPrimary,
    fontSize: 13,
  },
  rightAction: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
