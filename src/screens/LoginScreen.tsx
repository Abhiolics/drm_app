import React, { useState, useRef, useEffect } from 'react';
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
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  RotateCw,
  KeyRound,
  User,
  Phone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'otp' | 'password' | 'register';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');

  // Form Fields
  const [email, setEmail] = useState('katty@dreampay.com');
  const [password, setPassword] = useState('Password@123');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  const [countdown, setCountdown] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const otpInputRef = useRef<TextInput>(null);

  // Timer for resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (otpStep === 'verify' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, countdown]);

  // 1. Password Login
  const handlePasswordLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await authService.login(trimmedEmail, password);
      setIsSubmitting(false);

      if (res.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Fallback
        }
        onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Unable to connect to DreamPay server.'
      );
    }
  };

  // 2. Register Account
  const handleRegister = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await authService.register(
        trimmedName,
        trimmedPhone || '9876543210',
        trimmedEmail,
        password
      );
      setIsSubmitting(false);

      if (res.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Fallback
        }
        onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Registration failed. Try again.'
      );
    }
  };

  // 3. Send OTP
  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setErrorMessage(null);
    setSuccessNotice(null);
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await authService.sendOtp(trimmed);
      setIsSubmitting(false);

      if (res.success) {
        setOtpStep('verify');
        setCountdown(30);
        setOtp(res.otp || '');
        if (res.otp) {
          setSuccessNotice(`Demo OTP: ${res.otp}`);
        }
        setTimeout(() => otpInputRef.current?.focus(), 250);
      } else {
        setErrorMessage(res.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        err.response?.data?.message || err.message || 'No account found with this email. Please register.'
      );
    }
  };

  // 4. Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await authService.verifyOtp(email.trim(), otp.trim());
      setIsSubmitting(false);

      if (res.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Fallback
        }
        onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Invalid or expired OTP.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.response?.data?.message || 'Verification failed. Try again.');
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
                style={styles.brandGradient}
              >
                <ShieldCheck size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.appName}>DreamPay</Text>
              <Sparkles size={16} color={Colors.primary} style={{ marginLeft: 6 }} />
            </View>

            <Text style={styles.appTagline}>
              {authMode === 'register'
                ? 'Create your verified DreamPay wallet account'
                : 'Sign in to access your instant balance and rewards'}
            </Text>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAuthMode('password');
                setErrorMessage(null);
              }}
              style={[styles.modeTab, authMode === 'password' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, authMode === 'password' && styles.modeTabTextActive]}>
                Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAuthMode('otp');
                setOtpStep('send');
                setErrorMessage(null);
              }}
              style={[styles.modeTab, authMode === 'otp' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, authMode === 'otp' && styles.modeTabTextActive]}>
                OTP Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setAuthMode('register');
                setErrorMessage(null);
              }}
              style={[styles.modeTab, authMode === 'register' && styles.modeTabActive]}
            >
              <Text style={[styles.modeTabText, authMode === 'register' && styles.modeTabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mode 1: Password Login */}
          {authMode === 'password' && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
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

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={(txt) => {
                    setPassword(txt);
                    setErrorMessage(null);
                  }}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
              </View>

              {/* Demo Account shortcut */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setEmail('katty@dreampay.com');
                  setPassword('Password@123');
                }}
                style={styles.quickFillBtn}
              >
                <Text style={styles.quickFillText}>
                  Use Demo: <Text style={{ color: Colors.primary }}>katty@dreampay.com</Text> • Password@123
                </Text>
              </TouchableOpacity>

              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePasswordLogin}
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
                      <Text style={styles.primaryBtnText}>Sign In</Text>
                      <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Mode 2: OTP Login */}
          {authMode === 'otp' && (
            <View style={styles.formContainer}>
              {otpStep === 'send' ? (
                <>
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
                </>
              ) : (
                <>
                  <View style={styles.otpHeaderRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setOtpStep('send');
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

                  <Text style={styles.inputLabel}>Enter Verification Code</Text>

                  {/* 6 Digit Input */}
                  <View style={styles.inputRow}>
                    <KeyRound size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput
                      ref={otpInputRef}
                      style={[styles.textInput, { fontSize: 20, letterSpacing: 4, fontWeight: '700' }]}
                      value={otp}
                      onChangeText={(txt) => {
                        setOtp(txt.replace(/[^0-9]/g, '').slice(0, 6));
                        setErrorMessage(null);
                      }}
                      placeholder="• • • • • •"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>

                  {successNotice && (
                    <View style={[styles.errorContainer, { backgroundColor: Colors.successBg, borderColor: 'rgba(57, 217, 138, 0.3)' }]}>
                      <Text style={[styles.errorText, { color: Colors.success }]}>{successNotice}</Text>
                    </View>
                  )}

                  {errorMessage && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                  )}

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
                        <Text style={styles.primaryBtnText}>Verify & Login</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleSendOtp}
                    disabled={countdown > 0}
                    style={styles.resendRow}
                  >
                    <RotateCw
                      size={14}
                      color={countdown > 0 ? Colors.textMuted : Colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.resendText,
                        countdown === 0 && { color: Colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Mode 3: Register */}
          {authMode === 'register' && (
            <View style={styles.formContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputRow}>
                <User size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={(txt) => {
                    setFullName(txt);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. Amit Verma"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Phone Number</Text>
              <View style={styles.inputRow}>
                <Phone size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  value={phoneNumber}
                  onChangeText={(txt) => {
                    setPhoneNumber(txt);
                    setErrorMessage(null);
                  }}
                  placeholder="9876543210"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email Address</Text>
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
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Password</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={(txt) => {
                    setPassword(txt);
                    setErrorMessage(null);
                  }}
                  placeholder="Create password (min 6 chars)"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                />
              </View>

              {errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleRegister}
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
                      <Text style={styles.primaryBtnText}>Create Account</Text>
                      <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
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
              End-to-end encrypted session • Official DreamPay Gateway
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    justifyContent: 'space-between',
  },
  brandHero: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  brandIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    padding: 3,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    marginBottom: Spacing.md,
  },
  brandGradient: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  appName: {
    ...Typography.h1,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  appTagline: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginTop: 4,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  modeTabActive: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
  },
  modeTabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    ...Typography.body,
    padding: 0,
  },
  quickFillBtn: {
    marginTop: 10,
    paddingVertical: 4,
  },
  quickFillText: {
    ...Typography.captionSmall,
    color: Colors.textMuted,
  },
  errorContainer: {
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 112, 0.3)',
  },
  errorText: {
    ...Typography.captionSmall,
    color: Colors.danger,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: Spacing.lg,
  },
  primaryBtnText: {
    ...Typography.bodySemiBold,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backBtnText: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  sentEmailPill: {
    backgroundColor: Colors.primaryMuted,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    maxWidth: 150,
  },
  sentEmailText: {
    ...Typography.captionSmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: 4,
  },
  resendText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  securityFooterText: {
    ...Typography.captionSmall,
    color: Colors.textMuted,
  },
});
