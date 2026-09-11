import { describe, expect, it } from "vitest";

import { STOCKS } from "@/data/instruments";
import { searchStocks } from "@/lib/search";
import type { Quote } from "@/types/market";

const universe: Quote[] = STOCKS.map((stock) => ({
  symbol: stock.symbol,
  name: stock.name,
  price: 0,
  change: 0,
  changePercent: 0,
}));

const symbolsFor = (query: string) =>
  searchStocks(universe, query).map((stock) => stock.symbol);

describe("searchStocks", () => {
  it("matches on symbol", () => {
    expect(symbolsFor("INFY")).toEqual(["INFY"]);
  });

  it("matches on company name when the symbol does not contain the query", () => {
    // "infosys" appears nowhere in "INFY", so this can only match the name.
    expect(symbolsFor("infosys")).toEqual(["INFY"]);
    expect(symbolsFor("state bank")).toEqual(["SBIN"]);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(symbolsFor("  ReLiAnCe  ")).toEqual(["RELIANCE"]);
  });

  it("returns nothing when there is no match", () => {
    expect(symbolsFor("zzzz")).toEqual([]);
  });

  it("returns everything for an empty query", () => {
    expect(symbolsFor("")).toHaveLength(STOCKS.length);
  });
});
