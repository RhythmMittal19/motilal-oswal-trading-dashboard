import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Delta } from "@/components/Delta";
import { IntradayChart } from "@/components/IntradayChart";
import { ErrorPanel, LoadingPanel } from "@/components/states/Panels";
import { directionOf, formatPrice } from "@/lib/format";
import { theme } from "@/lib/theme";
import type { HistoryState } from "@/lib/use-history";
import type { Quote } from "@/types/market";

interface StockDetailProps {
  quote: Quote;
  history: HistoryState;
  onClose: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function StockDetail({ quote, history, onClose }: StockDetailProps) {
  const referencePrice = quote.price - quote.change;
  const prices =
    history.status === "ready" ? history.points.map((p) => p.price) : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        hitSlop={12}
        style={styles.close}
      >
        <Text style={styles.closeLabel}>← Watchlist</Text>
      </Pressable>

      <Text style={styles.symbol}>{quote.symbol}</Text>
      <Text style={styles.name}>{quote.name}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.price}>₹{formatPrice(quote.price)}</Text>
        <Delta
          change={quote.change}
          changePercent={quote.changePercent}
          style={styles.priceDelta}
        />
      </View>

      {history.status === "loading" && <LoadingPanel label="Loading chart…" />}

      {history.status === "error" && (
        <ErrorPanel error={history.error} onRetry={onClose} />
      )}

      {history.status === "ready" && (
        <>
          <IntradayChart
            points={history.points}
            referencePrice={referencePrice}
            direction={directionOf(quote.change)}
          />

          <View style={styles.stats}>
            <Stat label="PREV CLOSE" value={formatPrice(referencePrice)} />
            <Stat
              label="DAY HIGH"
              value={formatPrice(Math.max(...prices, quote.price))}
            />
            <Stat
              label="DAY LOW"
              value={formatPrice(Math.min(...prices, quote.price))}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.canvas },
  content: { padding: 20, paddingTop: 24 },
  close: { marginBottom: 18 },
  closeLabel: { color: theme.muted, fontSize: 13 },
  symbol: { color: theme.ink, fontSize: 15, fontWeight: "700" },
  name: { color: theme.muted, fontSize: 12, marginTop: 2 },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    marginTop: 18,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  price: {
    color: theme.ink,
    fontSize: 32,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  priceDelta: { fontSize: 13 },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.line,
  },
  stat: { gap: 4 },
  statLabel: { color: theme.muted, fontSize: 9, letterSpacing: 1 },
  statValue: {
    color: theme.ink,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
});
