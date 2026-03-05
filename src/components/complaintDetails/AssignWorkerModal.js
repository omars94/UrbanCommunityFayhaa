import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
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
import { formatLebanesePhone } from '../../utils';

const { width } = Dimensions.get('window');

/**
 * AssignWorkerModal
 * -----------------
 * Modal that lists available workers and allows assigning one to a complaint.
 *
 * Props:
 * - visible: boolean
 * - isLoading: boolean
 * - users: Array<{ id: string|number, full_name: string, phone_number?: string }>
 * - onClose: () => void
 * - onAssign: (userId: string|number, fullName: string) => void
 * - title?: string
 */
export default function AssignWorkerModal({
  visible,
  isLoading,
  users,
  onClose,
  onAssign,
  title = 'اختر عامل لتعيين الشكوى',
}) {
  const usersToShow = users || [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>

          {usersToShow.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                لا يوجد عمال متاحون في هذه المنطقة
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.usersList}
              showsVerticalScrollIndicator={false}
            >
              {usersToShow.map(userItem => (
                <TouchableOpacity
                  key={String(userItem.id)}
                  style={styles.userItem}
                  onPress={() => onAssign(userItem.id, userItem.full_name)}
                  disabled={isLoading}
                >
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{userItem.full_name}</Text>
                    {!!userItem.phone_number && (
                      <Text style={styles.userPhone}>
                        {formatLebanesePhone(userItem.phone_number)}
                      </Text>
                    )}
                  </View>
                  {isLoading && (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>إلغاء</Text>
          </TouchableOpacity>
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
  usersList: {
    maxHeight: 300,
    marginBottom: SPACING.lg,
  },
  emptyState: {
    paddingVertical: SPACING.xxl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.xs,
    backgroundColor: COLORS.surface,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILIES.primary,
  },
  userPhone: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    fontFamily: FONT_FAMILIES.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.gray[400],
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
  },
});

