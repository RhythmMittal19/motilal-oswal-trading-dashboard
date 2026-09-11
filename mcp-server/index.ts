import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

/**
 * A dev-time MCP server for the Trading Dashboard.
 *
 * It is a thin adapter over the Next.js API the web app already uses — it
 * reimplements nothing. That is the point: the REST endpoint exists so the
 * *browser* can fetch prices; this server exists so an *AI assistant* can,
 * with typed arguments and discoverable tools, while building the app.
 *
 * It is not part of the running application. Nothing the dashboard ships
 * depends on it.
 */

const API_BASE = process.env.TERMINAL_API_URL ?? "http://localhost:3000";

interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketSnapshot {
  indices: Quote[];
  stocks: Quote[];
  status: string;
  asOf: string;
}

interface PricePoint {
  time: string;
  price: number;
}

/** Every tool returns text, so failures are reported the same way as results. */
function text(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

async function getJson<T>(path: string): Promise<T | string> {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) {
      return `Request to ${path} failed with status ${response.status}.`;
    }
    return (await response.json()) as T;
  } catch {
    return `Could not reach ${API_BASE}. Start the web app with \`pnpm dev\` in web/ first.`;
  }
}

serveStdio(() => {
  const server = new McpServer({ name: "terminal-market-data", version: "1.0.0" });

  server.registerTool(
    "get_quote",
    {
      description:
        "Current simulated price, absolute change and percentage change for one " +
        "instrument. Accepts a stock symbol (RELIANCE, INFY) or an index " +
        "(NIFTY50, SENSEX, BANKNIFTY).",
      inputSchema: z.object({
        symbol: z.string().describe("Instrument symbol, e.g. RELIANCE"),
      }),
    },
    async ({ symbol }) => {
      const snapshot = await getJson<MarketSnapshot>("/api/market");
      if (typeof snapshot === "string") return text(snapshot);

      const wanted = symbol.trim().toUpperCase();
      const quote = [...snapshot.indices, ...snapshot.stocks].find(
        (candidate) => candidate.symbol === wanted,
      );

      if (!quote) {
        const known = [...snapshot.indices, ...snapshot.stocks]
          .map((candidate) => candidate.symbol)
          .join(", ");
        return text(`No instrument named "${wanted}". Known symbols: ${known}`);
      }

      return text({ ...quote, marketStatus: snapshot.status, asOf: snapshot.asOf });
    },
  );

  server.registerTool(
    "list_watchlist",
    {
      description:
        "Every instrument the dashboard currently knows about, with live " +
        "simulated prices. Useful for checking what data the UI is rendering.",
      inputSchema: z.object({}),
    },
    async () => {
      const snapshot = await getJson<MarketSnapshot>("/api/market");
      if (typeof snapshot === "string") return text(snapshot);

      return text({
        marketStatus: snapshot.status,
        asOf: snapshot.asOf,
        indices: snapshot.indices,
        stocks: snapshot.stocks,
      });
    },
  );

  server.registerTool(
    "get_intraday_series",
    {
      description:
        "The 09:15-15:30 intraday series for one symbol, as the chart receives " +
        "it. Returns the points plus min/max, which is what makes it useful for " +
        "checking the chart's scaling maths against real numbers.",
      inputSchema: z.object({
        symbol: z.string().describe("Instrument symbol, e.g. RELIANCE"),
      }),
    },
    async ({ symbol }) => {
      const series = await getJson<PricePoint[]>(
        `/api/history/${encodeURIComponent(symbol.trim().toUpperCase())}`,
      );
      if (typeof series === "string") return text(series);

      const prices = series.map((point) => point.price);
      return text({
        symbol: symbol.trim().toUpperCase(),
        pointCount: series.length,
        from: series[0]?.time,
        to: series[series.length - 1]?.time,
        min: Math.min(...prices),
        max: Math.max(...prices),
        points: series,
      });
    },
  );

  return server;
});

// stdout carries the JSON-RPC stream, so all logging goes to stderr.
console.error(`terminal-market-data MCP server running (API: ${API_BASE})`);
