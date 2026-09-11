import { describe, expect, it } from "vitest";
import {
  indexQuotes,
  intradaySeries,
  marketStatus,
  stockQuotes,
  tick,
} from "@/lib/simulation";
import { STOCKS } from "@/data/instruments";
import { formatSigned } from "@/lib/format";

describe("simulation", () => {
  it("derives change and changePercent from the previous close, rounded to paise", () => {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const quote = stockQuotes().find((q) => q.symbol === "RELIANCE")!;
    const seed = STOCKS.find((s) => s.symbol === "RELIANCE")!;

    expect(quote.price).toBe(round2(quote.price));
    expect(quote.change).toBe(round2(quote.price - seed.previousClose));
    expect(quote.changePercent).toBe(
      round2((quote.change / seed.previousClose) * 100),
    );
  });

  it("opens with instruments spread across the day's range, not all flat", () => {
    const moved = stockQuotes().filter((q) => q.changePercent !== 0);
    expect(moved.length).toBe(14);
  });

  it("keeps prices inside a plausible intraday band over a full session", () => {
    // A trading session is ~6h15m. At one tick per 2s that is ~11,250 ticks.
    for (let i = 0; i < 11_250; i++) tick();

    const drifted = [...indexQuotes(), ...stockQuotes()].filter(
      (q) => Math.abs(q.changePercent) > 5,
    );

    expect(drifted.map((q) => `${q.symbol} ${q.changePercent.toFixed(1)}%`)).toEqual([]);
  });
});

describe("marketStatus", () => {
  // 2026-09-11 is a Friday. IST is UTC+5:30.
  it("is OPEN during the session", () => {
    expect(marketStatus(new Date("2026-09-11T04:30:00Z"))).toBe("OPEN"); // 10:00 IST
  });

  it("is PRE_OPEN between 09:00 and 09:15", () => {
    expect(marketStatus(new Date("2026-09-11T03:35:00Z"))).toBe("PRE_OPEN"); // 09:05 IST
  });

  it("is CLOSED after the bell", () => {
    expect(marketStatus(new Date("2026-09-11T11:00:00Z"))).toBe("CLOSED"); // 16:30 IST
  });

  it("is CLOSED at the weekend even during session hours", () => {
    expect(marketStatus(new Date("2026-09-13T04:30:00Z"))).toBe("CLOSED"); // Sunday
  });
});

describe("intradaySeries", () => {
  it("covers 09:15 to 15:30 at five-minute steps", () => {
    const series = intradaySeries("RELIANCE")!;
    expect(series).toHaveLength(76);
    expect(series[0].time).toBe("09:15");
    expect(series[series.length - 1].time).toBe("15:30");
  });

  it("returns null for a symbol that does not exist", () => {
    expect(intradaySeries("NOTREAL")).toBeNull();
  });
});

describe("formatSigned", () => {
  it("keeps the sign consistent when a tiny move rounds to zero", () => {
    // A -1.02 point move on NIFTY is -0.004%, which rounds to -0.
    expect(formatSigned(-0.004, "down")).toBe("-0.00");
    expect(formatSigned(-1.02, "down")).toBe("-1.02");
  });

  it("uses no sign when flat", () => {
    expect(formatSigned(0, "flat")).toBe("0.00");
  });
});
