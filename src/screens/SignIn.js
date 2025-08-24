import { useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from 'react-native-paper';
import PhoneInput from 'react-native-phone-number-input';
import { useNavigation } from '@react-navigation/native';
import { ROUTE_NAMES } from '../constants';
import { requestOTP } from '../services/otpService';
import { checkIfUserExist } from '../api/authApi';
import { SIZES, COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_SIZES, FONT_WEIGHTS, FONT_FAMILIES } from '../constants';


export default function SignIn() {
    const [error, setError] = useState('');
    const phoneInput = useRef(null);
    const navigation = useNavigation();
    const [phone, setPhone] = useState('');
    const [formattedValue, setFormattedValue] = useState('');

    const signIn = async () => {
        setError('');
        if (!phone) {
            setError('يرجى إدخال رقم الهاتف');
            return;
        }

        try {
            const exist = await checkIfUserExist(formattedValue);
            if (exist.inRTDB) {
                const confirmation = await requestOTP(formattedValue);
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
                countryPickerButtonStyle={styles.countryPickerButton}
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
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    logoPlaceholder: {
        width: SIZES.logo.lg,
        height: SIZES.logo.lg,
        backgroundColor: COLORS.gray[200],
        borderRadius: BORDER_RADIUS.circle,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
    },
    logoText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text.secondary,
        fontFamily: FONT_FAMILIES.primary,
    },
    title: {
        fontSize: FONT_SIZES.huge,
        color: COLORS.primary,
        marginBottom: SPACING.xl,
        textAlign: 'center',
        fontWeight: FONT_WEIGHTS.bold,
        fontFamily: FONT_FAMILIES.primary,
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
