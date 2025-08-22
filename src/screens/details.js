import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  StatusBar,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { listenUsersByRole } from '../api/userApi';
import { assignComplaint, resolveComplaint, completeComplaint, rejectComplaint } from '../api/complaints';
import database from '@react-native-firebase/database';
import {
  COLORS,
  COMPLAINT_STATUS,
  FONT_WEIGHTS,
  SHADOWS,
  ROLES,
  BORDER_RADIUS,
  SPACING,
  FONT_SIZES,
  FONT_FAMILIES,
  COMPLAINT_STATUS_AR,
} from '../constants';

const { width } = Dimensions.get('window');

const getTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 1) {
      return 'الآن';
    } else if (diffInMinutes < 60) {
      return `منذ ${diffInMinutes} ${diffInMinutes === 1 ? 'دقيقة' : 'دقيقة'}`;
    } else if (diffInHours < 24) {
      return `منذ ${diffInHours} ${diffInHours === 1 ? 'ساعة' : 'ساعة'}`;
    } else if (diffInDays === 1) {
      return 'منذ يوم واحد';
    } else if (diffInDays === 2) {
      return 'منذ يومين';
    } else if (diffInDays < 11) {
      return `منذ ${diffInDays} أيام`;
    } else {
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error parsing date:', error);
    return 'تاريخ غير صحيح';
  }
};

const DisplayMap = ({ lat, long }) => {
  return (
    <View style={styles.mapContainer}>
      <MapView
        provider="google"
        scrollEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        style={styles.map}
        initialRegion={{
          latitude: Number(lat),
          longitude: Number(long),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{
            latitude: Number(lat),
            longitude: Number(long),
          }}
          onPress={() => {
            Alert.alert('تأكيد', 'هل تريد فتح الموقع في خرائط جوجل؟', [
              { text: 'إلغاء', style: 'cancel' },
              {
                text: 'فتح',
                onPress: () => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
                  Linking.openURL(url);
                },
              },
            ]);
          }}
        />
      </MapView>
    </View>
  );
};

export default function ComplaintDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { complaint } = route.params || {};

  const [complaintData, setComplaintData] = useState(complaint);
  const [status, setStatus] = useState(complaint?.status);
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(complaint?.worker_assignee_id || null);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(complaint?.manager_assignee_id || null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const user = useSelector((state) => state.user.user);
  useEffect(() => {
    let managersUnsubscribe;
    let workersUnsubscribe;

    const setupListeners = async () => {
      try {        
        managersUnsubscribe = listenUsersByRole(ROLES.MANAGER,setManagers);
        workersUnsubscribe = listenUsersByRole(ROLES.WORKER, setWorkers);
      } catch (error) {
        console.error('Setup error:', error);
        setError('خطأ في إعداد الاتصال بقاعدة البيانات');
      }
    };
    setupListeners();
    return () => {
      if (managersUnsubscribe) managersUnsubscribe();
      if (workersUnsubscribe) workersUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!complaint?.id) return;
    const complaintRef = database().ref(`complaints/${complaint.id}`);
    const unsubscribe = complaintRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setComplaintData({ ...data, id: complaint.id });
        setStatus(data.status);
        setSelectedManager(data.manager_assignee_id || null);
        setSelectedWorker(data.worker_assignee_id || null);
      }
    }, (error) => {
      console.error('Real-time update error:', error);
      setError('خطأ في تحديث بيانات الشكوى');
    });

    return () => complaintRef.off('value', unsubscribe);
  }, [complaint?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const snapshot = await database().ref(`complaints/${complaint.id}`).once('value');
      const data = snapshot.val();
      
      if (data) {
        setComplaintData({ ...data, id: complaint.id });
        setStatus(data.status);
        setSelectedManager(data.manager_assignee_id || null);
        setSelectedWorker(data.worker_assignee_id || null);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setError('خطأ في تحديث البيانات');
    } finally {
      setRefreshing(false);
    }
  }, [complaint?.id]);

  const getStatusColor = (status) => {
  const statusMap = {
    [COMPLAINT_STATUS.PENDING]: {bg: COLORS.status.pending.background, text: COLORS.status.pending.text },
    [COMPLAINT_STATUS.ASSIGNED]: {bg: COLORS.status.assigned.background, text: COLORS.status.assigned.text },
    [COMPLAINT_STATUS.RESOLVED]: {bg: COLORS.status.resolved.background, text: COLORS.status.resolved.text },
    [COMPLAINT_STATUS.COMPLETED]: {bg: COLORS.status.completed.background, text: COLORS.status.completed.text },
    [COMPLAINT_STATUS.REJECTED]: {bg: COLORS.status.rejected.background, text: COLORS.status.rejected.text },
  };
  return statusMap[status] || { bg: COLORS.gray[200], text: COLORS.text.secondary };
};

  const getStatusText = (status) => {
    const statusMap = {
      [COMPLAINT_STATUS.PENDING]: COMPLAINT_STATUS_AR.PENDING,
      [COMPLAINT_STATUS.ASSIGNED]: COMPLAINT_STATUS_AR.ASSIGNED,
      [COMPLAINT_STATUS.RESOLVED]: COMPLAINT_STATUS_AR.RESOLVED,
      [COMPLAINT_STATUS.COMPLETED]: COMPLAINT_STATUS_AR.COMPLETED,
      [COMPLAINT_STATUS.REJECTED]: COMPLAINT_STATUS_AR.REJECTED,
    };
    return statusMap[status] || status || 'غير محدد';
  };

  const handleAssignComplaint = useCallback(async (assignedUserId, assignedUserName) => {
    setIsLoading(true);
    try {
      await assignComplaint(complaint.id, assignedUserId, assignedUserName, user.role, user.id);
      setShowAssignModal(false);
      Alert.alert('نجح', 'تم تعيين الشكوى بنجاح')
    } catch (error) {
      console.error('Error assigning complaint:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تعيين الشكوى');
    } finally {
      setIsLoading(false);
    }
  }, [complaint?.id, user]);

  const handleResolveComplaint = useCallback(async () => {
    Alert.alert(
      'تأكيد الحل',
      'هل أنت متأكد من أن هذه الشكوى تم حلها؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            setIsLoading(true);
            try {
              await resolveComplaint(complaint.id, user.id);
              Alert.alert('نجح', 'تم تحديث حالة الشكوى إلى "تم الحل"');
            } catch (error) {
              console.error('Error resolving complaint:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الشكوى');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [complaint?.id, user?.id]);

  const handleCompleteComplaint = useCallback(async () => {
    Alert.alert(
      'تأكيد الإنجاز',
      'هل أنت متأكد من إنجاز هذه الشكوى نهائياً؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            setIsLoading(true);
            try {
              await completeComplaint(complaint.id, user.id);
              Alert.alert('نجح', 'تم إنجاز الشكوى بنجاح');
            } catch (error) {
              console.error('Error completing complaint:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء إنجاز الشكوى');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  }, [complaint?.id, user?.id]);

  const handleRejectComplaint = useCallback(async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('خطأ', 'يجب كتابة سبب الرفض');
      return;
    }

    setIsLoading(true);
    try {
      await rejectComplaint(complaint.id, user.id, rejectionReason.trim());
      setShowRejectModal(false);
      setRejectionReason('');
      Alert.alert('تم', 'تم رفض الشكوى');
    } catch (error) {
      console.error('Error rejecting complaint:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء رفض الشكوى');
    } finally {
      setIsLoading(false);
    }
  }, [complaint?.id, rejectionReason, user.id]);

  const renderStatusTimeline = useCallback(() => {
    const currentComplaint = complaintData || complaint;
    
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
        label: 'قيد الحل', 
        completed: [COMPLAINT_STATUS.RESOLVED, COMPLAINT_STATUS.COMPLETED].includes(status), 
        date: currentComplaint.resolved_at 
      },
      { 
        key: 'completed', 
        label: 'تم الحل', 
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
  }, [complaintData, complaint, status]);

  const renderAssignModal = useCallback(() => {
    const isAdmin = user?.role === ROLES.ADMIN;
    const usersToShow = isAdmin ? managers : workers;
    const modalTitle = isAdmin ? 'اختر مدير لتعيين الشكوى' : 'اختر عامل لتعيين الشكوى';

    return (
      <Modal
        visible={showAssignModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            
            {usersToShow.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {isAdmin ? 'لا يوجد مدراء متاحون' : 'لا يوجد عمال متاحون'}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
                {usersToShow.map((userItem) => (
                  <TouchableOpacity
                    key={userItem.id}
                    style={styles.userItem}
                    onPress={() => handleAssignComplaint(userItem.id, userItem.full_name)}
                    disabled={isLoading}
                  >
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{userItem.full_name}</Text>
                      <Text style={styles.userPhone}>{userItem.phone_number}</Text>
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
              onPress={() => setShowAssignModal(false)}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }, [showAssignModal, user?.role, managers, workers, isLoading, handleAssignComplaint]);

  const renderRejectModal = useCallback(() => {
    return (
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>سبب رفض الشكوى</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder=" اكتب سبب الرفض... (10-500 حرف)"
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              textAlignVertical="top"
              maxLength={500}
              editable={!isLoading}
            />
            
            <Text style={styles.characterCount}>
              {rejectionReason.length}/500 حرف
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.rejectButton,
                  (isLoading || rejectionReason.length < 10) && styles.disabledButton
                ]}
                onPress={handleRejectComplaint}
                disabled={isLoading || rejectionReason.length < 10}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.modalButtonText}>رفض الشكوى</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }, [showRejectModal, rejectionReason, isLoading, handleRejectComplaint]);

const renderActionButtons = useCallback(() => {
  const canAssign =
    (user?.role === ROLES.ADMIN && status === COMPLAINT_STATUS.PENDING) ||
    (user?.role === ROLES.MANAGER &&status === COMPLAINT_STATUS.ASSIGNED &&!complaintData?.worker_assignee_id);

  const canResolve =
    (user?.role === ROLES.WORKER && status === COMPLAINT_STATUS.ASSIGNED) ||
    (user?.role === ROLES.MANAGER && status === COMPLAINT_STATUS.ASSIGNED);

  const canComplete =
    user?.role === ROLES.ADMIN && status === COMPLAINT_STATUS.RESOLVED;

  const canReject =
    user?.role === ROLES.ADMIN && status === COMPLAINT_STATUS.PENDING;

  const isAlreadyAssigned =
    user?.role === ROLES.MANAGER && status === COMPLAINT_STATUS.ASSIGNED && complaintData?.worker_assignee_id;

  if (!canAssign && !canResolve && !canComplete && !canReject && !isAlreadyAssigned) {
    return null;
  }

  return (
    <View style={styles.actionsContainer}>
      {canAssign && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.assignButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={() => setShowAssignModal(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.actionButtonText}>
              {user?.role === ROLES.ADMIN ? "تعيين لمدير" : "تعيين لعامل"}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {isAlreadyAssigned && (
        <View style={[styles.actionButton, styles.alreadyAssignedButton]}>
          <Text style={styles.actionButtonText}>تم التعيين بالفعل</Text>
        </View>
      )}

      {canResolve && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.resolveButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={handleResolveComplaint}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={styles.actionButtonText}>تم الحل</Text>
          )}
        </TouchableOpacity>
      )}

      {canComplete && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.completeButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={handleCompleteComplaint}
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
          onPress={() => setShowRejectModal(true)}
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
}, [
  user?.role, status,complaintData?.worker_assignee_id, isLoading, handleResolveComplaint, handleCompleteComplaint,
]);
  const currentComplaint = complaint;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>→</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.complaintId}>
            #{currentComplaint.area_name || 'غير محدد'}
          </Text>
          <Text style={styles.complaintType}>
            {currentComplaint.indicator_name || 'نوع غير محدد'}
          </Text>
        </View>

        {isLoading && (
          <ActivityIndicator size="small" color={COLORS.white} />
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.contentContainer}>
          <View style={styles.section}>
            <View style={styles.statusHeader}>
              <Text style={styles.sectionTitle}>حالة الشكوى</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(status).bg }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(status).text }
                ]}>
                  {getStatusText(status)}
                </Text>
              </View>
            </View>

            {renderStatusTimeline()}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات الشكوى</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📅 تاريخ التقديم</Text>
              <Text style={styles.infoValue}>
                {currentComplaint.created_at ? new Date(currentComplaint.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : 'غير محدد'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🏷️ نوع المشكلة</Text>
              <Text style={styles.infoValue}>
                {currentComplaint.indicator_name || 'غير محدد'}
              </Text>
            </View>
             <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📍 المنطقة</Text>
              <Text style={styles.infoValue}>
                {currentComplaint.area_name || 'غير محدد'}
              </Text>
            </View>

            {currentComplaint.user_name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>👤 مقدم الشكوى</Text>
                <Text style={styles.infoValue}>{currentComplaint.user_name}</Text>
              </View>
            )}
            
            {currentComplaint.manager_name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>👨‍💼 المدير المسؤول</Text>
                <Text style={styles.infoValue}>{currentComplaint.manager_name}</Text>
              </View>
            )}
            
            {currentComplaint.worker_name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>👷‍♂️ العامل المسؤول</Text>
                <Text style={styles.infoValue}>{currentComplaint.worker_name}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 الموقع على الخريطة</Text>
            <View style={styles.locationContainer}>
              <DisplayMap 
                lat={currentComplaint.latitude} 
                long={currentComplaint.longitude}
              />
              <View style={styles.coordinatesContainer}>
                <Text style={styles.coordinatesText}>
                  الإحداثيات: {currentComplaint.latitude}, {currentComplaint.longitude}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>وصف المشكلة</Text>
            <Text style={styles.descriptionText}>
              {currentComplaint.description || 'لا يوجد وصف متاح'}
            </Text>
          </View>

          {status === COMPLAINT_STATUS.REJECTED && currentComplaint.rejection_reason && (
            <View style={[styles.section, styles.rejectionSection]}>
              <Text style={[styles.sectionTitle, styles.rejectionTitle]}>سبب الرفض</Text>
              <Text style={styles.rejectionReasonText}>
                {currentComplaint.rejection_reason}
              </Text>
              {currentComplaint.rejected_at && (
                <Text style={styles.rejectionDate}>
                  تاريخ الرفض: {getTimeAgo(currentComplaint.rejected_at)}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
      {renderActionButtons()}
      {renderAssignModal()}
      {renderRejectModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.massive,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  complaintId: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
    fontFamily: FONT_FAMILIES.primary,
  },
  complaintType: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILIES.primary,
  },

  errorBanner: {
    backgroundColor: COLORS.danger, 
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    flex: 1,
    fontFamily: FONT_FAMILIES.primary,
  },
  errorDismiss: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    paddingLeft: SPACING.md,
  },

  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.xl,
  },

  section: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    // ...SHADOWS.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  rejectionSection: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    fontFamily: FONT_FAMILIES.primary,
  },
  rejectionTitle: {
    color: COLORS.danger,
  },

  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xl,
  },
  statusText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
  },

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

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoLabel: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    flex: 1,
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILIES.primary,
  },
  infoValue: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    flex: 1,
    textAlign: 'right',
    fontFamily: FONT_FAMILIES.primary,
  },

  locationContainer: {
    alignItems: 'center',
  },
  mapContainer: {
    width: width - SPACING.xxxl * 2,
    height: 250,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    position: 'relative',
    backgroundColor: COLORS.location,
  },
  map: {
    flex: 1,
  },
  coordinatesContainer: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  coordinatesText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
  },

  descriptionText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.primary,
    lineHeight: 24,
    fontFamily: FONT_FAMILIES.primary,
  },

  rejectionReasonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.danger,
    lineHeight: 24,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILIES.primary,
  },
  rejectionDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
    fontFamily: FONT_FAMILIES.primary,
  },

  actionsContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    ...SHADOWS.lg,
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
  assignButton: {
    backgroundColor: COLORS.success,
  },
  resolveButton: {
    backgroundColor: COLORS.info,
  },
  completeButton: {
    backgroundColor: COLORS.warning,
  },
  rejectActionButton: {
    backgroundColor: COLORS.danger,
  },
  alreadyAssignedButton: {
    backgroundColor: COLORS.gray[400],
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    marginLeft: SPACING.sm,
    fontFamily: FONT_FAMILIES.primary,
  },

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
  modalButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
  },
});