import { useCallback, useEffect, useRef, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
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

/** LTR: signin left (0), signup right (+half). RTL row mirrors children so signin is right → offset +half. */
function pillTranslateX(mode, halfWidth, not_rtl) {
  if (halfWidth <= 0) return 0;
  const signinX = not_rtl ? halfWidth : 0;
  const signupX = not_rtl ? 0 : halfWidth;
  return mode === 'signin' ? signinX : signupX;
}

export default function AuthScreen() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [loadingVisible, setLoadingVisible] = useState(false);
  const [segmentReady, setSegmentReady] = useState(false);
  const halfWidth = useSharedValue(0);
  const translateX = useSharedValue(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const dispatch = useDispatch();

  const pillStyle = useAnimatedStyle(() => ({
    width: halfWidth.value,
    transform: [{ translateX: -translateX.value }],
  }));

  const not_rtl = !I18nManager.isRTL;

  const onToggleLayout = e => {
    const half = e.nativeEvent.layout.width / 2;
    halfWidth.value = half;
    setSegmentReady(true);
    translateX.value = withSpring(
      pillTranslateX(modeRef.current, half, not_rtl),
      SPRING,
    );
  };

  useEffect(() => {
    if (!segmentReady) return;
    translateX.value = withSpring(
      pillTranslateX(mode, halfWidth.value, not_rtl),
      SPRING,
    );
    // halfWidth / translateX are Reanimated shared values (stable); omit from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, segmentReady]);

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

  const toggleLoading = (val) => {
    setLoadingVisible(val);
  };
  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer} onLayout={onToggleLayout}>
        <Animated.View style={[styles.slidingPill, pillStyle]} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'signin' }}
          style={({ pressed }) => [
            styles.toggleButton,
            pressed && styles.togglePressed,
          ]}
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

      {mode === 'signup' && <SignUp toggleLoading={(val)=>toggleLoading(val)} />}

      {mode === 'signin' && <SignIn toggleLoading={(val)=>toggleLoading(val)} />}
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
