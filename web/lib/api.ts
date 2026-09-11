import type { ApiError, MarketSnapshot, PricePoint } from "@/types/market";

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

async function getJson<T>(path: string, signal: AbortSignal): Promise<Result<T>> {
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

    return { ok: true, data: (await response.json()) as T };
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
  return getJson<MarketSnapshot>(
    `/api/market${simulateFailure ? "?fail=1" : ""}`,
    signal,
  );
}

export function fetchHistory(
  symbol: string,
  signal: AbortSignal,
): Promise<Result<PricePoint[]>> {
  return getJson<PricePoint[]>(`/api/history/${encodeURIComponent(symbol)}`, signal);
}
