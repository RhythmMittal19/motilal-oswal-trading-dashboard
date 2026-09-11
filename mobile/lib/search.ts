import type { Quote } from "@/types/market";

/**
 * Matches on symbol or company name, case-insensitively.
 *
 * A plain `includes` rather than fuzzy matching: a user typing "rel" expects
 * RELIANCE, and anything cleverer becomes hard to predict and hard to explain.
 */
export function searchStocks(stocks: Quote[], query: string): Quote[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return stocks;

  return stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(needle) ||
      stock.name.toLowerCase().includes(needle),
  );
}
