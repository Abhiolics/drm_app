import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  Star,
  Send,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  X,
  Headphones,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/Header';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { appService } from '../services/appService';
import { ApiContact } from '../types';

interface ServiceScreenProps {
  onBack?: () => void;
}

export const ServiceScreen: React.FC<ServiceScreenProps> = ({ onBack }) => {
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ApiContact | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await appService.getContacts();
        if (Array.isArray(res) && res.length > 0) {
          setContacts(res.filter((c: ApiContact) => c.isActive !== false));
        } else {
          // Fallback official contacts if backend list empty
          setContacts([
            {
              _id: 'c1',
              type: 'telegram',
              label: 'Official Telegram Channel',
              value: 'https://t.me/dreampay_official',
              isActive: true,
            },
            {
              _id: 'c2',
              type: 'whatsapp',
              label: '24/7 WhatsApp Support',
              value: '+919876543210',
              isActive: true,
            },
          ]);
        }
      } catch (err) {
        console.warn('Failed to fetch support contacts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadContacts();
  }, []);

  const getContactUrl = (contact: ApiContact): string => {
    const val = contact.value;
    if (contact.type === 'whatsapp') {
      const cleanPhone = val.replace(/[^0-9]/g, '');
      return `https://wa.me/${cleanPhone}`;
    }
    if (contact.type === 'telegram') {
      return val.startsWith('http') ? val : `https://t.me/${val.replace('@', '')}`;
    }
    if (contact.type === 'email') {
      return `mailto:${val}`;
    }
    if (contact.type === 'phone') {
      return `tel:${val}`;
    }
    return val;
  };

  const handleContactPress = async (contact: ApiContact) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const url = getContactUrl(contact);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        setSelectedContact(contact);
      }
    } catch {
      setSelectedContact(contact);
    }
  };

  const handleCopyHandle = (contact: ApiContact) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />

      {/* Screen Header */}
      <Header
        title="Support Service"
        showBack={true}
        onBack={onBack}
        centerTitle={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Support Security Notice */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIconWrap}>
            <ShieldCheck size={18} color={Colors.primary} />
          </View>
          <View style={styles.noticeTextWrap}>
            <Text style={[Typography.caption, styles.noticeTitle]}>
              Official DreamPay Support Protection
            </Text>
            <Text style={styles.noticeSubtitle}>
              DreamPay staff will never ask for your password, withdrawal OTP, or secret credentials.
            </Text>
          </View>
        </View>

        {/* List of Live Support Channels */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading support desks...</Text>
          </View>
        ) : (
          <View style={styles.channelList}>
            {contacts.map((contact) => (
              <View key={contact._id} style={styles.channelCard}>
                {/* Badge Icon with Medallion */}
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['#1E5BF8', '#0F399E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                  >
                    <Star size={16} color="#FFD700" fill="#FFD700" />
                  </LinearGradient>
                </View>

                {/* Title & Subtitle */}
                <View style={styles.channelInfo}>
                  <View style={styles.nameRow}>
                    <Text
                      style={[Typography.bodySemiBold, styles.channelName]}
                      numberOfLines={1}
                    >
                      {contact.label}
                    </Text>
                  </View>
                  <View style={styles.roleRow}>
                    <Text style={[Typography.caption, styles.channelRole]} numberOfLines={1}>
                      {contact.value}
                    </Text>
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>Active</Text>
                    </View>
                  </View>
                </View>

                {/* Contact Pill Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleContactPress(contact)}
                  style={styles.contactBtn}
                >
                  <LinearGradient
                    colors={['#5B8CFF', '#7C5CFC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0.8 }}
                    style={styles.contactBtnGradient}
                  >
                    <Text style={styles.contactBtnText}>Connect</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Help Tip */}
        <View style={styles.helpFooter}>
          <Headphones size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.helpFooterText}>
            Average response time is under 2 minutes
          </Text>
        </View>
      </ScrollView>

      {/* Fallback Contact Sheet Modal */}
      <Modal
        visible={!!selectedContact}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedContact(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <MessageCircle size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={[Typography.h3, { color: Colors.textPrimary }]}>
                  Support Channel
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedContact(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedContact && (
              <View style={styles.modalContent}>
                <View style={styles.modalChannelInfo}>
                  <Text style={[Typography.bodySemiBold, { color: Colors.textPrimary }]}>
                    {selectedContact.label}
                  </Text>
                  <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: 4 }]}>
                    {selectedContact.value}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    const url = getContactUrl(selectedContact);
                    Linking.openURL(url);
                    setSelectedContact(null);
                  }}
                  style={styles.primaryModalBtn}
                >
                  <LinearGradient
                    colors={Colors.accentGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryModalGradient}
                  >
                    <Send size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryModalBtnText}>Open Channel Link</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleCopyHandle(selectedContact)}
                  style={styles.secondaryModalBtn}
                >
                  {copiedLink ? (
                    <>
                      <Check size={16} color={Colors.success} style={{ marginRight: 8 }} />
                      <Text style={[Typography.button, { color: Colors.success }]}>
                        Copied to Clipboard!
                      </Text>
                    </>
                  ) : (
                    <>
                      <Copy size={16} color={Colors.textPrimary} style={{ marginRight: 8 }} />
                      <Text style={[Typography.button, { color: Colors.textPrimary }]}>
                        Copy ({selectedContact.value})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxxl,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 92, 252, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 252, 0.25)',
    marginBottom: Spacing.md,
  },
  noticeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  noticeTextWrap: {
    flex: 1,
  },
  noticeTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  noticeSubtitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  channelList: {
    gap: 12,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(91, 140, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(91, 140, 255, 0.35)',
    marginRight: Spacing.md,
  },
  avatarGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  channelRole: {
    color: Colors.textSecondary,
    fontSize: 11,
    flexShrink: 1,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    backgroundColor: 'rgba(57, 217, 138, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.success,
    marginRight: 3,
  },
  onlineText: {
    color: Colors.success,
    fontSize: 9,
    fontWeight: '700',
  },
  contactBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  contactBtnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  helpFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  helpFooterText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderAccent,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    gap: Spacing.md,
  },
  modalChannelInfo: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  primaryModalBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  primaryModalGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
