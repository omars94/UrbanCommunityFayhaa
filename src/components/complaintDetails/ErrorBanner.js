import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  COLORS,
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from '../../constants';

/**
 * ErrorBanner
 * -----------
 * Small, reusable banner to surface transient screen-level errors.
 *
 * Props:
 * - message: string | null
 * - onDismiss: () => void
 */
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} accessibilityRole="button">
        <Text style={styles.dismiss}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    flex: 1,
    fontFamily: FONT_FAMILIES.primary,
  },
  dismiss: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    paddingLeft: SPACING.md,
    fontFamily: FONT_FAMILIES.primary,
  },
});

