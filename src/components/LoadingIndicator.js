import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

const LoadingOverlay = ({ visible = false }) => {
  return (
    <Modal
      transparent
      animationIn={'fadeIn'}
      animationOut={'fadeOut'}
      isVisible={visible}
    >
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    </Modal>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
