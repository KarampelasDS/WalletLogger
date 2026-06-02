import { useEffect, useRef } from "react";
import { Animated, PanResponder, Easing, StyleSheet } from "react-native";

/**
 * Wraps a period-based screen (history, statistics) to:
 *  - detect horizontal swipes and call onPrev / onNext
 *  - play a smooth slide+fade entrance whenever `triggerKey` changes
 *
 * Direction comes from `directionRef` (-1 prev, +1 next), which the parent
 * sets in its navigation handler so taps and swipes animate the same way.
 * The animation uses the native driver, so it stays smooth even while the
 * JS thread is busy rendering a heavy month.
 */
export default function MonthSwiper({
  triggerKey,
  directionRef,
  onPrev,
  onNext,
  enabled = true,
  style,
  children,
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevKey = useRef(triggerKey);

  // Latest callbacks/flags in a ref so the (one-time) PanResponder never goes stale
  const live = useRef({ onPrev, onNext, enabled });
  live.current = { onPrev, onNext, enabled };

  useEffect(() => {
    if (prevKey.current === triggerKey) return;
    prevKey.current = triggerKey;
    const dir = (directionRef && directionRef.current) || 0;
    translateX.setValue(dir * 55);
    opacity.setValue(0.35);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [triggerKey]);

  const isHorizontal = (g) =>
    live.current.enabled &&
    Math.abs(g.dx) > 12 &&
    Math.abs(g.dx) > Math.abs(g.dy) * 1.2;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_e, g) => isHorizontal(g),
      onMoveShouldSetPanResponder: (_e, g) => isHorizontal(g),
      onPanResponderRelease: (_e, g) => {
        if (!live.current.enabled) return;
        if (g.dx <= -40) live.current.onNext && live.current.onNext();
        else if (g.dx >= 40) live.current.onPrev && live.current.onPrev();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.fill, style, { transform: [{ translateX }], opacity }]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: "100%" },
});
