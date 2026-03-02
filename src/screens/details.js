import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Linking, Alert, StatusBar, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { getCurrentLocation } from '../utils/CurrentLocation.js';
import { launchCamera } from 'react-native-image-picker';
import { sendComplaintSttsNotification } from '../services/notifications.js';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  getEmailbyId,
  getManagerEmail,
  getWorkerByAreaId,
  getSupervisorEmailsByArea,
} from '../api/userApi';
import {
  assignComplaint,
  resolveComplaint,
  completeComplaint,
  rejectComplaint,
  denyComplaint,
} from '../api/complaints';
import database from '@react-native-firebase/database';
import { COLORS, COMPLAINT_STATUS, ROLES, COMPLAINT_STATUS_AR } from '../constants';
import {
  requestCameraPermissions,
  requestLocationPermission,
  useCustomAlert,
} from '../utils/Permissions.js';
import { ImageResolutionComponent } from '../components/resolveComponent.js';
import ImageService from '../services/ImageService.js';
import HeaderSection from '../components/headerSection';
import { checkLocationServicesEnabled } from '../utils/Permissions.js';
import CustomAlert from '../components/customAlert';
import ErrorBanner from '../components/complaintDetails/ErrorBanner';
import AssignWorkerModal from '../components/complaintDetails/AssignWorkerModal';
import RejectComplaintModal from '../components/complaintDetails/RejectComplaintModal';
import DenySolutionModal from '../components/complaintDetails/DenySolutionModal';
import ComplaintDetailsSections from '../components/complaintDetails/ComplaintDetailsSections';
import ComplaintDetailsActionButtons from '../components/complaintDetails/ComplaintDetailsActionButtons';

export const getTimeAgo = timestamp => {
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
        day: 'numeric',
      });
    }
  } catch (error) {
    console.error('Error parsing date:', error);
    return 'تاريخ غير صحيح';
  }
};

export default function ComplaintDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { complaint } = route.params || {};
  console.log('Navigated to ComplaintDetailsScreen with complaint:', complaint);
  const [complaintData, setComplaintData] = useState(complaint);
  const [status, setStatus] = useState(complaint?.status);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyreason, setDenyReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showResolutionComponent, setShowResolutionComponent] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState('');
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState(null);
  const { showAlert, AlertComponent } = useCustomAlert();
  const [alertVisible, setAlertVisible] = useState(false);
  const[areasWorkers,setAreasWorkers]=useState([]);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
  });

  // Helper function to send notifications based on complaint status change
  const sendNotificationsForStatusChange = async (
    complaint,
    newStatus,
    oldStatus,
  ) => {
    try {
      const notifications = [];

      // Get user email (complaint creator)
      const userEmail = await getEmailbyId(complaint.user_id);

      // Get worker emails if assigned (handle array)
      const workerEmails = complaint.worker_assignee_id
        ? await getEmailbyId(complaint.worker_assignee_id)
        : [];

      // Get admin emails
      const managerEmails = await getManagerEmail();

      const supervisorEmails = await getSupervisorEmailsByArea(
        complaint?.area_id ?? complaintData?.area_id,
      );

switch (newStatus) {
      case COMPLAINT_STATUS.ASSIGNED:
        // When complaint is assigned, notify worker and supervisor of the specific municipality
        if (workerEmails.length > 0 && oldStatus === COMPLAINT_STATUS.PENDING) {
          notifications.push({
            emails: workerEmails,
            message: 'تم تعيين شكوى جديدة لك من قبل المدير',
          });
        }

        // Notify supervisor of the specific municipality
        if (supervisorEmails.length > 0) {
          notifications.push({
            emails: supervisorEmails,
            message: 'تم تعيين شكوى جديدة في منطقتك',
          });
        }
        break;

      case COMPLAINT_STATUS.RESOLVED:
        // When resolved by worker, notify managers and the specific supervisor
        if (managerEmails.length > 0) {
          notifications.push({
            emails: managerEmails,
            message: 'تم حل شكوى من قبل العامل المسؤول',
          });
        }

        // Notify supervisor of the specific municipality
        if (supervisorEmails.length > 0) {
          notifications.push({
            emails: supervisorEmails,
            message: 'شكوى جديدة تحتاج إلى تأكيد الإنجاز في منطقتك',
          });
        }
        break;

      case COMPLAINT_STATUS.COMPLETED:
        // When completed, only notify the citizen (complaint creator)
        if (userEmail) {
          notifications.push({
            emails: [userEmail],
            message: 'تم إنجاز شكواك بنجاح',
          });
        }
        break;

      case COMPLAINT_STATUS.REJECTED:
        // When rejected, only notify the citizen (complaint creator)
        if (userEmail) {
          notifications.push({
            emails: [userEmail],
            message: 'تم رفض شكواك',
          });
        }
        break;

      case COMPLAINT_STATUS.DENIED:
        // When solution is denied, notify the worker to redo the work
        if (workerEmails.length > 0) {
          notifications.push({
            emails: workerEmails,
            message: 'تم رفض الحل المقترح للشكوى، يرجى إعادة المحاولة',
          });
        }

        if(managerEmails.length > 0) {
          notifications.push({
            emails: managerEmails,
            message: 'تم رفض الحل المقترح للشكوى من قبل المشرف',
          });
        }
        break;
    }

    // Send all notifications
    for (const notification of notifications) {
      try {
        await sendComplaintSttsNotification(
          notification.emails,
          newStatus,
          complaint,
        );
        console.log(
          `Notification sent to:`,
          notification.emails,
          `Message: ${notification.message}`,
        );
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendNotificationsForStatusChange:', error);
  }
};
  // Custom Alert Functions
  const showCustomAlert = (title, message, buttons = []) => {
    setAlertData({ title, message, buttons });
    setAlertVisible(true);
  };

  const hideCustomAlert = () => {
    setAlertVisible(false);
  };

  useFocusEffect(
    useCallback(() => {
      setShouldRenderMap(true);

      return () => {
        // Screen is unfocused, cleanup map
        setShouldRenderMap(false);
      };
    }, []),
  );

  const user = useSelector(state => state.user.user);
  useEffect(() => {
    const setupListeners = async () => {
      try {
        if (complaint?.area_id) {
          const workersByArea = await getWorkerByAreaId(complaint.area_id);
          setAreasWorkers(workersByArea);
        }
      } catch (error) {
        console.error('Setup error:', error);
        setError('خطأ في إعداد الاتصال بقاعدة البيانات');
      }
    };
    setupListeners();
  }, [complaint?.area_id]);

  useEffect(() => {
    if (!complaint?.id) return;
    const complaintRef = database().ref(`complaints/${complaint.id}`);
    const unsubscribe = complaintRef.on(
      'value',
      snapshot => {
        const data = snapshot.val();
        if (data) {
          setComplaintData({ ...data, id: complaint.id });
          setStatus(data.status);
        }
      },
      error => {
        console.error('Real-time update error:', error);
        setError('خطأ في تحديث بيانات الشكوى');
      },
    );

    return () => complaintRef.off('value', unsubscribe);
  }, [complaint?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const snapshot = await database()
        .ref(`complaints/${complaint.id}`)
        .once('value');
      const data = snapshot.val();

      if (data) {
        setComplaintData({ ...data, id: complaint.id });
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      setError('خطأ في تحديث البيانات');
    } finally {
      setRefreshing(false);
    }
  }, [complaint?.id]);

  const getStatusColor = status => {
    const statusMap = {
      [COMPLAINT_STATUS.PENDING]: {
        bg: COLORS.status.pending.background,
        text: COLORS.status.pending.text,
      },
      [COMPLAINT_STATUS.ASSIGNED]: {
        bg: COLORS.status.assigned.background,
        text: COLORS.status.assigned.text,
      },
      [COMPLAINT_STATUS.RESOLVED]: {
        bg: COLORS.status.resolved.background,
        text: COLORS.status.resolved.text,
      },
      [COMPLAINT_STATUS.COMPLETED]: {
        bg: COLORS.status.completed.background,
        text: COLORS.status.completed.text,
      },
      [COMPLAINT_STATUS.REJECTED]: {
        bg: COLORS.status.rejected.background,
        text: COLORS.status.rejected.text,
      },
    };
    return (
      statusMap[status] || { bg: COLORS.gray[200], text: COLORS.text.secondary }
    );
  };

  const getStatusText = status => {
    const statusMap = {
      [COMPLAINT_STATUS.PENDING]: COMPLAINT_STATUS_AR.PENDING,
      [COMPLAINT_STATUS.ASSIGNED]: COMPLAINT_STATUS_AR.ASSIGNED,
      [COMPLAINT_STATUS.RESOLVED]: COMPLAINT_STATUS_AR.RESOLVED,
      [COMPLAINT_STATUS.COMPLETED]: COMPLAINT_STATUS_AR.COMPLETED,
      [COMPLAINT_STATUS.REJECTED]: COMPLAINT_STATUS_AR.REJECTED,
      [COMPLAINT_STATUS.DENIED]: COMPLAINT_STATUS_AR.DENIED,
    };
    return statusMap[status] || status || 'غير محدد';
  };

  const handleAssignComplaint = useCallback(
    async (assignedUserId, assignedUserName) => {
      setIsLoading(true);
      try {
        const oldStatus = complaint.status;

        // Check if worker is already assigned (only for manager role assigning workers)
        if (user?.role === ROLES.MANAGER && complaintData?.worker_assignee_id) {
          const currentWorkerIds = Array.isArray(
            complaintData.worker_assignee_id,
          )
            ? complaintData.worker_assignee_id
            : [complaintData.worker_assignee_id];

          if (currentWorkerIds.includes(assignedUserId)) {
            Alert.alert(
              'تحذير',
              `العامل ${assignedUserName} مُعيّن بالفعل لهذه الشكوى`,
            );
            setIsLoading(false);
            return;
          }
        }
        await assignComplaint(
          complaint.id,
          assignedUserId,
          assignedUserName,
          user.role,
        );

        const updatedComplaint = {
        ...complaint,
        status: COMPLAINT_STATUS.ASSIGNED,
        worker_assignee_id: Array.isArray(complaint.worker_assignee_id)
          ? [...complaint.worker_assignee_id, assignedUserId]
          : [assignedUserId],
      };

        await sendNotificationsForStatusChange(
          updatedComplaint,
          COMPLAINT_STATUS.ASSIGNED,
          oldStatus,
        );

        setShowAssignModal(false);
        showCustomAlert('نجح', 'تم تعيين الشكوى بنجاح');
      } catch (error) {
        console.error('Error assigning complaint:', error);
        showCustomAlert('خطأ', 'حدث خطأ أثناء تعيين الشكوى');
      } finally {
        setIsLoading(false);
      }
    },
    [complaint?.id, user, complaintData?.worker_assignee_id],
  );

  const showLocationSettingsAlert = () => {
    showCustomAlert(
      'خدمات الموقع مطلوبة',
      'يرجى تمكين خدمات الموقع لاستخدام ميزة الكاميرا.',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
          onPress: hideCustomAlert,
        },
        {
          text: 'فتح الإعدادات',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('App-Prefs:Privacy&path=LOCATION');
            } else {
              Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
            }
          },
        },
      ],
    );
  };

  const handleResolveComplaint = useCallback(async () => {
    try {
      // Request camera permissions
      const getLocationPermissions = await requestLocationPermission(showAlert);
      if (!getLocationPermissions) {
        // showCustomAlert('خطأ', 'لا يمكن الوصول إلى الموقع بدون الأذونات اللازمة');
        return;
      }

      const getCameraPermissions = await requestCameraPermissions(showAlert);
      if (!getCameraPermissions) {
        // showCustomAlert('خطأ', 'لا يمكن الوصول إلى الكاميرا بدون الأذونات اللازمة');
        return;
      }

      const locationServicesEnabled = await checkLocationServicesEnabled();
      if (!locationServicesEnabled) {
        showLocationSettingsAlert();
        return;
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });

      console.log('Camera result:', result);

      if (!result.didCancel && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;

        try {
          const location = await getCurrentLocation();
          console.log('Current location:', location);

          setCapturedImageUri(uri);
          setCapturedLocation(location);
          setShowResolutionComponent(true);
        } catch (locationError) {
          console.error('Location error:', locationError);
          Alert.alert(
            'تحذير',
            'لم يتم الحصول على الموقع الحالي. هل تريد المتابعة بدون موقع؟',
            [
              { text: 'إلغاء', style: 'cancel' },
              {
                text: 'متابعة',
                onPress: () => {
                  setCapturedImageUri(uri);
                  setCapturedLocation(null);
                  setShowResolutionComponent(true);
                },
              },
            ],
          );
        }
      }
    } catch (error) {
      console.error('Error in handleResolveComplaint:', error);
      showCustomAlert('خطأ', 'حدث خطأ أثناء تحضير حل المشكلة');
    }
  }, []);

  useEffect(() => {
    if (capturedImageUri) {
      console.log('capturedImageUri updated:', capturedImageUri);
    }
  }, [capturedImageUri]);

  const submitResolveComplaint = async () => {
    setIsLoading(true);
    try {
      // const photo_url = await uploadPhoto(capturedImageUri);
      const result = await ImageService.processAndUploadImages(
        capturedImageUri,
        'resolved',
      );

      console.log('Photo uploaded:', result);

      if (result.success) {
        const oldStatus = complaint.status;

        // Pass location coordinates to resolveComplaint
        await resolveComplaint(
          complaint.id,
          result.fullImageUrl,
          result.thumbnailUrl,
          capturedLocation?.latitude || null,
          capturedLocation?.longitude || null,
        );

        // Send notifications after successful resolution
        const updatedComplaint = {
          ...complaint,
          status: COMPLAINT_STATUS.RESOLVED,
        };

        await sendNotificationsForStatusChange(
          updatedComplaint,
          COMPLAINT_STATUS.RESOLVED,
          oldStatus,
        );

        showCustomAlert('نجح', 'تم تحديث حالة الشكوى إلى "تم الحل"');

        // Clear captured data
        setCapturedImageUri('');
        setCapturedLocation(null);
      } else {
        showCustomAlert('خطأ', 'حدث خطأ أثناء تحديث الشكوى');
      }
    } catch (error) {
      console.error('Error resolving complaint:', error);
      showCustomAlert('خطأ', 'حدث خطأ أثناء تحديث الشكوى');
    } finally {
      setIsLoading(false);
    }
  };
  const handleCompleteComplaint = useCallback(async () => {
    showCustomAlert(
      'تأكيد الإنجاز',
      'هل أنت متأكد من إنجاز هذه الشكوى نهائياً؟',
      [
        { text: 'إلغاء', style: 'cancel', onPress: hideCustomAlert },
        {
          text: 'تأكيد',
          onPress: async () => {
            setIsLoading(true);
            try {
              const oldStatus = complaint.status;

              await completeComplaint(complaint.id);

              // Send notifications after successful completion
              const updatedComplaint = {
                ...complaint,
                status: COMPLAINT_STATUS.COMPLETED,
              };

              await sendNotificationsForStatusChange(
                updatedComplaint,
                COMPLAINT_STATUS.COMPLETED,
                oldStatus,
              );

              showCustomAlert('نجح', 'تم إنجاز الشكوى بنجاح');
            } catch (error) {
              console.error('Error completing complaint:', error);
              showCustomAlert('خطأ', 'حدث خطأ أثناء إنجاز الشكوى');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  }, [complaint?.id, user?.id]);
  
  const handleDenyComplaint = useCallback(async () => {
    if(!denyreason.trim()){
      showCustomAlert('خطأ', 'يجب كتابة سبب الرفض');
      return;
    }
    setIsLoading(true);
    try {
      const oldStatus = complaint.status;
      await denyComplaint(complaint.id, denyreason.trim());
      const updatedComplaint = {
        ...complaint,
        status: COMPLAINT_STATUS.DENIED,
        deny_reason: denyreason.trim(),
      };
      await sendNotificationsForStatusChange(
        updatedComplaint,
        COMPLAINT_STATUS.DENIED,
        oldStatus,
      );
      setShowDenyModal(false);
      setDenyReason('');
      showCustomAlert('تم', 'تم رفض الحل للشكوى');
    } catch (error) {
      console.error('Error denying complaint:', error);
      showCustomAlert('خطأ', 'حدث خطأ أثناء رفض الحل ');
    } finally {
      setIsLoading(false);
    }
  }, [complaint?.id, denyreason, user.id]);

  const handleRejectComplaint = useCallback(async () => {
    if (!rejectionReason.trim()) {
      showCustomAlert('خطأ', 'يجب كتابة سبب الرفض');
      return;
    }
    setIsLoading(true);
    try {
      const oldStatus = complaint.status;
      await rejectComplaint(complaint.id, rejectionReason.trim());
      const updatedComplaint = {
        ...complaint,
        status: COMPLAINT_STATUS.REJECTED,
        rejection_reason: rejectionReason.trim(),
      };

      await sendNotificationsForStatusChange(
        updatedComplaint,
        COMPLAINT_STATUS.REJECTED,
        oldStatus,
      );
      setShowRejectModal(false);
      setRejectionReason('');
      showCustomAlert('تم', 'تم رفض الشكوى');
    } catch (error) {
      console.error('Error rejecting complaint:', error);
      showCustomAlert('خطأ', 'حدث خطأ أثناء رفض الشكوى');
    } finally {
      setIsLoading(false);
    }
  }, [complaint?.id, rejectionReason, user.id]);

  // Inline modals and action buttons have been extracted into
  // dedicated presentational components in `src/components/complaintDetails/`.

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>→</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.complaintId}>تفاصيل الشكوى</Text>
        </View> */}
      <HeaderSection
        title="تفاصيل الشكوى"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      {isLoading && <ActivityIndicator size="small" color={COLORS.white} />}
      {/* </View> */}

      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        buttons={alertData.buttons}
        onClose={hideCustomAlert}
      />

      {/* Custom Alert Component */}
      <AlertComponent />

      <ComplaintDetailsSections
        complaint={complaint}
        complaintData={complaintData}
        status={status}
        userRole={user?.role}
        refreshing={refreshing}
        onRefresh={onRefresh}
        shouldRenderMap={shouldRenderMap}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        getTimeAgo={getTimeAgo}
      />

      <ComplaintDetailsActionButtons
        userRole={user?.role}
        status={status}
        hasAssignedWorker={!!complaintData?.worker_assignee_id}
        isLoading={isLoading}
        onOpenAssign={() => setShowAssignModal(true)}
        onResolve={handleResolveComplaint}
        onOpenDeny={() => setShowDenyModal(true)}
        onComplete={handleCompleteComplaint}
        onOpenReject={() => setShowRejectModal(true)}
      />

      <AssignWorkerModal
        visible={showAssignModal}
        isLoading={isLoading}
        users={areasWorkers}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignComplaint}
      />

      <RejectComplaintModal
        visible={showRejectModal}
        isLoading={isLoading}
        reason={rejectionReason}
        onChangeReason={setRejectionReason}
        onConfirm={handleRejectComplaint}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
        }}
      />

      <DenySolutionModal
        visible={showDenyModal}
        isLoading={isLoading}
        reason={denyreason}
        onChangeReason={setDenyReason}
        onConfirm={handleDenyComplaint}
        onClose={() => {
          setShowDenyModal(false);
          setDenyReason('');
        }}
      />
      <ImageResolutionComponent
        capturedImageUri={capturedImageUri}
        onConfirm={async () => {
          setShowResolutionComponent(false);
          await submitResolveComplaint();
        }}
        onCancel={() => setShowResolutionComponent(false)}
        isVisible={showResolutionComponent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
