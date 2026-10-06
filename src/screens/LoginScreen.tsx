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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RotateCw,
  KeyRound,
  User,
  Phone,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

type TabMode = 'login' | 'signup';
type LoginMethod = 'otp' | 'password';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, verifyOtp, register, sendOtp, refreshUser } = useAuth();
  const [tabMode, setTabMode] = useState<TabMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('otp');
  const [otpSent, setOtpSent] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  // UI States
  const [countdown, setCountdown] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const otpInputRef = useRef<TextInput>(null);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (otpSent && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, countdown]);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessNotice(null);
  };

  // 1. Send OTP to user's email
  const handleSendOtp = async (targetEmail?: string) => {
    const toEmail = (targetEmail || email).trim();
    if (!toEmail || !toEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const res = await sendOtp(toEmail);
      setIsSubmitting(false);

      if (res.success) {
        setOtpSent(true);
        setCountdown(30);
        setOtp(res.otp || '');
        setSuccessNotice('OTP code sent successfully to your email.');
        setTimeout(() => otpInputRef.current?.focus(), 250);
      } else {
        setErrorMessage(res.message || 'Failed to send OTP. Please check your email.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        err.response?.data?.message || err.message || 'No account found with this email. Please sign up first.'
      );
    }
  };

  // 2. Verify OTP & Redirect to Home
  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length < 4) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    clearMessages();
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await verifyOtp(email.trim(), trimmedOtp);
      setIsSubmitting(false);

      if (res.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Fallback
        }
        await refreshUser();
        onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Invalid or expired OTP. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Verification failed. Please check the code.'
      );
    }
  };

  // 3. Password Login
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

    clearMessages();
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await login(trimmedEmail, password);
      setIsSubmitting(false);

      if (res.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Fallback
        }
        await refreshUser();
        onLoginSuccess();
      } else {
        setErrorMessage(res.message || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Login failed. Please check your credentials.'
      );
    }
  };

  // 4. Register (Sign Up) -> Auto prompt login with OTP
  const handleRegister = async () => {
    const trimmedName = fullName.trim();
    const trimmedPhone = phoneNumber.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
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

    clearMessages();
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await register(
        trimmedName,
        trimmedPhone,
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

        // Transition smoothly to Login tab -> send OTP directly
        setTabMode('login');
        setLoginMethod('otp');
        setSuccessNotice('Account created successfully! Sending login OTP...');
        await handleSendOtp(trimmedEmail);
      } else {
        setErrorMessage(res.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(
        err.response?.data?.message || err.message || 'User already exists or registration failed.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Brand */}
          <View style={styles.brandHero}>
            <View style={styles.brandLogoWrap}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.brandLogoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.appTagline}>
              {tabMode === 'login'
                ? 'Welcome back! Sign in to access your wallet'
                : 'Create your account to start earning & withdrawing'}
            </Text>
          </View>

          {/* Segmented Switcher: Login | Sign Up */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setTabMode('login');
                clearMessages();
              }}
              style={[styles.tabButton, tabMode === 'login' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, tabMode === 'login' && styles.tabButtonTextActive]}>
                Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setTabMode('signup');
                clearMessages();
              }}
              style={[styles.tabButton, tabMode === 'signup' && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, tabMode === 'signup' && styles.tabButtonTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Success Banner */}
            {successNotice && (
              <View style={styles.successBanner}>
                <CheckCircle2 size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.successBannerText}>{successNotice}</Text>
              </View>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}

            {/* ================= LOGIN MODE ================= */}
            {tabMode === 'login' && (
              <>
                {loginMethod === 'otp' ? (
                  !otpSent ? (
                    /* Step 1: Enter Email & Request OTP */
                    <>
                      <Text style={styles.inputLabel}>Enter Registered Email</Text>
                      <View style={styles.inputRow}>
                        <Mail size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                        <TextInput
                          style={styles.textInput}
                          value={email}
                          onChangeText={(txt) => {
                            setEmail(txt);
                            clearMessages();
                          }}
                          placeholder="name@example.com"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>


                      {/* Send OTP Button */}
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleSendOtp()}
                        disabled={isSubmitting}
                        style={styles.primaryBtn}
                      >
                        <LinearGradient
                          colors={Colors.heroGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.primaryGradient}
                        >
                          {isSubmitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Text style={styles.primaryBtnText}>Send OTP Code</Text>
                              <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Or Login with Password toggle */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setLoginMethod('password');
                          clearMessages();
                        }}
                        style={styles.switchMethodBtn}
                      >
                        <Text style={styles.switchMethodText}>
                          Or log in with <Text style={styles.switchMethodHighlight}>Password</Text>
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    /* Step 2: Enter OTP & Verify */
                    <>
                      <View style={styles.otpHeaderRow}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            setOtpSent(false);
                            clearMessages();
                          }}
                          style={styles.backRow}
                        >
                          <ArrowLeft size={16} color={Colors.primary} />
                          <Text style={styles.backRowText}>Change Email</Text>
                        </TouchableOpacity>

                        <View style={styles.emailPill}>
                          <Text style={styles.emailPillText} numberOfLines={1}>
                            {email}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
                      <View style={styles.inputRow}>
                        <KeyRound size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                        <TextInput
                          ref={otpInputRef}
                          style={[styles.textInput, styles.otpTextInput]}
                          value={otp}
                          onChangeText={(txt) => {
                            setOtp(txt.replace(/[^0-9]/g, '').slice(0, 6));
                            clearMessages();
                          }}
                          placeholder="• • • • • •"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="number-pad"
                          maxLength={6}
                          autoFocus
                        />
                      </View>

                      {/* Verify Button */}
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleVerifyOtp}
                        disabled={isSubmitting}
                        style={styles.primaryBtn}
                      >
                        <LinearGradient
                          colors={Colors.heroGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.primaryGradient}
                        >
                          {isSubmitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Text style={styles.primaryBtnText}>Verify & Proceed to Home</Text>
                              <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Resend OTP */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleSendOtp()}
                        disabled={countdown > 0 || isSubmitting}
                        style={styles.resendBtn}
                      >
                        <RotateCw
                          size={14}
                          color={countdown > 0 ? Colors.textMuted : Colors.primary}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.resendText,
                            countdown === 0 && { color: Colors.primary, fontWeight: '700' },
                          ]}
                        >
                          {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )
                ) : (
                  /* Alternative: Password Login */
                  <>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <View style={styles.inputRow}>
                      <Mail size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.textInput}
                        value={email}
                        onChangeText={(txt) => {
                          setEmail(txt);
                          clearMessages();
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
                          clearMessages();
                        }}
                        placeholder="Enter your password"
                        placeholderTextColor={Colors.textMuted}
                        secureTextEntry
                      />
                    </View>

                    {/* Sign In Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handlePasswordLogin}
                      disabled={isSubmitting}
                      style={styles.primaryBtn}
                    >
                      <LinearGradient
                        colors={Colors.heroGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.primaryGradient}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.primaryBtnText}>Sign In to Home</Text>
                            <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Switch back to OTP */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setLoginMethod('otp');
                        clearMessages();
                      }}
                      style={styles.switchMethodBtn}
                    >
                      <Text style={styles.switchMethodText}>
                        Or log in with <Text style={styles.switchMethodHighlight}>Email OTP</Text>
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* ================= SIGN UP MODE ================= */}
            {tabMode === 'signup' && (
              <>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputRow}>
                  <User size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={(txt) => {
                      setFullName(txt);
                      clearMessages();
                    }}
                    placeholder="Enter your full name"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                  />
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Mobile Number</Text>
                <View style={styles.inputRow}>
                  <Phone size={18} color={Colors.textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.textInput}
                    value={phoneNumber}
                    onChangeText={(txt) => {
                      setPhoneNumber(txt);
                      clearMessages();
                    }}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
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
                      clearMessages();
                    }}
                    placeholder="name@example.com"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
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
                      clearMessages();
                    }}
                    placeholder="At least 6 characters"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry
                  />
                </View>

                {/* Create Account Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleRegister}
                  disabled={isSubmitting}
                  style={styles.primaryBtn}
                >
                  <LinearGradient
                    colors={Colors.heroGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Register & Proceed</Text>
                        <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switch to login link */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setTabMode('login');
                    clearMessages();
                  }}
                  style={styles.switchMethodBtn}
                >
                  <Text style={styles.switchMethodText}>
                    Already have an account? <Text style={styles.switchMethodHighlight}>Log In</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer Security Badge */}
          <View style={styles.securityFooter}>
            <ShieldCheck size={14} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.securityFooterText}>
              256-bit Secure Gateway • DreamPay Official
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
    justifyContent: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandLogoWrap: {
    width: 130,
    height: 130,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: Spacing.xs,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
  },
  appTagline: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
    marginTop: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: BorderRadius.full,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  successBannerText: {
    ...Typography.captionSmall,
    color: Colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorBannerText: {
    ...Typography.captionSmall,
    color: Colors.danger,
    textAlign: 'center',
    fontWeight: '500',
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
    backgroundColor: '#F9FAFB',
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
  otpTextInput: {
    fontSize: 22,
    letterSpacing: 6,
    fontWeight: '700',
  },
  demoFillBtn: {
    marginTop: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  demoFillText: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
  },
  primaryBtn: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: Spacing.lg,
  },
  primaryBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  switchMethodBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchMethodText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  switchMethodHighlight: {
    color: Colors.primary,
    fontWeight: '700',
  },
  otpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backRowText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  emailPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    maxWidth: 160,
  },
  emailPillText: {
    ...Typography.captionSmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 6,
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
    fontWeight: '500',
  },
});
