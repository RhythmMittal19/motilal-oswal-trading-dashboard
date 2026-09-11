import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Delta } from "@/components/Delta";
import { LivePrice } from "@/components/LivePrice";
import type { Direction } from "@/lib/format";
import { theme } from "@/lib/theme";
import type { Quote } from "@/types/market";

interface IndexTickerProps {
  indices: Quote[];
  ticks: Record<string, Direction>;
  tickKey: string;
}

/**
 * Horizontally scrollable rather than stacked. Three indices stacked
 * vertically would push the watchlist below the fold on a phone.
 */
export function IndexTicker({ indices, ticks, tickKey }: IndexTickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.container}
    >
      {indices.map((index) => (
        <View key={index.symbol} style={styles.cell}>
          <Text style={styles.label}>{index.name}</Text>
          <LivePrice
            value={index.price}
            tick={ticks[index.symbol]}
            tickKey={tickKey}
          />
          <Delta change={index.change} changePercent={index.changePercent} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.line,
    flexGrow: 0,
  },
  row: { paddingHorizontal: 8 },
  cell: { paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  label: {
    color: theme.muted,
    fontSize: 9,
    letterSpacing: 1.2,
  },
});
