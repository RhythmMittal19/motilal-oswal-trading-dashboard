"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchMarket } from "@/lib/api";
import type { Direction } from "@/lib/format";
import type { ApiError, MarketSnapshot } from "@/types/market";

const POLL_MS = 2000;

/**
 * A union rather than { isLoading, isError, data }.
 *
 * Three booleans allow eight combinations, most of them nonsense — "loading
 * and errored and holding data". Here those states cannot be constructed, and
 * the compiler makes the UI handle every case that can.
 *
 * `stale` marks a snapshot whose last refresh failed: the prices on screen were
 * real, they are just no longer current.
 */
export type MarketState =
  | { status: "loading" }
  | { status: "error"; error: ApiError }
  | {
      status: "ready";
      snapshot: MarketSnapshot;
      stale: boolean;
      /** Which way each symbol moved on the most recent tick, for the flash. */
      ticks: Record<string, Direction>;
    };

/**
 * Comparing the two snapshots here, inside the state updater, is the only
 * place both the old and new prices are in scope. Doing it per row would need
 * a ref and an effect in every single row.
 */
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
    const controller = new AbortController();

    async function poll() {
      const result = await fetchMarket(controller.signal, simulateFailure);
      if (controller.signal.aborted) return;

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
        // A single failed poll shouldn't wipe a working dashboard: keep the
        // last good prices and mark them stale. A failure the user explicitly
        // asked for is different — that one should surface.
        if (previous.status === "ready" && !simulateFailure) {
          return { ...previous, stale: true };
        }
        return { status: "error", error: result.error };
      });
    }

    void poll();
    const timer = setInterval(() => void poll(), POLL_MS);

    // Without this, an unmounted component keeps polling forever and React
    // warns about state updates on a component that no longer exists.
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [simulateFailure, attempt]);

  return { state, retry };
}
