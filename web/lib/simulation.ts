import { INDICES, STOCKS, type SeedInstrument } from "@/data/instruments";
import type { MarketStatus, PricePoint, Quote } from "@/types/market";

/**
 * Current price for every instrument, keyed by symbol.
 *
 * Module scope, so the simulated market survives between requests inside one
 * server process. See README for why this is fine here and wrong in production.
 */
const currentPrices = new Map<string, number>();

const ALL: SeedInstrument[] = [...INDICES, ...STOCKS];

function priceOf(seed: SeedInstrument): number {
  return currentPrices.get(seed.symbol) ?? seed.previousClose;
}

/**
 * Open each instrument somewhere inside the day's range instead of exactly at
 * the previous close. Starting everything at 0.00% makes the dashboard look
 * broken on first load, because every row shows no movement at all.
 */
function seedOpeningPrices(): void {
  for (const seed of ALL) {
    const dailyRange = seed.previousClose * (seed.volatility / 100);
    const offset = (Math.random() - 0.5) * dailyRange * 1.4;
    currentPrices.set(seed.symbol, seed.previousClose + offset);
  }
}

seedOpeningPrices();

/**
 * How hard each tick pulls the price back toward the previous close.
 *
 * A plain random walk has nothing anchoring it, so prices wander off — a test
 * over one simulated session had SBIN at -9.6%. This term makes large drift
 * statistically unlikely; the clamp below makes it impossible.
 */
const REVERSION = 0.005;

/** Advance every instrument by one step of a mean-reverting random walk. */
export function tick(): void {
  for (const seed of ALL) {
    const current = priceOf(seed);
    const dailyRange = seed.previousClose * (seed.volatility / 100);

    const noise = (Math.random() - 0.5) * dailyRange * 0.12;
    const reversion = (seed.previousClose - current) * REVERSION;

    const floor = seed.previousClose - dailyRange * 2;
    const ceiling = seed.previousClose + dailyRange * 2;
    const next = Math.min(ceiling, Math.max(floor, current + noise + reversion));

    currentPrices.set(seed.symbol, next);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Round first, then derive, so the numbers the client receives agree with each other. */
function toQuote(seed: SeedInstrument): Quote {
  const price = round2(priceOf(seed));
  const change = round2(price - seed.previousClose);
  return {
    symbol: seed.symbol,
    name: seed.name,
    price,
    change,
    changePercent: round2((change / seed.previousClose) * 100),
  };
}

const TICK_MS = 2000;
let lastAdvancedAt = 0;

/**
 * Advance the market by however many ticks have elapsed on the clock.
 *
 * Ticking once per request would make the market run faster whenever more
 * browser tabs are open, which is plainly wrong.
 */
export function advance(now: number = Date.now()): void {
  if (lastAdvancedAt === 0) {
    lastAdvancedAt = now;
    return;
  }

  const steps = Math.floor((now - lastAdvancedAt) / TICK_MS);
  if (steps <= 0) return;

  // Cap the catch-up so an idle server doesn't replay hours of ticks at once.
  for (let i = 0; i < Math.min(steps, 50); i++) tick();
  lastAdvancedAt += steps * TICK_MS;
}

export function indexQuotes(): Quote[] {
  return INDICES.map(toQuote);
}

export function stockQuotes(): Quote[] {
  return STOCKS.map(toQuote);
}

/* ---------------------------------------------------------------------------
 * Market status
 * ------------------------------------------------------------------------ */

const PRE_OPEN_AT = 9 * 60;
const OPEN_AT = 9 * 60 + 15;
const CLOSE_AT = 15 * 60 + 30;

/**
 * Read the wall clock in IST regardless of where the server runs.
 * `hourCycle: "h23"` avoids the engine quirk where midnight formats as "24".
 */
function istNow(now: Date): { weekday: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";

  return {
    weekday: get("weekday"),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

export function marketStatus(now: Date = new Date()): MarketStatus {
  const { weekday, minutes } = istNow(now);

  if (weekday === "Sat" || weekday === "Sun") return "CLOSED";
  if (minutes >= PRE_OPEN_AT && minutes < OPEN_AT) return "PRE_OPEN";
  if (minutes >= OPEN_AT && minutes <= CLOSE_AT) return "OPEN";
  return "CLOSED";
}

/* ---------------------------------------------------------------------------
 * Intraday history
 * ------------------------------------------------------------------------ */

const SERIES_STEP_MIN = 5;

/** Built once per symbol, so the chart doesn't redraw differently every poll. */
const seriesCache = new Map<string, PricePoint[]>();

function clockLabel(minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** How much of the previous step's move carries into the next one. */
const MOMENTUM = 0.7;

function buildSeries(seed: SeedInstrument): PricePoint[] {
  const points: PricePoint[] = [];
  const dailyRange = seed.previousClose * (seed.volatility / 100);

  let price = seed.previousClose;
  let move = 0;

  for (let m = OPEN_AT; m <= CLOSE_AT; m += SERIES_STEP_MIN) {
    const shock = (Math.random() - 0.5) * dailyRange * 0.22;

    // Independent steps produce static, not a price chart. Carrying most of
    // the previous move forward is what makes the line trend.
    move = move * MOMENTUM + shock;

    const reversion = (seed.previousClose - price) * 0.05;
    price += move + reversion;

    points.push({ time: clockLabel(m), price: round2(price) });
  }

  return points;
}

export function findInstrument(symbol: string): SeedInstrument | undefined {
  return ALL.find((s) => s.symbol === symbol);
}

/**
 * A full 09:15-15:30 session, always. Real data would stop at the current
 * time, but a mock that renders an empty chart outside market hours is
 * useless to demonstrate.
 */
export function intradaySeries(symbol: string): PricePoint[] | null {
  const seed = findInstrument(symbol);
  if (!seed) return null;

  let series = seriesCache.get(symbol);
  if (!series) {
    series = buildSeries(seed);
    seriesCache.set(symbol, series);
  }

  // Keep the final point in step with the live price so the chart agrees
  // with the number printed above it.
  const last = series[series.length - 1];
  return [...series.slice(0, -1), { time: last.time, price: round2(priceOf(seed)) }];
}
