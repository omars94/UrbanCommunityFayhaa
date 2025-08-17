import { useEffect, useRef, useState } from 'react';
import {
  I18nManager,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { setAreas } from '../slices/dataSlice';
import { useNavigation } from '@react-navigation/native';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { fetchAreas } from '../api/areasApi';

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
    backgroundColor: '#f9fafd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#051d5f',
    marginBottom: 20,
    textAlign: 'center',
  },
  phoneContainer: {
    width: '100%',
    height: 60,
    marginBottom: 20,
  },
  textInput: {
    paddingVertical: 0,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    width: '100%',
    marginBottom: 16,
    textAlign: 'left',
  },
  button: {
    width: '50%',
    height: 50,
    backgroundColor: '#2e64e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  countryPickerButton: {
    width: 60, // or adjust as needed
    justifyContent: 'center',
  },
  error: {
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#e9ecef',
    borderRadius: 20,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    fontSize: 16,
    color: '#888',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#2e64e5',
  },
  datePickerButton: {
    height: 40,
    flex: 1,
    alignSelf: 'center',

    backgroundColor: '#f1f3f6',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  datePickerButtonText: {
    color: '#333',
    fontSize: 16,
  },
});
