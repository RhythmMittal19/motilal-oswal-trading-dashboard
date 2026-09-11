import Svg, { Defs, LinearGradient, Line, Path, Stop } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";

import type { Direction } from "@/lib/format";
import { colorFor, theme } from "@/lib/theme";
import type { PricePoint } from "@/types/market";

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 180;
const PADDING_Y = 10;

interface IntradayChartProps {
  points: PricePoint[];
  referencePrice: number;
  direction: Direction;
}

/**
 * The same scaling maths as the web chart. Only the element names differ —
 * react-native-svg mirrors the SVG API, so nothing had to be re-derived.
 */
export function IntradayChart({
  points,
  referencePrice,
  direction,
}: IntradayChartProps) {
  if (points.length < 2) return null;

  const prices = points.map((point) => point.price);
  const min = Math.min(...prices, referencePrice);
  const max = Math.max(...prices, referencePrice);
  const span = max - min || 1;

  const xAt = (index: number) => (index / (points.length - 1)) * VIEW_WIDTH;
  const yAt = (price: number) =>
    PADDING_Y + (1 - (price - min) / span) * (VIEW_HEIGHT - PADDING_Y * 2);

  const line = points
    .map(
      (point, i) =>
        `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)},${yAt(point.price).toFixed(2)}`,
    )
    .join(" ");

  const area = `${line} L${VIEW_WIDTH},${VIEW_HEIGHT} L0,${VIEW_HEIGHT} Z`;
  const stroke = colorFor(direction === "flat" ? "up" : direction);

  return (
    <View>
      <Svg
        width="100%"
        height={160}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={stroke} stopOpacity="0.28" />
            <Stop offset="1" stopColor={stroke} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Line
          x1="0"
          x2={VIEW_WIDTH}
          y1={yAt(referencePrice)}
          y2={yAt(referencePrice)}
          stroke={theme.line}
          strokeDasharray="6 6"
          strokeWidth="2"
        />

        <Path d={area} fill="url(#fill)" />
        <Path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </Svg>

      <View style={styles.axis}>
        <Text style={styles.axisLabel}>{points[0].time}</Text>
        <Text style={styles.axisLabel}>{points[points.length - 1].time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axis: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  axisLabel: { color: theme.muted, fontSize: 10 },
});
