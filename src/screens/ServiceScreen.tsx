import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Modal,
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
import { mockServiceChannels } from '../data/mockData';
import { ServiceChannel } from '../types';

interface ServiceScreenProps {
  onBack?: () => void;
}

export const ServiceScreen: React.FC<ServiceScreenProps> = ({ onBack }) => {
  const [selectedChannel, setSelectedChannel] = useState<ServiceChannel | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleContactPress = async (channel: ServiceChannel) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const canOpen = await Linking.canOpenURL(channel.url);
      if (canOpen) {
        await Linking.openURL(channel.url);
      } else {
        // Fallback to modal with copy option
        setSelectedChannel(channel);
      }
    } catch {
      setSelectedChannel(channel);
    }
  };

  const handleCopyHandle = (channel: ServiceChannel) => {
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

      {/* Screen Header matching reference */}
      <Header
        title="Service"
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
              Official Support Protection
            </Text>
            <Text style={styles.noticeSubtitle}>
              PayApp representatives will never ask for your password, PIN, or withdrawal OTP.
            </Text>
          </View>
        </View>

        {/* List of Service Channels matching reference */}
        <View style={styles.channelList}>
          {mockServiceChannels.map((channel) => (
            <View key={channel.id} style={styles.channelCard}>
              {/* Badge Icon matching the blue star medallion in screenshot */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#1E5BF8', '#0F399E']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                >
                  {/* Subtle sparkle decoration */}
                  <View style={styles.sparkleDotTop} />
                  <View style={styles.sparkleDotBottom} />
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
                    {channel.name}
                  </Text>
                </View>
                <View style={styles.roleRow}>
                  <Text style={[Typography.caption, styles.channelRole]} numberOfLines={1}>
                    {channel.role}
                  </Text>
                  {channel.isOnline && (
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>24/7</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Contact Pill Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleContactPress(channel)}
                style={styles.contactBtn}
              >
                <LinearGradient
                  colors={['#5B8CFF', '#7C5CFC']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.8 }}
                  style={styles.contactBtnGradient}
                >
                  <Text style={styles.contactBtnText}>Contact</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </View>

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
        visible={!!selectedChannel}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedChannel(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <MessageCircle size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                <Text style={[Typography.h3, { color: Colors.textPrimary }]}>
                  Connect with Support
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedChannel(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedChannel && (
              <View style={styles.modalContent}>
                <View style={styles.modalChannelInfo}>
                  <Text style={[Typography.bodySemiBold, { color: Colors.textPrimary }]}>
                    {selectedChannel.name}
                  </Text>
                  <Text style={[Typography.caption, { color: Colors.textSecondary, marginTop: 2 }]}>
                    {selectedChannel.role} • {selectedChannel.handle}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    Linking.openURL(selectedChannel.url);
                    setSelectedChannel(null);
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
                    <Text style={styles.primaryModalBtnText}>Open in Telegram</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleCopyHandle(selectedChannel)}
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
                        Copy Telegram Handle ({selectedChannel.handle})
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

  // Security Notice
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

  // Channel List
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },

  // Blue Medallion with Gold Star
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
    position: 'relative',
    shadowColor: '#1E5BF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  sparkleDotTop: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  sparkleDotBottom: {
    position: 'absolute',
    bottom: 8,
    left: 7,
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },

  // Info
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

  // Contact Button
  contactBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  contactBtnGradient: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Help Footer
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

  // Modal
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
    borderWidth: 1,
    borderColor: Colors.border,
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
