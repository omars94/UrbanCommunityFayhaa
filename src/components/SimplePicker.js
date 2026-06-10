import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants';
import { FONT_SIZES } from '../constants';
import { FONT_WEIGHTS } from '../constants';
function SimplePicker({
  label,
  options,
  selectedValue,
  onValueChange,
  showLabel = true,
  labelKey,
  idKey,
  columns = 1,
  style = {},
  wrapperStyle,
  buttonStyle,
}) {
  const [visible, setVisible] = useState(false);
  const isSelected = Boolean(selectedValue);

  return (
    // <View style={{ paddingHorizontal: 5, flex: 1, maxHeight: 120 }}>
    <View style={[styles.rootWrapper, wrapperStyle, style]}>
      {showLabel && (
        <Text
          style={{
            marginBottom: 5,
            fontSize: FONT_SIZES.md,
            fontWeight: FONT_WEIGHTS.semibold,
            color: COLORS.text.primary,
          }}
        >
          {label}
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.pickerButton,
          isSelected && styles.pickerButtonSelected,
          buttonStyle,
        ]}
        onPress={() => setVisible(true)}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.pickerText,
            isSelected ? styles.pickerTextSelected : styles.pickerTextPlaceholder,
          ]}
        >
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
  rootWrapper: {
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  pickerButton: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  pickerButtonSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  pickerText: {
    textAlign: 'center',
  },
  pickerTextPlaceholder: {
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHTS.normal,
  },
  pickerTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: FONT_WEIGHTS.semibold,
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
