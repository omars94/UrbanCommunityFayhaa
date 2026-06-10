import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import auth from '@react-native-firebase/auth';
import HeaderSection from '../components/headerSection';
import { archiveUser } from '../api/userApi';
import { clearUser } from '../slices/userSlice';
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

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);
  const supportNumber =
    useSelector(state => state.data.constants?.deleteAccountSupportNb) || '';
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteAccount = async () => {
    if (!user?.id) {
      Alert.alert('خطأ', 'تعذر العثور على بيانات المستخدم');
      return;
    }

    setIsDeleting(true);
    try {
      await archiveUser(user.id);
      await auth().signOut();
      dispatch(clearUser());
      Alert.alert('تم', 'تم حذف حسابك بنجاح');
    } catch (error) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء حذف الحساب');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('تأكيد', 'هل أنت متأكد أنك تريد حذف حسابك؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: confirmDeleteAccount,
      },
    ]);
  };

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

        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>البريد الإلكتروني</Text>
          <Text style={styles.emailText}>{user?.email || '-'}</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="trash" size={22} color={COLORS.white} />
              <Text style={styles.actionButtonText}>احذف حسابي</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.contactText}>
          أو، إذا واجهت مشكلة يمكنك التواصل معنا
        </Text>

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
  emailContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emailLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text.secondary,
    fontFamily: FONT_FAMILIES.primary,
    marginBottom: SPACING.xs,
  },
  emailText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.primary,
    fontFamily: FONT_FAMILIES.primary,
    writingDirection: 'ltr',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.danger,
    marginBottom: SPACING.lg,
  },
  contactText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
    marginBottom: SPACING.lg,
    lineHeight: 24,
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
