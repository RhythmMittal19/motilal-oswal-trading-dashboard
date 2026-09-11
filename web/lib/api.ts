import type { ApiError, MarketSnapshot, PricePoint, Quote } from "@/types/market";

const REQUEST_TIMEOUT_MS = 8000;

/**
 * Success and failure as one value instead of thrown exceptions.
 *
 * The caller has to look at `ok` before it can reach the data, so there is no
 * path where a failure is silently treated as a success.
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

/**
 * The server is a separate program; its response is untrusted input. A cast
 * would only silence the compiler, not check anything.
 */
function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ApiError).code === "string" &&
    typeof (value as ApiError).message === "string"
  );
}

/**
 * The server is a separate program, so its success payloads are untrusted too.
 * `as T` only silences the compiler; a malformed 200 response used to take the
 * whole app down with "next.indices is not iterable" instead of showing the
 * error state.
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

export function isMarketSnapshot(value: unknown): value is MarketSnapshot {
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

export function isPricePoints(value: unknown): value is PricePoint[] {
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
  signal: AbortSignal,
  isValid: (value: unknown) => value is T,
): Promise<Result<T>> {
  try {
    const response = await fetch(path, {
      // Prices must never come from a cache.
      cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      return {
        ok: false,
        error: isApiError(body)
          ? body
          : {
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
    // An abort is a normal part of cleanup, not a failure worth showing.
    if (signal.aborted) {
      return { ok: false, error: { code: "ABORTED", message: "Request cancelled." } };
    }
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Could not reach the market data service.",
      },
    };
  }
}

export function fetchMarket(
  signal: AbortSignal,
  simulateFailure = false,
): Promise<Result<MarketSnapshot>> {
  return getJson(
    `/api/market${simulateFailure ? "?fail=1" : ""}`,
    signal,
    isMarketSnapshot,
  );
}

export function fetchHistory(
  symbol: string,
  signal: AbortSignal,
): Promise<Result<PricePoint[]>> {
  return getJson(
    `/api/history/${encodeURIComponent(symbol)}`,
    signal,
    isPricePoints,
  );
}
