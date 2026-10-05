import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Award, Clock } from 'lucide-react-native';
import { ApiTask } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { Badge } from './Badge';
import { PrimaryButton } from './PrimaryButton';

interface TaskItemCardProps {
  task: ApiTask;
  onPressCTA?: (task: ApiTask) => void;
  onPressCard?: (task: ApiTask) => void;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  onPressCTA,
  onPressCard,
}) => {
  const submission = task.mySubmission;
  const isApproved = submission?.status === 'approved';
  const isPending = submission?.status === 'pending';
  const isRejected = submission?.status === 'rejected';

  const badgeLabel = isApproved
    ? 'Completed'
    : isPending
    ? 'Under Review'
    : isRejected
    ? 'Rejected'
    : 'Active';

  const badgeVariant = isApproved
    ? 'success'
    : isPending
    ? 'warning'
    : isRejected
    ? 'danger'
    : 'outline';

  const ctaText = isApproved
    ? 'Claimed ✓'
    : isPending
    ? 'Under Review'
    : isRejected
    ? 'Resubmit'
    : 'Submit Proof';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPressCard?.(task)}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <Badge
          label={badgeLabel}
          variant={badgeVariant}
          size="sm"
          style={styles.tagBadge}
        />
        <View style={styles.tagRight}>
          <Clock size={12} color={Colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={[Typography.captionSmall, styles.validDate]}>
            Daily Reward
          </Text>
        </View>
      </View>

      <Text style={[Typography.sectionTitle, styles.title]} numberOfLines={2}>
        {task.title}
      </Text>

      <Text style={[Typography.body, styles.description]} numberOfLines={3}>
        {task.description}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.rewardContainer}>
          <View style={styles.rewardIconWrapper}>
            <Award size={14} color={Colors.primary} />
          </View>
          <Text style={[Typography.bodySemiBold, styles.rewardText]}>
            ₹ {task.rewardAmount}.00
          </Text>
        </View>

        <View style={styles.ctaWrapper}>
          <PrimaryButton
            title={ctaText}
            onPress={() => (onPressCTA ? onPressCTA(task) : onPressCard?.(task))}
            size="sm"
            variant={
              isApproved
                ? 'secondary'
                : isPending
                ? 'outline'
                : 'primary'
            }
            disabled={isApproved || isPending}
          />
        </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 0,
  },
  tagRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validDate: {
    color: Colors.textMuted,
    flexShrink: 0,
  },
  title: {
    color: Colors.textPrimary,
    marginTop: 2,
    marginBottom: 6,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  rewardIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    flexShrink: 0,
  },
  rewardText: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  ctaWrapper: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
