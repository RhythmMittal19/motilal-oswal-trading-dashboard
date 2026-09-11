/**
 * MOCK MARKET DATA — not real quotes.
 *
 * Prices are plausible NSE levels chosen as a starting point for the simulation.
 * Nothing here should ever be presented to a user as real market data.
 */

export interface SeedInstrument {
  symbol: string;
  name: string;
  /** The simulation starts here and measures every move against it. */
  previousClose: number;
  /**
   * Rough daily move in percent. Without this every row drifts by the same
   * amount, which reads as obviously fake.
   */
  volatility: number;
}

export const INDICES: SeedInstrument[] = [
  { symbol: "NIFTY50", name: "NIFTY 50", previousClose: 24836.3, volatility: 0.6 },
  { symbol: "SENSEX", name: "SENSEX", previousClose: 81290.75, volatility: 0.6 },
  { symbol: "BANKNIFTY", name: "NIFTY BANK", previousClose: 52145.6, volatility: 0.9 },
];

export const STOCKS: SeedInstrument[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", previousClose: 1402.55, volatility: 1.1 },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", previousClose: 3128.4, volatility: 0.9 },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", previousClose: 1687.9, volatility: 1.0 },
  { symbol: "INFY", name: "Infosys Ltd", previousClose: 1542.25, volatility: 1.2 },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", previousClose: 1298.6, volatility: 1.0 },
  { symbol: "ITC", name: "ITC Ltd", previousClose: 412.35, volatility: 0.8 },
  { symbol: "SBIN", name: "State Bank of India", previousClose: 812.7, volatility: 1.3 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", previousClose: 1655.1, volatility: 1.0 },
  { symbol: "LT", name: "Larsen & Toubro Ltd", previousClose: 3601.85, volatility: 1.1 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", previousClose: 2398.45, volatility: 0.7 },
  { symbol: "AXISBANK", name: "Axis Bank Ltd", previousClose: 1104.2, volatility: 1.2 },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", previousClose: 12480.0, volatility: 1.0 },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd", previousClose: 2456.3, volatility: 0.9 },
  { symbol: "WIPRO", name: "Wipro Ltd", previousClose: 248.75, volatility: 1.4 },
];

/**
 * Which stocks appear on the watchlist. Symbols only — the prices themselves
 * live in exactly one place, so the watchlist can never disagree with the
 * detail panel.
 *
 * The remaining STOCKS are reachable only through search, which keeps search
 * meaningful instead of filtering a list the user can already see.
 */
export const WATCHLIST_SYMBOLS: string[] = [
  "RELIANCE",
  "TCS",
  "HDFCBANK",
  "INFY",
  "ICICIBANK",
  "ITC",
  "SBIN",
  "BHARTIARTL",
];
