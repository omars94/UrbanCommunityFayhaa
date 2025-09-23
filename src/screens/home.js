import React, { use, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import {
  setAreas,
  setIndicators,
  setWasteItems,
  setMunicipalities,
  setConstants,
} from '../../src/slices/dataSlice';
import { setUser } from '../slices/userSlice';
import { setComplaints } from '../slices/complaintsSlice';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import CustomAlert from '../components/customAlert';
import { getUserByFbUID, handlePromotion } from '../api/userApi';
import {
  COMPLAINT_STATUS,
  COLORS,
  ROLES,
  ROUTE_NAMES,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
  SPACING,
  // SHADOWS,
  SIZES,
} from '../constants';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { fetchWasteItems } from '../api/wasteApi';
import { fetchComplaints } from '../api/complaintsApi';

// Fetch all complaints
export async function getData(dispatch) {
  console.log('get data');
  console.log('get data2');
  database()
    .ref('/areas')
    .once('value', snapshot => {
      console.log('Areas data: ', snapshot.val());
      dispatch(setAreas(snapshot.val()));
    });
  database()
    .ref('/municipalities')
    .once('value', snapshot => {
      console.log('Municipalities data: ', snapshot.val());
      dispatch(setMunicipalities(snapshot.val()));
    })
    .catch(error => {
      console.error('Error fetching municipalities:', error);
    });
  database()
    .ref('/indicators')
    .once('value', snapshot => {
      console.log('Indicators data: ', snapshot.val());
      dispatch(setIndicators(snapshot.val()));
    });
  database()
    .ref('/constants')
    .once('value', snapshot => {
      console.log('constants data: ', snapshot.val());
      dispatch(setConstants(snapshot.val()));
    });
  fetchWasteItems(dispatch, setWasteItems);
  fetchComplaints(dispatch, setComplaints);
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);
  const { complaints } = useSelector(state => state.complaints);
  console.log('complaints', complaints);
  const complaintsCount = complaints ? complaints.length : 0;
  console.log('complaintsCount', complaintsCount);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
    loading: false,
  });

  const role = user.role;
  let complaintFirstNumber;
  let complaintFirstLabel;
  let complaintSecondNumber;
  let complaintSecondLabel;

  switch (role) {
    case 2:
      const pendingComplaints = (complaints || []).filter(
        c => c.status === COMPLAINT_STATUS.PENDING,
      ).length;
      console.log('pendingComplaints', pendingComplaints);

      const assignedComplaints = (complaints || []).filter(
        c => c.status === COMPLAINT_STATUS.ASSIGNED,
      ).length;
      console.log('assignedComplaints', assignedComplaints);

      complaintFirstLabel = 'شكوى معيّنة';
      complaintFirstNumber = assignedComplaints;
      complaintSecondNumber = 'شكوى جديدة';
      complaintSecondLabel = pendingComplaints;
      break;
    case 3:
      const workerAssignedComplaints = (complaints || []).filter(
        c =>
          Array.isArray(c.worker_assignee_id) &&
          c.worker_assignee_id.includes(user.id) &&
          c.status === COMPLAINT_STATUS.ASSIGNED,
      ).length;
      console.log('rejectedComplaints', workerAssignedComplaints);

      const workerResolvedComplaints = (complaints || []).filter(
        c =>
          Array.isArray(c.worker_assignee_id) &&
          c.worker_assignee_id.includes(user.id) &&
          c.status === COMPLAINT_STATUS.RESOLVED,
      ).length;
      console.log('rejectedComplaints', workerResolvedComplaints);
      complaintFirstLabel = 'شكوى معيّنة';
      complaintFirstNumber = workerAssignedComplaints;
      complaintSecondNumber = workerResolvedComplaints;
      complaintSecondLabel = ' شكوى محلولة';
      break;
    case 5:
      const assignedAreas = user?.assigned_areas_ids || [];

      const assignedAreaComplaints = (complaints || []).filter(
        c =>
          assignedAreas.includes(c.area_id) &&
          c.status === COMPLAINT_STATUS.ASSIGNED,
      ).length;
      console.log('assignedComplaints', assignedAreaComplaints);

      const notCompletedComplaints = (complaints || []).filter(
        c =>
          assignedAreas.includes(c.area_id) &&
          c.status === COMPLAINT_STATUS.RESOLVED,
      ).length;
      console.log('notComletedComplaints', notCompletedComplaints);
      complaintFirstLabel = 'شكوى معيّنة';
      complaintFirstNumber = workerAssignedComplaints;
      complaintSecondNumber = assignedComplaints;
      complaintSecondLabel = ' شكوى للمراجعة';

      break;
    default:
      const completedComplaints = (complaints || []).filter(
        c => c.status === COMPLAINT_STATUS.COMPLETED,
      ).length;
      console.log('completeComplaints', completedComplaints);

      const rejectedComplaints = (complaints || []).filter(
        c => c.status === COMPLAINT_STATUS.REJECTED,
      ).length;
      console.log('rejectedComplaints', rejectedComplaints);

      const activeComplaints =
        complaintsCount - (completedComplaints + rejectedComplaints);
      console.log('activeComplaints', activeComplaints);
      complaintFirstLabel = 'شكوى مكتملة ';
      complaintFirstNumber = completedComplaints;
      complaintSecondNumber = activeComplaints;
      complaintSecondLabel = ' شكوى نشطة';
  }

  // Custom Alert Functions
  const showCustomAlert = (title, message, buttons = [], loading = false) => {
    setAlertData({ title, message, buttons, loading });
    setAlertVisible(true);
  };

  const hideCustomAlert = () => {
    setAlertVisible(false);
  };

  useEffect(() => {
    if (!user?.id) return;

    const userRef = database().ref(`/users/${user.id}`);

    const listener = userRef.on('value', snapshot => {
      const updatedUser = snapshot.val();
      if (updatedUser) {
        console.log('User updated in DB:', updatedUser);
        dispatch(setUser(updatedUser));
      }
    });

    return () => {
      userRef.off('value', listener);
    };
  }, [user?.id, dispatch]);

  useEffect(() => {
    const checkInvitation = async () => {
      console.log('USERR', user, 'IR: ', user?.invite_role);

      const roleMessages = {
        [ROLES.SUPERVISOR]: {
          title: 'لقد تمت دعوتك لتصبح مراقباً في النظام',
          message: 'هل تقبل الدعوة لتصبح مراقباً في النظام؟',
          success: 'تمت الترقية بنجاح',
        },
        [ROLES.MANAGER]: {
          title: 'لقد تمت دعوتك لتصبح مسؤولاً في النظام',
          message: 'هل تقبل الدعوة لتصبح مسؤولاً في النظام؟',
          success: 'تمت الترقية بنجاح',
        },
        [ROLES.WORKER]: {
          title: 'لقد تمت دعوتك لتصبح موظفاً في النظام',
          message: 'هل تقبل الدعوة لتصبح موظفاً في النظام؟',
          success: 'تمت الترقية بنجاح',
        },
      };

      const inviteRole = user?.invite_role;
      if (![ROLES.MANAGER, ROLES.WORKER, ROLES.SUPERVISOR].includes(inviteRole))
        return;

      const { title, message, success } = roleMessages[inviteRole];

      const handleResponse = async accept => {
        try {
          if (accept) setLoading(true);

          await handlePromotion(
            user.id,
            accept,
            accept ? inviteRole : user.role,
            {
              municipalities: user.invite_municipalities
                ? user.invite_municipalities
                : null,
              areas: user.invite_areas ? user.invite_areas : null,
            },
          );

          if (accept) {
            const updatedUser = await getUserByFbUID(auth().currentUser.uid);
            dispatch(setUser(updatedUser));
            setLoading(false);
          }

          showCustomAlert('نجاح', accept ? success : 'تم رفض الترقية بنجاح', [
            { text: 'حسناً', onPress: hideCustomAlert },
          ]);
        } catch (error) {
          setLoading(false);
          showCustomAlert('خطأ', error.message, [
            { text: 'حسناً', onPress: hideCustomAlert },
          ]);
          console.log(error);
        }
      };

      showCustomAlert(title, message, [
        {
          text: 'قبول',
          onPress: () => handleResponse(true),
        },
        {
          text: 'رفض',
          style: 'cancel',
          onPress: () => handleResponse(false),
        },
      ]);
    };

    checkInvitation();
  }, [user?.invite_role]);

  useEffect(() => {
    getData(dispatch);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>جاري التحميل ...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <CustomAlert
          visible={alertVisible}
          title={alertData.title}
          message={alertData.message}
          buttons={alertData.buttons}
          onClose={hideCustomAlert}
        />

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/appIcon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.welcomeText}>أهلاً وسهلاً</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.userName}>{user?.full_name}</Text>
          </View>

          <Text style={styles.subtitle}>اتحاد بلديات الفيحاء</Text>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuContainer}>
          <View style={styles.menuRow}>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() =>
                navigation.navigate(ROUTE_NAMES.COMPLAINTS, {
                  screen: ROUTE_NAMES.COMPLAINTS,
                })
              }
            >
              <View style={styles.iconContainer}>
                <MaterialDesignIcons
                  name="file-document-outline"
                  style={[styles.icon, { color: COLORS.warning }]}
                />
                {/* <Image
                  source={require('../assets/complaintsIcon.png')} // path to your PNG
                  style={{
                    width: 50,
                    height: 55,
                    marginRight: SPACING.xs,
                  }}
                /> */}
              </View>
              <Text style={styles.menuTitle}>شكاوي</Text>
              <Text style={styles.menuSubtitle}>تتبع الحالة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() =>
                navigation.navigate(ROUTE_NAMES.COMPLAINTS, {
                  screen: ROUTE_NAMES.ADD_COMPLAINT,
                })
              }
            >
              <View style={styles.iconContainer}>
                <MaterialDesignIcons
                  name="camera-plus-outline"
                  style={[styles.icon, { color: COLORS.secondary }]}
                />
                {/* <Image
                  source={require('../assets/cameraIcon.png')} //
                  style={{
                    width: 50,
                    height: 50,
                  }}
                /> */}
              </View>
              <Text style={styles.menuTitle}>تقديم شكوى</Text>
              <Text style={styles.menuSubtitle}>الإبلاغ عن مشكلة</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuRow}>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => navigation.navigate(ROUTE_NAMES.WASTE)}
            >
              <View style={styles.iconContainer}>
                <MaterialDesignIcons
                  name="recycle"
                  // style={[styles.icon, { color: COLORS.primary }]}
                  style={[styles.icon, { color: '#34A853' }]}
                />
              </View>
              <Text
                style={styles.menuTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                التخلص من النفايات
              </Text>
              <Text
                style={styles.menuSubtitle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                معلومات النفايات الخاصة
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => Linking.openURL('tel:175')}
            >
              <View style={styles.iconContainer}>
                <MaterialDesignIcons
                  // name="phone"
                  // name="fire-extinguisher"
                  name="fire-truck"
                  style={[
                    styles.icon,
                    {
                      // color: COLORS.secondary,
                      color: COLORS.red,
                      // color: COLORS.danger,
                      // transform: [{ rotate: '270deg' }],
                    },
                  ]}
                />
              </View>
              <Text style={styles.menuTitle}>طوارئ</Text>
              <Text style={styles.menuSubtitle}> فوج الإطفاء </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuRow}>
            <View style={styles.menuCard}>
              <Text style={styles.statNumber}>{complaintFirstNumber}</Text>
              <Text style={styles.menuTitle}>{complaintFirstLabel}</Text>
            </View>
            <View style={styles.menuCard}>
              <Text style={styles.statNumber}>{complaintSecondNumber}</Text>
              <Text style={styles.menuTitle}>{complaintSecondLabel}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
  },
  headerSection: {
    backgroundColor: COLORS.primary,
    // paddingTop: SIZES.header.height - SPACING.sm,
    paddingTop: SPACING.huge,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    borderBottomLeftRadius: BORDER_RADIUS.xxl,
    borderBottomRightRadius: BORDER_RADIUS.xxl,
  },
  logoContainer: {
    width: SIZES.logo.lg,
    height: SIZES.logo.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.circle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: SIZES.logo.md,
    height: SIZES.logo.md,
    // marginRight: SPACING.xs,
    // marginBottom: SPACING.sm,
  },
  welcomeText: {
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.white,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.white,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  roleContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  roleText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.medium.toString(),
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '48%',
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: SPACING.xs,
  },
  icon: {
    fontSize: SPACING.xxxl,
  },
  menuTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold.toString(),
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  menuSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZES.title - SPACING.md,
    fontWeight: FONT_WEIGHTS.bold.toString(),
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
});
