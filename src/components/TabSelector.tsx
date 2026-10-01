import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface TabSelectorProps<T extends string> {
  tabs: { id: T; label: string }[];
  activeTab: T;
  onSelectTab: (tabId: T) => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'segmented' | 'pills';
}

export function TabSelector<T extends string>({
  tabs,
  activeTab,
  onSelectTab,
  style,
  variant = 'segmented',
}: TabSelectorProps<T>) {
  const handleSelect = (id: T) => {
    if (id !== activeTab) {
      try {
        Haptics.selectionAsync();
      } catch {
        // Fallback
      }
      onSelectTab(id);
    }
  };

  if (variant === 'pills') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.pillsContainer, style]}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              activeOpacity={0.7}
              onPress={() => handleSelect(tab.id)}
              style={[
                styles.pillButton,
                isActive ? styles.pillButtonActive : styles.pillButtonInactive,
              ]}
            >
              <Text
                style={[
                  Typography.caption,
                  isActive ? styles.pillTextActive : styles.pillTextInactive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.segmentedContainer, style]}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.75}
            onPress={() => handleSelect(tab.id)}
            style={[
              styles.segmentTab,
              isActive && styles.segmentTabActive,
            ]}
          >
            <Text
              style={[
                Typography.tab,
                isActive ? styles.segmentTextActive : styles.segmentTextInactive,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  segmentTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  segmentTextInactive: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingRight: Spacing.md,
  },
  pillButton: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  pillButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  pillButtonInactive: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderSubtle,
  },
  pillTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  pillTextInactive: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
