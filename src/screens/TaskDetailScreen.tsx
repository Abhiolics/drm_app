import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Award, Clock, CheckCircle2, Circle, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Header } from '../components/Header';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { TaskItem } from '../types';

interface TaskDetailScreenProps {
  onBack?: () => void;
  taskItem?: TaskItem;
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({
  onBack,
  taskItem,
}) => {
  const [task, setTask] = useState<TaskItem>(
    taskItem || {
      id: 'task-active-main',
      category: 'daily',
      tag: 'TODAY',
      title: 'Daily Incentive Bonus 2026-08-02',
      description:
        'Participate in daily reading activities. Depending on your total reading amount, you will get rewards on the next day.',
      rewardPoints: 100,
      rewardInr: 100,
      status: 'in_progress',
      progressPercent: 65,
      ctaText: 'In Progress',
      deadline: 'Today, 23:59',
      steps: [
        { title: 'Daily login attendance confirmed', done: true },
        { title: 'Read financial report (Session 1: 15 min)', done: true },
        { title: 'Read market overview (Session 2: 15 min)', done: false },
        { title: 'Claim end-of-day bonus grant', done: false },
      ],
    }
  );

  const progressVal = useSharedValue(0);

  useEffect(() => {
    progressVal.value = 0;
    progressVal.value = withTiming(task.progressPercent / 100, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [task.progressPercent, progressVal]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${Math.min(100, Math.max(0, progressVal.value * 100))}%`,
  }));

  const handleToggleStep = (index: number) => {
    if (!task.steps) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
    const updatedSteps = [...task.steps];
    updatedSteps[index].done = !updatedSteps[index].done;

    const completedCount = updatedSteps.filter((s) => s.done).length;
    const newPercent = Math.round((completedCount / updatedSteps.length) * 100);

    setTask({
      ...task,
      steps: updatedSteps,
      progressPercent: newPercent,
      status: newPercent === 100 ? 'claimable' : 'in_progress',
      ctaText: newPercent === 100 ? 'Claim Reward' : 'In Progress',
    });
  };

  const handleMainCTA = () => {
    if (task.steps) {
      const firstUndone = task.steps.findIndex((s) => !s.done);
      if (firstUndone !== -1) {
        handleToggleStep(firstUndone);
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Fallback
        }
        onBack?.();
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />

      <Header
        title="Active Task"
        showBack={!!onBack}
        onBack={onBack}
        centerTitle
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.badgeRow}>
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

        <Text style={[Typography.h2, styles.title]}>{task.title}</Text>
        <Text style={[Typography.body, styles.description]}>
          {task.description}
        </Text>

        {/* Reward & Deadline Card */}
        <View style={styles.metricCard}>
          <View style={styles.metricCol}>
            <View style={styles.iconCircle}>
              <Award size={18} color={Colors.primary} />
            </View>
            <Text style={styles.metricLabel}>Reward</Text>
            <Text
              style={styles.metricValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              +{task.rewardPoints} Pts (₹{task.rewardInr || task.rewardPoints})
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricCol}>
            <View style={styles.iconCircle}>
              <Clock size={18} color={Colors.secondary} />
            </View>
            <Text style={styles.metricLabel}>Deadline</Text>
            <Text
              style={styles.metricValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {task.deadline || 'Today 23:59'}
            </Text>
          </View>
        </View>

        {/* Animated Progress Section */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Overall Task Progress</Text>
            <Text style={styles.progressPercent}>{task.progressPercent}%</Text>
          </View>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, animatedProgressStyle]} />
          </View>
        </View>

        {/* Instructions / Step by Step Criteria */}
        {task.steps && (
          <View style={styles.section}>
            <Text style={[Typography.sectionTitle, styles.sectionTitle]}>
              Step-by-Step Instructions
            </Text>
            {task.steps.map((step, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => handleToggleStep(idx)}
                style={styles.stepCard}
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

        <View style={styles.guaranteeBox}>
          <ShieldCheck size={16} color={Colors.primary} />
          <Text style={styles.guaranteeText}>
            Rewards are automatically credited within 24 hours of completion
          </Text>
        </View>

        {/* Main CTA */}
        <PrimaryButton
          title={
            task.status === 'claimable'
              ? 'Claim +100 Points Reward'
              : 'Complete Next Step'
          }
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleMainCTA}
        />
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
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statusBadge: {},
  title: {
    color: Colors.textPrimary,
    marginTop: 4,
    marginBottom: 6,
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
    marginBottom: Spacing.md,
  },
  metricCol: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricLabel: {
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
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
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
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 92, 252, 0.08)',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    gap: Spacing.xs,
  },
  guaranteeText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
});
