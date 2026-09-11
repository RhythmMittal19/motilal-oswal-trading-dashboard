import { useEffect, useState } from "react";

import { fetchHistory } from "@/lib/api";
import type { ApiError, PricePoint } from "@/types/market";

export type HistoryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | { status: "ready"; points: PricePoint[] };

export function useHistory(symbol: string | null): HistoryState {
  const [entry, setEntry] = useState<{
    symbol: string;
    state: HistoryState;
  } | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let active = true;

    void (async () => {
      const result = await fetchHistory(symbol);
      if (!active) return;

      setEntry({
        symbol,
        state: result.ok
          ? { status: "ready", points: result.data }
          : { status: "error", error: result.error },
      });
    })();

    return () => {
      active = false;
    };
  }, [symbol]);

  if (!symbol) return { status: "idle" };

  // Having no result for the current symbol is the loading state. Deriving it
  // means it can never disagree with what's actually loaded.
  return entry?.symbol === symbol ? entry.state : { status: "loading" };
}
