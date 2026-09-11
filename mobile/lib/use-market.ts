import { useCallback, useEffect, useState } from "react";

import { fetchMarket } from "@/lib/api";
import type { Direction } from "@/lib/format";
import type { ApiError, MarketSnapshot } from "@/types/market";

const POLL_MS = 2000;

export type MarketState =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | {
      status: "ready";
      snapshot: MarketSnapshot;
      stale: boolean;
      ticks: Record<string, Direction>;
    };

function tickDirections(
  previous: MarketSnapshot,
  next: MarketSnapshot,
): Record<string, Direction> {
  const before = new Map<string, number>();
  for (const quote of [...previous.indices, ...previous.stocks]) {
    before.set(quote.symbol, quote.price);
  }

  const directions: Record<string, Direction> = {};
  for (const quote of [...next.indices, ...next.stocks]) {
    const was = before.get(quote.symbol);
    directions[quote.symbol] =
      was === undefined || was === quote.price
        ? "flat"
        : quote.price > was
          ? "up"
          : "down";
  }
  return directions;
}

export function useMarket(simulateFailure: boolean): {
  state: MarketState;
  retry: () => void;
} {
  const [state, setState] = useState<MarketState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let active = true;

    async function poll() {
      const result = await fetchMarket(simulateFailure);
      if (!active) return;

      setState((previous) => {
        if (result.ok) {
          return {
            status: "ready",
            snapshot: result.data,
            stale: false,
            ticks:
              previous.status === "ready"
                ? tickDirections(previous.snapshot, result.data)
                : {},
          };
        }
        if (previous.status === "ready" && !simulateFailure) {
          return { ...previous, stale: true };
        }
        return { status: "error", error: result.error };
      });
    }

    void poll();
    const timer = setInterval(() => void poll(), POLL_MS);

    // Timers survive unmount unless cleared, which leaks and warns.
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [simulateFailure, attempt]);

  return { state, retry };
}
