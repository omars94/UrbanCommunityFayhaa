import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COMPLAINT_STATUS, COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, FONT_FAMILIES, ROLES } from '../../constants/index';

const StatusTimeline = ({ complaint, status, getTimeAgo, userRole }) => {
  const currentComplaint = complaint;

  // Function to get assignment label based on user role
  const getAssignmentLabel = () => {
    if (userRole === ROLES.CITIZEN) {
      return 'تم تعيين الشكوى';
    }

    // For ADMIN and MANAGER, show worker assignments only
    const labels = [];
    
    // Worker assignments
    if (currentComplaint.worker_assignee_id && currentComplaint.worker_assignee_id.length > 0) {
      currentComplaint.worker_assignee_id.forEach((workerId, index) => {
        const workerName = currentComplaint.worker_name?.[index] || 'غير محدد';
        labels.push(`تم تعيين للعامل: ${workerName}`);
      });
    }
    
    return labels.length > 0 ? labels : ['تم تعيين الشكوى'];
  };

  // Function to get assignment dates based on user role
  const getAssignmentDates = () => {
    if (userRole === ROLES.CITIZEN) {
      return [currentComplaint.assigned_to_worker_at?.[0] || currentComplaint.assigned_at];
    }

    const dates = [];
    
    // Worker assignment dates only
    if (currentComplaint.assigned_to_worker_at && currentComplaint.assigned_to_worker_at.length > 0) {
      dates.push(...currentComplaint.assigned_to_worker_at);
    }
    
    return dates.length > 0 ? dates : [currentComplaint.assigned_to_worker_at?.[0] || currentComplaint.assigned_at];
  };
  
  // Handle rejected complaints timeline
  if (status === COMPLAINT_STATUS.REJECTED) {
    const hasAssigned = currentComplaint.assigned_to_worker_at || currentComplaint.assigned_at;
    const hasResolved = currentComplaint.resolved_at;
    const hasCompleted = currentComplaint.completed_at;
    const hasDenied = currentComplaint.denied_at;
    
    const rejectedSteps = [
      {
        key: 'submitted',
        label: 'تم استلام الشكوى',
        completed: true,
        date: currentComplaint.created_at
      }
    ];

    if (hasAssigned) {
      const assignmentLabels = getAssignmentLabel();
      const assignmentDates = getAssignmentDates();
      
      if (Array.isArray(assignmentLabels)) {
        // Multiple assignments (for admin/manager view)
        assignmentLabels.forEach((label, index) => {
          rejectedSteps.push({
            key: `assigned_${index}`,
            label: label,
            completed: true,
            date: assignmentDates[index] || assignmentDates[0]
          });
        });
      } else {
        // Single assignment label (for citizen view)
        rejectedSteps.push({
          key: 'assigned',
          label: assignmentLabels,
          completed: true,
          date: assignmentDates[0]
        });
      }
    }

    if (hasResolved) {
      rejectedSteps.push({
        key: 'resolved',
        label: 'تم الحل',
        completed: true,
        date: currentComplaint.resolved_at
      });
    }

    if (hasDenied) {
      rejectedSteps.push({
        key: 'denied',
        label: 'تم رفض الحل',
        completed: true,
        date: currentComplaint.denied_at,
        isDenied: true
      });
    }

    if (hasCompleted) {
      rejectedSteps.push({
        key: 'completed',
        label: 'مكتملة',
        completed: true,
        date: currentComplaint.completed_at
      });
    }

    rejectedSteps.push({
      key: 'rejected',
      label: 'تم رفض الشكوى',
      completed: true,
      date: currentComplaint.rejected_at,
      isRejected: true
    });

    return (
      <View style={styles.timelineContainer}>
        {rejectedSteps.map((step, index) => (
          <View key={step.key} style={styles.timelineItem}>
            <View style={[
              styles.timelineDot,
              step.completed && (step.isRejected ? styles.timelineDotRejected : 
                               step.isDenied ? styles.timelineDotDenied : 
                               styles.timelineDotCompleted),
              status === step.key && styles.timelineDotActive
            ]} />
            <View style={styles.timelineContent}>
              <Text style={[
                styles.timelineLabel,
                step.isRejected && styles.rejectedTimelineLabel,
                step.isDenied && styles.deniedTimelineLabel
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

  // Handle denied status timeline
  if (status === COMPLAINT_STATUS.DENIED) {
    const hasAssigned = currentComplaint.assigned_to_worker_at || currentComplaint.assigned_at;
    
    const deniedSteps = [
      {
        key: 'submitted',
        label: 'تم استلام الشكوى',
        completed: true,
        date: currentComplaint.created_at
      }
    ];

    if (hasAssigned) {
      const assignmentLabels = getAssignmentLabel();
      const assignmentDates = getAssignmentDates();
      
      if (Array.isArray(assignmentLabels)) {
        // Multiple assignments (for admin/manager view)
        assignmentLabels.forEach((label, index) => {
          deniedSteps.push({
            key: `assigned_${index}`,
            label: label,
            completed: true,
            date: assignmentDates[index] || assignmentDates[0]
          });
        });
      } else {
        // Single assignment label (for citizen view)
        deniedSteps.push({
          key: 'assigned',
          label: assignmentLabels,
          completed: true,
          date: assignmentDates[0]
        });
      }
    }

    deniedSteps.push(
      {
        key: 'resolved',
        label: 'تم الحل',
        completed: true,
        date: currentComplaint.resolved_at
      },
      {
        key: 'denied',
        label: 'تم رفض الحل',
        completed: true,
        date: currentComplaint.denied_at,
        isDenied: true
      }
    );

    return (
      <View style={styles.timelineContainer}>
        {deniedSteps.map((step, index) => (
          <View key={step.key} style={styles.timelineItem}>
            <View style={[
              styles.timelineDot,
              step.completed && (step.isDenied ? styles.timelineDotDenied : styles.timelineDotCompleted),
              status === step.key && styles.timelineDotActive
            ]} />
            <View style={styles.timelineContent}>
              <Text style={[
                styles.timelineLabel,
                step.isDenied && styles.deniedTimelineLabel
              ]}>{step.label}</Text>
              <Text style={styles.timelineDate}>
                {getTimeAgo(step.date)}
              </Text>
            </View>
            {index < deniedSteps.length - 1 && <View style={styles.timelineLine} />}
          </View>
        ))}
      </View>
    );
  }

  // Regular timeline steps for other statuses
  const timelineSteps = [
    {
      key: 'submitted',
      label: 'تم استلام الشكوى',
      completed: true,
      date: currentComplaint.created_at
    }
  ];

  // Handle assignment steps based on user role (workers only now)
  const hasAssigned = currentComplaint.assigned_to_worker_at || currentComplaint.assigned_at;
  if (hasAssigned) {
    const assignmentLabels = getAssignmentLabel();
    const assignmentDates = getAssignmentDates();
    
    if (Array.isArray(assignmentLabels) && userRole !== ROLES.CITIZEN) {
      // Multiple assignments (for admin/manager view)
      assignmentLabels.forEach((label, index) => {
        timelineSteps.push({
          key: `assigned_${index}`,
          label: label,
          completed: status !== COMPLAINT_STATUS.PENDING,
          date: assignmentDates[index] || assignmentDates[0]
        });
      });
    } else {
      // Single assignment step (for citizen view or fallback)
      timelineSteps.push({
        key: 'assigned',
        label: Array.isArray(assignmentLabels) ? assignmentLabels[0] : assignmentLabels,
        completed: status !== COMPLAINT_STATUS.PENDING,
        date: assignmentDates[0]
      });
    }
  } else {
    // Show pending assignment step
    timelineSteps.push({
      key: 'assigned',
      label: 'تم تعيين الشكوى',
      completed: status !== COMPLAINT_STATUS.PENDING,
      date: null
    });
  }

  // Add remaining steps
  timelineSteps.push(
    {
      key: 'resolved',
      label: 'تم الحل',
      completed: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.COMPLETED, COMPLAINT_STATUS.DENIED].includes(status),
      date: currentComplaint.resolved_at
    }
  );

  // Add deny step if solution was denied
  if (currentComplaint.denied_at) {
    timelineSteps.push({
      key: 'denied',
      label: 'تم رفض الحل',
      completed: status === COMPLAINT_STATUS.DENIED,
      date: currentComplaint.denied_at,
      isDenied: true
    });
  }

  // Add completion step
  timelineSteps.push({
    key: 'completed',
    label: 'مكتملة',
    completed: status === COMPLAINT_STATUS.COMPLETED,
    date: currentComplaint.completed_at
  });

  return (
    <View style={styles.timelineContainer}>
      {timelineSteps.map((step, index) => (
        <View key={step.key} style={styles.timelineItem}>
          <View style={[
            styles.timelineDot,
            step.completed && (step.isDenied ? styles.timelineDotDenied : styles.timelineDotCompleted),
            status === step.key && styles.timelineDotActive
          ]} />
          <View style={styles.timelineContent}>
            <Text style={[
              styles.timelineLabel,
              step.isDenied && styles.deniedTimelineLabel
            ]}>{step.label}</Text>
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
  timelineDotDenied: {
    backgroundColor: COLORS.warning || '#f39c12', // Orange color for denied status
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
  deniedTimelineLabel: {
    color: COLORS.warning || '#f39c12', // Orange color for denied text
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