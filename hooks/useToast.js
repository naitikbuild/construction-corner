import { useCallback, useRef, useState } from 'react';
import { Animated } from 'react-native';

const VISIBLE_MS = 1800;
const FADE_MS = 200;

// Minimal cross-platform "brief toast" — no dismiss action needed, fades in,
// holds, then fades itself out. RN has no built-in cross-platform toast
// (ToastAndroid is Android-only, Alert requires a manual dismiss tap), so
// this is a small self-contained replacement driven by a single opacity value.
export function useToast() {
  const [message, setMessage] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() => setMessage(''));
    }, VISIBLE_MS);
  }, [opacity]);

  return { toastMessage: message, toastOpacity: opacity, showToast };
}
