import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Award } from 'lucide-react-native';
import { TaskItem } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { Badge } from './Badge';
import { PrimaryButton } from './PrimaryButton';

interface TaskItemCardProps {
  task: TaskItem;
  onPressCTA?: (task: TaskItem) => void;
  onPressCard?: (task: TaskItem) => void;
}

export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  onPressCTA,
  onPressCard,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPressCard?.(task)}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <Badge
          label={task.tag}
          variant="outline"
          size="sm"
          style={styles.tagBadge}
        />
        {task.validUntil && (
          <Text style={[Typography.captionSmall, styles.validDate]}>
            {task.validUntil}
          </Text>
        )}
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
            {task.rewardPoints}
          </Text>
        </View>

        <View style={styles.ctaWrapper}>
          <PrimaryButton
            title={task.ctaText}
            onPress={() => (onPressCTA ? onPressCTA(task) : onPressCard?.(task))}
            size="sm"
            variant={
              task.status === 'in_progress'
                ? 'outline'
                : task.ctaText === 'Not Started'
                ? 'secondary'
                : 'primary'
            }
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
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderColor: Colors.primaryLight,
  },
  validDate: {
    color: Colors.textMuted,
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
    gap: Spacing.xs,
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
    minWidth: 90,
  },
});
