import auth from '@react-native-firebase/auth';
import { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from 'react-native-paper';
import PhoneInput from 'react-native-phone-number-input';
import { useDispatch, useSelector } from 'react-redux';
import { setAreas } from '../slices/dataSlice';
import { useNavigation } from '@react-navigation/native';
import { ROUTE_NAMES } from '../constants';
import { requestOTP } from '../services/otpService';
import { checkIfUserExist } from '../api/authApi';

export default function SignIn() {
    const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
    const [error, setError] = useState('');
    const phoneInput = useRef(null);
    // const dispatch = useDispatch();
    const navigation = useNavigation();
    const recaptchaVerifier = useRef(null);
    const [phone, setPhone] = useState('');
    const [formattedValue, setFormattedValue] = useState('');
    const [confirm, setConfirm] = useState(null);
    const [user, setUser] = useState(null);


    const signIn = async () => {
        setError('');
        if (!phone) {
            setError('يرجى إدخال رقم الهاتف');
            return;
        }

        try {
            const exist = await checkIfUserExist(formattedValue); // isSignIn = true
            if (exist.inRTDB) {
                const confirmation = await requestOTP(formattedValue);
                //await auth().signInWithPhoneNumber(formattedValue);
                // setConfirm(confirmation);
                // setUser(exist.profile);
                console.log(exist);
                navigation.navigate(ROUTE_NAMES.OTP,
                    {
                        phone: formattedValue,
                        confirm: confirmation,
                        user: exist.profile,
                        signIn: true
                    });
            } else {
                setError('You must sign up before');
            }
        } catch (error) {
            console.error(error);
            setError('خطأ في إرسال رمز التحقق');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                تسجيل الدخول
            </Text>
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

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
                style={styles.button}
                mode="contained"
                onPress={signIn}
            >
                <Text style={styles.buttonText}>
                    دخول
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
