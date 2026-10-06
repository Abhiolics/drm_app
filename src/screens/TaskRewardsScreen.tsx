import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Award } from 'lucide-react-native';
import { Header } from '../components/Header';
import { TabSelector } from '../components/TabSelector';
import { TaskItemCard } from '../components/TaskItemCard';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { taskService } from '../services/taskService';
import { ApiTask } from '../types';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface TaskRewardsScreenProps {
  onBack?: () => void;
  showBack?: boolean;
}

type TaskTab = 'all' | 'pending' | 'completed';

export const TaskRewardsScreen: React.FC<TaskRewardsScreenProps> = ({
  onBack,
  showBack = true,
}) => {
  const [activeTab, setActiveTab] = useState<TaskTab>('all');
  const [tasksList, setTasksList] = useState<ApiTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomNavPadding = useBottomNavPadding();

  const tabs: { id: TaskTab; label: string }[] = [
    { id: 'all', label: 'All Tasks' },
    { id: 'pending', label: 'Under Review' },
    { id: 'completed', label: 'Completed' },
  ];

  useEffect(() => {
    let isCancelled = false;
    taskService.getTasks().then((res) => {
      if (isCancelled) return;
      if (Array.isArray(res)) {
        setTasksList(res);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!isCancelled) setIsLoading(false);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await taskService.getTasks();
      if (Array.isArray(res)) {
        setTasksList(res);
      }
    } catch (error) {
      console.warn('Failed to load tasks:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTasks = tasksList.filter((task) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return task.mySubmission?.status === 'pending';
    if (activeTab === 'completed') return task.mySubmission?.status === 'approved';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <Header
        title="Task Rewards"
        showBack={showBack}
        onBack={onBack}
        centerTitle
      />

      <View style={styles.mainContainer}>
        <View style={styles.tabContainer}>
          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onSelectTab={(cat) => setActiveTab(cat as TaskTab)}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching daily tasks...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomNavPadding }]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
          >
            {filteredTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Award size={32} color={Colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'all'
                    ? 'No Active Tasks Right Now'
                    : activeTab === 'pending'
                    ? 'No Tasks Under Review'
                    : 'No Completed Tasks Yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'all'
                    ? 'Check back later for new reward tasks and promotional missions.'
                    : activeTab === 'pending'
                    ? 'Tasks you submit will appear here while our review team verifies them.'
                    : 'Complete daily tasks and submit screenshot proofs to earn rewards.'}
                </Text>
              </View>
            ) : (
              filteredTasks.map((task) => (
                <TaskItemCard
                  key={task._id}
                  task={task}
                  onPressCard={(item) => setSelectedTask(item)}
                  onPressCTA={(item) => setSelectedTask(item)}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Task Proof Submission Modal */}
      <TaskDetailModal
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onTaskSubmitted={() => {
          handleRefresh();
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  tabContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
