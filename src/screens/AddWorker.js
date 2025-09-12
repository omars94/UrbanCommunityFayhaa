import React, { useEffect, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  COLORS,
  ROLES,
  FONT_FAMILIES,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants';
import { getAllByRole, promoteToRole, revokeRole } from '../api/userApi';
import { checkIfUserExist } from '../api/authApi';
import CustomAlert from '../components/customAlert';
import HeaderSection from '../components/headerSection';
import { formatLebanesePhone } from '../utils';

export default function AddWorkerScreen() {
  const [workersArray, setWorkersArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [phone, setPhone] = useState('');
  const navigation = useNavigation();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
  });

  // Custom Alert Functions
  const showCustomAlert = (title, message, buttons = []) => {
    setAlertData({ title, message, buttons });
    setAlertVisible(true);
  };

  const hideCustomAlert = () => {
    setAlertVisible(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkers();
    setRefreshing(false);
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const workers = await getAllByRole(ROLES.WORKER);
      const array = workers
        ? Object.keys(workers).map(key => ({
            id: key,
            ...workers[key],
          }))
        : [];
      setWorkersArray(array || []);
    } catch (error) {
      showCustomAlert('خطأ', 'فشل تحميل بيانات الموظفين');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchWorkers();
    }, []),
  );

  const handleAddWorker = async () => {
    try {
      if (!phone.trim()) {
        showCustomAlert('تنبيه', 'الرجاء إدخال رقم هاتف الموظف');
        return;
      }
      const formattedPhone = '+961' + phone;
      const exist = await checkIfUserExist(formattedPhone);
      if (!exist.inRTDB) {
        showCustomAlert('خطأ', 'المستخدم غير موجود');
        return;
      }
      const { id, role, full_name } = exist.profile;

      if (role === ROLES.WORKER) {
        showCustomAlert('خطأ', 'المستخدم موظف بالفعل');
        return;
      } else if (role === ROLES.MANAGER) {
        showCustomAlert('خطأ', 'المستخدم مسؤول بالفعل');
        return;
      } else if (role === ROLES.ADMIN) {
        showCustomAlert('خطأ', 'المستخدم مدير ولا يمكن ترقيته');
        return;
      }

      if (role === ROLES.CITIZEN) {
        showCustomAlert(
          'إضافة موظف جديد',
          [
            '',
            `هل تريد إرسال دعوة إلى ${full_name}`,
            `(${formatLebanesePhone(formattedPhone)})`,
            'ليصبح موظفاً',
          ].join('\n'),
          [
            {
              text: 'تأكيد',
              onPress: async () => {
                try {
                  await promoteToRole(id, ROLES.WORKER);
                  setPhone('');
                  fetchWorkers();
                  showCustomAlert('نجاح', 'تم  ارسال دعوة الترقية بنجاح');
                } catch (error) {
                  showCustomAlert('خطأ', error?.message || 'حدث خطأ غير متوقع');
                  console.log(error);
                }
              },
            },
            {
              text: 'إلغاء',
              style: 'cancel',
              onPress: hideCustomAlert,
            },
          ],
        );
      }
    } catch (error) {
      showCustomAlert('خطأ', 'حدث خطأ غير متوقع');
      console.log(error);
    }
  };

  const handleRevokeRole = async id => {
    try {
      showCustomAlert('ازالة موظف', `هل تريد ازالة هذا الموظف`, [
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              await revokeRole(id);
              fetchWorkers();
              showCustomAlert('نجاح', 'تم  ازالة الموظف بنجاح');
            } catch (error) {
              showCustomAlert('خطأ', 'حدث خطأ غير متوقع');
              console.log(error);
            }
          },
        },
        {
          text: 'إلغاء',
          style: 'cancel',
          onPress: hideCustomAlert,
        },
      ]);
    } catch (error) {
      showCustomAlert('خطأ', 'حدث خطأ غير متوقع');
      console.log(error);
    }
  };

  const renderWorker = ({ item }) => {
    const { phone_number, full_name } = item;

    return (
      <View style={styles.workerCard}>
        <Text style={styles.workerName} numberOfLines={1}>
          {full_name}
        </Text>

        <View style={styles.rowBetween}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>موظف</Text>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              handleRevokeRole(item.id);
            }}
          >
            <Text style={styles.deleteText}>إزالة</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.phoneText}>
          {formatLebanesePhone(phone_number)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>جاري التحميل ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CustomAlert
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        buttons={alertData.buttons}
        onClose={hideCustomAlert}
      />

      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة الموظفين</Text>
        <Text style={styles.headerSub}>إضافة وإدارة موظفي الميدان</Text>
      </View> */}
      <HeaderSection
        title="إدارة الموظفين"
        subtitle="إضافة وإدارة موظفي الميدان"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoText} numberOfLines={2}>
          صلاحيات الموظف: يمكن للموظفين استلام الشكاوى المعيّنة وحلها مع تقديم
          الأدلة المطلوبة
        </Text>
      </View>

      <View style={styles.addCard}>
        <Text style={styles.addTitle}>إضافة موظف جديد</Text>
        <Text style={styles.label}>رقم هاتف الموظف</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="XX XXX XXX"
            placeholderTextColor="#9aa0a7"
            keyboardType="phone-pad"
            textAlign="right"
            maxLength={8}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddWorker}>
            <Text style={styles.addBtnText}>إضافة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {workersArray?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>الموظفين الحاليين</Text>
          <FlatList
            data={workersArray}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyExtractor={item => item.id.toString()}
            renderItem={renderWorker}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        </>
      )}
      {workersArray?.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا يوجد موظفين</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
  },
  headerSub: {
    color: COLORS.white,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: FONT_FAMILIES.primary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
  },
  infoBox: {
    backgroundColor: COLORS.secondaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  infoText: {
    color: COLORS.secondary,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONT_FAMILIES.primary,
  },
  addCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 20,
    ...SHADOWS.md,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILIES.primary,
  },
  label: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
    fontFamily: FONT_FAMILIES.primary,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    fontSize: 16,
    fontFamily: FONT_FAMILIES.primary,
    color: COLORS.text.primary,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    ...SHADOWS.sm,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: FONT_FAMILIES.primary,
  },
  list: {
    flex: 1,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginHorizontal: 16,
    marginBottom: 12,
    fontFamily: FONT_FAMILIES.primary,
  },
  workerCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    ...SHADOWS.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  workerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    fontFamily: FONT_FAMILIES.primary,
  },
  phoneText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: FONT_FAMILIES.primary,
    marginTop: 4,
  },
  badge: {
    backgroundColor: COLORS.roles.worker.background,
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.xl,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.roles.worker.text,
    fontWeight: '600',
    fontFamily: FONT_FAMILIES.primary,
  },
  deleteBtn: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.sm,
  },
  deleteText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILIES.primary,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: FONT_FAMILIES.primary,
  },
});
