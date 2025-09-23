import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  COLORS,
  ROLES,
  FONT_FAMILIES,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants';
import CustomAlert from '../components/customAlert';
import HeaderSection from '../components/headerSection';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { checkIfUserExist } from '../api/authApi';
import { formatLebanesePhone } from '../utils';
import { promoteToRole, updateUserAssignments } from '../api/userApi';

export default function AddUserForm() {
  const navigation = useNavigation();
  const areas = useSelector(state => state.data.areas);
  const municipalities = useSelector(state => state.data.municipalities);
  const route = useRoute();

  // Get role from route params (ROLES.WORKER or ROLES.SUPERVISOR)
  const { role, mode = 'add', userData = null } = route.params;
  const isUpdateMode = mode === 'update';

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filteredAreas, setFilteredAreas] = useState([]);

  // Selection states
  const [selectedMunicipalities, setSelectedMunicipalities] = useState([]);
  const [selectedAreas, setSelectedAreas] = useState([]);

  // Alert state
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

  // Get role-specific text configurations
  const getRoleConfig = () => {
    console.log(userData);
    const isWorker = role === ROLES.WORKER;
    const isSupervisor = role === ROLES.SUPERVISOR;

    return {
      title: isWorker ? (!isUpdateMode? 'إضافة موظف جديد' : 'تعديل بيانات الموظف') : (!isUpdateMode? 'إضافة مراقب جديد' : 'تعديل بيانات المراقب'),
      subtitle: isWorker
        ? 'إدخال بيانات الموظف والمناطق المخصصة'
        : 'إدخال بيانات المراقب والمناطق المخصصة',
      userInfoTitle: isWorker ? 'معلومات الموظف' : 'معلومات المراقب',
      phoneLabel: isWorker ? 'رقم هاتف الموظف' : 'رقم هاتف المراقب',
      areasTitle: isWorker
        ? 'اختر المناطق التي سيعمل فيها الموظف'
        : 'اختر المناطق التي سيشرف عليها المراقب',
      submitButtonText: isWorker ? 'إضافة الموظف' : 'إضافة المراقب',
      inviteTitle: isWorker ? 'إضافة موظف جديد' : 'إضافة مراقب جديد',
      inviteMessage: isWorker ? 'ليصبح موظفاً' : 'ليصبح مراقباً',
      successMessage: isUpdateMode
        ? 'تم التحديث بنجاح'
        : 'تم ارسال دعوة الترقية بنجاح',
      alreadyRoleError: isWorker
        ? 'المستخدم موظف بالفعل'
        : 'المستخدم مراقب بالفعل',
      otherRoleError: isWorker
        ? {
            [ROLES.SUPERVISOR]: 'المستخدم مراقب بالفعل',
            [ROLES.MANAGER]: 'المستخدم مسؤول بالفعل',
            [ROLES.ADMIN]: 'المستخدم مدير ولا يمكن ترقيته',
          }
        : {
            [ROLES.WORKER]: 'المستخدم موظف بالفعل',
            [ROLES.MANAGER]: 'المستخدم مسؤول بالفعل',
            [ROLES.ADMIN]: 'المستخدم مدير ولا يمكن ترقيته',
          },
    };
  };

  const config = getRoleConfig();

  useEffect(() => {
    if (isUpdateMode && userData) {
      console.log('Loading user data...');
      // Extract phone number (remove +961 prefix)
      const phoneNumber = userData.phone_number?.replace('+961', '') || '';
      setPhone(phoneNumber);

      setSelectedMunicipalities(userData.municipalities_ids || []);
      // setSelectedAreas(userData.assigned_areas_ids || []);
      setTimeout(() => {
        setSelectedAreas(userData.assigned_areas_ids || []);
      }, 0);
    }
  }, [isUpdateMode, userData]);

  // Filter areas based on selected municipalities
  useEffect(() => {
    if (selectedMunicipalities.length > 0) {
      const filtered = areas.filter(area =>
        selectedMunicipalities.some(
          municipalityId =>
            area.municipality_id.toString() === municipalityId.toString(),
        ),
      );
      setFilteredAreas(filtered);

      // Remove selected areas that don't belong to selected municipalities
      setSelectedAreas(prev =>
        prev.filter(areaId =>
          filtered.some(area => area.id.toString() === areaId.toString()),
        ),
      );
    } else {
      setFilteredAreas([]);
      setSelectedAreas([]);
    }
  }, [selectedMunicipalities, areas]);

  const handleMunicipalityToggle = municipalityId => {
    setSelectedMunicipalities(prev => {
      if (prev.includes(municipalityId)) {
        return prev.filter(id => id !== municipalityId);
      } else {
        return [...prev, municipalityId];
      }
    });
  };

  const handleAreaToggle = areaId => {
    setSelectedAreas(prev => {
      if (prev.includes(areaId)) {
        return prev.filter(id => id !== areaId);
      } else {
        return [...prev, areaId];
      }
    });
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!phone.trim()) {
        showCustomAlert(
          'تنبيه',
          `الرجاء إدخال ${config.phoneLabel.toLowerCase()}`,
        );
        return;
      }

      if (selectedMunicipalities.length === 0) {
        showCustomAlert('تنبيه', 'الرجاء اختيار بلدية واحدة على الأقل');
        return;
      }

      if (selectedAreas.length === 0) {
        showCustomAlert('تنبيه', 'الرجاء اختيار منطقة واحدة على الأقل');
        return;
      }

      const validMunicipalities = selectedMunicipalities.filter(
        municipalityId =>
          areas.some(
            area =>
              area.municipality_id.toString() === municipalityId.toString() &&
              selectedAreas.includes(area.id),
          ),
      );

      if (validMunicipalities.length === 0) {
        showCustomAlert('تنبيه', 'يجب اختيار منطقة واحدة على الأقل لكل بلدية');
        return;
      }

      setSubmitting(true);

      if (isUpdateMode) {
        // Update existing user
        try {
          await updateUserAssignments(userData.id, {
            municipalities: validMunicipalities,
            areas: selectedAreas,
          });

          showCustomAlert('نجاح', config.successMessage, [
            {
              text: 'موافق',
              onPress: () => {
                hideCustomAlert();
                navigation.goBack();
              },
            },
          ]);
        } catch (error) {
          showCustomAlert('خطأ', error?.message || 'حدث خطأ غير متوقع');
          console.log(error);
        }
      } else {
        const formattedPhone = '+961' + phone;
        const exist = await checkIfUserExist(formattedPhone);

        if (!exist.inRTDB) {
          showCustomAlert('خطأ', 'المستخدم غير موجود');
          return;
        }

        const { id, role: userRole, full_name } = exist.profile;

        // Check if user already has the target role
        if (userRole === role) {
          showCustomAlert('خطأ', config.alreadyRoleError);
          return;
        }

        // Check other role conflicts
        if (config.otherRoleError[userRole]) {
          showCustomAlert('خطأ', config.otherRoleError[userRole]);
          return;
        }

        console.log('selected Municipalities: ', selectedMunicipalities);
        console.log('selected Areas: ', selectedAreas);

        if (userRole === ROLES.CITIZEN) {
          showCustomAlert(
            config.inviteTitle,
            [
              `هل تريد إرسال دعوة إلى ${full_name}`,
              `(${formatLebanesePhone(formattedPhone)})`,
              config.inviteMessage,
            ].join('\n'),
            [
              {
                text: 'تأكيد',
                onPress: async () => {
                  try {
                    // Include municipalities and areas in the invite
                    await promoteToRole(id, role, {
                      municipalities: validMunicipalities,
                      areas: selectedAreas,
                    });

                    showCustomAlert('نجاح', config.successMessage, [
                      {
                        text: 'موافق',
                        onPress: () => {
                          hideCustomAlert();
                          navigation.goBack();
                        },
                      },
                    ]);
                  } catch (error) {
                    showCustomAlert(
                      'خطأ',
                      error?.message || 'حدث خطأ غير متوقع',
                    );
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
      }
    } catch (error) {
      showCustomAlert('خطأ', 'حدث خطأ غير متوقع');
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCheckbox = (isSelected, onPress, label, style = {}) => (
    <TouchableOpacity
      style={[styles.checkboxContainer, style]}
      onPress={onPress}
    >
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

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
        title={config.title}
        subtitle={config.subtitle}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Phone Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{config.userInfoTitle}</Text>
          <Text style={styles.label}>{config.phoneLabel}</Text>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={[
                styles.phoneInput,
                isUpdateMode && styles.phoneInputDisabled,
              ]}
              value={phone}
              onChangeText={setPhone}
              placeholder="XX XXX XXX"
              placeholderTextColor="#9aa0a7"
              keyboardType="phone-pad"
              textAlign="right"
              maxLength={8}
              editable={!isUpdateMode}
            />
            <Text style={styles.phonePrefix}>+961</Text>
          </View>
          {isUpdateMode && (
            <Text style={styles.disabledNote}>لا يمكن تعديل رقم الهاتف</Text>
          )}
        </View>

        {/* Municipalities Selection */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>اختيار البلديات</Text>
          <Text style={styles.subtitle}>{config.areasTitle}</Text>

          {municipalities.map(municipality => (
            <View key={municipality.id} style={{ marginBottom: 12 }}>
              {renderCheckbox(
                selectedMunicipalities.includes(municipality.id),
                () => handleMunicipalityToggle(municipality.id),
                municipality.name_ar,
              )}
            </View>
          ))}

          {selectedMunicipalities.length > 0 && (
            <Text style={styles.selectionCount}>
              تم اختيار {selectedMunicipalities.length} بلدية
            </Text>
          )}
        </View>

        {/* Areas Selection */}
        {filteredAreas.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>اختيار المناطق</Text>
            <Text style={styles.subtitle}>
              اختر المناطق المحددة من البلديات المختارة
            </Text>

            {/* Check All Option */}
            <View key="check-all" style={{ marginBottom: 16 }}>
              {renderCheckbox(
                selectedAreas.length === filteredAreas.length &&
                  filteredAreas.length > 0,
                () => {
                  if (selectedAreas.length === filteredAreas.length) {
                    // Uncheck all
                    setSelectedAreas([]);
                  } else {
                    // Check all filtered areas
                    setSelectedAreas(filteredAreas.map(area => area.id));
                  }
                },
                'اختيار الكل',
              )}
            </View>

            {filteredAreas.map(area => (
              <View key={area.id} style={{ marginBottom: 12 }}>
                {renderCheckbox(
                  selectedAreas.includes(area.id),
                  () => handleAreaToggle(area.id),
                  area.name_ar,
                  { marginBottom: 12 },
                )}
              </View>
            ))}

            {selectedAreas.length > 0 && (
              <Text style={styles.selectionCount}>
                تم اختيار {selectedAreas.length} منطقة
              </Text>
            )}
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : isUpdateMode ? (
              <Text style={styles.submitButtonText}>تحديث</Text>
            ) : (
              <Text style={styles.submitButtonText}>
                {config.submitButtonText}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    marginBottom: 16,
    ...SHADOWS.md,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
    fontFamily: FONT_FAMILIES.primary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    fontFamily: FONT_FAMILIES.primary,
  },
  label: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
    fontFamily: FONT_FAMILIES.primary,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: FONT_FAMILIES.primary,
    color: COLORS.text.primary,
  },
  phonePrefix: {
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text.secondary,
    fontFamily: FONT_FAMILIES.primary,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.gray[300],
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILIES.primary,
    flex: 1,
  },
  selectionCount: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    ...SHADOWS.md,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONT_FAMILIES.primary,
  },
  phoneInputDisabled: {
    backgroundColor: COLORS.gray[100],
    color: COLORS.text.secondary,
  },
  disabledNote: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 4,
    fontStyle: 'italic',
    fontFamily: FONT_FAMILIES.primary,
  },
});
