import { useRef, useState } from 'react';
import { Animated } from 'react-native';

const THRESHOLD = 10;
const DEFAULT_HEADER_HEIGHT = 100;
const ANIM_MS = 220;

// Instagram/Twitter-style auto-hide header: hides on scroll-down past a small
// threshold (avoids flicker on tiny jitters), reveals on any real scroll-up,
// and is forced visible at the very top of the content.
export function useAutoHideHeader() {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);

  const lastY = useRef(0);
  const hidden = useRef(false);
  const accumulated = useRef(0);
  const heightRef = useRef(DEFAULT_HEADER_HEIGHT);

  const showHeader = () => {
    if (!hidden.current) return;
    hidden.current = false;
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: ANIM_MS, useNativeDriver: true }),
    ]).start();
  };

  const hideHeader = () => {
    if (hidden.current) return;
    hidden.current = true;
    Animated.parallel([
      Animated.timing(translateY, { toValue: -heightRef.current, duration: ANIM_MS, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: ANIM_MS, useNativeDriver: true }),
    ]).start();
  };

  const onScroll = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastY.current;
    lastY.current = y;

    // Always visible at (or above, during elastic overscroll) the top.
    if (y <= 0) {
      accumulated.current = 0;
      showHeader();
      return;
    }

    // Accumulate same-direction movement so a slow deliberate scroll still
    // crosses the threshold, while a quick back-and-forth jitter cancels out.
    if ((delta > 0 && accumulated.current < 0) || (delta < 0 && accumulated.current > 0)) {
      accumulated.current = 0;
    }
    accumulated.current += delta;

    if (accumulated.current > THRESHOLD) {
      hideHeader();
      accumulated.current = 0;
    } else if (accumulated.current < -THRESHOLD) {
      showHeader();
      accumulated.current = 0;
    }
  };

  const onHeaderLayout = (e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0 && h !== heightRef.current) {
      heightRef.current = h;
      setHeaderHeight(h);
    }
  };

  return {
    headerAnimatedStyle: { transform: [{ translateY }], opacity },
    headerHeight,
    onHeaderLayout,
    onScroll,
  };
}
