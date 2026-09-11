import {
  advance,
  indexQuotes,
  intradaySeries,
  marketStatus,
  stockQuotes,
} from "@/lib/simulation";
import type { ApiError, MarketSnapshot, PricePoint, Quote } from "@/types/market";

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

/**
 * A remote server's success payload is untrusted too. Casting with `as T` only
 * silences the compiler: a malformed 200 response crashes the app instead of
 * showing the error state.
 */
function isQuote(value: unknown): value is Quote {
  const quote = value as Quote;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof quote.symbol === "string" &&
    typeof quote.name === "string" &&
    Number.isFinite(quote.price) &&
    Number.isFinite(quote.change) &&
    Number.isFinite(quote.changePercent)
  );
}

function isMarketSnapshot(value: unknown): value is MarketSnapshot {
  const snapshot = value as MarketSnapshot;
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray(snapshot.indices) &&
    snapshot.indices.every(isQuote) &&
    Array.isArray(snapshot.stocks) &&
    snapshot.stocks.every(isQuote) &&
    ["OPEN", "CLOSED", "PRE_OPEN"].includes(snapshot.status) &&
    typeof snapshot.asOf === "string"
  );
}

function isPricePoints(value: unknown): value is PricePoint[] {
  return (
    Array.isArray(value) &&
    value.every((point) => {
      const candidate = point as PricePoint;
      return (
        typeof point === "object" &&
        point !== null &&
        typeof candidate.time === "string" &&
        Number.isFinite(candidate.price)
      );
    })
  );
}

async function getJson<T>(
  path: string,
  isValid: (value: unknown) => value is T,
): Promise<Result<T>> {
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
    const body: unknown = await response.json();
    if (!isValid(body)) {
      return {
        ok: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "The market data service returned data in an unexpected shape.",
        },
      };
    }

    return { ok: true, data: body };
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
  if (BASE_URL) return getJson("/api/market", isMarketSnapshot);

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
    return getJson(
      `/api/history/${encodeURIComponent(symbol)}`,
      isPricePoints,
    );
  }

  const series = intradaySeries(symbol);
  return series
    ? { ok: true, data: series }
    : {
        ok: false,
        error: { code: "SYMBOL_NOT_FOUND", message: `No data for ${symbol}.` },
      };
}
