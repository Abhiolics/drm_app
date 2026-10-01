import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Spacing } from '../theme/spacing';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />

      {/* Ambient background glow */}
      <View style={styles.ambientGlow} />

      <View style={styles.content}>
        {/* Emblem Logo */}
        <View style={styles.logoOuter}>
          <LinearGradient
            colors={Colors.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <ShieldCheck size={48} color="#FFFFFF" strokeWidth={2.2} />
          </LinearGradient>
        </View>

        {/* Brand Name */}
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>PayApp</Text>
          <View style={styles.sparkleWrap}>
            <Sparkles size={16} color={Colors.primary} />
          </View>
        </View>

        <Text style={styles.brandTagline}>
          Fast Payout & Instant UPI Rewards
        </Text>

        {/* Loading Spinner */}
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Secured by 256-Bit Encryption</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: '30%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(124, 92, 252, 0.15)',
    filter: 'blur(50px)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    backgroundColor: 'rgba(124, 92, 252, 0.25)',
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    fontFamily: Typography.h1.fontFamily,
  },
  sparkleWrap: {
    marginLeft: 6,
    marginTop: -8,
  },
  brandTagline: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  spinnerContainer: {
    marginTop: Spacing.xxl,
  },
  footer: {
    paddingBottom: Spacing.xl,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
