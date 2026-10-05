import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Bell,
  CheckCheck,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Award,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { ApiNotification } from '../types';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const { refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getNotifications();
      if (Array.isArray(res)) {
        setNotifications(res);
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarking(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshUser();
    } catch (e) {
      console.warn('Failed to mark all notifications read:', e);
    } finally {
      setIsMarking(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return { icon: ArrowDownLeft, color: Colors.success };
      case 'withdrawal':
        return { icon: ArrowUpRight, color: Colors.danger };
      case 'task':
        return { icon: Award, color: Colors.primary };
      case 'gift_code':
        return { icon: Gift, color: '#FFA500' };
      default:
        return { icon: Bell, color: Colors.secondary };
    }
  };

  const formatNotificationTime = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    })} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

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

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Fetching notifications...</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Bell size={28} color={Colors.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyTitle}>No Notifications</Text>
                  <Text style={styles.emptyDesc}>
                    {"You're all caught up! Updates regarding deposits and rewards will appear here."}
                  </Text>
                </View>
              ) : (
                notifications.map((item) => {
                  const { icon: IconComp, color } = getNotificationIcon(item.type);
                  return (
                    <View
                      key={item._id}
                      style={[
                        styles.item,
                        !item.isRead && styles.unreadItem,
                      ]}
                    >
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: `${color}20` },
                        ]}
                      >
                        <IconComp size={16} color={color} />
                      </View>
                      <View style={styles.itemContent}>
                        <View style={styles.itemHeader}>
                          <Text
                            style={[
                              Typography.bodySemiBold,
                              styles.itemTitle,
                              !item.isRead && { color: Colors.textPrimary },
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text style={styles.itemTime}>
                            {formatNotificationTime(item.createdAt)}
                          </Text>
                        </View>
                        <Text style={styles.itemMessage}>{item.message}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {notifications.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isMarking}
              onPress={handleMarkAllRead}
              style={styles.markReadBtn}
            >
              <CheckCheck size={16} color={Colors.primary} />
              <Text style={styles.markReadText}>
                {isMarking ? 'Marking...' : 'Mark all as read'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    width: '100%',
    maxHeight: '78%',
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
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  list: {
    maxHeight: 380,
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  emptyDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
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
  unreadItem: {
    borderColor: Colors.borderAccent,
    backgroundColor: 'rgba(124, 92, 252, 0.08)',
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
    fontSize: 13,
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
