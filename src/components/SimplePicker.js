import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function SimplePicker({
  label,
  options,
  selectedValue,
  onValueChange,
  showLabel = true,
  labelKey,
  idKey,
  columns = 1,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={{ paddingHorizontal: 5, flex: 1, maxHeight: 80 }}>
      {showLabel && (
        <Text style={{ marginBottom: 5, textAlign: 'center' }}>{label}</Text>
      )}
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setVisible(true)}
      >
        <Text numberOfLines={1} style={{ textAlign: 'center' }}>
          {selectedValue || `اختر ${label}`}
        </Text>
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              numColumns={columns}
              data={options}
              keyExtractor={(item, index) => item?.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onValueChange(item);
                    setVisible(false);
                  }}
                >
                  <Text style={{ textAlign: 'center' }}>
                    {item?.[labelKey]}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    textAlign: 'right',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    margin: 32,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  option: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default SimplePicker;
