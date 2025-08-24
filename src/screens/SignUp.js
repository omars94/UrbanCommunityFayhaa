import DateTimePicker from '@react-native-community/datetimepicker';
import { useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import PhoneInput from 'react-native-phone-number-input';
import { useSelector } from 'react-redux';
import SimplePicker from '../components/SimplePicker';
import { useNavigation } from '@react-navigation/native';
import { ROLES, ROUTE_NAMES } from '../constants';
import { requestOTP } from '../services/otpService';
import { checkIfUserExist } from '../api/authApi';
import { SIZES, COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, FONT_WEIGHTS, FONT_FAMILIES } from '../constants';

export default function SignUp() {
  const [error, setError] = useState('');
  const phoneInput = useRef(null);
  const navigation = useNavigation();
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState(null);
  const [fullName, setFullName] = useState(null);
  const [formattedValue, setFormattedValue] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { areas } = useSelector(state => state.data);

  const signUp = async () => {
    setError('');
    if (!dateOfBirth || !fullName || !phone) {
      setError('يرجى ملء جميع الحقول');
      return;
    }
    try {
      const exist = await checkIfUserExist(phone);
      if (!exist.inRTDB) {
        const confirmation = await requestOTP(formattedValue); //+961...
        console.log(confirmation);
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
        contentStyle={styles.inputContentStyle}
        outlineStyle={styles.inputOutlineStyle}
        onChangeText={setFullName}
        mode="outlined"
        activeOutlineColor={COLORS.primary}
        outlineColor={COLORS.gray[300]}
        theme={{
          colors: {
            primary: COLORS.primary,
            outline: COLORS.gray[300],
            onSurfaceVariant: COLORS.text.secondary,
          },
          width: '100%'
        }}
      />
  
      {/* Area Picker and Date Picker Row */}
      <View style={styles.pickerDateRow}>
        <View style={{ flex: 1 }}>
          <SimplePicker
            label="المنطقة"
            columns={1}
            showLabel={false}
            options={areas}
            labelKey={'name_ar'}
            selectedValue={area?.name_ar}
            onValueChange={setArea}
          />
        </View>
        
        {showDatePicker || Platform.OS == 'ios' ? (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={
                dateOfBirth ? new Date(dateOfBirth) : new Date(2015, 0, 1)
              }
              mode="date"
              locale="ar"
              display="compact"
              style={{
                width: '100%',
                height: '100%',
              }}
              textColor={COLORS.text.primary}
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
        countryPickerButtonStyle={styles.countryPickerButton}
      />
  
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
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.huge,
    color: COLORS.primary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
  },
  input: {
    height: SIZES.input.height,
    width: '100%',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  phoneContainer: {
    width: '100%',
    height: SIZES.input.height + 10,
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  textInput: {
    paddingVertical: 0,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILIES.primary,
  },
  pickerDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    width: '100%',
  },
  datePickerContainer: {
    borderRadius: BORDER_RADIUS.md,
    flex: 1,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.white,
    height: SIZES.input.height,
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  datePickerButton: {
    height: SIZES.input.height,
    flex: 1,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    ...SHADOWS.sm,
  },
  datePickerButtonText: {
    color: COLORS.text.primary,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILIES.primary,
    textAlign: 'center',
  },
  countryPickerButton: {
    width: 60,
    justifyContent: 'center',
  },
  button: {
    width: '70%',
    height: SIZES.button.height,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
    ...SHADOWS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
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