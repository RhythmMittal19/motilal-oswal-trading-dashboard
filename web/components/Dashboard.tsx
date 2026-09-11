"use client";

import { useState } from "react";

import { IndexTicker } from "@/components/IndexTicker";
import { MarketStatusPill } from "@/components/MarketStatusPill";
import { QuoteRow } from "@/components/QuoteRow";
import { SearchField } from "@/components/SearchField";
import { StockDetail } from "@/components/StockDetail";
import { EmptyPanel } from "@/components/states/EmptyPanel";
import { ErrorPanel } from "@/components/states/ErrorPanel";
import { LoadingRows } from "@/components/states/LoadingRows";
import { WATCHLIST_SYMBOLS } from "@/data/instruments";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import { searchStocks } from "@/lib/search";
import { useHistory } from "@/lib/use-history";
import { useMarket } from "@/lib/use-market";
import type { Quote } from "@/types/market";

export function Dashboard() {
  // Three pieces of genuine state. Everything else below is computed from
  // them during render — derived values in state are how two parts of a UI
  // start disagreeing with each other.
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

  // Driven by WATCHLIST_SYMBOLS so the watchlist keeps its own order rather
  // than whatever order the API happened to return.
  const watchlist = WATCHLIST_SYMBOLS.map((symbol) => bySymbol.get(symbol)).filter(
    (quote): quote is Quote => quote !== undefined,
  );

  const isSearching = query.trim().length > 0;
  const visible = isSearching
    ? searchStocks(snapshot?.stocks ?? [], query)
    : watchlist;

  const selectedQuote = selectedSymbol ? (bySymbol.get(selectedSymbol) ?? null) : null;

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold tracking-tight">
            TERMINAL
          </span>
          <span className="text-[11px] text-muted">Trading Dashboard</span>
        </div>

        <div className="flex items-center gap-4">
          {snapshot && <MarketStatusPill status={snapshot.status} />}
          {snapshot && (
            <span className="tnum text-[11px] text-muted">
              {state.status === "ready" && state.stale
                ? "Reconnecting…"
                : `Updated ${formatClock(snapshot.asOf)}`}
            </span>
          )}
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(event) => setSimulateFailure(event.target.checked)}
              className="accent-accent"
            />
            Simulate failure
          </label>
        </div>
      </header>

      {snapshot ? (
        <IndexTicker
          indices={snapshot.indices}
          ticks={ticks}
          tickKey={tickKey}
        />
      ) : (
        <div className="h-[49px] border-y border-line" />
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 p-3 lg:grid lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start lg:gap-3 lg:p-4">
        <section
          className={cn(
            "border border-line bg-surface",
            selectedSymbol && "hidden lg:block",
          )}
        >
          <SearchField value={query} onChange={setQuery} />

          {state.status === "loading" && <LoadingRows />}

          {state.status === "error" && (
            <ErrorPanel error={state.error} onRetry={retry} />
          )}

          {state.status === "ready" &&
            visible.length === 0 &&
            (isSearching ? (
              <EmptyPanel
                title="No matches"
                description={`Nothing matched "${query.trim()}". Try a symbol like INFY or a name like Wipro.`}
              />
            ) : (
              <EmptyPanel
                title="Watchlist is empty"
                description="Search above to find a stock and add it here."
              />
            ))}

          {state.status === "ready" && visible.length > 0 && (
            <ul className="divide-y divide-line">
              {visible.map((quote) => (
                <li key={quote.symbol}>
                  <QuoteRow
                    quote={quote}
                    tick={ticks[quote.symbol]}
                    tickKey={tickKey}
                    selected={quote.symbol === selectedSymbol}
                    onSelect={setSelectedSymbol}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className={cn("mt-3 lg:mt-0", !selectedSymbol && "hidden lg:block")}
        >
          {selectedQuote ? (
            <StockDetail
              quote={selectedQuote}
              history={history}
              onBack={() => setSelectedSymbol(null)}
            />
          ) : (
            <div className="border border-line bg-surface">
              {/* A selected symbol with no quote means the feed is down, not
                  that the user picked nothing. Saying so is more honest. */}
              {selectedSymbol ? (
                <EmptyPanel
                  title="Price unavailable"
                  description={`No current data for ${selectedSymbol}.`}
                />
              ) : (
                <EmptyPanel
                  title="No stock selected"
                  description="Pick a stock from the watchlist to see its intraday chart."
                />
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
