import { StyleSheet, Text, type TextStyle } from "react-native";

import { colorFor } from "@/lib/theme";
import { directionOf, formatSigned } from "@/lib/format";

interface DeltaProps {
  change: number;
  changePercent: number;
  style?: TextStyle;
}

/** Arrow and sign carry the meaning as well as the colour. */
export function Delta({ change, changePercent, style }: DeltaProps) {
  const direction = directionOf(change);
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "–";

  return (
    <Text style={[styles.text, { color: colorFor(direction) }, style]}>
      {arrow} {formatSigned(change, direction)} (
      {formatSigned(changePercent, direction)}%)
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 11,
    // Stops the row twitching sideways as digits change width.
    fontVariant: ["tabular-nums"],
  },
});
