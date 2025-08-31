import { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import PhoneInput from 'react-native-phone-number-input';
import { useNavigation } from '@react-navigation/native';
import { ROUTE_NAMES } from '../constants';
import { sendOtp } from '../services/otpService';
import { checkIfUserExistByEmail, loginUser } from '../api/authApi';
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
import { validateLebaneseNumber } from '../utils';
import { useRoute } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email('البريد الإلكتروني غير صحيح')
    .required('البريد الإلكتروني مطلوب')
    .matches(/^[a-zA-Z0-9._%+-]+@gmail\.com$/i, 'البريد الإلكتروني غير صالح'),
  password: Yup.string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .required('كلمة المرور مطلوبة'),
});

export default function SignIn() {
  // const [error, setError] = useState('');
  // const phoneInput = useRef(null);
  const navigation = useNavigation();
  // const [phone, setPhone] = useState('');
  // const [formattedValue, setFormattedValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const route = useRoute();
  const [showPassword, setShowPassword] = useState(false);

  // Get pre-filled credentials from route params
  const prefillEmail = route?.params?.prefillEmail || '';
  const prefillPassword = route?.params?.prefillPassword || '';

  const initialValues = {
    email: prefillEmail,
    password: prefillPassword,
  };

  const handleSubmit = async (
    values,
    { setSubmitting, setFieldError, setStatus },
  ) => {
    setStatus(null);

    try {
      // Check if user exists
      const exist = await checkIfUserExistByEmail(values.email);
      if (exist.inRTDB) {
        const response = await loginUser({
          email: values.email,
          password: values.password,
        });
        console.log('Login response:', response);
      } else {
        setStatus('الرجاء انشاء حساب قبل تسجيل الدخول');
      }
    } catch (error) {
      console.log(error);
      setStatus(
        error?.message || 'خطأ في تسجيل الدخول، يرجى المحاولة مرة أخرى',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Image
            source={require('../assets/logo1.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.logoTitle}>اتحاد بلديات الفيحاء</Text>
        <Text style={styles.logoSubtitle}>Urban Community Fayhaa</Text>
      </View>

      {prefillEmail && prefillPassword && (
        <Text style={styles.infoText}>
          تم ملء بياناتك مسبقاً. يرجى التحقق من بريدك الإلكتروني قبل تسجيل
          الدخول.
        </Text>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          isSubmitting,
          status,
        }) => (
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.fieldContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    touched.email && errors.email && styles.inputError,
                  ]}
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
                    // styles.inputWithIcon,
                    touched.password && errors.password && styles.inputError,
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

            {/* General Error */}
            {status && <Text style={styles.error}>{status}</Text>}

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <View style={styles.buttonContent}>
                {/* {isSubmitting && (
                  <MaterialDesignIcons
                    name="refresh"
                    size={20}
                    color={COLORS.white}
                    style={styles.loadingIcon}
                  />
                )} */}
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              تحقق من بريدك الإلكتروني للتأكيد
            </Text>
          </View>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // justifyContent: 'center',
    // paddingHorizontal: SPACING.lg,
    paddingTop: '20%',
  },
  logoContainer: {
    alignItems: 'center',
    // marginBottom: SPACING.xl,
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
    width: SIZES.logo?.sm || 40,
    height: SIZES.logo?.sm || 40,
  },
  logoTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text?.primary || COLORS.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
  },
  logoSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text?.secondary || COLORS.gray?.[600] || '#6b7280',
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
    marginBottom: SPACING.lg,
  },
  infoText: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILIES.primary,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  fieldContainer: {
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    // marginBottom: 16,
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
    // color: colors.textColor,
    fontSize: 14,
    textAlign: 'right',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
    marginRight: 4,
    fontFamily: FONT_FAMILIES.primary,
    textAlign: 'left',
  },
  button: {
    height: SIZES.button?.height || 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.primary,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray?.[400] || '#bdc3c7',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginRight: SPACING.sm,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  signUpText: {
    color: COLORS.text?.secondary || COLORS.gray?.[600],
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.primary,
  },
  signUpLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.primary,
    fontWeight: FONT_WEIGHTS.medium,
    textDecorationLine: 'underline',
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
