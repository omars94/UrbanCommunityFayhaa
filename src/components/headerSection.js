// components/HeaderSection.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from '../constants/index.ts';

const HeaderSection = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  customStyles = {},
}) => {
  return (
    <View style={[styles.header, customStyles.header]}>
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
      <Text style={[styles.headerTitle, customStyles.title]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.headerSubtitle, customStyles.subtitle]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.huge,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: SPACING.huge,
    left: SPACING.lg,
    zIndex: 1,
    padding: SPACING.xs,
  },
});

export default HeaderSection;
