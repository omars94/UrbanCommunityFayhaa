import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  ROLES,
  COMPLAINT_STATUS,
} from '../../constants';

/**
 * ComplaintDetailsActionButtons
 * ----------------------------
 * Renders the bottom action buttons in the complaint details screen.
 * Logic is role/status based, but UI is kept here to keep the screen readable.
 *
 * Props:
 * - userRole: number
 * - status: string
 * - hasAssignedWorker: boolean
 * - isLoading: boolean
 * - onOpenAssign: () => void
 * - onResolve: () => void
 * - onOpenDeny: () => void
 * - onComplete: () => void
 * - onOpenReject: () => void
 * - onSupervisorApprove: () => void
 * - onSupervisorReject: () => void
 */
export default function ComplaintDetailsActionButtons({
  userRole,
  status,
  hasAssignedWorker,
  isLoading,
  onOpenAssign,
  onResolve,
  onOpenDeny,
  onComplete,
  onOpenReject,
  onSupervisorApprove,
  onSupervisorReject,
}) {
  const canAssign =
    (userRole === ROLES.ADMIN || userRole === ROLES.MANAGER) &&
    (status === COMPLAINT_STATUS.PENDING || status === COMPLAINT_STATUS.ASSIGNED);

  const canResolve =
    (userRole === ROLES.WORKER && status === COMPLAINT_STATUS.ASSIGNED) ||
    (userRole === ROLES.MANAGER &&
      (status === COMPLAINT_STATUS.ASSIGNED || status === COMPLAINT_STATUS.PENDING));

  const canComplete = userRole === ROLES.SUPERVISOR && status === COMPLAINT_STATUS.RESOLVED;

  const canReject = userRole === ROLES.ADMIN && status === COMPLAINT_STATUS.PENDING;

  const canDeny = userRole === ROLES.SUPERVISOR && status === COMPLAINT_STATUS.RESOLVED;

  const canSupervisorApproveOrReject =
    userRole === ROLES.SUPERVISOR && status === COMPLAINT_STATUS.FIRST_SUPERVISOR_ACCEPTANCE;

  const canSupervisorReassign =
    userRole === ROLES.SUPERVISOR && status === COMPLAINT_STATUS.SUPERVISOR_REJECTED;

  if (
    !canAssign &&
    !canResolve &&
    !canComplete &&
    !canReject &&
    !canDeny &&
    !canSupervisorApproveOrReject &&
    !canSupervisorReassign
  ) {
    return null;
  }

  return (
    <View style={styles.actionsContainer}>
      {canAssign && (
        <TouchableOpacity
          style={[styles.actionButton, styles.assignButton, isLoading && styles.disabledButton]}
          onPress={onOpenAssign}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.actionButtonText}>
              {!hasAssignedWorker ? 'تعيين لعامل' : 'إعادة تعيين العامل'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {canResolve && (
        <TouchableOpacity
          style={[styles.actionButton, styles.resolveButton, isLoading && styles.disabledButton]}
          onPress={onResolve}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.actionButtonText}>حل المشكلة عن طريق صورة</Text>
          )}
        </TouchableOpacity>
      )}

      {canSupervisorApproveOrReject && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonHalf,
              styles.actionButtonCompact,
              styles.completeButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={onSupervisorApprove}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.actionButtonText}>موافقة</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonHalf,
              styles.actionButtonCompact,
              styles.rejectActionButton,
              isLoading && styles.disabledButton,
            ]}
            onPress={onSupervisorReject}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.actionButtonText}>رفض</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {canSupervisorReassign && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonCompact,
            styles.reassignFullWidth,
            styles.reassignButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={onSupervisorApprove}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.actionButtonText}>إعادة تعيين للمسؤول</Text>
          )}
        </TouchableOpacity>
      )}

      {canDeny && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.rejectActionButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={onOpenDeny}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.actionButtonText}>رفض الحل</Text>
          )}
        </TouchableOpacity>
      )}

      {canComplete && (
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton, isLoading && styles.disabledButton]}
          onPress={onComplete}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.actionButtonText}>تأكيد الإنجاز</Text>
          )}
        </TouchableOpacity>
      )}

      {canReject && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.rejectActionButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={onOpenReject}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.actionButtonText}>رفض الشكوى</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionsContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    ...SHADOWS.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  actionButton: {
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xs,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  actionButtonHalf: {
    width: '48%',
    marginBottom: 0,
  },
  actionButtonCompact: {
    paddingVertical: SPACING.md,
  },
  assignButton: {
    backgroundColor: COLORS.secondary,
  },
  resolveButton: {
    backgroundColor: COLORS.primary,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
  },
  reassignButton: {
    backgroundColor: COLORS.success,
  },
  reassignFullWidth: {
    width: '100%',
    marginBottom: SPACING.xs,
  },
  rejectActionButton: {
    backgroundColor: COLORS.red,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    marginLeft: SPACING.sm,
    fontFamily: FONT_FAMILIES.primary,
  },
});

