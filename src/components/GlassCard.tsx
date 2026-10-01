import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  elevated?: boolean;
  borderAccent?: boolean;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 30,
  tint = 'dark',
  elevated = false,
  borderAccent = false,
  padding = Spacing.md,
}) => {
  const containerStyle: ViewStyle = {
    backgroundColor: elevated ? Colors.surfaceElevated : Colors.surface,
    borderColor: borderAccent ? Colors.borderAccent : Colors.border,
    padding,
    borderRadius: BorderRadius.md,
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.outer, containerStyle, style]}>
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  // Graceful android / web rendering with exact translucent surface
  return (
    <View
      style={[
        styles.outer,
        containerStyle,
        {
          backgroundColor: elevated
            ? 'rgba(23, 21, 33, 0.92)'
            : 'rgba(17, 16, 25, 0.88)',
        },
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
