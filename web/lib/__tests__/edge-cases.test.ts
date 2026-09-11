import { describe, expect, it } from "vitest";

import { INDICES, STOCKS } from "@/data/instruments";
import { directionOf, formatPrice, formatSigned } from "@/lib/format";
import {
  advance,
  indexQuotes,
  intradaySeries,
  marketStatus,
  stockQuotes,
} from "@/lib/simulation";

/** 2026-09-11 is a Friday, 2026-09-12 a Saturday. IST is UTC+5:30. */
const ist = (utc: string) => new Date(utc);

describe("marketStatus boundaries", () => {
  it("flips exactly at the pre-open bell", () => {
    expect(marketStatus(ist("2026-09-11T03:29:00Z"))).toBe("CLOSED"); // 08:59
    expect(marketStatus(ist("2026-09-11T03:30:00Z"))).toBe("PRE_OPEN"); // 09:00
  });

  it("flips exactly at the opening bell", () => {
    expect(marketStatus(ist("2026-09-11T03:44:00Z"))).toBe("PRE_OPEN"); // 09:14
    expect(marketStatus(ist("2026-09-11T03:45:00Z"))).toBe("OPEN"); // 09:15
  });

  it("flips exactly at the closing bell", () => {
    expect(marketStatus(ist("2026-09-11T10:00:00Z"))).toBe("OPEN"); // 15:30
    expect(marketStatus(ist("2026-09-11T10:01:00Z"))).toBe("CLOSED"); // 15:31
  });

  it("stays closed at the weekend even inside session hours", () => {
    expect(marketStatus(ist("2026-09-12T04:30:00Z"))).toBe("CLOSED"); // Sat 10:00
  });

  it("reads midnight as 00:00, not 24:00", () => {
    // Thu 18:30 UTC is Fri 00:00 IST. An hourCycle slip here would produce
    // 1440 minutes instead of 0.
    expect(marketStatus(ist("2026-09-10T18:30:00Z"))).toBe("CLOSED");
  });
});

describe("simulation robustness", () => {
  it("never produces a negative or zero price", () => {
    for (let i = 0; i < 5000; i++) advance(Date.now() + i * 2000);
    const prices = [...indexQuotes(), ...stockQuotes()].map((q) => q.price);
    expect(prices.every((p) => p > 0)).toBe(true);
  });

  it("caps catch-up so a long idle gap cannot stall the server", () => {
    const before = stockQuotes().map((q) => q.price);
    // Ten hours of missed ticks in a single call.
    advance(Date.now() + 10 * 60 * 60 * 1000);
    const after = stockQuotes().map((q) => q.price);
    expect(after.every((p) => Number.isFinite(p) && p > 0)).toBe(true);
    expect(after).toHaveLength(before.length);
  });

  it("returns null rather than throwing for unknown symbols", () => {
    for (const bad of ["", "   ", "../etc/passwd", "<script>", "🙂", "A".repeat(5000)]) {
      expect(intradaySeries(bad)).toBeNull();
    }
  });

  it("produces finite, ordered intraday points for every instrument", () => {
    for (const seed of [...INDICES, ...STOCKS]) {
      const series = intradaySeries(seed.symbol)!;
      expect(series).toHaveLength(76);
      expect(series.every((p) => Number.isFinite(p.price) && p.price > 0)).toBe(true);
      expect(series[0].time < series[series.length - 1].time).toBe(true);
    }
  });
});

describe("formatting robustness", () => {
  it("keeps sign, arrow and percentage agreeing when a move rounds to zero", () => {
    expect(directionOf(-0.004)).toBe("down");
    expect(formatSigned(-0.004, "down")).toBe("-0.00");
    expect(formatSigned(0, "flat")).toBe("0.00");
  });

  it("groups large values in lakhs, as Indian users expect", () => {
    expect(formatPrice(1248000)).toBe("12,48,000.00");
    expect(formatPrice(12480)).toBe("12,480.00");
  });
});
