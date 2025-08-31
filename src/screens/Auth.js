import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button} from 'react-native-paper';
import { useDispatch} from 'react-redux';
import { setAreas } from '../slices/dataSlice';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { fetchAreas } from '../api/areasApi';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, FONT_WEIGHTS, FONT_FAMILIES } from '../constants';

export default function AuthScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const dispatch = useDispatch();

  const getAreas = async () => {
    try {
      const areas = await fetchAreas();
      dispatch(setAreas(areas));
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  };
  useEffect(() => {
    getAreas();
  }, []);

  // const sendVerificationCode = async () => {
  //   setError('');
  //   try {
  //     debugger;

  //     const confirmation = await auth().signInWithPhoneNumber(formattedValue);
  //     console.log('Confirmation:', confirmation);
  //     setConfirm(confirmation);
  //   } catch (err) {
  //     setError('خطأ في إرسال رمز التحقق');
  //   }
  // };

  // const confirmCode = async () => {
  //   try {
  //     debugger;

  //     const userCredential = await confirm.confirm(verificationCode);
  //     if (mode === 'signup') {
  //       const profile = {
  //         id: userCredential.user.uid,
  //         phone: formattedValue,
  //         full_name: fullName,
  //         date_of_birth: dateOfBirth,
  //         role: 'citizen',
  //         profile_complete: true,
  //         area_id: area?.id,
  //       };
  //       const db = firebase.firestore();
  //       await db.collection('profiles').add(profile);
  //     }

  //     // dispatch(
  //     //   setUser({
  //     //     access_token: await userCredential.user.getIdToken(),
  //     //     ...userCredential.user,
  //     //   }),
  //     // );
  //   } catch (err) {
  //     setError('رمز التحقق غير صحيح');
  //   }
  // };

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <Button
          style={[
            styles.toggleButton,
            mode === 'signin' && styles.toggleActive,
          ]}
          onPress={() => setMode('signin')}
        >
          <Text
            style={[
              styles.toggleText,
              mode === 'signin' && styles.toggleTextActive,
            ]}
          >
            تسجيل الدخول
          </Text>
        </Button>
        <Button
          style={[
            styles.toggleButton,
            mode === 'signup' && styles.toggleActive,
          ]}
          onPress={() => setMode('signup')}
        >
          <Text
            style={[
              styles.toggleText,
              mode === 'signup' && styles.toggleTextActive,
            ]}
          >
            إنشاء حساب
          </Text>
        </Button>
      </View>

      {mode === 'signup' && (<SignUp />)}

      {mode === 'signin' && (<SignIn />)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // justifyContent: 'center',
    // alignItems: 'center',
    padding: SPACING.huge,
    marginTop: SPACING.xxl
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  toggleText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
