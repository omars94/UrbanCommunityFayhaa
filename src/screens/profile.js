import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import SimplePicker from '../components/SimplePicker';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import CustomAlert from '../components/customAlert';
import { setUser } from '../slices/userSlice';
import { COLORS, FONT_FAMILIES, BORDER_RADIUS, SHADOWS } from '../constants';
import { updateUser } from '../api/userApi';
import { useNavigation } from '@react-navigation/native';
import HeaderSection from '../components/headerSection';
import { formatLebanesePhone } from '../utils';

const ProfileSchema = Yup.object().shape({
  full_name: Yup.string().trim().required('الرجاء إدخال الاسم الكامل'),
  area: Yup.mixed().required('الرجاء اختيار المنطقة'),
  date_of_birth: Yup.date()
    .max(new Date(), 'لا يمكن أن يكون تاريخ الميلاد في المستقبل')
    .required('الرجاء اختيار تاريخ الميلاد'),
});

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);
  const areas = useSelector(state => state.data.areas) || [];

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
  });
  const navigation = useNavigation();

  const showCustomAlert = (title, message, buttons = []) => {
    setAlertData({ title, message, buttons });
    setAlertVisible(true);
  };
  const hideCustomAlert = () => setAlertVisible(false);

  const handleSubmitProfile = async (values, { setSubmitting }) => {
    setSubmitting(true);
    try {
      const updated = {
        ...user,
        full_name: values.full_name,
        area_id: values.area?.id ?? values.area?.area_id ?? null,
        date_of_birth: values.date_of_birth
          ? new Date(values.date_of_birth).toISOString()
          : null,
      };
      console.log(updated);
      await updateUser(updated);
      dispatch(setUser(updated));
      setSubmitting(false);
      showCustomAlert('نجاح', 'تم حفظ التغييرات بنجاح', [
        { text: 'حسناً', onPress: hideCustomAlert },
      ]);
    } catch (err) {
      console.error('Failed updating profile:', err);
      setSubmitting(false);
      showCustomAlert('خطأ', err.message || 'فشل حفظ التغييرات', [
        { text: 'حسناً', onPress: hideCustomAlert },
      ]);
    }
  };

  const initialValues = {
    full_name: user?.full_name ?? '',
    area: areas.find(a => String(a.id) === String(user?.area_id)) ?? null,
    date_of_birth: user?.date_of_birth ? new Date(user.date_of_birth) : null,
  };

  return (
    <View>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <Text style={styles.headerSub}>تحديث معلوماتك الشخصية</Text>
      </View> */}
      <HeaderSection
        title="تعديل الملف الشخصي"
        subtitle="تحديث معلوماتك الشخصية"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 16 }}>
          <Formik
            initialValues={initialValues}
            enableReinitialize
            validationSchema={ProfileSchema}
            onSubmit={handleSubmitProfile}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              setFieldValue,
              errors,
              touched,
              isSubmitting,
            }) => (
              <View style={styles.addCard}>
                <Text style={styles.addTitle}>معلومات الحساب</Text>

                <Text style={styles.label}>الاسم الكامل</Text>
                <TextInput
                  label="الاسم الكامل"
                  value={values.full_name}
                  style={styles.input}
                  onChangeText={text => setFieldValue('full_name', text)}
                  onBlur={() => handleBlur('full_name')}
                  mode="outlined"
                />
                {errors.full_name && touched.full_name && (
                  <Text style={styles.errorText}>{errors.full_name}</Text>
                )}

                <Text style={[styles.label, { marginTop: 12 }]}>
                  رقم الهاتف
                </Text>
                <TextInput
                  label="الهاتف"
                  value={formatLebanesePhone(user?.phone_number)}
                  style={styles.input}
                  editable={false}
                  mode="outlined"
                />

                <Text style={[styles.label, { marginTop: 12 }]}>المنطقة</Text>
                <SimplePicker
                  label="المنطقة"
                  columns={1}
                  showLabel={false}
                  options={areas}
                  labelKey={'name_ar'}
                  selectedValue={values.area?.name_ar}
                  onValueChange={labelOrValue => {
                    // SimplePicker may return the label; map to full object
                    const selected =
                      areas.find(a => a.name_ar === labelOrValue) || null;
                    // fallback: if SimplePicker returns full object already
                    const result =
                      typeof labelOrValue === 'object'
                        ? labelOrValue
                        : selected;
                    setFieldValue('area', result);
                  }}
                />
                {errors.area && touched.area && (
                  <Text style={styles.errorText}>{errors.area}</Text>
                )}

                <Text style={[styles.label, { marginTop: 12 }]}>تاريخ الميلاد</Text>
                <View>
                  {showDatePicker || Platform.OS === 'ios' ? (
                    <DateTimePicker
                      value={
                        values.date_of_birth
                          ? new Date(values.date_of_birth)
                          : new Date(2015, 0, 1)
                      }
                      mode="date"
                      locale="ar"
                      display="compact"
                      onChange={(event, selectedDate) => {
                        const { type } = event || {};
                        if (
                          type === 'dismissed' ||
                          (Platform.OS === 'android' && type === 'set')
                        ) {
                          setShowDatePicker(false);
                        }
                        if (selectedDate)
                          setFieldValue('date_of_birth', selectedDate);
                      }}
                      maximumDate={new Date()}
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(prev => !prev)}
                    >
                      <Text style={styles.datePickerButtonText}>
                        {values.date_of_birth
                          ? `تاريخ الميلاد: ${new Date(
                              values.date_of_birth,
                            ).toLocaleDateString('ar')}`
                          : 'اختر تاريخ الميلاد'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.addBtn, { marginTop: 18 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.addBtnText}>حفظ التغييرات</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Formik>
        </View>

        <CustomAlert
          visible={alertVisible}
          title={alertData.title}
          message={alertData.message}
          buttons={alertData.buttons}
          onClose={hideCustomAlert}
        />
      </ScrollView>
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

  addCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: 20,
    marginTop: 18,
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
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1.5,
    borderColor: COLORS.gray?.[300] ?? '#e6e6e6',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    fontSize: 16,
    fontFamily: FONT_FAMILIES.primary,
    color: COLORS.text.primary,
  },
  datePickerButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.gray?.[300] ?? '#e6e6e6',
    borderRadius: BORDER_RADIUS.md,
    padding: 12,
    justifyContent: 'center',
  },
  datePickerButtonText: {
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
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: FONT_FAMILIES.primary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 6,
    fontFamily: FONT_FAMILIES.primary,
  },
});
