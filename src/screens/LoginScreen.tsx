import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

type LoginStep = 'email' | 'otp';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<LoginStep>('email');
  const [email, setEmail] = useState('katty@payapp.com');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const otpInputRef = useRef<TextInput>(null);

  // Timer for resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'otp' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, countdown]);

  const handleSendOtp = () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback
      }
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
      setCountdown(30);
      setOtp('');
      setTimeout(() => otpInputRef.current?.focus(), 250);
    }, 800);
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) {
      setErrorMessage('Please enter the 4-digit verification code.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback
      }
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Fallback
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess();
    }, 900);
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    setCountdown(30);
    setOtp('');
    setErrorMessage(null);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Fallback
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Brand Badge */}
          <View style={styles.brandHero}>
            <View style={styles.brandIconWrap}>
              <LinearGradient
                colors={Colors.accentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.brandIconGradient}
              >
                <ShieldCheck size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.appName}>PayApp</Text>
              <Sparkles size={16} color={Colors.primary} style={{ marginLeft: 6 }} />
            </View>

            <Text style={styles.appTagline}>
              {step === 'email'
                ? 'Sign in to access your instant balance and rewards'
                : 'Enter one-time password to verify identity'}
            </Text>
          </View>

          {/* Step 1: Email Input View */}
          {step === 'email' && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Registered Email</Text>

              <View style={styles.inputRow}>
                <Mail size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={(txt) => {
                    setEmail(txt);
                    setErrorMessage(null);
                  }}
                  placeholder="name@example.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Quick Fill Demo Email */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setEmail('katty@payapp.com')}
                style={styles.quickFillBtn}
              >
                <Text style={styles.quickFillText}>
                  Use Demo Account: <Text style={{ color: Colors.primary }}>katty@payapp.com</Text>
                </Text>
              </TouchableOpacity>

              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSendOtp}
                disabled={isSubmitting}
                style={styles.primaryBtn}
              >
                <LinearGradient
                  colors={Colors.accentGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Get OTP Code</Text>
                      <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: OTP Verification View */}
          {step === 'otp' && (
            <View style={styles.formContainer}>
              <View style={styles.otpHeaderRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setStep('email');
                    setErrorMessage(null);
                  }}
                  style={styles.backBtn}
                >
                  <ArrowLeft size={16} color={Colors.textSecondary} />
                  <Text style={styles.backBtnText}>Change Email</Text>
                </TouchableOpacity>

                <View style={styles.sentEmailPill}>
                  <Text style={styles.sentEmailText} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Enter 4-Digit Verification Code</Text>

              {/* 4 Digit Boxes */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => otpInputRef.current?.focus()}
                style={styles.otpBoxesRow}
              >
                {[0, 1, 2, 3].map((idx) => {
                  const digit = otp[idx] || '';
                  const isCurrent = otp.length === idx;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.otpBox,
                        isCurrent && styles.otpBoxActive,
                        digit ? styles.otpBoxFilled : null,
                      ]}
                    >
                      <Text style={styles.otpDigitText}>{digit}</Text>
                    </View>
                  );
                })}
              </TouchableOpacity>

              {/* Hidden Actual Input */}
              <TextInput
                ref={otpInputRef}
                style={styles.hiddenInput}
                value={otp}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '').slice(0, 4);
                  setOtp(cleaned);
                  setErrorMessage(null);
                  if (cleaned.length === 4) {
                    try {
                      Haptics.selectionAsync();
                    } catch {
                      // Fallback
                    }
                  }
                }}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus={true}
              />

              {/* Quick Fill Demo OTP Hint */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setOtp('1234')}
                style={styles.quickFillBtn}
              >
                <Text style={styles.quickFillText}>
                  Tap to Fill Demo OTP: <Text style={{ color: Colors.success, fontWeight: '700' }}>1234</Text>
                </Text>
              </TouchableOpacity>

              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Resend Countdown */}
              <View style={styles.resendRow}>
                {countdown > 0 ? (
                  <Text style={styles.resendTimerText}>
                    Resend code in <Text style={{ color: Colors.primary }}>{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity activeOpacity={0.7} onPress={handleResendOtp}>
                    <Text style={styles.resendActionText}>Resend Code Now</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleVerifyOtp}
                disabled={isSubmitting}
                style={styles.primaryBtn}
              >
                <LinearGradient
                  colors={Colors.accentGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Verify & Sign In</Text>
                      <CheckCircle2 size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Security Guarantee Notice */}
          <View style={styles.securityFooter}>
            <Lock size={14} color={Colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.securityFooterText}>
              End-to-end encrypted session • Official PayApp Gateway
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  brandIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2,
    backgroundColor: 'rgba(124, 92, 252, 0.2)',
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginBottom: Spacing.md,
  },
  brandIconGradient: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    fontFamily: Typography.h1.fontFamily,
    letterSpacing: -0.5,
  },
  appTagline: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: Spacing.md,
    lineHeight: 18,
  },
  formContainer: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  inputLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    padding: 0,
    fontFamily: Typography.body.fontFamily,
  },
  quickFillBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  quickFillText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 92, 112, 0.12)',
    borderRadius: BorderRadius.sm,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  primaryBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // OTP Styles
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  sentEmailPill: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    maxWidth: 160,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sentEmailText: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.md,
  },
  otpBox: {
    width: 58,
    height: 62,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  otpBoxFilled: {
    borderColor: Colors.borderAccent,
  },
  otpDigitText: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendTimerText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  resendActionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // Footer
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  securityFooterText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
