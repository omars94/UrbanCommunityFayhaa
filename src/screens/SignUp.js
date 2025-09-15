import DateTimePicker from '@react-native-community/datetimepicker';
import { useRef, useState } from 'react';
import database from '@react-native-firebase/database';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import { useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import SimplePicker from '../components/SimplePicker';
import { useNavigation } from '@react-navigation/native';
import { ROLES, ROUTE_NAMES } from '../constants';
import { requestOTP, sendOtp } from '../services/otpService';
import { checkIfUserExist, checkIfUserExistByEmail } from '../api/authApi';
import {
  SIZES,
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILIES,
} from '../constants';
import { set } from '@react-native-firebase/database';
import { validateLebaneseNumber } from '../utils';
// import TwilioFirebaseAuth from '../services/twilioFirebaseAuth';
import {
  sendEmailVerification,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { auth } from '../utils/firebase';
import { signUpUser } from '../api/authApi';
import CustomAlert from '../components/customAlert';
import { signInWithEmailAndPassword } from '@react-native-firebase/auth';

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(2, 'الاسم يجب أن يكون أكثر من حرفين')
    .max(50, 'الاسم يجب أن يكون أقل من 50 حرف')
    .required('الاسم الكامل مطلوب'),
  email: Yup.string()
    .email('البريد الإلكتروني غير صحيح')
    .required('البريد الإلكتروني مطلوب')
    .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/i, 'البريد الإلكتروني غير صالح'),
  password: Yup.string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(20, 'كلمة المرور يجب أن تكون أقل من 20 حرف')
    .required('كلمة المرور مطلوبة'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'كلمات المرور غير متطابقة')
    .required('تأكيد كلمة المرور مطلوب'),
  phone: Yup.string()
    .required('رقم الهاتف مطلوب')
    .test('lebanese-phone', 'رقم هاتف لبناني غير صحيح', function (value) {
      if (!value) return false;
      const validation = validateLebaneseNumber(value);
      return validation.isValid;
    }),
  area: Yup.object().nullable().required('المنطقة مطلوبة'),
  dateOfBirth: Yup.date()
    .max(new Date(), 'تاريخ الميلاد لا يمكن أن يكون في المستقبل')
    .required('تاريخ الميلاد مطلوب')
    .test('age', 'يجب أن تكون أكبر من 10 سنة', function (value) {
      if (!value) return false;
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 10;
    }),
});

export default function SignUp() {
  const phoneInput = useRef(null);
  const navigation = useNavigation();
  const [formattedValue, setFormattedValue] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    buttons: [],
    loading: false,
  });
  const { areas } = useSelector(state => state.data);

  // const twilioAuth = new TwilioFirebaseAuth();

  const initialValues = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    area: null,
    dateOfBirth: null,
  };

  // Custom Alert Functions
  const showCustomAlert = (title, message, buttons = [], loading = false) => {
    setAlertData({ title, message, buttons, loading });
    setAlertVisible(true);
  };

  const hideCustomAlert = () => {
    setAlertVisible(false);
  };

  const handleSubmit = async (
    values,
    { setSubmitting, setFieldError, setStatus, resetForm },
  ) => {
    setStatus(null);

    try {
      // Check if user exists
      const exist = await checkIfUserExistByEmail(values.email);
      if (exist.inRTDB) {
        setFieldError(
          'email',
          'البريد الالكتروني مسجل مسبقاً، الرجاء تسجيل الدخول',
        );
        setSubmitting(false);
        return;
      }

      const phoneExist = await checkIfUserExist(formattedValue);
      if (phoneExist.inRTDB) {
        setFieldError('phone', 'رقم الهاتف مسجل مسبقاً، الرجاء تسجيل الدخول');
        setSubmitting(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password,
      );

      if (userCredential) {
        const userr = userCredential.user;
        const firebase_uid = userr.uid;
        const user = {
          email: values.email,
          password: values.password,
          phone_number: formattedValue,
          full_name: values.fullName,
          date_of_birth: values.dateOfBirth
            ? new Date(values.dateOfBirth).toISOString()
            : null,
          area_id: values.area?.id,
          role: ROLES.CITIZEN,
          firebase_uid,
        };
        const userKey = await signUpUser(user);
        console.log('User registered successfully:', userKey);

        await database().ref(`users/${userKey}`).update({ firebase_uid });
        await sendEmailVerification(userr);
        await auth.signOut();
        resetForm({
          values: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            phone: '',
            area: null,
            dateOfBirth: null,
          },
        });
        showCustomAlert(
          'نجاح',
          'تم التسجيل بنجاح الرجاء التحقق من البريد الالكتروني ثم تسجيل الدخول',
          [{ text: 'حسناً', onPress: hideCustomAlert }],
        );
      } else {
        setStatus('الرقم مسجل مسبقاً، الرجاء تسجيل الدخول');
      }
    } catch (error) {
      console.log(error);
      setStatus(error?.message || 'خطأ في التسجيل، يرجى المحاولة مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={require('../assets/appIcon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.logoTitle}>اتحاد بلديات الفيحاء</Text>
          <Text style={styles.logoSubtitle}>Urban Community Fayhaa</Text>
        </View>
        <CustomAlert
          visible={alertVisible}
          title={alertData.title}
          message={alertData.message}
          buttons={alertData.buttons}
          onClose={hideCustomAlert}
        />

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            isSubmitting,
            setFieldValue,
            status,
          }) => (
            <View style={styles.formContainer}>
              {/* Full Name Input */}
              <View style={styles.fieldContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={values.fullName}
                    style={[
                      styles.input,
                      touched.fullName && errors.fullName && styles.inputError,
                    ]}
                    onChangeText={handleChange('fullName')}
                    onBlur={handleBlur('fullName')}
                    placeholder="الاسم الكامل"
                    placeholderTextColor={COLORS.gray?.[500]}
                  />
                </View>
                {touched.fullName && errors.fullName && (
                  <Text style={styles.errorText}>{errors.fullName}</Text>
                )}
              </View>

              {/* Email Input */}
              <View style={styles.fieldContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, touched.email && errors.email]}
                    placeholder="البريد الإلكتروني"
                    placeholderTextColor={COLORS.gray?.[500]}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    maxLength={128}
                  />
                  <MaterialDesignIcons
                    name="email"
                    size={20}
                    color={COLORS.gray?.[400]}
                    style={styles.inputIcon}
                  />
                </View>
                {touched.email && errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.fieldContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      touched.password && errors.password,
                    ]}
                    placeholder="كلمة المرور"
                    placeholderTextColor={COLORS.gray?.[500]}
                    secureTextEntry={!showPassword}
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    maxLength={20}
                    textAlign="right"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.inputIcon}
                  >
                    <MaterialDesignIcons
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color={COLORS.gray?.[400]}
                    />
                  </TouchableOpacity>
                </View>
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.fieldContainer}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput, // Add specific style for password
                      touched.confirmPassword && errors.confirmPassword,
                    ]}
                    placeholder="تأكيد كلمة المرور"
                    placeholderTextColor={COLORS.gray?.[500]}
                    secureTextEntry={!showConfirmPassword}
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    maxLength={20}
                    textAlign="right"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.inputIcon}
                  >
                    <MaterialDesignIcons
                      name={showConfirmPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color={COLORS.gray?.[400]}
                    />
                  </TouchableOpacity>
                </View>
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <View style={{ flexDirection: 'row-reverse' }}>
                  <PhoneInput
                    ref={phoneInput}
                    defaultValue={values.phone}
                    defaultCode="LB"
                    placeholder="رقم الهاتف"
                    layout="first"
                    //  flagButton="second"
                    onChangeText={text => {
                      setFieldValue('phone', text);
                    }}
                    onChangeFormattedText={setFormattedValue}
                    withShadow={false}
                    containerStyle={[
                      styles.phoneContainer,
                      touched.phone && errors.phone && styles.inputError,
                      { flexDirection: 'row-reverse' },
                    ]}
                    textContainerStyle={[
                      styles.phoneTextContainer,
                      {
                        textAlign: 'left',
                        // paddingLeft: 5,
                        paddingRight: 0,
                      },
                      { flexDirection: 'row-reverse' },
                    ]}
                    textInputStyle={[
                      styles.phoneTextInput,
                      { textAlign: 'right' },
                    ]}
                    countryPickerProps={{ renderFlagButton: false }}
                    countryPickerButtonStyle={[
                      styles.countryPickerButton,
                      // { flexDirection: 'row-reverse' },
                    ]}
                    textInputProps={{
                      keyboardType: 'number-pad',
                      maxLength: 8,
                    }}
                    codeTextStyle={styles.codeTextStyle}
                  />
                </View>
                {touched.phone && errors.phone && (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                )}
              </View>

              {/* {touched.phone && errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )} */}
              {/* </View> */}

              {/* Date of Birth */}
              <View style={styles.fieldContainer}>
                <View style={styles.inputContainer}>
                  {showDatePicker || Platform.OS === 'ios' ? (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={
                          values.dateOfBirth
                            ? new Date(values.dateOfBirth)
                            : new Date(2003, 8, 27)
                        }
                        mode="date"
                        locale="ar"
                        display="compact"
                        style={styles.datePicker}
                        textColor={COLORS.text?.primary || COLORS.primary}
                        onChange={(event, selectedDate) => {
                          const { type } = event;
                          if (
                            type === 'dismissed' ||
                            (Platform.OS === 'android' && type === 'set')
                          ) {
                            setShowDatePicker(false);
                          }
                          if (selectedDate) {
                            setFieldValue('dateOfBirth', selectedDate);
                          }
                        }}
                        maximumDate={new Date()}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.datePickerButtonText}>
                        {values.dateOfBirth
                          ? `${new Date(values.dateOfBirth).toLocaleDateString(
                              'ar',
                            )}`
                          : 'اختر تاريخ الميلاد'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {touched.dateOfBirth && errors.dateOfBirth && (
                  <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
                )}
              </View>

              {/* Area Picker */}
              <View style={styles.fieldContainer}>
                {/* <View style={styles.pickerContainer}> */}
                <SimplePicker
                  label="المنطقة"
                  columns={1}
                  showLabel={false}
                  options={areas}
                  labelKey={'name_ar'}
                  selectedValue={values.area?.name_ar}
                  onValueChange={selectedArea =>
                    setFieldValue('area', selectedArea)
                  }
                />
                {/* </View> */}
                {touched.area && errors.area && (
                  <Text style={styles.errorText}>{errors.area}</Text>
                )}
              </View>

              {/* General Error */}
              {status && <Text style={styles.error}>{status}</Text>}

              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'جاري التسجيل...' : 'تسجيل'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.footerText}>
                تحقق من بريدك الإلكتروني للتأكيد
              </Text>
            </View>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
}
// Updated StyleSheet
const styles = StyleSheet.create({
  scrollViewContent: {
    flexGrow: 1, // Changed from flex: 1
    paddingTop: SPACING.xxxl,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  logoContainer: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  logoPlaceholder: {
    width: SIZES.logo?.lg || 80,
    height: SIZES.logo?.lg || 80,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.circle || 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.gray?.[200] || '#e5e7eb',
  },
  logo: {
    width: SIZES.logo?.md || 40,
    height: SIZES.logo?.md || 40,
  },
  logoTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text?.primary || COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
    paddingBottom: SPACING.sm,
  },
  logoSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text?.secondary || COLORS.gray?.[600] || '#6b7280',
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
    marginBottom: SPACING.lg,
  },
  formContainer: {
    paddingHorizontal: 14,
    paddingBottom: SPACING.xl, // Add bottom padding for scrolling
  },
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.gray[400],
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    // width: '100%',
    textAlign: 'right',
  },
  passwordInput: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
    textAlign: 'left',
    fontFamily: FONT_FAMILIES.primary,
    paddingHorizontal: 4,
  },
  datePickerContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: COLORS.text?.primary || COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.primary,
    textAlign: 'center',
  },
  phoneContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.gray[400],
    padding: 0,
    width: '100%',
    marginBottom: 0,
  },
  phoneTextContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    height: '100%',
  },
  phoneTextInput: {
    color: COLORS.text?.primary || COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.primary,
    height: '100%',
  },
  countryPickerButton: {
    // width: 60,
    justifyContent: 'center',
  },
  codeTextStyle: {
    color: COLORS.text?.primary || COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.primary,
  },
  pickerContainer: {
    height: 56, // Match other input heights
    backgroundColor: COLORS.white,
    borderRadius: 12, // Match other input border radius
    borderWidth: 1,
    borderColor: COLORS.gray[400], // Match other input border color
    justifyContent: 'center',
    // paddingHorizontal: 16, // Match other input padding
    overflow: 'hidden',
  },
  button: {
    height: SIZES.button?.height || 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.primary,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray?.[400] || '#bdc3c7',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
  },
  footerText: {
    color: COLORS.text?.secondary || COLORS.gray?.[600] || '#6b7280',
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
  },

  error: {
    color: COLORS.danger,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.primary,
  },
});
//   return (
//     <ScrollView
//       contentContainerStyle={styles.scrollViewContent}
//       showsVerticalScrollIndicator={false}
//     >
//       <View style={styles.container}>
//         <View style={styles.logoContainer}>
//           <View style={styles.logoPlaceholder}>
//             <Image
//               source={require('../assets/logo1.png')}
//               style={styles.logo}
//               resizeMode="contain"
//             />
//           </View>
//           <Text style={styles.logoTitle}>اتحاد بلديات الفيحاء</Text>
//         </View>

//         <Formik
//           initialValues={initialValues}
//           validationSchema={validationSchema}
//           onSubmit={handleSubmit}
//         >
//           {({
//             handleChange,
//             handleBlur,
//             handleSubmit,
//             values,
//             errors,
//             touched,
//             isSubmitting,
//             setFieldValue,
//             status,
//           }) => (
//             <View style={styles.formContainer}>
//               {/* Full Name Input */}
//               <View style={styles.inputContainer}>
//                 <TextInput
//                   value={values.fullName}
//                   style={[
//                     styles.input,
//                     touched.fullName && errors.fullName && styles.inputError,
//                   ]}
//                   onChangeText={handleChange('fullName')}
//                   onBlur={handleBlur('fullName')}
//                   placeholder="الاسم الكامل"
//                   placeholderTextColor={COLORS.gray?.[500]}
//                 />
//                 {touched.fullName && errors.fullName && (
//                   <Text style={styles.errorText}>{errors.fullName}</Text>
//                 )}
//               </View>

//               {/* Email Input */}
//               <View style={styles.inputContainer}>
//                 {/* <View style={styles.inputWithIcon}> */}
//                 <TextInput
//                   style={[
//                     styles.input,
//                     styles.inputWithIconPadding,
//                     touched.email && errors.email && styles.inputError,
//                   ]}
//                   placeholder="البريد الإلكتروني"
//                   placeholderTextColor={COLORS.gray?.[500]}
//                   autoCapitalize="none"
//                   keyboardType="email-address"
//                   value={values.email}
//                   onChangeText={handleChange('email')}
//                   onBlur={handleBlur('email')}
//                   maxLength={128}
//                 />
//                 <MaterialDesignIcons
//                   name="email"
//                   size={20}
//                   color={COLORS.gray?.[400]}
//                   style={styles.inputIcon}
//                 />
//                 {/* </View> */}
//                 {touched.email && errors.email && (
//                   <Text style={styles.errorText}>{errors.email}</Text>
//                 )}
//               </View>

//               {/* Password Input */}
//               <View style={styles.inputContainer}>
//                 {/* <View style={styles.inputWithIcon}> */}
//                 <TextInput
//                   style={[
//                     styles.input,
//                     styles.inputWithIconPadding,
//                     // { textAlign: 'left', writingDirection: 'ltr' },
//                     touched.password && errors.password && styles.inputError,
//                   ]}
//                   placeholder="كلمة المرور"
//                   placeholderTextColor={COLORS.gray?.[500]}
//                   secureTextEntry={!showPassword}
//                   value={values.password}
//                   onChangeText={handleChange('password')}
//                   onBlur={handleBlur('password')}
//                   maxLength={20}
//                 />
//                 <TouchableOpacity
//                   onPress={() => setShowPassword(!showPassword)}
//                   style={styles.inputIcon}
//                 >
//                   <MaterialDesignIcons
//                     name={showPassword ? 'eye' : 'eye-off'}
//                     size={20}
//                     color={COLORS.gray?.[400]}
//                   />
//                 </TouchableOpacity>
//                 {/* </View> */}
//               </View>
//               {touched.password && errors.password && (
//                 <Text style={styles.errorText}>{errors.password}</Text>
//               )}

//               {/* Confirm Password Input */}
//               <View style={styles.inputContainer}>
//                 {/* <View style={styles.inputWithIcon}> */}
//                 <TextInput
//                   style={[
//                     styles.input,
//                     styles.inputWithIconPadding,
//                     touched.confirmPassword &&
//                       errors.confirmPassword &&
//                       styles.inputError,
//                   ]}
//                   placeholder="تأكيد كلمة المرور"
//                   placeholderTextColor={COLORS.gray?.[500]}
//                   secureTextEntry={!showConfirmPassword}
//                   value={values.confirmPassword}
//                   onChangeText={handleChange('confirmPassword')}
//                   onBlur={handleBlur('confirmPassword')}
//                   maxLength={20}
//                 />
//                 <TouchableOpacity
//                   onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//                   style={styles.inputIcon}
//                 >
//                   <MaterialDesignIcons
//                     name={showConfirmPassword ? 'eye' : 'eye-off'}
//                     size={20}
//                     color={COLORS.gray?.[400]}
//                   />
//                 </TouchableOpacity>
//                 {/* </View> */}
//                 {touched.confirmPassword && errors.confirmPassword && (
//                   <Text style={styles.errorText}>{errors.confirmPassword}</Text>
//                 )}
//               </View>

//               {/* Phone Input */}
//               <View style={styles.inputContainer}>
//                 <PhoneInput
//                   ref={phoneInput}
//                   defaultValue={values.phone}
//                   defaultCode="LB"
//                   placeholder="رقم الهاتف"
//                   layout="first"
//                   onChangeText={text => {
//                     setFieldValue('phone', text);
//                   }}
//                   onChangeFormattedText={setFormattedValue}
//                   withShadow={false}
//                   containerStyle={[
//                     styles.phoneContainer,
//                     styles.input,
//                     touched.phone && errors.phone && styles.inputError,
//                   ]}
//                   textContainerStyle={styles.phoneTextContainer}
//                   textInputStyle={styles.phoneTextInput}
//                   countryPickerProps={{ renderFlagButton: false }}
//                   countryPickerButtonStyle={styles.countryPickerButton}
//                   textInputProps={{
//                     keyboardType: 'number-pad',
//                     maxLength: 8,
//                   }}
//                   codeTextStyle={styles.codeTextStyle}
//                 />
//                 {touched.phone && errors.phone && (
//                   <Text style={styles.errorText}>{errors.phone}</Text>
//                 )}
//               </View>

//               {/* Area Picker */}
//               {/* <View style={styles.inputContainer}> */}
//               <View
//                 style={[
//                   // styles.pickerContainer,
//                   touched.area && errors.area && styles.inputError,
//                 ]}
//               >
//                 <SimplePicker
//                   label="المنطقة"
//                   columns={1}
//                   showLabel={false}
//                   options={areas}
//                   labelKey={'name_ar'}
//                   selectedValue={values.area?.name_ar}
//                   onValueChange={selectedArea =>
//                     setFieldValue('area', selectedArea)
//                   }
//                 />
//               </View>
//               {touched.area && errors.area && (
//                 <Text style={styles.errorText}>{errors.area}</Text>
//               )}
//               {/* </View> */}

//               {/* Date of Birth */}
//               <View style={styles.inputContainer}>
//                 {showDatePicker || Platform.OS === 'ios' ? (
//                   <View
//                     style={[
//                       styles.input,
//                       styles.datePickerContainer,
//                       touched.dateOfBirth &&
//                         errors.dateOfBirth &&
//                         styles.inputError,
//                     ]}
//                   >
//                     <DateTimePicker
//                       value={
//                         values.dateOfBirth
//                           ? new Date(values.dateOfBirth)
//                           : new Date(2000, 0, 1)
//                       }
//                       mode="date"
//                       locale="ar"
//                       display="compact"
//                       style={styles.datePicker}
//                       textColor={COLORS.text?.primary || COLORS.primary}
//                       onChange={(event, selectedDate) => {
//                         const { type } = event;
//                         if (
//                           type === 'dismissed' ||
//                           (Platform.OS === 'android' && type === 'set')
//                         ) {
//                           setShowDatePicker(false);
//                         }
//                         if (selectedDate) {
//                           setFieldValue('dateOfBirth', selectedDate);
//                         }
//                       }}
//                       maximumDate={new Date()}
//                     />
//                   </View>
//                 ) : (
//                   <TouchableOpacity
//                     style={[
//                       styles.input,
//                       touched.dateOfBirth &&
//                         errors.dateOfBirth &&
//                         styles.inputError,
//                     ]}
//                     onPress={() => setShowDatePicker(true)}
//                   >
//                     <View style={styles.datePickerButton}>
//                       <Text style={styles.datePickerButtonText}>
//                         {values.dateOfBirth
//                           ? `${new Date(values.dateOfBirth).toLocaleDateString(
//                               'ar',
//                             )}`
//                           : 'اختر تاريخ الميلاد'}
//                       </Text>
//                     </View>
//                   </TouchableOpacity>
//                 )}
//                 {touched.dateOfBirth && errors.dateOfBirth && (
//                   <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
//                 )}
//               </View>

//               {/* General Error */}
//               {status && <Text style={styles.error}>{status}</Text>}

//               <TouchableOpacity
//                 style={[styles.button, isSubmitting && styles.buttonDisabled]}
//                 onPress={handleSubmit}
//                 disabled={isSubmitting}
//               >
//                 <Text style={styles.buttonText}>
//                   {isSubmitting ? 'جاري التسجيل...' : 'تسجيل'}
//                 </Text>
//               </TouchableOpacity>

//               <Text style={styles.footerText}>
//                 تحقق من بريدك الإلكتروني للتأكيد
//               </Text>
//             </View>
//           )}
//         </Formik>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   scrollViewContent: {
//     paddingTop: SPACING.xl,
//     flexGrow: 1,
//     // justifyContent: 'center',
//     // alignItems: 'center',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     justifyContent: 'center',
//   },
//   logoContainer: {
//     alignItems: 'center',
//   },
//   logoPlaceholder: {
//     width: SIZES.logo?.lg || 80,
//     height: SIZES.logo?.lg || 80,
//     backgroundColor: COLORS.white,
//     borderRadius: BORDER_RADIUS.circle || 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: SPACING.lg,
//     ...SHADOWS.md,
//     borderWidth: 1,
//     borderColor: COLORS.gray?.[200] || '#e5e7eb',
//   },
//   logo: {
//     width: SIZES.logo?.sm || 40,
//     height: SIZES.logo?.sm || 40,
//   },
//   logoTitle: {
//     fontSize: FONT_SIZES.xl,
//     color: COLORS.text?.primary || COLORS.primary,
//     marginBottom: SPACING.sm,
//     textAlign: 'center',
//     fontWeight: FONT_WEIGHTS.bold,
//     fontFamily: FONT_FAMILIES.primary,
//     paddingBottom: SPACING.sm,
//   },
//   formContainer: {
//     // width: '100%',
//     // maxWidth: 350,
//     // alignSelf: 'center',
//     // flex: 1,
//     paddingHorizontal: 14,
//     // paddingTop: 100,
//   },
//   // inputContainer: {
//   //   marginBottom: SPACING.md,
//   // },
//   // input: {
//   //   height: SIZES.input?.height || 50,
//   //   backgroundColor: COLORS.white,
//   //   borderRadius: BORDER_RADIUS.md,
//   //   borderWidth: 1,
//   //   borderColor: COLORS.gray?.[300] || '#d1d5db',
//   //   paddingHorizontal: SPACING.md,
//   //   justifyContent: 'center',
//   //   ...SHADOWS.sm,
//   //   fontSize: FONT_SIZES.md,
//   //   color: COLORS.text?.primary || COLORS.primary,
//   //   fontFamily: FONT_FAMILIES.primary,
//   // },
//   inputError: {
//     borderColor: COLORS.danger,
//     borderWidth: 1.5,
//   },
//   // inputWithIcon: {
//   //   position: 'relative',
//   //   flexDirection: 'row',
//   //   alignItems: 'center',
//   // },
//   // inputWithIconPadding: {
//   //   paddingRight: 45,
//   // },
//   // inputIcon: {
//   //   position: 'absolute',
//   //   right: 12,
//   //   top: '50%',
//   //   marginTop: -10,
//   // },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: COLORS.white,
//     borderRadius: 12,
//     marginBottom: 16,
//     paddingHorizontal: 16,
//     height: 56,
//     borderWidth: 1,
//     borderColor: COLORS.gray[400],
//   },
//   inputIcon: {
//     // marginRight: 12,
//     marginLeft: 12,
//   },
//   input: {
//     flex: 1,
//     // color: colors.textColor,
//     fontSize: 16,
//     width: '100%',
//   },
//   errorText: {
//     color: COLORS.danger,
//     fontSize: FONT_SIZES.sm,
//     marginTop: 4,
//     marginRight: 4,
//     fontFamily: FONT_FAMILIES.primary,
//     textAlign: 'right',
//   },
//   datePickerContainer: {
//     paddingHorizontal: 0,
//   },
//   datePickerButton: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: SPACING.md,
//   },
//   datePickerButtonText: {
//     color: COLORS.text?.primary || COLORS.primary,
//     fontSize: FONT_SIZES.md,
//     fontFamily: FONT_FAMILIES.primary,
//   },
//   phoneContainer: {
//     backgroundColor: 'transparent',
//     marginBottom: 0,
//   },
//   phoneTextContainer: {
//     backgroundColor: 'transparent',
//     paddingVertical: 0,
//   },
//   phoneTextInput: {
//     // height: '100%',
//     color: COLORS.text?.primary || COLORS.primary,
//     fontSize: FONT_SIZES.md,
//     fontFamily: FONT_FAMILIES.primary,
//   },
//   countryPickerButton: {
//     width: 60,
//     justifyContent: 'center',
//   },
//   codeTextStyle: {
//     color: COLORS.text?.primary || COLORS.primary,
//     fontSize: FONT_SIZES.md,
//     fontFamily: FONT_FAMILIES.primary,
//   },
//   pickerContainer: {
//     height: 50,
//     backgroundColor: COLORS.white,
//     borderRadius: BORDER_RADIUS.md,
//     borderWidth: 1,
//     borderColor: COLORS.gray[300],
//     justifyContent: 'center',
//     overflow: 'hidden',
//   },
//   button: {
//     height: SIZES.button?.height || 50,
//     backgroundColor: COLORS.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: BORDER_RADIUS.lg,
//     marginTop: SPACING.xl,
//     marginBottom: SPACING.lg,
//     ...SHADOWS.primary,
//   },
//   buttonDisabled: {
//     backgroundColor: COLORS.gray?.[400] || '#bdc3c7',
//   },
//   buttonText: {
//     color: COLORS.white,
//     fontSize: FONT_SIZES.lg,
//     fontWeight: FONT_WEIGHTS.bold,
//     fontFamily: FONT_FAMILIES.primary,
//   },
//   footerText: {
//     color: COLORS.text?.secondary || COLORS.gray?.[600] || '#6b7280',
//     fontSize: FONT_SIZES.sm,
//     textAlign: 'center',
//     fontFamily: FONT_FAMILIES.primary,
//   },
//   error: {
//     color: COLORS.danger,
//     marginBottom: SPACING.md,
//     textAlign: 'center',
//     fontSize: FONT_SIZES.md,
//     fontFamily: FONT_FAMILIES.primary,
//   },
// });

// const signUp = async () => {
//   setIsLoading(true);
//   setError('');
//   if (
//     !dateOfBirth ||
//     !fullName ||
//     !phone ||
//     !area ||
//     !email ||
//     !password ||
//     !confirmPassword
//   ) {
//     setError('يرجى ملء جميع الحقول');
//     setIsLoading(false);
//     return;
//   }
//   const validation = validateLebaneseNumber(phone);
//   if (!validation.isValid) {
//     setError(validation.message);
//     setIsLoading(false);
//     return;
//   }
//   if (password !== confirmPassword) {
//     setError('passwords must match');
//     setIsLoading(false);
//     return;
//   }
//   try {
//     const exist = await checkIfUserExist(phone);
//     if (!exist.inRTDB) {
//       // const confirmation = await sendOtp(formattedValue); //+961...
//       // const sendResult = await twilioAuth.requestVerificationCode(
//       //   phoneNumber,
//       // );

//       const user = {
//         email: email,
//         password: password,
//         phone_number: formattedValue,
//         full_name: fullName,
//         date_of_birth: dateOfBirth
//           ? new Date(dateOfBirth).toISOString()
//           : null,
//         area_id: area?.id,
//         role: ROLES.CITIZEN,
//       };

//       const sendResult = await signUpUser(user);

//       if (sendResult) {
//         // console.log('Verification code sent!');
//         console.log('User registered successfully:', sendResult);
//         const userCredential = await createUserWithEmailAndPassword(
//           auth,
//           email,
//           password,
//         );
//         const userr = userCredential.user;
//         await sendEmailVerification(userr);

//         await auth.signOut();
//         // Alert.alert('تم التسجيل بنجاح! يرجى التحقق من بريدك الإلكتروني.');

//         navigation.navigate('SignIn', {
//           prefillEmail: email,
//           prefillPassword: password,
//         });

// if (!confirmation) {
//   setError('خطأ في إرسال رمز التحقق');
//   setIsLoading(false);
//   return;
// }
// console.log(confirmation);
// navigation.navigate(ROUTE_NAMES.OTP, {
//   phone: formattedValue,
//   // confirm: confirmation,
//   user: {
//     phone_number: formattedValue,
//     full_name: fullName,
//     date_of_birth: dateOfBirth
//       ? new Date(dateOfBirth).toISOString()
//       : null,
//     area_id: area?.id,
//     role: ROLES.CITIZEN,
//     invite_role: null,
//   },
//   signIn: false,
// });
//       } else {
//         setError('الرقم مسجل مسبقاً، الرجاء تسجيل الدخول');
//       }
//     }
//   } catch (error) {
//     console.error(error);
//     setError(error?.message || 'خطأ في إرسال رمز التحقق');
//   } finally {
//     setIsLoading(false);
//   }
// };
// return (
//   <ScrollView
//     // style={styles.scrollView}
//     contentContainerStyle={styles.scrollViewContent}
//     showsVerticalScrollIndicator={false}
//   >
//     <View style={styles.container}>
//       <View style={styles.logoContainer}>
//         <View style={styles.logoPlaceholder}>
//           <Image
//             source={require('../assets/logo1.png')}
//             style={styles.logo}
//             resizeMode="contain"
//           />
//         </View>
//         <Text style={styles.logoTitle}>اتحاد بلديات الفيحاء</Text>
//         {/* <Text style={styles.logoSubtitle}>Urban Community Fayhaa</Text> */}
//       </View>

//       <View style={styles.formContainer}>
//         {/* Full Name Input */}
//         <TextInput
//           value={fullName}
//           style={styles.input}
//           onChangeText={setFullName}
//           placeholder="الاسم الكامل"
//           placeholderTextColor={COLORS.gray?.[500]}
//         />

//         {/* Email Input */}
//         <TextInput
//           style={styles.input}
//           placeholder="Email"
//           // placeholderTextColor={colors.textSecondary}
//           autoCapitalize="none"
//           keyboardType="email-address"
//           value={email}
//           onChangeText={setEmail}
//           // onBlur={handleBlur('email')}
//           maxLength={128}
//         />

//         {/* Password Input */}
//         <TextInput
//           style={styles.input}
//           placeholder="Password"
//           // placeholderTextColor={colors.textSecondary}
//           secureTextEntry={!showPassword}
//           value={password}
//           onChangeText={setPassword}
//           // onBlur={handleBlur('password')}
//           maxLength={20}
//         />

//         {/* Confirm Password Input */}
//         <TextInput
//           style={styles.input}
//           placeholder="Confirm Password"
//           // placeholderTextColor={colors.textSecondary}
//           secureTextEntry={!showConfirmPassword}
//           value={confirmPassword}
//           onChangeText={setConfirmPassword}
//           // onBlur={handleBlur('cPassword')}
//           maxLength={20}
//         />

//         {/* Phone Input */}
//         <PhoneInput
//           ref={phoneInput}
//           defaultValue={phone}
//           defaultCode="LB"
//           placeholder="رقم الهاتف"
//           layout="first"
//           onChangeText={setPhone}
//           onChangeFormattedText={setFormattedValue}
//           withShadow={false} // Remove shadow since parent has it
//           containerStyle={styles.phoneContainer}
//           textContainerStyle={styles.phoneTextContainer}
//           textInputStyle={styles.phoneTextInput}
//           countryPickerProps={{ renderFlagButton: false }}
//           countryPickerButtonStyle={styles.countryPickerButton}
//           textInputProps={{
//             keyboardType: 'number-pad',
//             maxLength: 8,
//           }}
//           codeTextStyle={styles.codeTextStyle}
//         />

//         {/* Area Picker */}
//         <View style={styles.pickerContainer}>
//           <SimplePicker
//             label="المنطقة"
//             columns={1}
//             showLabel={false}
//             options={areas}
//             labelKey={'name_ar'}
//             selectedValue={area?.name_ar}
//             onValueChange={setArea}
//           />
//         </View>

//         {/* Date of Birth */}
//         {showDatePicker || Platform.OS === 'ios' ? (
//           <View style={[styles.input, styles.datePickerContainer]}>
//             <DateTimePicker
//               value={
//                 dateOfBirth ? new Date(dateOfBirth) : new Date(2015, 0, 1)
//               }
//               mode="date"
//               locale="ar"
//               display="compact"
//               style={styles.datePicker}
//               textColor={COLORS.text?.primary || COLORS.primary}
//               onChange={(event, selectedDate) => {
//                 const { type } = event;
//                 if (
//                   type === 'dismissed' ||
//                   (Platform.OS === 'android' && type === 'set')
//                 ) {
//                   setShowDatePicker(false);
//                 }
//                 if (selectedDate) setDateOfBirth(selectedDate);
//               }}
//               maximumDate={new Date()}
//             />
//           </View>
//         ) : (
//           <TouchableOpacity
//             style={styles.input}
//             onPress={() => setShowDatePicker(true)}
//           >
//             <Text style={styles.datePickerButtonText}>
//               {dateOfBirth
//                 ? `${new Date(dateOfBirth).toLocaleDateString('ar')}`
//                 : 'اختر تاريخ الميلاد'}
//             </Text>
//           </TouchableOpacity>
//         )}

//         {error ? <Text style={styles.error}>{error}</Text> : null}

//         <TouchableOpacity
//           style={[styles.button, isLoading && styles.buttonDisabled]}
//           onPress={signUp}
//           disabled={isLoading}
//         >
//           <Text style={styles.buttonText}>تسجيل</Text>
//         </TouchableOpacity>

//         <Text style={styles.footerText}>
//           سنرسل لك رمز تحقق عبر الرسائل القصيرة
//         </Text>
//       </View>
//     </View>
//   </ScrollView>
// );
// return (
//   <ScrollView
//   // style={styles.scrollView}
//   contentContainerStyle={styles.scrollViewContent}
//   showsVerticalScrollIndicator={false}>
//   <View style={styles.container}>
//     <View style={styles.logoContainer}>
//       <View style={styles.logoPlaceholder}>
//         <Image
//           source={require('../assets/logo1.png')}
//           style={styles.logo}
//           resizeMode="contain"
//         />
//       </View>
//       <Text style={styles.logoTitle}>اتحاد بلديات الفيحاء</Text>
//       {/* <Text style={styles.logoSubtitle}>Urban Community Fayhaa</Text> */}
//     </View>

//     <View style={styles.formContainer}>
//       {/* <Text style={styles.inputLabel}>الاسم الكامل</Text> */}
//       <TextInput
//         value={fullName}
//         style={styles.input}
//         onChangeText={setFullName}
//         placeholder="الاسم الكامل"
//         placeholderTextColor={COLORS.gray?.[500]}
//       />

//       {/* <Text style={styles.inputLabel}>رقم الهاتف</Text> */}

//       <View style={[styles.input, { direction: 'ltr' }]}>
//         {/* <View style={styles.inputContainer}> */}
//           {/* <Icon
//             name="mail-outline"
//             size={20}
//             // color={colors.textSecondary}
//             style={styles.inputIcon}
//           /> */}
//           <TextInput
//             style={styles.input}
//             placeholder="Email"
//             // placeholderTextColor={colors.textSecondary}
//             autoCapitalize="none"
//             keyboardType="email-address"
//             value={email}
//             onChangeText={setEmail}
//             // onBlur={handleBlur('email')}
//             maxLength={128}
//           />
//         {/* </View> */}

//         {/* <View style={styles.inputContainer}> */}
//           {/* <Icon
//             name="lock-closed-outline"
//             size={20}
//             // color={colors.textSecondary}
//             style={styles.inputIcon}
//           /> */}
//           <TextInput
//             style={styles.input}
//             placeholder="Password"
//             // placeholderTextColor={colors.textSecondary}
//             secureTextEntry={!showPassword}
//             value={password}
//             onChangeText={setPassword}
//             // onBlur={handleBlur('password')}
//             maxLength={20}
//           />
//           {/* <TouchableOpacity
//             onPress={() => setShowPassword(!showPassword)}
//             style={styles.eyeIcon}
//           > */}
//             {/* <Icon
//               name={showPassword ? 'eye-outline' : 'eye-off-outline'}
//               size={20}
//               // color={colors.orange}
//             /> */}
//           {/* </TouchableOpacity> */}
//         {/* </View> */}
//         {/* {touched.password && errors.password && (
//           <Text style={styles.error}>{errors.password}</Text>
//         )} */}

//         {/* <View style={styles.inputContainer}> */}
//           {/* <Icon
//             name="lock-closed-outline"
//             size={20}
//             // color={colors.textSecondary}
//             style={styles.inputIcon}
//           /> */}
//           <TextInput
//             style={styles.input}
//             placeholder="Confirm Password"
//             // placeholderTextColor={colors.textSecondary}
//             secureTextEntry={!showConfirmPassword}
//             value={confirmPassword}
//             onChangeText={setConfirmPassword}
//             // onBlur={handleBlur('cPassword')}
//             maxLength={20}
//           />
//           {/* <TouchableOpacity
//             onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//             style={styles.eyeIcon}
//           > */}
//             {/* <Icon
//               name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
//               size={20}
//               color={colors.orange}
//             /> */}
//           {/* </TouchableOpacity> */}
//         {/* </View> */}

//         <PhoneInput
//           ref={phoneInput}
//           defaultValue={phone}
//           defaultCode="LB"
//           placeholder="رقم الهاتف"
//           layout="first"
//           onChangeText={setPhone}
//           onChangeFormattedText={setFormattedValue}
//           withShadow={false} // Remove shadow since parent has it
//           containerStyle={styles.phoneContainer}
//           textContainerStyle={styles.phoneTextContainer}
//           textInputStyle={styles.phoneTextInput}
//           countryPickerProps={{ renderFlagButton: false }}
//           countryPickerButtonStyle={styles.countryPickerButton}
//           textInputProps={{
//             keyboardType: 'number-pad',
//             maxLength: 8,
//           }}
//           codeTextStyle={styles.codeTextStyle}
//         />
//       </View>

//       {/* Area Picker */}
//       {/* <Text style={styles.inputLabel}>المنطقة</Text> */}
//       <View style={styles.pickerContainer}>
//         <SimplePicker
//           label="المنطقة"
//           columns={1}
//           showLabel={false}
//           options={areas}
//           labelKey={'name_ar'}
//           selectedValue={area?.name_ar}
//           onValueChange={setArea}
//         />
//       </View>

//       {/* Date of Birth */}
//       {/* <Text style={styles.inputLabel}>تاريخ الميلاد</Text> */}
//       {showDatePicker || Platform.OS === 'ios' ? (
//         <View style={[styles.input, styles.datePickerContainer]}>
//           <DateTimePicker
//             value={dateOfBirth ? new Date(dateOfBirth) : new Date(2015, 0, 1)}
//             mode="date"
//             locale="ar"
//             display="compact"
//             style={styles.datePicker}
//             textColor={COLORS.text?.primary || COLORS.primary}
//             onChange={(event, selectedDate) => {
//               const { type } = event;
//               if (
//                 type === 'dismissed' ||
//                 (Platform.OS === 'android' && type === 'set')
//               ) {
//                 setShowDatePicker(false);
//               }
//               if (selectedDate) setDateOfBirth(selectedDate);
//             }}
//             maximumDate={new Date()}
//           />
//         </View>
//       ) : (
//         <TouchableOpacity
//           style={styles.input}
//           onPress={() => setShowDatePicker(true)}
//         >
//           <Text style={styles.datePickerButtonText}>
//             {dateOfBirth
//               ? `${new Date(dateOfBirth).toLocaleDateString('ar')}`
//               : 'اختر تاريخ الميلاد'}
//           </Text>
//         </TouchableOpacity>
//       )}

//       {error ? <Text style={styles.error}>{error}</Text> : null}

//       <TouchableOpacity
//         style={[styles.button, isLoading && styles.buttonDisabled]}
//         onPress={signUp}
//         disabled={isLoading}
//       >
//         <Text style={styles.buttonText}>تسجيل</Text>
//       </TouchableOpacity>

//       <Text style={styles.footerText}>
//         سنرسل لك رمز تحقق عبر الرسائل القصيرة
//       </Text>
//     </View>
//   </View>
//   </ScrollView>
// );
// }
// {
/* </ScrollView> */
// }

// const styles = StyleSheet.create({
//   scrollView: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   scrollViewContent: {
//     // flex: 1,
//     // justifyContent: 'center',
//     // alignItems: 'center',
//     paddingTop: SPACING.xl,
//     // padding: 0,
//     // margin: 0
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     justifyContent: 'center',
//     // alignItems: 'center',
//   },
//   logoContainer: {
//     alignItems: 'center',
//   },
//   logoPlaceholder: {
//     width: SIZES.logo?.lg || 80,
//     height: SIZES.logo?.lg || 80,
//     backgroundColor: COLORS.white,
//     borderRadius: BORDER_RADIUS.circle || 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: SPACING.lg,
//     ...SHADOWS.md,
//     borderWidth: 1,
//     borderColor: COLORS.gray?.[200] || '#e5e7eb',
//   },
//   logo: {
//     width: SIZES.logo?.sm || 40,
//     height: SIZES.logo?.sm || 40,
//   },
//   logoTitle: {
//     fontSize: FONT_SIZES.xl,
//     color: COLORS.text?.primary || COLORS.primary,
//     marginBottom: SPACING.sm,
//     textAlign: 'center',
//     fontWeight: FONT_WEIGHTS.bold,
//     fontFamily: FONT_FAMILIES.primary,
//     paddingBottom: SPACING.sm,
//   },
//   logoSubtitle: {
//     fontSize: FONT_SIZES.sm,
//     color: COLORS.text?.secondary || COLORS.gray?.[600] || '#6b7280',
//     textAlign: 'center',
//     fontFamily: FONT_FAMILIES.primary,
//     marginBottom: SPACING.xl,
//   },
//   formContainer: {
//     width: '100%',
//     maxWidth: 350,
//     alignSelf: 'center',
//     // paddingHorizontal: SPACING.lg,
//   },
//   inputLabel: {
//     fontSize: FONT_SIZES.md,
//     color: COLORS.text?.primary || COLORS.primary,
//     marginBottom: SPACING.sm,
//     fontFamily: FONT_FAMILIES.primary,
//     fontWeight: FONT_WEIGHTS.medium,
//   },
//   input: {
//     height: SIZES.input?.height || 50,
//     // width: '100%',
//     backgroundColor: COLORS.white,
//     borderRadius: BORDER_RADIUS.md,
//     borderWidth: 1,
//     borderColor: COLORS.gray?.[300] || '#d1d5db',
//     marginBottom: SPACING.lg,
//     paddingHorizontal: SPACING.md,
//     justifyContent: 'center',
//     ...SHADOWS.sm,
//   },
//   datePickerContainer: {
//     // paddingHorizontal: 0,
//     // width: '100%',
//     // height: '100%',
//   },
//   datePickerButtonText: {
//     color: COLORS.text?.primary || COLORS.primary,
//     fontSize: FONT_SIZES.lg,
//     fontFamily: FONT_FAMILIES.primary,
//     padding: SPACING.sm + 5,
//   },
//   phoneContainer: {
//     backgroundColor: 'transparent',
//   },
//   phoneTextContainer: {
//     backgroundColor: 'transparent',
//     paddingVertical: 0,
//   },
//   phoneTextInput: {
//     height: '100%',
//     color: COLORS.text?.primary || COLORS.primary,
//     fontSize: FONT_SIZES.lg,
//     fontFamily: FONT_FAMILIES.primary,
//   },
//   countryPickerButton: {
//     width: 60,
//     justifyContent: 'center',
//   },
//   button: {
//     // width: '100%',
//     height: SIZES.button?.height || 50,
//     backgroundColor: COLORS.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: BORDER_RADIUS.lg,
//     marginTop: SPACING.xl,
//     marginBottom: SPACING.lg,
//     ...SHADOWS.primary,
//   },
//   buttonDisabled: {
//     backgroundColor: '#bdc3c7',
//   },
//   buttonText: {
//     color: COLORS.white,
//     fontSize: FONT_SIZES.lg,
//     fontWeight: FONT_WEIGHTS.bold,
//     fontFamily: FONT_FAMILIES.primary,
//   },
//   footerText: {
//     color: COLORS.text?.secondary || COLORS.gray?.[600] || '#6b7280',
//     fontSize: FONT_SIZES.sm,
//     textAlign: 'center',
//     fontFamily: FONT_FAMILIES.primary,
//     // marginTop: SPACING.md,
//   },
//   error: {
//     color: COLORS.danger,
//     marginBottom: SPACING.md,
//     textAlign: 'center',
//     fontSize: FONT_SIZES.md,
//     fontFamily: FONT_FAMILIES.primary,
//   },
// });
