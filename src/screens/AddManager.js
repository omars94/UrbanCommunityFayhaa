import React, { useEffect, useState } from "react";
import {
  useFocusEffect,
} from '@react-navigation/native';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { COLORS, ROLES, FONT_FAMILIES, BORDER_RADIUS, SHADOWS } from "../constants";
import { getAllByRole, promoteToRole, revokeRole } from "../api/userApi";
import { checkIfUserExist } from "../api/authApi";
import CustomAlert from "../components/customAlert";

export default function AddManagerScreen() {
  const [managersArray, setManagersArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [phone, setPhone] = useState("");

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
    await fetchManagers();
    setRefreshing(false);
  };

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const managers = await getAllByRole(ROLES.MANAGER);
      const array = managers
        ? Object.keys(managers).map(key => ({
          id: key,
          ...managers[key]
        })) : [];
      setManagersArray(array || []);
    } catch (error) {
      showCustomAlert('خطأ', 'فشل تحميل بيانات المديرين');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchManagers();
    }, []),
  );

  const handleAddManager = async () => {
    try {

      if (!phone.trim()) {
        showCustomAlert('تنبيه', 'الرجاء إدخال رقم هاتف المدير');
        return;
      }
      const formattedPhone = '+961' + phone;
      const exist = await checkIfUserExist(formattedPhone);
      if (!exist.inRTDB) {
        showCustomAlert('خطأ', 'المستخدم غير موجود');
        return;
      }
      const { id, role, full_name } = exist.profile;

      if (role === ROLES.MANAGER) {
        showCustomAlert('خطأ', 'المستخدم مسؤول بالفعل');
        return;
      }
      else if (role === ROLES.ADMIN) {
        showCustomAlert('خطأ', 'المستخدم مدير ولا يمكن ترقيته');
        return;
      }

      if (role === ROLES.CITIZEN || role === ROLES.WORKER) {
        showCustomAlert(
          'إضافة مدير جديد',
          `هل تريد إرسال دعوة إلى ${full_name} (${formattedPhone})ليصبح مديراً؟ `,
          [
            {
              text: 'تأكيد',
              onPress: async () => {
                try {
                  await promoteToRole(id, ROLES.MANAGER);
                  setPhone("");
                  fetchManagers();
                  showCustomAlert('نجاح', 'تم  ارسال دعوة الترقية بنجاح');
                } catch (error) {
                  showCustomAlert('خطأ', error?.message || 'حدث خطأ غير متوقع');
                  console.log(error);
                }
              }
            },
            {
              text: 'إلغاء',
              style: 'cancel',
              onPress: hideCustomAlert
            }
          ]
        );
      }

    } catch (error) {
      showCustomAlert('خطأ', 'حدث خطأ غير متوقع');
      console.log(error);
    }
  };

  const handleRevokeRole = async (id) => {
    try {
      showCustomAlert(
        'ازالة مدير',
        `هل تريد ازالة هذا المدير`,
        [
          {
            text: 'تأكيد',
            onPress: async () => {
              try {
                await revokeRole(id);
                fetchManagers();
                showCustomAlert('نجاح', 'تم  ازالة المدير بنجاح');
              } catch (error) {
                showCustomAlert('خطأ', 'حدث خطأ غير متوقع');
                console.log(error);
              }
            }
          },
          {
            text: 'إلغاء',
            style: 'cancel',
            onPress: hideCustomAlert
          }
        ]
      );
    } catch (error) {
      showCustomAlert('خطأ', 'حدث خطأ غير متوقع');
      console.log(error);
    }
  }

  const renderManager = ({ item }) => {
    const {
      phone_number,
      full_name,
    } = item;

    return (
      <View style={styles.managerCard}>

        <Text style={styles.managerName} numberOfLines={1}>
          {full_name}
        </Text>

        <View style={styles.rowBetween}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>مدير</Text>
          </View>


          <TouchableOpacity style={styles.deleteBtn} onPress={() => { handleRevokeRole(item.id) }}>
            <Text style={styles.deleteText}>إزالة</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.phoneText}>{phone_number}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d32f2f" />
        <Text style={styles.loadingText}>جاري تحميل ...</Text>
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


      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة المديرين</Text>
        <Text style={styles.headerSub}>إضافة وإدارة المديرين</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText} numberOfLines={2}>
          صلاحيات المدير: يمكن للمديرين مراجعة التبليغات وحذفها مؤقتًا، وإضافة موظفين جدد.
        </Text>
      </View>

      <View style={styles.addCard}>
        <Text style={styles.addTitle}>إضافة مدير جديد</Text>
        <Text style={styles.label}>رقم هاتف المدير</Text>

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
          <TouchableOpacity style={styles.addBtn} onPress={handleAddManager}>
            <Text style={styles.addBtnText}>إضافة</Text>
          </TouchableOpacity>
        </View>
      </View>

      {managersArray?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>المدراء الحاليون</Text>
          <FlatList
            data={managersArray}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyExtractor={item => item.id.toString()}
            renderItem={renderManager}
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
      {managersArray?.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا يوجد مديرين</Text>
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
    fontWeight: "700",
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.arabic,
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
    backgroundColor: COLORS.roles.admin.background,
    borderRadius: BORDER_RADIUS.md,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  infoText: {
    color: COLORS.success,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FONT_FAMILIES.primary,
  },
  addCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
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
    fontWeight: "700",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    ...SHADOWS.sm,
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: FONT_FAMILIES.primary,
  },
  list: {
    flex: 1,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginHorizontal: 16,
    marginBottom: 12,
    fontFamily: FONT_FAMILIES.primary,
  },
  managerCard: {
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
  managerName: {
    fontSize: 17,
    fontWeight: "700",
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
    backgroundColor: COLORS.roles.manager.background,
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.xl,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.roles.manager.text,
    fontWeight: "600",
    fontFamily: FONT_FAMILIES.primary,
  },
  deleteBtn: {
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.sm,
    ...SHADOWS.sm,
  },
  deleteText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: FONT_FAMILIES.primary,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: FONT_FAMILIES.primary,
  },
});