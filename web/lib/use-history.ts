"use client";

import { useEffect, useState } from "react";

import { fetchHistory } from "@/lib/api";
import type { ApiError, PricePoint } from "@/types/market";

export type HistoryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; points: PricePoint[] };

/**
 * Fetched once per symbol rather than polled. The intraday shape barely moves
 * between ticks, so re-requesting 76 points every two seconds buys nothing.
 */
export function useHistory(symbol: string | null): HistoryState {
  const [entry, setEntry] = useState<{
    symbol: string;
    state: HistoryState;
  } | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const controller = new AbortController();

    void (async () => {
      const result = await fetchHistory(symbol, controller.signal);
      if (controller.signal.aborted) return;

      setEntry({
        symbol,
        state: result.ok
          ? { status: "ready", points: result.data }
          : { status: "error", error: result.error },
      });
    })();

    // Selecting a new stock aborts the previous request, so a slow response
    // for the old symbol can't overwrite the new one's chart.
    return () => controller.abort();
  }, [symbol]);

  if (!symbol) return { status: "idle" };

  // Having no result for the current symbol *is* the loading state. Deriving
  // it beats storing it: nothing can get out of sync, and there's no extra
  // render just to flip a flag.
  return entry?.symbol === symbol ? entry.state : { status: "loading" };
}
