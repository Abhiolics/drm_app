import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { X, Award, Clock, CheckCircle2, Circle } from 'lucide-react-native';
import { TaskItem } from '../types';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { Badge } from './Badge';
import { PrimaryButton } from './PrimaryButton';

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  task: TaskItem | null;
  onUpdateTask?: (updated: TaskItem) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  onClose,
  task,
  onUpdateTask,
}) => {
  const insets = useSafeAreaInsets();
  const progressVal = useSharedValue(0);

  useEffect(() => {
    if (visible && task) {
      progressVal.value = 0;
      progressVal.value = withTiming(task.progressPercent / 100, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [visible, task, progressVal]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, progressVal.value * 100))}%`,
  }));

  if (!task) return null;

  const handleToggleStep = (index: number) => {
    if (!task.steps) return;
    const updatedSteps = [...task.steps];
    updatedSteps[index].done = !updatedSteps[index].done;

    const completedCount = updatedSteps.filter((s) => s.done).length;
    const newPercent = Math.round((completedCount / updatedSteps.length) * 100);

    const updatedTask: TaskItem = {
      ...task,
      steps: updatedSteps,
      progressPercent: newPercent,
      status: newPercent === 100 ? 'claimable' : 'in_progress',
      ctaText: newPercent === 100 ? 'Claim Reward' : 'In Progress',
    };

    progressVal.value = withTiming(newPercent / 100, { duration: 400 });
    onUpdateTask?.(updatedTask);
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
            <View style={styles.tagRow}>
              <Badge label={task.tag} variant="outline" size="sm" />
              <Badge
                label={
                  task.status === 'claimable'
                    ? 'Claim Ready'
                    : task.status === 'in_progress'
                    ? 'In Progress'
                    : 'Active'
                }
                variant={task.status === 'claimable' ? 'success' : 'accent'}
                size="sm"
                style={styles.statusBadge}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={[Typography.h2, styles.title]}>{task.title}</Text>
            <Text style={[Typography.body, styles.description]}>
              {task.description}
            </Text>

            {/* Metrics Card */}
            <View style={styles.metricCard}>
              <View style={styles.metricCol}>
                <View style={styles.metricIconWrap}>
                  <Award size={18} color={Colors.primary} />
                </View>
                <Text style={styles.metricSub}>Reward Payout</Text>
                <Text style={styles.metricValue}>
                  +{task.rewardPoints} Pts (₹{task.rewardInr || task.rewardPoints})
                </Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricCol}>
                <View style={styles.metricIconWrap}>
                  <Clock size={18} color={Colors.secondary} />
                </View>
                <Text style={styles.metricSub}>Valid Until</Text>
                <Text style={styles.metricValue}>
                  {task.deadline || task.validUntil || 'Active'}
                </Text>
              </View>
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Task Completion</Text>
                <Text style={styles.progressPercentText}>
                  {task.progressPercent}%
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[styles.progressBarFill, animatedProgressStyle]}
                />
              </View>
            </View>

            {/* Steps Checklist */}
            {task.steps && task.steps.length > 0 && (
              <View style={styles.checklistSection}>
                <Text style={[Typography.sectionTitle, styles.checklistTitle]}>
                  Step by Step Criteria
                </Text>
                {task.steps.map((step, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => handleToggleStep(idx)}
                    style={styles.stepItem}
                  >
                    {step.done ? (
                      <CheckCircle2 size={20} color={Colors.success} />
                    ) : (
                      <Circle size={20} color={Colors.textMuted} />
                    )}
                    <Text
                      style={[
                        styles.stepText,
                        step.done && styles.stepTextDone,
                      ]}
                    >
                      {step.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* CTA */}
            <View style={styles.footerCTA}>
              <PrimaryButton
                title={
                  task.status === 'claimable'
                    ? 'Claim +100 Points Now'
                    : 'Mark Next Step Complete'
                }
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  if (task.steps) {
                    const firstUndone = task.steps.findIndex((s) => !s.done);
                    if (firstUndone !== -1) {
                      handleToggleStep(firstUndone);
                    } else {
                      onClose();
                    }
                  } else {
                    onClose();
                  }
                }}
              />
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
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statusBadge: {
    marginLeft: 6,
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
  title: {
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  description: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 4,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercentText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  checklistSection: {
    marginBottom: Spacing.lg,
  },
  checklistTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  stepText: {
    color: Colors.textPrimary,
    fontSize: 13,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  stepTextDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  footerCTA: {
    marginTop: Spacing.sm,
  },
});
