// components/HeaderSection.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILIES
} from '../constants';

const HeaderSection = ({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  customStyles = {}
}) => {
  return (
    <View style={[styles.header, customStyles.header]}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackPress}
        >
          <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
      <Text style={[styles.headerTitle, customStyles.title]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.headerSubtitle, customStyles.subtitle]}>{subtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // header: {
  //   backgroundColor: COLORS.primary,
  //   padding: SPACING.lg,
  //   paddingTop: SPACING.xxl,
  // },
  // headerTitle: {
  //   color: COLORS.white,
  //   fontSize: FONT_SIZES.xxxl,
  //   fontWeight: FONT_WEIGHTS.bold,
  //   fontFamily: FONT_FAMILIES.arabic,
  //   textAlign: 'center',
  //   marginBottom: SPACING.xs,
  // },
  // headerSubtitle: {
  //   color: COLORS.white,
  //   fontSize: FONT_SIZES.md,
  //   fontFamily: FONT_FAMILIES.arabic,
  //   textAlign: 'center',
  //   opacity: 0.9,
  // },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    paddingTop: SPACING.xxxl,
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
    top: SPACING.xxl + 20,
    left: SPACING.lg,
    zIndex: 1,
    padding: SPACING.xs,
  },
});

export default HeaderSection;