import DateTimePicker from '@react-native-community/datetimepicker';
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
import PhoneInput from 'react-native-phone-number-input';
import { useDispatch, useSelector } from 'react-redux';
import SimplePicker from '../components/SimplePicker';
import { setAreas } from '../slices/dataSlice';
import { useNavigation } from '@react-navigation/native';
import { ROLES, ROUTE_NAMES } from '../constants';
import { fetchAreas } from '../api/areasApi';
import { requestOTP } from '../services/otpService';
import { checkIfUserExist } from '../api/authApi';

export default function SignUp() {
  // const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [error, setError] = useState('');
  const phoneInput = useRef(null);
  // const dispatch = useDispatch();
  const navigation = useNavigation();
  // const recaptchaVerifier = useRef(null);
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [formattedValue, setFormattedValue] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // const [confirm, setConfirm] = useState(null);
  // const [user, setUser] = useState(null);
  // const [verificationCode, setVerificationCode] = useState('');
  const { areas } = useSelector(state => state.data);

  const signUp = async () => {
    setError('');
    if (!dateOfBirth || !fullName || !phone) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    try {
      const exist = await checkIfUserExist(phone); // isSignIn = false
      if (!exist.inRTDB) {
        const confirmation = await requestOTP(formattedValue); //+961...
        //await auth().signInWithPhoneNumber(formattedValue);
        console.log(confirmation);
        // setConfirm(confirmation);
        // setUser(exist.profile);
        // const signIn = false;
        navigation.navigate(ROUTE_NAMES.OTP,
          {
            phone: formattedValue,
            confirm: confirmation,
            user: {
              phone_number: formattedValue,
              full_name: fullName,
              date_of_birth: dateOfBirth,
              area_id: area?.id,
              role: ROLES.CITIZEN,
              invite_role: null
            },
            signIn: false
          });
      } else {
        setError('an account already exist with this phone number');
      }
    } catch (error) {
      console.error(error);
      setError('خطأ في إرسال رمز التحقق');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        إنشاء حساب
      </Text>
      <TextInput
        label="الاسم الكامل"
        value={fullName}
        style={styles.input}
        onChangeText={setFullName}
        mode="outlined"
      />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 15,
        }}
      >
        <SimplePicker
          label="المنطقة"
          columns={3}
          showLabel={false}
          options={areas}
          labelKey={'name_ar'}
          selectedValue={area?.name_ar}
          onValueChange={setArea}
        />
        {showDatePicker || Platform.OS == 'ios' ? (
          <View
            style={{
              borderRadius: 10,
              alignSelf: 'center',
              flex: 1,
            }}
          >
            <DateTimePicker
              value={
                dateOfBirth ? new Date(dateOfBirth) : new Date(2015, 0, 1)
              }
              mode="date"
              locale="ar"
              display="compact"
              style={{
                flex: 1,
                alignSelf: 'center',
                borderRadius: 10,
              }}
              textColor="#ecf0f1"
              onChange={(event, selectedDate) => {
                const { type } = event;
                console.log(type);
                if (
                  type == 'dismissed' ||
                  (Platform.OS == 'android' && type == 'set')
                ) {
                  setShowDatePicker(false);
                }
                if (selectedDate) setDateOfBirth(selectedDate);
              }}
              maximumDate={new Date()}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(prev => !prev)}
          >
            <Text style={styles.datePickerButtonText}>
              {dateOfBirth
                ? `تاريخ الميلاد: ${new Date(
                  dateOfBirth,
                ).toLocaleDateString('ar')}`
                : 'اختر تاريخ الميلاد'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <PhoneInput
        ref={phoneInput}
        defaultValue={phone}
        defaultCode="LB"
        placeholder="رقم الهاتف"
        layout="first"
        onChangeText={setPhone}
        onChangeFormattedText={setFormattedValue}
        withShadow
        containerStyle={[styles.phoneContainer]}
        textContainerStyle={styles.textInput}
        textInputStyle={styles.textInput}
        countryPickerProps={{ renderFlagButton: false }}
        countryPickerButtonStyle={styles.countryPickerButton} // <-- Add this line
      />
      {/* {confirm ? (
        <TextInput
          label="رمز التحقق"
          value={verificationCode}
          style={styles.input}
          onChangeText={setVerificationCode}
          mode="outlined"
          keyboardType="number-pad"
        />
      ) : null} */}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        style={styles.button}
        mode="contained"
        onPress={signUp}
      >
        <Text style={styles.buttonText}>
          تسجيل
        </Text>
      </Button>
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
