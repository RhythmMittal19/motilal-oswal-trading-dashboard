import { useEffect, useRef } from "react";
import { Animated, StyleSheet, type TextStyle } from "react-native";

import type { Direction } from "@/lib/format";
import { formatPrice } from "@/lib/format";
import { theme } from "@/lib/theme";

interface LivePriceProps {
  value: number;
  tick?: Direction;
  /** Changes every poll, which is what re-triggers the flash. */
  tickKey: string;
  style?: TextStyle;
}

/**
 * React Native has no CSS keyframes, so the flash is an Animated value driven
 * back to zero on each tick. `useNativeDriver` is false because background
 * colour is not one of the properties the native driver can animate.
 */
export function LivePrice({ value, tick, tickKey, style }: LivePriceProps) {
  const flash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!tick || tick === "flat") return;

    flash.setValue(1);
    const animation = Animated.timing(flash, {
      toValue: 0,
      duration: 600,
      useNativeDriver: false,
    });
    animation.start();

    return () => animation.stop();
  }, [tickKey, tick, flash]);

  const backgroundColor = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [
      "rgba(0,0,0,0)",
      tick === "down" ? "rgba(246,70,93,0.22)" : "rgba(14,203,129,0.22)",
    ],
  });

  return (
    <Animated.Text style={[styles.text, { backgroundColor }, style]}>
      {formatPrice(value)}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: theme.ink,
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    paddingHorizontal: 3,
    borderRadius: 3,
    overflow: "hidden",
  },
});
