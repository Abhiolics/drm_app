import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback on web/unsupported devices
    }
    onPress();
  };

  // Sizing
  const sizeStyles: Record<string, { height: number; paddingHorizontal: number; fontSize: number }> = {
    sm: { height: 32, paddingHorizontal: Spacing.sm, fontSize: 12 },
    md: { height: 42, paddingHorizontal: Spacing.md, fontSize: 14 },
    lg: { height: 50, paddingHorizontal: Spacing.xl, fontSize: 16 },
  };

  const currentSize = sizeStyles[size];

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled}
        style={[
          styles.container,
          animatedStyle,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={Colors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            { height: currentSize.height, paddingHorizontal: currentSize.paddingHorizontal },
          ]}
        >
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text
            style={[
              Typography.button,
              styles.primaryText,
              { fontSize: currentSize.fontSize },
              icon ? styles.textWithIcon : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  const getVariantStyles = (): { bg: string; border?: string; text: string } => {
    switch (variant) {
      case 'secondary':
        return {
          bg: Colors.surfaceElevated,
          border: Colors.border,
          text: Colors.textPrimary,
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: Colors.borderAccent,
          text: Colors.primary,
        };
      case 'danger':
        return {
          bg: Colors.dangerBg,
          border: Colors.danger,
          text: Colors.danger,
        };
      case 'ghost':
      default:
        return {
          bg: 'transparent',
          text: Colors.textSecondary,
        };
    }
  };

  const vStyle = getVariantStyles();

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        animatedStyle,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          backgroundColor: vStyle.bg,
          borderColor: vStyle.border || 'transparent',
          borderWidth: vStyle.border ? 1 : 0,
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && iconPosition === 'left' && <>{icon}</>}
      <Text
        style={[
          Typography.button,
          { color: vStyle.text, fontSize: currentSize.fontSize },
          icon ? styles.textWithIcon : undefined,
          textStyle,
        ]}
      >
        {title}
      </Text>
      {icon && iconPosition === 'right' && <>{icon}</>}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
  },
  fullWidth: {
    width: '100%',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textWithIcon: {
    marginHorizontal: Spacing.xs,
  },
  disabled: {
    opacity: 0.45,
  },
});
