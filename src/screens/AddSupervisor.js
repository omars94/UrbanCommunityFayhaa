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
  ROUTE_NAMES,
} from '../constants';
import { getAllByRole, promoteToRole, revokeRole } from '../api/userApi';
import { checkIfUserExist } from '../api/authApi';
import CustomAlert from '../components/customAlert';
import HeaderSection from '../components/headerSection';
import { formatLebanesePhone } from '../utils';
import { useSelector } from 'react-redux';

export default function AddSupervisorScreen() {
  const [supervisorsArray, setSupervisorsArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // const [phone, setPhone] = useState('');
  const navigation = useNavigation();
  const municipalities = useSelector(state => state.data.municipalities);
  const areas = useSelector(state => state.data.areas);

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
    await fetchSupervisors();
    setRefreshing(false);
  };

  const fetchSupervisors = async () => {
    setLoading(true);
    try {
      const supervisors = await getAllByRole(ROLES.SUPERVISOR);
      const array = supervisors
        ? Object.keys(supervisors).map(key => ({
            id: key,
            ...supervisors[key],
          }))
        : [];
      setSupervisorsArray(array || []);
    } catch (error) {
      showCustomAlert('خطأ', 'فشل تحميل بيانات المراقبين');
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchSupervisors();
    }, []),
  );

  const handleAddSupervisor = async () => {
    navigation.navigate(ROUTE_NAMES.ADD_USER_FORM, { role: ROLES.SUPERVISOR });
  };

  const handleRevokeRole = async id => {
    try {
      showCustomAlert('ازالة مراقب', `هل تريد ازالة هذا المراقب`, [
        {
          text: 'تأكيد',
          onPress: async () => {
            try {
              await revokeRole(id);
              fetchSupervisors();
              showCustomAlert('نجاح', 'تم  ازالة المراقب بنجاح');
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

  const handleEdit = item => {
    navigation.navigate(ROUTE_NAMES.ADD_USER_FORM, {
      role: ROLES.SUPERVISOR,
      mode: 'update',
      userData: item,
    });
  };

  const renderSupervisor = ({ item }) => {
    const { phone_number, full_name, municipalities_ids, assigned_areas_ids } =
      item;

    const getMunicipalityNames = () => {
      if (
        !municipalities_ids ||
        !Array.isArray(municipalities_ids) ||
        !municipalities
      ) {
        return 'غير محدد';
      }

      const names = municipalities_ids
        .map(id => {
          const municipality = municipalities.find(
            m => m.id.toString() === id.toString(),
          );
          return municipality ? municipality.name_ar : null;
        })
        .filter(Boolean);

      return names.length > 0 ? names.join('، ') : 'غير محدد';
    };

    // Get area names
    const getAreaNames = () => {
      if (!assigned_areas_ids || !Array.isArray(assigned_areas_ids) || !areas) {
        return 'غير محدد';
      }

      const names = assigned_areas_ids
        .map(id => {
          const area = areas.find(a => a.id.toString() === id.toString());
          return area ? area.name_ar : null;
        })
        .filter(Boolean);

      return names.length > 0 ? names.join('، ') : 'غير محدد';
    };

    return (
      <View style={styles.supervisorCard}>
        <View style={styles.rowBetween}>
          <Text style={styles.supervisorName} numberOfLines={1}>
            {full_name}
          </Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => {handleEdit(item);}}
            >
              <Text style={styles.editText}>تعديل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => {
                handleRevokeRole(item.id);
              }}
            >
              <Text style={styles.deleteText}>إزالة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* <View style={styles.rowBetween}> */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>البلديات</Text>
        </View>
        {/* </View> */}

        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentText} numberOfLines={2}>
            {getMunicipalityNames()}
          </Text>
        </View>

        <View>
          <View style={styles.areabadge}>
            <Text style={styles.areabadgeText}>المناطق</Text>
          </View>
          <View style={styles.assignmentInfo}>
            <Text style={styles.assignmentText} numberOfLines={3}>
              {getAreaNames()}
            </Text>
          </View>
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

      <HeaderSection
        title="إدارة المراقبين"
        subtitle="إضافة وإدارة مراقبي الميدان"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoText} numberOfLines={2}>
          صلاحيات المراقب: يمكن للمراقبين اكمال حل الشكاوى
        </Text>
      </View>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddSupervisor}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>إضافة مراقب جديد</Text>
        </TouchableOpacity>
      </View>

      {supervisorsArray?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>المراقبين الحاليين</Text>
          <FlatList
            data={supervisorsArray}
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyExtractor={item => item.id.toString()}
            renderItem={renderSupervisor}
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
      {supervisorsArray?.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>لا يوجد مراقبين</Text>
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
  addButtonContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonIcon: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILIES.primary,
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
  supervisorCard: {
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
  supervisorName: {
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
    alignSelf: 'flex-start',
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
  areabadge: {
    backgroundColor: COLORS.secondaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.xl,
  },
  areabadgeText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
    fontFamily: FONT_FAMILIES.primary,
  },
  assignmentInfo: {
    flex: 1,
    marginRight: 12,
    paddingLeft: 4,
    paddingBottom: 6,
    paddingTop: 2,
  },
  assignmentLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: FONT_FAMILIES.primary,
  },
  assignmentText: {
    fontSize: 13,
    color: COLORS.text.primary,
    lineHeight: 18,
    fontFamily: FONT_FAMILIES.primary,
  },
  areasRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 50,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  editBtn: {
    backgroundColor: COLORS.secondary,
  },
  editText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_FAMILIES.primary,
  },
  deleteBtn: {
    backgroundColor: COLORS.primary,
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
