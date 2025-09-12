// File: app/otp.js (OTP Verification Screen)
import React, { useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import {
  ROUTE_NAMES,
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILIES,
  BORDER_RADIUS,
  SHADOWS,
  SIZES,
} from '../constants';
import auth from '@react-native-firebase/auth';
import { signUp } from '../api/authApi';
import { formatLebanesePhone } from '../utils/index';
// import { verifyOtp } from '../services/otpService';
// import TwilioFirebaseAuth from '../services/twilioFirebaseAuth';

export default function OTPScreen() {
  const {
    params: {
      phone,
      //  confirm,
      user,
      signIn,
    },
  } = useRoute();
  const navigation = useNavigation();
  // const recaptchaVerifier = useRef(null);

  const [code, setCode] = useState('');
  // const twilioAuth = new TwilioFirebaseAuth();

  const handleVerify = async () => {
    try {
      console.log('Code value:', code, typeof code);
      // if (!confirm) {
      //   console.log('No confirmation object provided to OTP screen');
      //   return;
      // }
      // const credential = await confirm.confirm(code);
      // const userCredential = await auth().signInWithCredential(credential);
      // console.log('signed in!', userCredential);
      // const result = verifyOtp(phone, code);
      // const result = await twilioAuth.verifyAndSignIn(
      //   phoneNumber,
      //   verificationCode,
      //   {
      //     name: userName,
      //     signupMethod: 'phone',
      //   },
      // );
      console.log('Verification result:', result);
      if (!signIn) {
        // user = {...user, firebase_uid :credential.user.uid };
        await signUp({ ...user, firebase_uid: credential.user.uid });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleResendCode = async () => {
    // Add resend logic here
    console.log('Resending code...');
  };

  return (
    <View style={styles.container}>
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Image
            source={require('../assets/appIcon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>ادخل رمز التسجيل</Text>

      {/* Subtitle with phone number */}
      <Text style={styles.subtitle}>
        {/* تم إرسال رمز التحقق إلى {phone} */}
        تم إرسال رمز التحقق إلى {formatLebanesePhone(phone)}
      </Text>

      {/* OTP Input Container */}
      <View style={styles.otpContainer}>
        <OtpInput
          numberOfDigits={6}
          value={code}
          onTextChange={setCode}
          autoFocus
          theme={{
            containerStyle: [styles.otpView, { direction: 'ltr' }],
            inputFieldStyle: styles.otpInput,
            inputFieldHighlightedStyle: styles.otpInputFocused,
          }}
          textInputProps={{
            writingDirection: 'ltr',
            textAlign: 'center',
          }}
        />
      </View>

      {/* Verify Button */}
      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>تأكيد الرمز</Text>
      </TouchableOpacity>

      {/* Resend Code Section */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>لم تتلق الرمز؟</Text>
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendCode}
        >
          <Text style={styles.resendButtonText}>إعادة الإرسال</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoPlaceholder: {
    width: SIZES.logo.md,
    height: SIZES.logo.md,
    backgroundColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  logoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontFamily: FONT_FAMILIES.primary,
  },
  logo: {
    width: SIZES.logo.sm,
    height: SIZES.logo.sm,
  },
  title: {
    fontSize: FONT_SIZES.huge,
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xxl,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
  },
  otpContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  otpView: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
    color: COLORS.text.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
    textAlign: 'center',
    ...SHADOWS.sm,
  },
  otpInputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    ...SHADOWS.primary,
  },
  button: {
    width: '70%',
    height: SIZES.button.height,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.lg,
    ...SHADOWS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
  },
  resendContainer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  resendText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    fontFamily: FONT_FAMILIES.primary,
  },
  resendButton: {
    marginTop: SPACING.sm,
  },
  resendButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
    textDecorationLine: 'underline',
  },
});
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>ادخل رمز التسجيل</Text>
//       {/* <Text style={styles.subtitle}>Sent to {phone}</Text> */}

//       <OtpInput
//         numberOfDigits={6}
//         value={code}
//         onTextChange={setCode}
//         autoFocus
//         theme={{
//           containerStyle: styles.otpView,
//           inputFieldStyle: styles.otpInput,
//           inputFieldHighlightedStyle: styles.otpInputFocused,
//         }}
//       />
//       <TouchableOpacity style={styles.button} onPress={handleVerify}>
//         <Text style={styles.buttonText}>التسجيل</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// // Shared Styles
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f9fafd',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   title: {
//     fontSize: 28,
//     color: '#051d5f',
//     marginBottom: 20,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#051d5f',
//     marginBottom: 30,
//   },
//   phoneContainer: {
//     width: '100%',
//     height: 60,
//     marginBottom: 20,
//   },
//   textInput: {
//     paddingVertical: 0,
//   },
//   button: {
//     width: '100%',
//     height: 50,
//     backgroundColor: '#2e64e5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 10,
//     marginTop: 20,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   otpView: {
//     width: '80%',
//     height: 100,
//   },
//   otpInput: {
//     width: 40,
//     height: 45,
//     borderWidth: 1,
//     borderColor: '#ced4da',
//     borderRadius: 5,
//     color: '#000',
//   },
//   otpInputFocused: {
//     borderColor: '#2e64e5',
//   },
// });
