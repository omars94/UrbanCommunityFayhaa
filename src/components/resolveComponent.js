import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SHADOWS,
  Z_INDEX,
} from '../constants/index';

const { width: screenWidth } = Dimensions.get('window');

export const ImageResolutionComponent = ({ 
  capturedImageUri, 
  onConfirm, 
  onCancel, 
  isVisible = true 
}) => {

  const handleConfirmImage = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

    return (
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.title}>تأكيد حل الشكوى</Text>
              <View style={styles.spacer} />
            </View>

            <View style={styles.content}>
              <Text style={styles.confirmText}>هل تريد تأكيد حل الشكوى بهذه الصورة؟</Text>
              
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: capturedImageUri }}
                  style={styles.capturedImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>لا</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmImage}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmButtonText}>نعم، تأكيد</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    width: '100%',
    maxWidth: screenWidth - (SPACING.xl * 2),
    padding: SPACING.xxl,
    elevation: 10, // Android shadow
    shadowColor: COLORS.black, // iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.circle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  spacer: {
    width: 36,
    height: 36,
  },
  content: {
    alignItems: 'center',
  },
  confirmText: {
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.normal,
    textAlign: 'center',
  },
  imageContainer: {
    backgroundColor: COLORS.gray[100],
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    width: '100%',
    alignItems: 'center',
  },
  capturedImage: {
    width: 280,
    height: 200,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonContainer: {
    flexDirection: 'row-reverse', // RTL
    width: '100%',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray[500],
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
  },
  successIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#dcfce7',
    borderRadius: BORDER_RADIUS.circle,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  successIconText: {
    fontSize: 32,
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  successTextContainer: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.normal,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    gap: SPACING.lg,
  },
  input: {
    width: '100%',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.primary,
    fontWeight: FONT_WEIGHTS.normal,
    backgroundColor: COLORS.white,
  },
  submitButton: {
    width: '100%',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
  },
  disabledButton: {
    backgroundColor: COLORS.text.disabled,
  },
  disabledButtonText: {
    color: COLORS.white,
  },
});

export default ImageResolutionComponent;