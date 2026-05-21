import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import HeaderSection from '../components/headerSection';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILIES,
  BORDER_RADIUS,
  SIZES,
  SHADOWS,
} from '../constants';
import { formatLebanesePhone } from '../utils';

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const supportNumber =
    useSelector(state => state.data.constants?.deleteAccountSupportNb) || '';

  const formattedPhone = formatLebanesePhone(supportNumber?.toString());

  const handlePhonePress = () => {
    if (!supportNumber) {
      Alert.alert('خطأ', 'رقم الدعم غير متوفر حالياً');
      return;
    }
    Linking.openURL(`tel:${supportNumber}`).catch(() => {
      Alert.alert('خطأ', 'لا يمكن إجراء المكالمة');
    });
  };

  const handleWhatsAppPress = () => {
    if (!supportNumber) {
      Alert.alert('خطأ', 'رقم الدعم غير متوفر حالياً');
      return;
    }
    Linking.openURL(`https://wa.me/${supportNumber}`).catch(() => {
      Alert.alert('خطأ', 'لا يمكن فتح واتساب');
    });
  };

  return (
    <View style={styles.container}>
      <HeaderSection
        title="حذف الحساب"
        subtitle="تواصل معنا لحذف حسابك"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
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

        <Text style={styles.message}>لحذف حسابك، يرجى التواصل معنا</Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={handleWhatsAppPress}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={22} color={COLORS.white} />
            <Text style={styles.actionButtonText}>واتساب</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.phoneButton]}
            onPress={handlePhonePress}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={22} color={COLORS.white} />
            <Text style={[styles.actionButtonText, styles.phoneNumberText]}>
              {supportNumber || 'اتصل بنا'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  logoPlaceholder: {
    width: SIZES.logo.lg,
    height: SIZES.logo.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.circle || 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  logo: {
    width: SIZES.logo.md,
    height: SIZES.logo.md,
  },
  logoTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.bold,
    fontFamily: FONT_FAMILIES.primary,
  },
  logoSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
  },
  message: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
    marginBottom: SPACING.xl,
    lineHeight: 28,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    minWidth: 240,
    maxWidth: 300,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  phoneButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.white,
    fontFamily: FONT_FAMILIES.primary,
  },
  phoneNumberText: {
    writingDirection: 'ltr',
    textAlign: 'left',
  },
});
