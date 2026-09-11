/**
 * The shape of anything with a live price — a stock or an index.
 *
 * Stocks and indices need identical fields on screen, so they share one type.
 * If they genuinely diverge later (volume, lot size), split them then.
 */
export interface Quote {
  symbol: string;
  name: string;
  price: number;
  /** Absolute move against the previous close. Derived, never stored. */
  change: number;
  changePercent: number;
}

/** One point on the intraday chart. */
export interface PricePoint {
  /** "HH:MM" in IST — the x-axis label. */
  time: string;
  price: number;
}

/**
 * A string union rather than `string` so a typo like "OPNE" fails to compile
 * and a switch over it can be checked for exhaustiveness.
 */
export type MarketStatus = "OPEN" | "CLOSED" | "PRE_OPEN";

/**
 * Everything the dashboard needs, in one payload.
 *
 * One endpoint instead of three, because the screen renders as a single unit —
 * three requests would mean three loading states that can disagree with each other.
 */
export interface MarketSnapshot {
  indices: Quote[];
  stocks: Quote[];
  status: MarketStatus;
  /** ISO timestamp, so the UI can show "last updated" honestly. */
  asOf: string;
}

/**
 * Every API failure returns this shape, so the client has exactly one error
 * format to handle rather than guessing at whatever the server sent.
 */
export interface ApiError {
  code: string;
  message: string;
}
