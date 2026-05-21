import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { setAreas } from '../slices/dataSlice';
import SignIn from './SignIn';
import SignUp from './SignUp';
import { fetchAreas } from '../api/areasApi';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILIES,
} from '../constants';
import LoadingOverlay from '../components/LoadingIndicator';

const SPRING = { damping: 22, stiffness: 220, mass: 0.8 };

export default function AuthScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [loadingVisible, setLoadingVisible] = useState(false);
  const halfWidth = useSharedValue(0);
  const translateX = useSharedValue(0);
  // Stores measured layouts of each toggle button. Using refs keeps this
  // independent of render cycles and avoids stale closures inside onLayout.
  const layoutsRef = useRef({ signin: null, signup: null });
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const dispatch = useDispatch();

  const pillStyle = useAnimatedStyle(() => ({
    width: halfWidth.value,
    transform: [{ translateX: translateX.value }],
  }));

  // Computes the pill's translateX from measured button positions so the
  // animation works under both LTR and RTL without relying on
  // I18nManager.isRTL, which is unreliable on the first iOS launch after a
  // fresh install (e.g. via TestFlight) because forceRTL(true) does not
  // take effect until the next app launch.
  const computePillX = useCallback(targetMode => {
    const { signin, signup } = layoutsRef.current;
    if (!signin || !signup) return null;
    // Detect rendered layout direction directly from measurements. In RTL the
    // first child (signin) renders to the right of the second child (signup).
    const isReverseRow = signin.x > signup.x;
    // React Native auto-swaps `left: 0` -> `right: 0` for absolute children
    // in RTL, so the pill's untranslated left edge is at containerWidth
    // - pillWidth = signin.width. In LTR it stays at 0.
    const pillBaseX = isReverseRow ? signin.width : 0;
    const targetButtonX = targetMode === 'signin' ? signin.x : signup.x;
    return targetButtonX - pillBaseX;
  }, []);

  const applyPill = useCallback(
    animated => {
      const target = computePillX(modeRef.current);
      if (target === null) return;
      halfWidth.value = layoutsRef.current.signin.width;
      if (animated) {
        translateX.value = withSpring(target, SPRING);
      } else {
        translateX.value = target;
      }
    },
    [computePillX, halfWidth, translateX],
  );

  const onButtonLayout = key => e => {
    const { x, width } = e.nativeEvent.layout;
    const prev = layoutsRef.current[key];
    if (prev && prev.x === x && prev.width === width) return;
    const isFirstMeasure = !prev;
    layoutsRef.current[key] = { x, width };
    applyPill(!isFirstMeasure);
  };

  useEffect(() => {
    applyPill(true);
  }, [mode, applyPill]);

  const getAreas = useCallback(async () => {
    try {
      const areas = await fetchAreas();
      dispatch(setAreas(areas));
    } catch (error) {
      console.error('Error fetching areas:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    getAreas();
  }, [getAreas]);

  const toggleLoading = val => {
    setLoadingVisible(val);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <Animated.View style={[styles.slidingPill, pillStyle]} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'signin' }}
          style={({ pressed }) => [
            styles.toggleButton,
            pressed && styles.togglePressed,
          ]}
          onLayout={onButtonLayout('signin')}
          onPress={() => setMode('signin')}
        >
          <Text
            adjustsFontSizeToFit
            style={[
              styles.toggleText,
              mode === 'signin' && styles.toggleTextActive,
            ]}
          >
            تسجيل الدخول
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'signup' }}
          style={({ pressed }) => [
            styles.toggleButton,
            pressed && styles.togglePressed,
          ]}
          onLayout={onButtonLayout('signup')}
          onPress={() => setMode('signup')}
        >
          <Text
            adjustsFontSizeToFit
            style={[
              styles.toggleText,
              mode === 'signup' && styles.toggleTextActive,
            ]}
          >
            إنشاء حساب
          </Text>
        </Pressable>
      </View>

      {mode === 'signup' && (
        <SignUp toggleLoading={val => toggleLoading(val)} />
      )}

      {mode === 'signin' && (
        <SignIn toggleLoading={val => toggleLoading(val)} />
      )}
      <LoadingOverlay visible={loadingVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // justifyContent: 'center',
    // alignItems: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xxl,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray[200],
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.sm,
  },
  slidingPill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  togglePressed: {
    opacity: 0.85,
  },
  toggleText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text.secondary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontFamily: FONT_FAMILIES.primary,
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
