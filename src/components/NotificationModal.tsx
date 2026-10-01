import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Bell, CheckCheck, ShieldAlert, ArrowDownLeft } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

const notifications = [
  {
    id: 'n1',
    title: 'Settlement Credited',
    message: '₹ 2,000.00 successfully settled to your DRM wallet via IMPS UPI Direct.',
    time: '15m ago',
    icon: ArrowDownLeft,
    color: Colors.success,
  },
  {
    id: 'n2',
    title: 'Daily Bonus Active',
    message: 'Today reading incentive bonus is live. Complete sessions to earn +100 Pts.',
    time: '1h ago',
    icon: Bell,
    color: Colors.primary,
  },
  {
    id: 'n3',
    title: 'Security Verification',
    message: 'New wallet payout node registered from device DRM-Mobile-App.',
    time: 'Yesterday',
    icon: ShieldAlert,
    color: Colors.secondary,
  },
];

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Bell size={18} color={Colors.primary} />
              <Text style={[Typography.sectionTitle, styles.title]}>
                Notifications
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {notifications.map((item) => {
              const IconComp = item.icon;
              return (
                <View key={item.id} style={styles.item}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${item.color}20` },
                    ]}
                  >
                    <IconComp size={16} color={item.color} />
                  </View>
                  <View style={styles.itemContent}>
                    <View style={styles.itemHeader}>
                      <Text style={[Typography.bodySemiBold, styles.itemTitle]}>
                        {item.title}
                      </Text>
                      <Text style={styles.itemTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.itemMessage}>{item.message}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.markReadBtn}
          >
            <CheckCheck size={16} color={Colors.primary} />
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    color: Colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    maxHeight: 360,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    color: Colors.textPrimary,
  },
  itemTime: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  itemMessage: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  markReadText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
});
