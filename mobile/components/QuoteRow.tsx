import { Pressable, StyleSheet, Text, View } from "react-native";

import { Delta } from "@/components/Delta";
import { LivePrice } from "@/components/LivePrice";
import type { Direction } from "@/lib/format";
import { theme } from "@/lib/theme";
import type { Quote } from "@/types/market";

interface QuoteRowProps {
  quote: Quote;
  tick?: Direction;
  tickKey: string;
  onSelect: (symbol: string) => void;
}

export function QuoteRow({ quote, tick, tickKey, onSelect }: QuoteRowProps) {
  return (
    <Pressable
      onPress={() => onSelect(quote.symbol)}
      accessibilityRole="button"
      accessibilityLabel={`${quote.name}, ${quote.price}`}
      // A visible press state matters more on touch than on a mouse, where
      // there is no hover to tell you the row is interactive.
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <Text style={styles.symbol}>{quote.symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {quote.name}
        </Text>
      </View>

      <View style={styles.right}>
        <LivePrice value={quote.price} tick={tick} tickKey={tickKey} />
        <Delta change={quote.change} changePercent={quote.changePercent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    // 62pt tall: comfortably above the 44pt minimum touch target.
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.line,
  },
  pressed: { backgroundColor: theme.elevated },
  left: { flexShrink: 1 },
  right: { alignItems: "flex-end", gap: 2 },
  symbol: { color: theme.ink, fontSize: 13, fontWeight: "600" },
  name: { color: theme.muted, fontSize: 11, marginTop: 2 },
});
