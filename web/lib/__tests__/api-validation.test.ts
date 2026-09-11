import { describe, expect, it } from "vitest";

import { isMarketSnapshot, isPricePoints } from "@/lib/api";

const validQuote = {
  symbol: "INFY",
  name: "Infosys Ltd",
  price: 1542.25,
  change: 1.5,
  changePercent: 0.1,
};

const validSnapshot = {
  indices: [validQuote],
  stocks: [validQuote],
  status: "OPEN",
  asOf: "2026-09-11T04:30:00.000Z",
};

describe("isMarketSnapshot", () => {
  it("accepts a well-formed snapshot", () => {
    expect(isMarketSnapshot(validSnapshot)).toBe(true);
  });

  it.each([
    ["missing arrays", { status: "OPEN", asOf: "x" }],
    ["indices not an array", { ...validSnapshot, indices: "nope" }],
    ["a quote missing a field", { ...validSnapshot, stocks: [{ symbol: "X" }] }],
    ["a price that is not a number", { ...validSnapshot, stocks: [{ ...validQuote, price: "1542" }] }],
    ["NaN price", { ...validSnapshot, stocks: [{ ...validQuote, price: NaN }] }],
    ["an unknown market status", { ...validSnapshot, status: "HALTED" }],
    ["null", null],
    ["an array", []],
    ["a string", "OPEN"],
  ])("rejects %s", (_label, payload) => {
    expect(isMarketSnapshot(payload)).toBe(false);
  });
});

describe("isPricePoints", () => {
  it("accepts a well-formed series", () => {
    expect(isPricePoints([{ time: "09:15", price: 100 }])).toBe(true);
    expect(isPricePoints([])).toBe(true);
  });

  it.each([
    ["a non-array", { time: "09:15", price: 100 }],
    ["a point missing price", [{ time: "09:15" }]],
    ["a non-numeric price", [{ time: "09:15", price: "100" }]],
    ["null entries", [null]],
  ])("rejects %s", (_label, payload) => {
    expect(isPricePoints(payload)).toBe(false);
  });
});
