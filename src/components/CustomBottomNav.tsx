import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import {
  Home,
  Receipt,
  Plus,
  BarChart3,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';

export type TabName = 'Home' | 'Payments' | 'Account' | 'Stats' | 'Assets' | 'Tasks';

export const useBottomNavPadding = () => {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom > 0 ? insets.bottom + 8 : 16, 16) + 64 + 20;
};

interface CustomBottomNavProps {
  currentTab: TabName;
  onSelectTab: (tab: TabName) => void;
}

interface NavItemConfig {
  id: TabName;
  label: string;
  icon: typeof Home;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'Home', label: 'Home', icon: Home },
  { id: 'Payments', label: 'Payments', icon: Receipt },
  { id: 'Account', label: 'Account', icon: Plus },
  { id: 'Stats', label: 'Stats', icon: BarChart3 },
  { id: 'Assets', label: 'Assets', icon: User },
];

const TabButton: React.FC<{
  item: NavItemConfig;
  isActive: boolean;
  onPress: () => void;
}> = ({ item, isActive, onPress }) => {
  const scale = useSharedValue(isActive ? 1.08 : 1);
  const IconComp = item.icon;
  const isCenter = item.id === 'Account';

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.12 : 1, {
      damping: 14,
      stiffness: 280,
    });
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Fallback
    }
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          isCenter && styles.centerIconWrapper,
          isCenter && isActive && styles.centerIconWrapperActive,
          animatedStyle,
        ]}
      >
        <IconComp
          size={isCenter ? 24 : 22}
          color={
            isCenter
              ? '#FFFFFF'
              : isActive
              ? Colors.primary
              : Colors.textMuted
          }
          strokeWidth={isCenter ? 2.6 : isActive ? 2.4 : 1.8}
        />
        {isActive && !isCenter && (
          <View style={styles.activeDotContainer}>
            <View style={styles.activeDot} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export const CustomBottomNav: React.FC<CustomBottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom > 0 ? insets.bottom + 8 : 16, 16);

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <View style={styles.navBar}>
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={45}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.itemsContainer}>
          {NAV_ITEMS.map((item) => (
            <TabButton
              key={item.id}
              item={item}
              isActive={currentTab === item.id}
              onPress={() => onSelectTab(item.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    alignItems: 'center',
    zIndex: 999,
  },
  navBar: {
    width: '100%',
    maxWidth: 440,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(17, 16, 25, 0.78)'
        : 'rgba(17, 16, 25, 0.94)',
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  itemsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  activeDotContainer: {
    position: 'absolute',
    bottom: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  centerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1B2C',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  centerIconWrapperActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});
