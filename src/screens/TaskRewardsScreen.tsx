import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Header } from '../components/Header';
import { TabSelector } from '../components/TabSelector';
import { TaskItemCard } from '../components/TaskItemCard';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { mockTasks } from '../data/mockData';
import { TaskCategory, TaskItem } from '../types';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface TaskRewardsScreenProps {
  onBack?: () => void;
  showBack?: boolean;
}

export const TaskRewardsScreen: React.FC<TaskRewardsScreenProps> = ({
  onBack,
  showBack = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('newbie');
  const [tasksList, setTasksList] = useState<TaskItem[]>(mockTasks);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const bottomNavPadding = useBottomNavPadding();

  const tabs: { id: TaskCategory; label: string }[] = [
    { id: 'newbie', label: 'Newbie Tasks' },
    { id: 'growth', label: 'Team Growth' },
    { id: 'daily', label: 'Daily Tasks' },
  ];

  const currentTasks = tasksList.filter((t) => t.category === activeCategory);

  const handleUpdateTask = (updated: TaskItem) => {
    setTasksList((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
    setSelectedTask(updated);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

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
            activeTab={activeCategory}
            onSelectTab={(cat) => setActiveCategory(cat)}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomNavPadding }]}
        >
          {currentTasks.map((task) => (
            <TaskItemCard
              key={task.id}
              task={task}
              onPressCard={(item) => setSelectedTask(item)}
              onPressCTA={(item) => setSelectedTask(item)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Interactive Active Task Modal with Reanimated Progress */}
      <TaskDetailModal
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        onUpdateTask={handleUpdateTask}
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
  },
});
