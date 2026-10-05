import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  X,
  Award,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react-native';
import { ApiTask } from '../types';
import { taskService } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';
import { BorderRadius, Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';
import { Badge } from './Badge';
import { PrimaryButton } from './PrimaryButton';

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  task: ApiTask | null;
  onTaskSubmitted?: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  onClose,
  task,
  onTaskSubmitted,
}) => {
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const [selectedProofUri, setSelectedProofUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!task) return null;

  const submissionStatus = task.mySubmission?.status;

  const handlePickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow access to your photos to upload task proof screenshot.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setSelectedProofUri(result.assets[0].uri);
        setErrorMessage(null);
      }
    } catch (err: any) {
      console.warn('Image picker error:', err);
      Alert.alert('Error', 'Unable to pick screenshot. Please try again.');
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedProofUri) {
      setErrorMessage('Please select a completion screenshot before submitting.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // Fallback
      }
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const res = await taskService.submitTaskProof(task._id, selectedProofUri);

      if (res?.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Proof Submitted!',
          'Your task proof screenshot has been submitted for verification. Reward will be added to your wallet upon review.'
        );
        setSelectedProofUri(null);
        await refreshUser();
        onTaskSubmitted?.();
        onClose();
      } else {
        setErrorMessage(res?.message || 'Failed to submit proof. Please try again.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error submitting task proof.';
      setErrorMessage(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom + Spacing.md, Spacing.xl) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.tagRow}>
              <Badge label="Daily Reward Task" variant="outline" size="sm" />
              {submissionStatus === 'approved' && (
                <Badge label="Completed" variant="success" size="sm" />
              )}
              {submissionStatus === 'pending' && (
                <Badge label="Under Review" variant="warning" size="sm" />
              )}
              {submissionStatus === 'rejected' && (
                <Badge label="Rejected" variant="danger" size="sm" />
              )}
              {!submissionStatus && (
                <Badge label="Ready to Start" variant="accent" size="sm" />
              )}
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setSelectedProofUri(null);
                setErrorMessage(null);
                onClose();
              }}
              style={styles.closeBtn}
            >
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={[Typography.h2, styles.title]}>{task.title}</Text>
            <Text style={[Typography.body, styles.description]}>
              {task.description}
            </Text>

            {/* Metrics Card */}
            <View style={styles.metricCard}>
              <View style={styles.metricCol}>
                <View style={styles.metricIconWrap}>
                  <Award size={18} color={Colors.primary} />
                </View>
                <Text style={styles.metricSub}>Reward Earning</Text>
                <Text style={styles.metricValue}>₹ {task.rewardAmount}.00</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricCol}>
                <View style={styles.metricIconWrap}>
                  <Clock size={18} color={Colors.secondary} />
                </View>
                <Text style={styles.metricSub}>Verification</Text>
                <Text style={styles.metricValue}>Fast 15-Min Audit</Text>
              </View>
            </View>

            {/* Status Feedback Banner */}
            {submissionStatus === 'approved' && (
              <View style={styles.statusSuccessBanner}>
                <CheckCircle2 size={20} color={Colors.success} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusSuccessTitle}>Task Approved!</Text>
                  <Text style={styles.statusSuccessText}>
                    ₹ {task.rewardAmount}.00 has been credited to your DreamPay wallet.
                  </Text>
                </View>
              </View>
            )}

            {submissionStatus === 'pending' && (
              <View style={styles.statusPendingBanner}>
                <FileCheck size={20} color={Colors.warning} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusPendingTitle}>Submission Under Review</Text>
                  <Text style={styles.statusPendingText}>
                    Your proof screenshot has been submitted and is currently being audited by the DreamPay review team.
                  </Text>
                </View>
              </View>
            )}

            {/* Proof Upload Area (When not yet approved) */}
            {submissionStatus !== 'approved' && submissionStatus !== 'pending' && (
              <View style={styles.uploadSection}>
                <Text style={[Typography.sectionTitle, styles.uploadSectionTitle]}>
                  Upload Proof Screenshot
                </Text>
                <Text style={styles.uploadSectionDesc}>
                  Perform the task described above and upload a screenshot showing proof of completion.
                </Text>

                {selectedProofUri ? (
                  <View style={styles.proofPreviewContainer}>
                    <Image source={{ uri: selectedProofUri }} style={styles.proofPreviewImage} />
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handlePickImage}
                      style={styles.changeProofBtn}
                    >
                      <Text style={styles.changeProofText}>Change Screenshot</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickImage}
                    style={styles.pickBox}
                  >
                    <View style={styles.pickIconCircle}>
                      <Upload size={22} color={Colors.primary} />
                    </View>
                    <Text style={styles.pickTitle}>Select Screenshot from Gallery</Text>
                    <Text style={styles.pickHint}>JPG, PNG or WEBP format</Text>
                  </TouchableOpacity>
                )}

                {errorMessage && (
                  <View style={styles.errorBox}>
                    <AlertCircle size={16} color={Colors.danger} style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <View style={styles.footerCTA}>
                  <PrimaryButton
                    title={isSubmitting ? 'Submitting Proof...' : 'Submit Proof Screenshot'}
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isSubmitting}
                    icon={
                      isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Upload size={18} color="#FFFFFF" />
                      )
                    }
                    onPress={handleSubmitProof}
                  />
                </View>
              </View>
            )}

            {/* When already submitted or approved */}
            {(submissionStatus === 'approved' || submissionStatus === 'pending') && (
              <View style={styles.footerCTA}>
                <PrimaryButton
                  title="Close"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onPress={onClose}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  description: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  metricCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricSub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginBottom: 2,
  },
  metricValue: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  metricDivider: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 4,
  },
  statusSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
    marginBottom: Spacing.lg,
  },
  statusSuccessTitle: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '700',
  },
  statusSuccessText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statusPendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 176, 32, 0.12)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.3)',
    marginBottom: Spacing.lg,
  },
  statusPendingTitle: {
    color: Colors.warning,
    fontSize: 14,
    fontWeight: '700',
  },
  statusPendingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  uploadSection: {
    marginBottom: Spacing.md,
  },
  uploadSectionTitle: {
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  uploadSectionDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  pickBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderAccent,
    borderStyle: 'dashed',
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  pickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  pickTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  pickHint: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  proofPreviewContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  proofPreviewImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
    marginBottom: Spacing.xs,
  },
  changeProofBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeProofText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 92, 112, 0.12)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 112, 0.3)',
  },
  errorText: {
    color: '#FF5C70',
    fontSize: 12,
    flex: 1,
  },
  footerCTA: {
    marginTop: Spacing.xs,
  },
});
