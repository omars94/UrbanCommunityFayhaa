import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useSelector } from 'react-redux';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILIES,
  BORDER_RADIUS,
} from '../constants';

export default function AccountDeletedModal({ visible, onClose }) {
  const supportNumber =
    useSelector(state => state.data.constants?.deleteAccountSupportNb) || '';

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>تم حذف هذا الحساب</Text>
          <Text style={styles.subtitle}>يمكنك التواصل معنا</Text>

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

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>حسناً</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.danger,
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text?.secondary || COLORS.gray?.[600],
    textAlign: 'center',
    fontFamily: FONT_FAMILIES.primary,
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
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
    width: '100%',
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
  closeButton: {
    backgroundColor: COLORS.gray?.[200] || '#e5e7eb',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text?.primary || COLORS.black,
    fontFamily: FONT_FAMILIES.primary,
  },
});
