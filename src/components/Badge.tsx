import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';

export type BadgeVariant =
  | 'accent'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'neutral'
  | 'outline';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'accent',
  style,
  textStyle,
  size = 'sm',
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: Colors.successBg, text: Colors.success, border: 'transparent' };
      case 'danger':
        return { bg: Colors.dangerBg, text: Colors.danger, border: 'transparent' };
      case 'warning':
        return { bg: Colors.warningBg, text: Colors.warning, border: 'transparent' };
      case 'info':
        return { bg: Colors.infoBg, text: Colors.info, border: 'transparent' };
      case 'neutral':
        return { bg: 'rgba(255,255,255,0.06)', text: Colors.textSecondary, border: Colors.borderSubtle };
      case 'outline':
        return { bg: 'transparent', text: Colors.primary, border: Colors.borderAccent };
      case 'accent':
      default:
        return { bg: Colors.primaryLight, text: Colors.primary, border: Colors.borderAccent };
    }
  };

  const current = getColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
          borderWidth: current.border !== 'transparent' ? 1 : 0,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? Spacing.xs : Spacing.sm,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: current.text,
            fontSize: isSm ? 10 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
