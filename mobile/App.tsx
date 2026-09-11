import { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { IndexTicker } from "@/components/IndexTicker";
import { QuoteRow } from "@/components/QuoteRow";
import { StockDetail } from "@/components/StockDetail";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/states/Panels";
import { WATCHLIST_SYMBOLS } from "@/data/instruments";
import { formatClock } from "@/lib/format";
import { searchStocks } from "@/lib/search";
import { theme } from "@/lib/theme";
import { useHistory } from "@/lib/use-history";
import { useMarket } from "@/lib/use-market";
import type { Quote } from "@/types/market";

const STATUS_LABELS = {
  OPEN: "Market open",
  PRE_OPEN: "Pre-open",
  CLOSED: "Market closed",
} as const;

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  const { state, retry } = useMarket(simulateFailure);
  const history = useHistory(selectedSymbol);

  const snapshot = state.status === "ready" ? state.snapshot : null;
  const ticks = state.status === "ready" ? state.ticks : {};
  const tickKey = snapshot?.asOf ?? "";

  const bySymbol = new Map(
    (snapshot?.stocks ?? []).map((stock) => [stock.symbol, stock]),
  );

  const watchlist = WATCHLIST_SYMBOLS.map((symbol) => bySymbol.get(symbol)).filter(
    (quote): quote is Quote => quote !== undefined,
  );

  const isSearching = query.trim().length > 0;
  const visible = isSearching
    ? searchStocks(snapshot?.stocks ?? [], query)
    : watchlist;

  const selectedQuote = selectedSymbol
    ? (bySymbol.get(selectedSymbol) ?? null)
    : null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>TERMINAL</Text>
            <Text style={styles.tagline}>Trading Dashboard</Text>
          </View>

          <View style={styles.statusRow}>
            {snapshot && (
              <>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        snapshot.status === "OPEN" ? theme.up : theme.muted,
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {STATUS_LABELS[snapshot.status]}
                </Text>
                <Text style={styles.statusText}>
                  {state.status === "ready" && state.stale
                    ? "Reconnecting…"
                    : formatClock(snapshot.asOf)}
                </Text>
              </>
            )}

            <View style={styles.spacer} />
            <Text style={styles.statusText}>Fail</Text>
            <Switch
              value={simulateFailure}
              onValueChange={setSimulateFailure}
              trackColor={{ true: theme.accent, false: theme.line }}
            />
          </View>
        </View>

        {snapshot && (
          <IndexTicker
            indices={snapshot.indices}
            ticks={ticks}
            tickKey={tickKey}
          />
        )}

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search symbol or company"
          placeholderTextColor={theme.muted}
          autoCorrect={false}
          autoCapitalize="characters"
          accessibilityLabel="Search stocks by symbol or company name"
          style={styles.search}
        />

        {state.status === "loading" && <LoadingPanel label="Loading prices…" />}

        {state.status === "error" && (
          <ErrorPanel error={state.error} onRetry={retry} />
        )}

        {state.status === "ready" && (
          <FlatList
            data={visible}
            keyExtractor={(quote) => quote.symbol}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <QuoteRow
                quote={item}
                tick={ticks[item.symbol]}
                tickKey={tickKey}
                onSelect={setSelectedSymbol}
              />
            )}
            ListEmptyComponent={
              isSearching ? (
                <EmptyPanel
                  title="No matches"
                  description={`Nothing matched "${query.trim()}". Try INFY or Wipro.`}
                />
              ) : (
                <EmptyPanel
                  title="Watchlist is empty"
                  description="Search above to find a stock."
                />
              )
            }
          />
        )}

        {/* A slide-up screen rather than an inline panel: on a phone, drilling
            into a detail view is the expected gesture. */}
        <Modal
          visible={selectedQuote !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedSymbol(null)}
        >
          {selectedQuote && (
            <StockDetail
              quote={selectedQuote}
              history={history}
              onClose={() => setSelectedSymbol(null)}
            />
          )}
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.canvas },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 8 },
  brandRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  brand: { color: theme.ink, fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  tagline: { color: theme.muted, fontSize: 11 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  spacer: { flex: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: theme.muted, fontSize: 11 },
  search: {
    margin: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.line,
    backgroundColor: theme.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.ink,
    fontSize: 14,
  },
});
