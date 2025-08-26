import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import { setAreas, setIndicators, setWasteItems } from '../../src/slices/dataSlice';
import { setUser } from '../slices/userSlice';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import CustomAlert from '../components/customAlert';
import { getUserByFbUID, handlePromotion } from '../api/userApi';
import {
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

// Fetch all complaints
export async function getData(dispatch) {
  console.log('get data');
  console.log('get data2');
  database()
    .ref('/areas')
    .once('value', snapshot => {
      console.log('User data: ', snapshot.val());
      dispatch(setAreas(snapshot.val()));
    });
  database()
    .ref('/indicators')
    .once('value', snapshot => {
      console.log('User data: ', snapshot.val());
      dispatch(setIndicators(snapshot.val()));
    });
  fetchWasteItems(dispatch, setWasteItems);
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);
  const { complaints } = useSelector(state => state.complaints);

  console.log('complaints', complaints);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
    loading: false,
  });

  const role = user.role;
  let role_text = '';
  switch (role) {
    case ROLES.ADMIN:
      role_text = 'مدير النظام';
      break;
    case ROLES.MANAGER:
      role_text = 'مسؤول';
      break;
    case ROLES.WORKER:
      role_text = 'موظف';
      break;
    default:
      role_text = 'مواطن';
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
    const checkInvitation = async () => {
      console.log("USERR", user, 'IR: ', user?.invite_role);

      const roleMessages = {
        [ROLES.MANAGER]: {
          title: 'لقد تمت دعوتك لتصبح مديرا في النظام',
          message: 'هل تقبل الدعوة لتصبح مديراً في النظام؟',
          success: 'تمت الترقية بنجاح',
        },
        [ROLES.WORKER]: {
          title: 'لقد تمت دعوتك لتصبح موظفاً في النظام',
          message: 'هل تقبل الدعوة لتصبح موظفاً في النظام؟',
          success: 'تمت الترقية بنجاح',
        },
      };

      const inviteRole = user?.invite_role;
      if (![ROLES.MANAGER, ROLES.WORKER].includes(inviteRole)) return;

      const { title, message, success } = roleMessages[inviteRole];

      const handleResponse = async accept => {
        try {
          if (accept) setLoading(true);

          await handlePromotion(
            user.id,
            accept,
            accept ? inviteRole : user.role,
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
        <Text style={styles.loadingText}>جاري تحميل ...</Text>
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
              source={require('../assets/logo.png')} // Adjust path as needed
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.welcomeText}>أهلاً وسهلاً</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.userName}>{user?.full_name}</Text>
            <Ionicons
              name="remove"
              size={42}
              color={COLORS.white}
              style={{
                transform: [{ rotate: '90deg' }],
                marginHorizontal: -10,
                marginBottom: SPACING.lg,
              }}
            />
            <View style={styles.roleContainer}>
              <Text style={styles.roleText}> {role_text}</Text>
            </View>
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
                  style={[styles.icon, { color: COLORS.status.pending.text }]}
                />
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
                  name="plus-circle-outline"
                  style={[styles.icon, { color: COLORS.status.completed.text }]}
                />
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
                  style={[styles.icon, { color: COLORS.roles.admin.text }]}
                />
              </View>
              <Text style={styles.menuTitle}>التخلص من النفايات</Text>
              <Text style={styles.menuSubtitle}>معلومات النفايات الخاصة</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => Linking.openURL('tel:175')}
            >
              <View style={styles.iconContainer}>
                <MaterialDesignIcons
                  name="phone"
                  style={[styles.icon, { color: COLORS.primary }]}
                />
              </View>
              <Text style={styles.menuTitle}>طوارئ</Text>
              <Text style={styles.menuSubtitle}>الدفاع المدني </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuRow}>
            <View style={styles.menuCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.menuTitle}>شكوى مكتملة</Text>
            </View>
            <View style={styles.menuCard}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.menuTitle}>شكوى نشطة </Text>
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
    paddingTop: SIZES.header.height - SPACING.sm,
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
    width: SIZES.logo.sm,
    height: SIZES.logo.sm,
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
    paddingTop: SPACING.xxl,
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
    width: '47%',
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
    fontSize: SPACING.xxxl + SPACING.sm,
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
