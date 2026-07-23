import { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, Pressable, FlatList,
  Animated, PanResponder, Dimensions, StyleSheet,
} from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DOUBLE_TAP_MS = 280;
const ZOOM_SCALE = 2.5;

// ─── One slide: image + double-tap-to-zoom + pan-when-zoomed ───────────────
// IMPORTANT: this view must NEVER claim the responder for a plain single-finger
// swipe, or it will steal the gesture from the parent FlatList and swiping
// between photos will silently stop working. It only claims responder when
// the image is already zoomed in (to pan it) — never otherwise.
function ZoomableImage({ uri, onRequestClose, onZoomChange }) {
  const [imgError, setImgError] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const currentScale = useRef(1);
  const currentTranslate = useRef({ x: 0, y: 0 });
  const lastTapTime = useRef(0);
  const tapTimeout = useRef(null);

  useEffect(() => () => { if (tapTimeout.current) clearTimeout(tapTimeout.current); }, []);

  const resetZoom = () => {
    currentScale.current = 1;
    currentTranslate.current = { x: 0, y: 0 };
    if (onZoomChange) onZoomChange(false);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
    ]).start();
  };

  const zoomIn = () => {
    currentScale.current = ZOOM_SCALE;
    if (onZoomChange) onZoomChange(true);
    Animated.spring(scale, { toValue: ZOOM_SCALE, useNativeDriver: true, friction: 7 }).start();
  };

  // Single vs. double tap, resolved with a short timer — decoupled entirely
  // from the pan/zoom responder so it never interferes with FlatList paging.
  const handlePress = () => {
    const now = Date.now();
    const sinceLastTap = now - lastTapTime.current;
    if (lastTapTime.current > 0 && sinceLastTap < DOUBLE_TAP_MS) {
      if (tapTimeout.current) { clearTimeout(tapTimeout.current); tapTimeout.current = null; }
      lastTapTime.current = 0;
      if (currentScale.current > 1) resetZoom(); else zoomIn();
      return;
    }
    lastTapTime.current = now;
    tapTimeout.current = setTimeout(() => {
      tapTimeout.current = null;
      lastTapTime.current = 0;
      if (currentScale.current <= 1 && onRequestClose) onRequestClose();
    }, DOUBLE_TAP_MS);
  };

  // Pan the image around ONLY once it's zoomed in — this responder is a no-op
  // (never claims) while at the default 1x scale, so single-finger swipes
  // always fall through to the parent FlatList untouched.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt) =>
        currentScale.current > 1 && evt.nativeEvent.touches.length === 1,
      onPanResponderMove: (evt, gesture) => {
        translateX.setValue(currentTranslate.current.x + gesture.dx);
        translateY.setValue(currentTranslate.current.y + gesture.dy);
      },
      onPanResponderRelease: (evt, gesture) => {
        currentTranslate.current = {
          x: currentTranslate.current.x + gesture.dx,
          y: currentTranslate.current.y + gesture.dy,
        };
      },
    })
  ).current;

  return (
    <View style={pv.slide} {...panResponder.panHandlers}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handlePress}>
        {imgError || !uri ? (
          <View style={pv.placeholder}>
            <Text style={pv.placeholderIcon}>🖼️</Text>
            <Text style={pv.placeholderText}>Photo unavailable</Text>
          </View>
        ) : (
          <Animated.Image
            source={{ uri }}
            style={[pv.image, { transform: [{ translateX }, { translateY }, { scale }] }]}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        )}
      </Pressable>
    </View>
  );
}

// ─── Fullscreen viewer ───────────────────────────────────────────────────────
export default function PhotoViewer({ visible, photos = [], initialIndex = 0, onClose }) {
  const items = (photos || [])
    .map(p => (typeof p === 'string' ? p : p?.uri))
    .filter(Boolean);

  const safeInitialIndex = Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1));
  const [index, setIndex] = useState(safeInitialIndex);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setIndex(safeInitialIndex);
      setScrollEnabled(true);
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      if (onClose) onClose();
    });
  };

  if (!visible || items.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      <Animated.View style={[pv.overlay, { opacity }]}>
        <FlatList
          data={items}
          horizontal
          pagingEnabled
          scrollEnabled={scrollEnabled}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={safeInitialIndex}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          keyExtractor={(_, i) => String(i)}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setIndex(newIndex);
          }}
          renderItem={({ item }) => (
            <ZoomableImage
              uri={item}
              onRequestClose={handleClose}
              onZoomChange={(zoomed) => setScrollEnabled(!zoomed)}
            />
          )}
        />

        <TouchableOpacity style={pv.closeBtn} onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={pv.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {items.length > 1 && (
          <View style={pv.counterWrap} pointerEvents="none">
            <Text style={pv.counterText}>{index + 1} / {items.length}</Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const pv = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000' },
  slide: { width: SCREEN_W, height: SCREEN_H, alignItems: 'center', justifyContent: 'center' },
  image: { width: SCREEN_W, height: SCREEN_H },
  placeholder: { width: SCREEN_W, height: SCREEN_H, alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 48, opacity: 0.4, marginBottom: 8 },
  placeholderText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  closeBtn: {
    position: 'absolute', top: 48, right: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  counterWrap: {
    position: 'absolute', top: 56, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
