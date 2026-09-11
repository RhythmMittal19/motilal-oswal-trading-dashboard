import {
  advance,
  indexQuotes,
  intradaySeries,
  marketStatus,
  stockQuotes,
} from "@/lib/simulation";
import type { ApiError, MarketSnapshot, PricePoint } from "@/types/market";

/**
 * Where the mobile app gets its prices.
 *
 * Unset (the default): it runs the same simulation module the web API runs,
 * in-process, so the app works with nothing else started.
 *
 * Set to the Next.js server's address (e.g. http://192.168.1.5:3000): the app
 * becomes a second client of the API the web dashboard already uses.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const REQUEST_TIMEOUT_MS = 8000;

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

const FEED_DOWN: ApiError = {
  code: "UPSTREAM_UNAVAILABLE",
  message: "Market data feed is not responding.",
};

async function getJson<T>(path: string): Promise<Result<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message: `Request failed with status ${response.status}.`,
        },
      };
    }
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: `Could not reach ${BASE_URL}. Check EXPO_PUBLIC_API_URL.`,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchMarket(
  simulateFailure: boolean,
): Promise<Result<MarketSnapshot>> {
  if (simulateFailure) return { ok: false, error: FEED_DOWN };
  if (BASE_URL) return getJson<MarketSnapshot>("/api/market");

  advance();
  return {
    ok: true,
    data: {
      indices: indexQuotes(),
      stocks: stockQuotes(),
      status: marketStatus(),
      asOf: new Date().toISOString(),
    },
  };
}

export async function fetchHistory(symbol: string): Promise<Result<PricePoint[]>> {
  if (BASE_URL) {
    return getJson<PricePoint[]>(`/api/history/${encodeURIComponent(symbol)}`);
  }

  const series = intradaySeries(symbol);
  return series
    ? { ok: true, data: series }
    : {
        ok: false,
        error: { code: "SYMBOL_NOT_FOUND", message: `No data for ${symbol}.` },
      };
}
