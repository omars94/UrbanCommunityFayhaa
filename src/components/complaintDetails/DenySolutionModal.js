import React from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  SPACING,
} from '../../constants';

const { width } = Dimensions.get('window');

/**
 * DenySolutionModal
 * ----------------
 * Modal that asks the supervisor for a "deny solution" reason
 * (used when a resolved complaint is rejected by supervisor).
 *
 * Props:
 * - visible: boolean
 * - isLoading: boolean
 * - reason: string
 * - onChangeReason: (text: string) => void
 * - onConfirm: () => void
 * - onClose: () => void
 * - maxLength?: number
 */
export default function DenySolutionModal({
  visible,
  isLoading,
  reason,
  onChangeReason,
  onConfirm,
  onClose,
  maxLength = 500,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>سبب رفض الحل</Text>

          <TextInput
            style={styles.textInput}
            placeholder=" اكتب سبب رفض الحل... "
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={onChangeReason}
            textAlignVertical="top"
            maxLength={maxLength}
            editable={!isLoading}
          />

          <Text style={styles.characterCount}>
            {reason.length}/{maxLength} حرف
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.rejectButton,
                (isLoading || reason.trim().length < 1) && styles.disabledButton,
              ]}
              onPress={onConfirm}
              disabled={isLoading || reason.trim().length < 1}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.modalButtonText}>رفض الحل</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelModalButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay || 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: width * 0.9,
    maxHeight: '80%',
    ...SHADOWS.xl,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontFamily: FONT_FAMILIES.primary,
  },
  textInput: {
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONT_SIZES.lg,
    minHeight: 120,
    marginBottom: SPACING.sm,
    textAlignVertical: 'top',
    fontFamily: FONT_FAMILIES.primary,
  },
  characterCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'right',
    marginBottom: SPACING.lg,
    fontFamily: FONT_FAMILIES.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  rejectButton: {
    backgroundColor: COLORS.danger,
  },
  cancelModalButton: {
    backgroundColor: COLORS.gray[400],
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
  },
});

