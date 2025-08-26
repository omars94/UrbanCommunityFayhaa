import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COMPLAINT_STATUS, COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, FONT_FAMILIES } from '../../constants/index';

const StatusTimeline = ({ complaint, status, getTimeAgo }) => {
  const currentComplaint = complaint;
  
  if (status === COMPLAINT_STATUS.REJECTED) {
    const rejectedSteps = [
      {
        key: 'submitted',
        label: 'تم استلام الشكوى',
        completed: true,
        date: currentComplaint.created_at
      },
      {
        key: 'rejected',
        label: 'تم رفض الشكوى',
        completed: true,
        date: currentComplaint.rejected_at,
        isRejected: true
      },
    ];

    return (
      <View style={styles.timelineContainer}>
        {rejectedSteps.map((step, index) => (
          <View key={step.key} style={styles.timelineItem}>
            <View style={[
              styles.timelineDot,
              step.completed && (step.isRejected ? styles.timelineDotRejected : styles.timelineDotCompleted),
              status === step.key && styles.timelineDotActive
            ]} />
            <View style={styles.timelineContent}>
              <Text style={[
                styles.timelineLabel,
                step.isRejected && styles.rejectedTimelineLabel
              ]}>{step.label}</Text>
              <Text style={styles.timelineDate}>
                {getTimeAgo(step.date)}
              </Text>
            </View>
            {index < rejectedSteps.length - 1 && <View style={styles.timelineLine} />}
          </View>
        ))}
      </View>
    );
  }

  const timelineSteps = [
    {
      key: 'submitted',
      label: 'تم استلام الشكوى',
      completed: true,
      date: currentComplaint.created_at
    },
    {
      key: 'assigned',
      label: 'تم تعيين الشكوى',
      completed: status !== COMPLAINT_STATUS.PENDING,
      date: currentComplaint.assigned_at || currentComplaint.assigned_to_worker_at
    },
    {
      key: 'resolved',
      label: 'تم الحل',
      completed: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.COMPLETED].includes(status),
      date: currentComplaint.resolved_at
    },
    {
      key: 'completed',
      label: 'مكتملة ',
      completed: status === COMPLAINT_STATUS.COMPLETED,
      date: currentComplaint.completed_at
    },
  ];

  return (
    <View style={styles.timelineContainer}>
      {timelineSteps.map((step, index) => (
        <View key={step.key} style={styles.timelineItem}>
          <View style={[
            styles.timelineDot,
            step.completed && styles.timelineDotCompleted,
            status === step.key && styles.timelineDotActive
          ]} />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineLabel}>{step.label}</Text>
            <Text style={styles.timelineDate}>
              {getTimeAgo(step.date)}
            </Text>
          </View>
          {index < timelineSteps.length - 1 && <View style={styles.timelineLine} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  timelineContainer: {
    paddingRight: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.gray[300],
    marginRight: SPACING.md,
    marginTop: 2,
  },
  timelineDotActive: {
    backgroundColor: COLORS.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineDotCompleted: {
    backgroundColor: COLORS.success,
  },
  timelineDotRejected: {
    backgroundColor: COLORS.danger,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILIES.primary,
  },
  rejectedTimelineLabel: {
    color: COLORS.danger,
    fontWeight: FONT_WEIGHTS.bold,
  },
  timelineDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  timelineLine: {
    position: 'absolute',
    left: 6,
    top: 20,
    bottom: -SPACING.md,
    width: 2,
    backgroundColor: COLORS.gray[300],
  },
});

export default StatusTimeline;