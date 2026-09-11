# terminal-market-data (MCP server)

A **development-time** MCP server. It is not part of the running application,
and nothing the dashboard ships depends on it.

## What it does

Exposes three tools over stdio, each a thin adapter over the Next.js API the
web app already calls:

| Tool | Arguments | Returns |
| --- | --- | --- |
| `get_quote` | `symbol` | Live price, change and percentage change for one instrument |
| `list_watchlist` | – | Every instrument the dashboard knows about, with live prices |
| `get_intraday_series` | `symbol` | The 76-point 09:15–15:30 series plus its min and max |

## Why MCP and not just the REST API

They serve different clients.

- `/api/market` exists so the **browser** can fetch prices. Browsers speak HTTP.
- This server exists so an **AI assistant** can reach the same data with typed,
  self-describing tools it can discover at runtime. An assistant cannot browse
  arbitrary HTTP endpoints or know what parameters they take.

It reimplements nothing — that separation is the whole point.

## Running it

The web app must be running first, since this server proxies to it:

```bash
cd web && pnpm dev      # terminal 1
```

The repository's `.mcp.json` registers the server, so an MCP-aware client in
this directory picks it up automatically. To run it by hand:

```bash
cd mcp-server && npm start
```

Node 24 strips TypeScript types natively, so there is no build step.
