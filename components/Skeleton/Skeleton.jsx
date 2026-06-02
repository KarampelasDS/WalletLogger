import { useEffect, useRef } from "react";
import { Animated } from "react-native";

/** A single pulsing placeholder block. */
export default function Skeleton({ width = "100%", height = 16, radius = 6, style }) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: "#3a3c52", opacity },
        style,
      ]}
    />
  );
}
