import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ApiPlan, OfferItem } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { Badge } from './Badge';
import { PrimaryButton } from './PrimaryButton';

interface OfferCardProps {
  plan?: ApiPlan;
  offer?: OfferItem;
  isUserCurrentPlan?: boolean;
  onClaim: (item: ApiPlan | OfferItem) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  plan,
  offer,
  isUserCurrentPlan = false,
  onClaim,
}) => {
  const title = plan ? plan.name : (offer ? offer.badge : 'VIP Plan');
  const amount = plan ? plan.amount : (offer ? offer.amount : 0);
  const code = plan ? plan._id.slice(-6).toUpperCase() : (offer ? offer.code : 'DRMP');
  const description = plan ? plan.description : (offer ? `+${offer.income} bonus` : '');
  const isClaimed = isUserCurrentPlan || (offer?.isClaimed ?? false);

  return (
    <View style={styles.card}>
      <View style={styles.leftIconContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.currencySymbol}>DRMP</Text>
        </View>
      </View>

      <View style={styles.centerContent}>
        <View style={styles.badgeRow}>
          <Badge
            label={title}
            variant="outline"
            size="sm"
            style={styles.specialBadge}
            textStyle={{ color: Colors.primary, fontSize: 9 }}
          />
          <Text style={[Typography.captionSmall, styles.codeText]} numberOfLines={1}>
            Tier: <Text style={styles.codeBold}>{code}</Text>
          </Text>
        </View>

        <View style={styles.numbersRow}>
          <View style={styles.statCol}>
            <Text style={[Typography.captionSmall, styles.metaLabel]}>Plan Amount</Text>
            <Text
              style={[Typography.bodySemiBold, styles.metaValue]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              ₹{amount.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.statCol, { flex: 1.2 }]}>
            <Text style={[Typography.captionSmall, styles.metaLabel]}>Benefits</Text>
            <Text
              style={[
                Typography.captionSmall,
                styles.metaValue,
                { color: Colors.success, fontSize: 11 },
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightAction}>
        <PrimaryButton
          title={isClaimed ? 'Active' : 'Activate'}
          onPress={() => onClaim(plan || (offer as OfferItem))}
          size="sm"
          variant={isClaimed ? 'secondary' : 'primary'}
          disabled={isClaimed}
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
    gap: Spacing.sm,
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
