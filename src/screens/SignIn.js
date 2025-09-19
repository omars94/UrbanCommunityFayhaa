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
import { sendOtp } from '../services/otpService';
import {
  checkIfUserExistByEmail,
  loginUser,
  updateResendCount,
} from '../api/authApi';
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
import { checkResendEligibility } from '../api/authApi';
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../utils/firebase';

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
  const [showPassword, setShowPassword] = useState(false);

  const [showResendLink, setShowResendLink] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [maxResends, setMaxResends] = useState(3);
  const [resendEmail, setResendEmail] = useState('');
  const [password, setPassword] = useState('');
  const [countdownTimer, setCountdownTimer] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  const initialValues = {
    email: '',
    password: '',
  };

  useEffect(() => {
    return () => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [countdownTimer]);

  // Start countdown timer
  const startCountdown = seconds => {
    setRemainingTime(seconds);

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setCountdownTimer(timer);
  };

  const onResendEmail = async (email, password) => {
    if (
      !email ||
      isResending ||
      resendCount >= maxResends ||
      remainingTime > 0
    ) {
      return;
    }

    setIsResending(true);

    try {
      const eligibility = await checkResendEligibility(email);

      if (!eligibility.canResend) {
        return {
          success: false,
          error: eligibility.error,
          remainingTime: eligibility.remainingTime,
          remainingAttempts: eligibility.remainingAttempts,
        };
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      console.log('User signed in for resend:', userCredential.user);
      console.log('email', email);
      console.log('pass', password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      await auth.signOut();
      const res = await updateResendCount(email);
      setResendCount(res?.newResendCount);
      startCountdown(60);
      // if (result.remainingTime > 0) {
      //   startCountdown(result.remainingTime);
      // }
      // }
    } catch (error) {
      console.log('Resend email error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (
    values,
    { setSubmitting, setFieldError, setStatus },
  ) => {
    setStatus(null);
    setShowResendLink(false);

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
      if (
        error?.message?.includes(
          'يجب عليك تفعيل الحساب عن طريق الرابط المرسل على بريدك الإلكتروني قبل تسجيل الدخول',
        )
      ) {
        setResendEmail(values.email);
        setPassword(values.password);

        try {
          const eligibility = await checkResendEligibility(values.email);
          const currentCount = 3 - eligibility?.remainingAttempts || 0;
          setResendCount(currentCount);

          const attemptsMessage = eligibility.canResend
            ? `\n\nلديك ${eligibility?.remainingAttempts} محاولة متبقية لإرسال البريد.`
            : '\n\nلقد وصلت إلى الحد الأقصى من محاولات الإرسال.';

          setStatus(
            `يرجى التحقق من بريدك الإلكتروني والنقر على رابط التأكيد قبل تسجيل الدخول.`,
          );
        } catch (eligibilityError) {
          console.log('Error checking eligibility:', eligibilityError);
          setStatus(
            'يرجى التحقق من بريدك الإلكتروني والنقر على رابط التأكيد قبل تسجيل الدخول.',
          );
        } finally {
          setShowResendLink(true);
        }
      } else if (error?.message?.includes('auth/invalid-credential')) {
        setStatus('كلمة المرور التي أدخلتها غير صحيحة. يرجى المحاولة مرة أخرى');
      } else {
        setStatus(
          error?.message || 'خطأ في تسجيل الدخول، يرجى المحاولة مرة أخرى',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
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

            {/* Resend Email Section */}
            {showResendLink && (
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  (isResending ||
                    resendCount >= maxResends ||
                    remainingTime > 0) &&
                    styles.resendButtonDisabled,
                ]}
                onPress={() => onResendEmail(resendEmail, password)}
                disabled={
                  isResending || resendCount >= maxResends || remainingTime > 0
                }
              >
                <Text
                  style={[
                    styles.resendButtonText,
                    (isResending ||
                      resendCount >= maxResends ||
                      remainingTime > 0) &&
                      styles.resendButtonTextDisabled,
                  ]}
                >
                  {isResending
                    ? 'جاري الإرسال...'
                    : remainingTime > 0
                    ? `إعادة الإرسال (${remainingTime}s)`
                    : resendCount >= maxResends
                    ? 'تم الوصول للحد الأقصى من المحاولات'
                    : `إعادة إرسال رابط التأكيد (${
                        maxResends - resendCount
                      } متبقية)`}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* <Text style={styles.footerText}>
              تحقق من بريدك الإلكتروني للتأكيد
            </Text> */}
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
    paddingTop: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
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
  },
  logoSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text?.secondary || COLORS.gray?.[600] || '#6b7280',
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
    // marginBottom: SPACING.lg,
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
    color: COLORS.black,
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
  resendButton: {
    backgroundColor: COLORS.secondary || COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    // marginBottom: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  resendButtonDisabled: {
    backgroundColor: COLORS.gray?.[400] || '#bdc3c7',
  },
  resendButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    fontFamily: FONT_FAMILIES.primary,
  },
  resendButtonTextDisabled: {
    color: COLORS.white,
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
