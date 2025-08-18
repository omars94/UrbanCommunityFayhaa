import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const CustomAlert = ({ visible, title, message, buttons = [], onClose }) => {
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    container: {
      backgroundColor: COLORS.white,
      borderRadius: 12,
      padding: 20,
      width: '90%',
      maxWidth: 300,
      elevation: 10,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.black,
      marginBottom: 10,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: COLORS.black,
      lineHeight: 22,
      marginBottom: 20,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 12,
    },
    singleButtonContainer: {
      width: '100%',
      alignItems: 'center',
    },
    button: {
      backgroundColor: COLORS.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      height: 48,
      minWidth: 120,
    },
    fullWidthButton: {
      width: '80%',
    },
    halfWidthButton: {
      width: '48%',
    },
    cancelButton: {
      backgroundColor: COLORS.gray[200],
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    cancelButtonText: {
      color: COLORS.black,
    },
    disabledButton: {
      opacity: 0.6,
    },
  });

  const renderButtons = () => {
    if (buttons.length === 0) {
      return (
        <View style={styles.singleButtonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.fullWidthButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>حسناً</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (buttons.length === 1) {
      return (
        <View style={styles.singleButtonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.fullWidthButton]}
            onPress={() => {
              if (buttons[0].onPress) buttons[0].onPress();
              onClose();
            }}
          >
            <Text style={styles.buttonText}>{buttons[0].text}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.buttonContainer}>
        {buttons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.button,
              styles.halfWidthButton,
              button.style === 'cancel' && styles.cancelButton
            ]}
            onPress={() => {
              if (button.onPress) button.onPress();
              onClose();
            }}
          >
            <Text
              style={[
                styles.buttonText,
                button.style === 'cancel' && styles.cancelButtonText,
              ]}
            >
              {button.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {title && <Text style={styles.title}>{title}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.buttonContainer}>{renderButtons()}</View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;