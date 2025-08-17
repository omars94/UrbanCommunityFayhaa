// File: app/otp.js (OTP Verification Screen)
import React, { useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { routeNames } from '../constants';
import auth from '@react-native-firebase/auth';
import { signUp } from '../api/authApi';

export default function OTPScreen() {
  const { params: { phone, confirm, user, signIn } } = useRoute();
  const navigation = useNavigation();
  // const recaptchaVerifier = useRef(null);

  const [code, setCode] = useState('');

  const handleVerify = async () => {
    try {
      console.log("Code value:", code, typeof code);
      if (!confirm) {
        console.log('No confirmation object provided to OTP screen');
        return;
      }
      const credential = await confirm.confirm(code);
      // const userCredential = await auth().signInWithCredential(credential);
      // console.log('signed in!', userCredential);
      if (!signIn) {
        // user = {...user, firebase_uid :credential.user.uid };
        await signUp({ ...user, firebase_uid: credential.user.uid });
      }

    } catch (e) {
      console.log(e);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>ادخل رمز التسجيل</Text>
      {/* <Text style={styles.subtitle}>Sent to {phone}</Text> */}

      <OtpInput
        numberOfDigits={6}
        value={code}
        onTextChange={setCode}
        autoFocus
        theme={{
          containerStyle: styles.otpView,
          inputFieldStyle: styles.otpInput,
          inputFieldHighlightedStyle: styles.otpInputFocused,
        }}
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>التسجيل</Text>
      </TouchableOpacity>
    </View>
  );
}

// Shared Styles
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
  },
  subtitle: {
    fontSize: 16,
    color: '#051d5f',
    marginBottom: 30,
  },
  phoneContainer: {
    width: '100%',
    height: 60,
    marginBottom: 20,
  },
  textInput: {
    paddingVertical: 0,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2e64e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  otpView: {
    width: '80%',
    height: 100,
  },
  otpInput: {
    width: 40,
    height: 45,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 5,
    color: '#000',
  },
  otpInputFocused: {
    borderColor: '#2e64e5',
  },
});
