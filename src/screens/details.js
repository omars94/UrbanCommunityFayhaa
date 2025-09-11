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
  FlatList,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getCurrentLocation } from '../utils/CurrentLocation.js';
import { launchCamera } from 'react-native-image-picker';
import {sendComplaintSttsNotification} from '../services/notifications.js';
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { listenUsersByRole , getEmailbyId, getAdminEmails} from '../api/userApi';
import {
  assignComplaint,
  resolveComplaint,
  completeComplaint,
  rejectComplaint,
} from '../api/complaints';
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
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { DisplayMap } from '../components/detailsComponents/map.js';
import ImageSlider from '../components/detailsComponents/imageSlider.js';
import {
  requestCameraPermissions,
  requestLocationPermission,
  useCustomAlert,
} from '../utils/Permissions.js';
import { ImageResolutionComponent } from '../components/resolveComponent.js';
import storage from '@react-native-firebase/storage';
import StatusTimeline from '../components/detailsComponents/timeline.js';
import ImageService from '../services/ImageService.js';
import HeaderSection from '../components/headerSection';
import { formatLebanesePhone } from '../utils/index';
import {checkLocationServicesEnabled} from '../utils/Permissions.js';
import CustomAlert from "../components/customAlert";

const { width } = Dimensions.get('window');

const uploadPhoto = async uri => {
  const filename = `issues/${Date.now()}.jpg`;
  const reference = storage().ref(filename);
  await reference.putFile(uri);
  return await reference.getDownloadURL();
};

const getTimeAgo = timestamp => {
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
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(
    complaint?.worker_assignee_id || [],
  );
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(
    complaint?.manager_assignee_id || null,
  );
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showResolutionComponent, setShowResolutionComponent] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState('');
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [capturedLocation, setCapturedLocation] = useState(null);
  // Add custom alert hook
  const { showAlert, AlertComponent } = useCustomAlert();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
  });

  // Helper function to send notifications based on complaint status change
const sendNotificationsForStatusChange = async (complaint, newStatus, oldStatus) => {
  try {
    const notifications = [];
    
    // Get user email (complaint creator)
    const userEmail = await getEmailbyId(complaint.user_id);
    
    // Get manager email if assigned
    const managerEmail = complaint.manager_assignee_id 
      ? await getEmailbyId(complaint.manager_assignee_id) 
      : null;
    
    // Get worker emails if assigned (handle array)
    const workerEmails = complaint.worker_assignee_id 
      ? await getEmailbyId(complaint.worker_assignee_id)
      : [];
    
    // Get admin emails 
    const adminEmails = await getAdminEmails(); 
    
    switch (newStatus) {
      case COMPLAINT_STATUS.ASSIGNED:
        // When admin assigns to manager
        if (oldStatus === COMPLAINT_STATUS.PENDING && managerEmail) {
          notifications.push({
            emails: [managerEmail],
            message: 'تم تعيين شكوى جديدة لك من قبل الإدارة'
          });
        }
        
        // When manager assigns to worker(s)
        if (workerEmails.length > 0 && oldStatus === COMPLAINT_STATUS.ASSIGNED) {
          notifications.push({
            emails: workerEmails,
            message: 'تم تعيين شكوى جديدة لك من قبل المدير'
          });
        }
        
        // Notify user about assignment
        // if (userEmail) {
        //   notifications.push({
        //     emails: [userEmail],
        //     message: 'تم تعيين شكواك للجهة المختصة'
        //   });
        // }
        break;
        
      case COMPLAINT_STATUS.RESOLVED:
        // Notify manager when worker resolves
        // if (managerEmail) {
        //   notifications.push({
        //     emails: [managerEmail],
        //     message: 'تم حل شكوى من قبل العامل المسؤول'
        //   });
        // }
        
        // Notify admin when complaint is resolved
        if (adminEmails.length > 0) {
          notifications.push({
            emails: adminEmails,
            message: 'شكوى جديدة تحتاج إلى تأكيد الإنجاز'
          });
        }
        
        // Notify user about resolution
        // if (userEmail) {
        //   notifications.push({
        //     emails: [userEmail],
        //     message: 'تم حل شكواك وفي انتظار تأكيد الإنجاز'
        //   });
        // }
        break;
        
      case COMPLAINT_STATUS.COMPLETED:
        // Notify manager when admin completes
        // if (managerEmail) {
        //   notifications.push({
        //     emails: [managerEmail],
        //     message: 'تم تأكيد إنجاز شكوى من قبل الإدارة'
        //   });
        // }
        
        // Notify worker(s) when admin completes
        // if (workerEmails.length > 0) {
        //   notifications.push({
        //     emails: workerEmails,
        //     message: 'تم تأكيد إنجاز شكوى عملت عليها'
        //   });
        // }
        
        // Notify user about completion
        if (userEmail) {
          notifications.push({
            emails: [userEmail],
            message: 'تم إنجاز شكواك بنجاح'
          });
        }
        break;
        
      case COMPLAINT_STATUS.REJECTED:
        // Notify manager when admin rejects
        // if (managerEmail) {
        //   notifications.push({
        //     emails: [managerEmail],
        //     message: 'تم رفض شكوى من قبل الإدارة'
        //   });
        // }
        
        // Notify worker(s) when admin rejects
        // if (workerEmails.length > 0) {
        //   notifications.push({
        //     emails: workerEmails,
        //     message: 'تم رفض شكوى كنت مسؤولاً عنها'
        //   });
        // }
        
        // Notify user about rejection
        // if (userEmail) {
        //   notifications.push({
        //     emails: [userEmail],
        //     message: 'تم رفض شكواك'
        //   });
        // }
        break;
    }
    
    // Send all notifications
    for (const notification of notifications) {
      try {
        await sendComplaintSttsNotification(
          notification.emails,
          newStatus,
          complaint
        );
        console.log(`Notification sent to:`, notification.emails, `Message: ${notification.message}`);
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
    let managersUnsubscribe;
    let workersUnsubscribe;

    const setupListeners = async () => {
      try {
        managersUnsubscribe = listenUsersByRole(ROLES.MANAGER, setManagers);
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
    const unsubscribe = complaintRef.on(
      'value',
      snapshot => {
        const data = snapshot.val();
        if (data) {
          setComplaintData({ ...data, id: complaint.id });
          setStatus(data.status);
          setSelectedManager(data.manager_assignee_id || null);
          setSelectedWorker(data.worker_assignee_id || []);
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
        setSelectedManager(data.manager_assignee_id || null);
        setSelectedWorker(data.worker_assignee_id || []);
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
          const currentWorkerIds = Array.isArray(complaintData.worker_assignee_id) 
            ? complaintData.worker_assignee_id 
            : [complaintData.worker_assignee_id];
          
          if (currentWorkerIds.includes(assignedUserId)) {
            Alert.alert('تحذير', `العامل ${assignedUserName} مُعيّن بالفعل لهذه الشكوى`);
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
        [user.role === ROLES.ADMIN ? 'manager_assignee_id' : 'worker_assignee_id']: 
          user.role === ROLES.ADMIN ? assignedUserId : 
          Array.isArray(complaint.worker_assignee_id) 
            ? [...complaint.worker_assignee_id, assignedUserId]
            : [assignedUserId]
      };
      
      await sendNotificationsForStatusChange(updatedComplaint, COMPLAINT_STATUS.ASSIGNED, oldStatus);
      

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
        status: COMPLAINT_STATUS.RESOLVED 
      };
      
      await sendNotificationsForStatusChange(updatedComplaint, COMPLAINT_STATUS.RESOLVED, oldStatus);

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
    showCustomAlert('تأكيد الإنجاز', 'هل أنت متأكد من إنجاز هذه الشكوى نهائياً؟', [
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
            status: COMPLAINT_STATUS.COMPLETED 
          };
          
          await sendNotificationsForStatusChange(updatedComplaint, COMPLAINT_STATUS.COMPLETED, oldStatus);

            showCustomAlert('نجح', 'تم إنجاز الشكوى بنجاح');
          } catch (error) {
            console.error('Error completing complaint:', error);
            showCustomAlert('خطأ', 'حدث خطأ أثناء إنجاز الشكوى');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  }, [complaint?.id, user?.id]);

  const handleRejectComplaint = useCallback(async () => {
    if (!rejectionReason.trim()) {
      showCustomAlert('خطأ', 'يجب كتابة سبب الرفض');
      return;
    }
    setIsLoading(true);
    try {
      const oldStatus = complaint.status;
      await rejectComplaint(complaint.id,rejectionReason.trim());
      const updatedComplaint = { 
      ...complaint, 
      status: COMPLAINT_STATUS.REJECTED,
      rejection_reason: rejectionReason.trim()
    };
    
    await sendNotificationsForStatusChange(updatedComplaint, COMPLAINT_STATUS.REJECTED, oldStatus);
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

  const renderAssignModal = useCallback(() => {
    const isAdmin = user?.role === ROLES.ADMIN;
    const usersToShow = isAdmin ? managers : workers;
    const modalTitle = isAdmin
      ? 'اختر مدير لتعيين الشكوى'
      : 'اختر عامل لتعيين الشكوى';

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
              <ScrollView
                style={styles.usersList}
                showsVerticalScrollIndicator={false}
              >
                {usersToShow.map(userItem => (
                  <TouchableOpacity
                    key={userItem.id}
                    style={styles.userItem}
                    onPress={() =>
                      handleAssignComplaint(userItem.id, userItem.full_name)
                    }
                    disabled={isLoading}
                  >
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{userItem.full_name}</Text>
                      <Text style={styles.userPhone}>
                        {formatLebanesePhone(userItem.phone_number)}
                      </Text>
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
  }, [
    showAssignModal,
    user?.role,
    managers,
    workers,
    isLoading,
    handleAssignComplaint,
  ]);

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
              placeholder=" اكتب سبب الرفض... "
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
                  (isLoading || rejectionReason.length < 1) &&
                    styles.disabledButton,
                ]}
                onPress={handleRejectComplaint}
                disabled={isLoading || rejectionReason.length < 1}
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
      (user?.role === ROLES.MANAGER && status === COMPLAINT_STATUS.ASSIGNED);

    const canResolve =
      (user?.role === ROLES.WORKER && status === COMPLAINT_STATUS.ASSIGNED) ||
      (user?.role === ROLES.MANAGER && status === COMPLAINT_STATUS.ASSIGNED);

    const canComplete =
      user?.role === ROLES.ADMIN && status === COMPLAINT_STATUS.RESOLVED;

    const canReject =
      user?.role === ROLES.ADMIN &&
      [COMPLAINT_STATUS.PENDING, COMPLAINT_STATUS.RESOLVED].includes(status);

    const isAlreadyAssigned =
      user?.role === ROLES.MANAGER &&
      status === COMPLAINT_STATUS.ASSIGNED &&
      complaintData?.worker_assignee_id;

    if (
      !canAssign &&
      !canResolve &&
      !canComplete &&
      !canReject &&
      !isAlreadyAssigned
    ) {
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
                {user?.role === ROLES.ADMIN
                  ? 'تعيين لمدير'
                  : !complaintData?.worker_assignee_id
                  ? 'تعيين لعامل'
                  : 'إعادة تعيين العامل'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* {isAlreadyAssigned && (
        <View style={[styles.actionButton, styles.alreadyAssignedButton]}>
          <Text style={styles.actionButtonText}>تم التعيين بالفعل</Text>
        </View>
      )} */}

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
              <Text style={styles.actionButtonText}>
                حل المشكلة عن طريق صورة
              </Text>
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
    user?.role,
    status,
    complaintData?.worker_assignee_id,
    isLoading,
    handleResolveComplaint,
    handleCompleteComplaint,
  ]);

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

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        buttons={alertData.buttons}
        onClose={hideCustomAlert}
      />

      {/* Custom Alert Component */}
        <AlertComponent />

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
            <ImageSlider complaint={complaintData || complaint} />
          </View>
          <View style={styles.section}>
            <View style={styles.statusHeader}>
              <Text style={styles.sectionTitle}>حالة الشكوى</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(status).bg },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(status).text },
                  ]}
                >
                  {getStatusText(status)}
                </Text>
              </View>
            </View>

            <StatusTimeline
              complaint={complaintData || complaint}
              status={status}
              getTimeAgo={getTimeAgo}
              userRole={user?.role} 
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>نوع المشكلة</Text>
            <Text style={styles.descriptionText}>
              {complaintData.indicator_name || 'غير محدد'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات الشكوى</Text>
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar"
                size={20}
                color="#2E86AB"
                style={{ marginRight: 5 }}
              />

              <Text style={styles.infoLabel}>تاريخ التقديم</Text>
              <Text style={styles.infoValue}>
                {complaintData.created_at
                  ? new Date(complaintData.created_at).toLocaleDateString(
                      'ar-EG',
                      {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )
                  : 'غير محدد'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons
                name="location"
                size={20}
                color="#E74C3C"
                style={{ marginRight: 5 }}
              />

              <Text style={styles.infoLabel}>المنطقة</Text>
              <Text style={styles.infoValue}>
                {complaintData.area_name || 'غير محدد'}
              </Text>
            </View>
            {complaintData.user_name && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="person"
                  size={20}
                  color="#2E86AB"
                  style={{ marginRight: 5 }}
                />

                <Text style={styles.infoLabel}>مقدم الشكوى</Text>
                <Text style={styles.infoValue}>{complaintData.user_name}</Text>
              </View>
            )}
            {user.role === ROLES.ADMIN && complaintData.manager_name && (
              <View style={styles.infoRow}>
                <MaterialDesignIcons
                  name="account-tie"
                  size={20}
                  color="#2E86AB"
                  style={{ marginRight: 5 }}
                />

                <Text style={styles.infoLabel}>المدير المسؤول</Text>
                <Text style={styles.infoValue}>
                  {complaintData.manager_name}
                </Text>
              </View>
            )}
            {(user.role === ROLES.ADMIN || user.role === ROLES.MANAGER) &&
              complaintData.worker_name && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="construct"
                    size={20}
                    color="#2E86AB"
                    style={{ marginRight: 5 }}
                  />

                  <Text style={styles.infoLabel}>العامل المسؤول</Text>
                  <Text style={styles.infoValue}>
                    {
                      complaintData.worker_name[
                        complaintData.worker_name.length - 1
                      ]
                    }
                  </Text>
                </View>
              )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="map"
                size={20}
                color="#2E86AB"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.sectionTitle}>الموقع على الخريطة</Text>
            </View>
            <View style={styles.locationContainer}>
              {shouldRenderMap && (
                <DisplayMap
                  lat={complaintData.latitude}
                  long={complaintData.longitude}
                  resolvedLat={complaintData.resolved_lat}
                  resolvedLong={complaintData.resolved_long}
                  status={status}
                />
              )}
              <View style={styles.coordinatesContainer}>
                <Ionicons
                  name="pin"
                  size={20}
                  color="#E74C3C"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.coordinatesText}>
                  إحداثيات الشكوى: {complaintData.latitude},{' '}
                  {complaintData.longitude}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialDesignIcons
                name="text-box"
                size={20}
                color="#2E86AB"
                style={{ marginRight: 5 }}
              />

              <Text style={styles.sectionTitle}>وصف المشكلة</Text>
            </View>
            <Text style={styles.descriptionText}>
              {complaintData.description || 'لا يوجد وصف متاح'}
            </Text>
          </View>

          {status === COMPLAINT_STATUS.REJECTED &&
            complaintData.rejection_reason && (
              <View style={[styles.section, styles.rejectionSection]}>
                <Text style={[styles.sectionTitle, styles.rejectionTitle]}>
                  سبب الرفض
                </Text>
                <Text style={styles.rejectionReasonText}>
                  {complaintData.rejection_reason}
                </Text>
                {complaintData.rejected_at && (
                  <Text style={styles.rejectionDate}>
                    تاريخ الرفض: {getTimeAgo(complaintData.rejected_at)}
                  </Text>
                )}
              </View>
            )}
        </View>
      </ScrollView>
      {renderActionButtons()}
      {renderAssignModal()}
      {renderRejectModal()}
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
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
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
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
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
    shadowColor: '#000',
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
  coordinatesContainer: {
    flexDirection: 'row',
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
  sectionHeader: {
    flexDirection: 'row',
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
