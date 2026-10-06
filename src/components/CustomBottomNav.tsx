import React from 'react';
import {
  View,
  Text,
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
  CreditCard,
  Wallet,
  Users2,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { BorderRadius } from '../theme/spacing';

export type TabName = 'Home' | 'Plan' | 'Account' | 'Stats' | 'Assets' | 'Payments' | 'Tasks';

/**
 * Calculates dynamic bottom offset that adapts seamlessly between:
 * 1. Traditional 3-button navigation (Back/Home/Recents) on Android
 * 2. Gesture pill / home indicator navigation on Android & iOS
 * 3. Standard viewport devices (e.g. iPhone SE, desktop/web)
 */
export const getNavBottomOffset = (insetsBottom: number): number => {
  if (Platform.OS === 'android') {
    if (insetsBottom === 0) {
      // Android with 3-button navigation (standard system bar outside viewport)
      return 10;
    } else if (insetsBottom >= 40) {
      // Android with 3-button navigation rendered edge-to-edge inside viewport
      return insetsBottom + 6;
    } else {
      // Android with gesture navigation (safe inset typically 16-28dp)
      return insetsBottom + 6;
    }
  } else if (Platform.OS === 'ios') {
    if (insetsBottom === 0) {
      // Older iPhone SE / physical Home button
      return 10;
    } else {
      // Modern iPhone with gesture home bar (insetsBottom typically 34dp)
      return insetsBottom;
    }
  } else {
    // Web / desktop
    return 16;
  }
};

export const useBottomNavPadding = () => {
  const insets = useSafeAreaInsets();
  const bottomOffset = getNavBottomOffset(insets.bottom);
  const navBarHeight = 70;
  const bottomBuffer = 20; // Extra breathing room for scroll lists
  return bottomOffset + navBarHeight + bottomBuffer;
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
  { id: 'Plan', label: 'Payments', icon: CreditCard },
  { id: 'Account', label: 'Add account', icon: Wallet },
  { id: 'Stats', label: 'Stats', icon: Users2 },
  { id: 'Assets', label: 'My Assets', icon: User },
];

const TabButton: React.FC<{
  item: NavItemConfig;
  isActive: boolean;
  onPress: () => void;
}> = ({ item, isActive, onPress }) => {
  const scale = useSharedValue(isActive ? 1.05 : 1);
  const IconComp = item.icon;
  const isCenter = item.id === 'Account';

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1, {
      damping: 15,
      stiffness: 300,
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

  if (isCenter) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={styles.centerTabButton}
      >
        <Animated.View style={[styles.centerIconWrapper, animatedStyle]}>
          <Wallet size={22} color="#1E293B" strokeWidth={2.2} />
        </Animated.View>
        <Text
          style={[
            styles.centerTabLabel,
            { color: isActive ? Colors.primary : Colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.iconWrapper, animatedStyle]}>
        <IconComp
          size={22}
          color={isActive ? Colors.primary : Colors.textMuted}
          strokeWidth={isActive ? 2.4 : 1.8}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isActive ? Colors.primary : Colors.textMuted },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export const CustomBottomNav: React.FC<CustomBottomNavProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = getNavBottomOffset(insets.bottom);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: bottomOffset }]}
    >
      <View style={styles.navBar}>
        {Platform.OS === 'ios' && (
          <BlurView
            intensity={60}
            tint="light"
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
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 999,
  },
  navBar: {
    width: '100%',
    maxWidth: 440,
    height: 70,
    borderRadius: BorderRadius.full,
    backgroundColor:
      Platform.OS === 'ios'
        ? 'rgba(255, 255, 255, 0.95)'
        : '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  itemsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  centerTabButton: {
    width: 68,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  centerIconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  centerTabLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
