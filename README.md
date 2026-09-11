# Terminal — Trading Dashboard

A simplified trading dashboard for retail investors, built for the **AI Round —
Software Engineer (Fresher)** assignment. Two clients, one shared idea of what a
market looks like:

- **`web/`** — Next.js 16 + TypeScript
- **`mobile/`** — React Native (Expo 57) + TypeScript
- **`mcp-server/`** — a development-time MCP server (not part of the app)

> **The prices are simulated.** Nothing in this project is real market data and
> nothing here should be used to make a trading decision.

---

## Features

| | Web | Mobile |
| --- | :---: | :---: |
| Market overview — NIFTY 50, SENSEX, NIFTY BANK | ✅ | ✅ |
| Value, change, % change, market status | ✅ | ✅ |
| Watchlist of 8 stocks | ✅ | ✅ |
| Symbol, company name, price, change, % change | ✅ | ✅ |
| Prices update every 2 seconds | ✅ | ✅ |
| Flash on price tick (green up / red down) | ✅ | ✅ |
| Search by symbol **or** company name | ✅ | ✅ |
| Stock detail with intraday chart | ✅ | ✅ |
| Prev close / day high / day low | ✅ | ✅ |
| Loading state | ✅ | ✅ |
| API/data failure state, with retry | ✅ | ✅ |
| No search results state | ✅ | ✅ |
| Empty data state | ✅ | ✅ |
| Responsive down to 390px | ✅ | n/a |

The search universe is deliberately **larger than the watchlist** — 14 stocks
exist, 8 are on the watchlist, and 6 (LT, HINDUNILVR, AXISBANK, MARUTI,
ASIANPAINT, WIPRO) are reachable only through search. Searching a list you can
already see is not really searching.

---

## Tech stack

| Layer | Choice | Why this and not something else |
| --- | --- | --- |
| Web framework | Next.js 16, App Router | Required by the assignment. The API route also gives a natural place to put the "backend". |
| Language | TypeScript, `strict: true` | Catches the class of bug where a number is `undefined` before it reaches the screen. |
| Styling (web) | Tailwind CSS v4 | Design tokens live in `@theme`, so no component hardcodes a colour. |
| Styling (mobile) | React Native `StyleSheet` | NativeWind would add setup risk for no benefit at this size. |
| Chart | Hand-written SVG | ~60 lines. Works on both platforms with the same maths and no dependency. |
| Mobile runtime | Expo 57 | Runs on a phone via QR code with no native toolchain. |
| Tests | Vitest | Covers the simulation logic, which is pure and is where real bugs live. |
| Class helper | `clsx` + `tailwind-merge` | Predictable conditional classes. |

**Not used, deliberately:** Redux/Zustand (three `useState` calls are enough),
a database (the data is a fixture), WebSockets (polling is what the assignment
asks for and is simpler to explain), authentication (not required), Docker.

---

## Setup

Requires **Node 20+** (Node 24 recommended — the MCP server relies on native
TypeScript stripping).

### Web

```bash
cd web
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

```bash
pnpm test      # run the simulation tests
pnpm build     # production build
pnpm lint
```

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR code with **Expo Go**, or press `a` for an Android emulator,
`i` for an iOS simulator, or `w` to run it in a browser.

> Mobile uses **npm**, web uses **pnpm**. This is deliberate: React Native's
> Metro bundler does not follow pnpm's symlinked `node_modules` without extra
> resolver configuration.

By default the mobile app runs the simulation in-process, so it needs nothing
else running. To point it at the web app's API instead — making it a second
client of the same backend:

```bash
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000 npx expo start
```

### MCP server

See [`mcp-server/README.md`](mcp-server/README.md). It requires the web app to
be running, because it proxies to that API.

---

## API / data source

There is no external market data provider. Prices are generated locally.

```
Browser / Expo app
        │  HTTP GET
        ▼
Next.js route handler          web/app/api/…
        │
        ▼
Simulation engine              web/lib/simulation.ts
        │
        ▼
Seed fixture                   web/data/instruments.ts
```

### Endpoints

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/api/market` | `MarketSnapshot` — indices, stocks, market status, timestamp |
| `GET` | `/api/market?fail=1` | `500` with `{ code, message }` — forces the error state for demos |
| `GET` | `/api/history/:symbol` | `PricePoint[]` — 76 points, 09:15–15:30 at 5-minute steps |
| `GET` | `/api/history/:unknown` | `404` with `{ code, message }` |

Every failure uses the same `{ code, message }` shape, so the client has one
error format to handle rather than guessing at whatever the server sent.

### Why route through an API at all

Importing the fixture straight into a component would be fewer lines, but then
the loading and error states would be theatre — there would be no network to
fail. Going through an HTTP endpoint means loading, failure, retry and status
codes are all real, and swapping in a genuine market-data feed later is a
change to one file, with the API key staying on the server where it belongs.

### How prices move

Each instrument does a **mean-reverting random walk** — a random nudge each
tick, plus a gentle pull back toward the previous close, plus a hard clamp at
±2× the day's expected range. A plain random walk has nothing anchoring it and
wanders off; see [`AI-LOG.md`](AI-LOG.md) for the test that caught exactly that.

The clock, not the request count, drives the simulation: the server advances by
however many 2-second ticks have actually elapsed. Otherwise the market would
run faster whenever a second browser tab was open.

---

## Key assumptions

1. **Simulated data is acceptable.** The assignment permits mock data; a real
   NSE feed would mean API keys, CORS problems and rate limits for no gain here.
2. **Prices are plausible, not accurate.** Seed values are realistic NSE levels
   chosen as a starting point, not quotes from any particular day.
3. **The intraday chart always shows a full 09:15–15:30 session**, even outside
   market hours. Real data would stop at the current time, but a chart that is
   empty at 9pm cannot be demonstrated.
4. **Indices move independently of their constituents.** Modelling the
   correlation between NIFTY and the stocks inside it was not worth the
   complexity here.
5. **Market status follows NSE hours in IST** (pre-open 09:00, open 09:15–15:30,
   weekdays), computed from the IST wall clock regardless of server timezone.
   Trading holidays are not modelled.
6. **The watchlist is fixed.** Add/remove would be straightforward — it is a
   list of symbols — but is not in the requirements.

---

## Known limitations

- **Simulation state lives in module scope.** Fine for one server process;
  on a serverless platform each instance would keep its own market, and the
  prices would differ between them. A real deployment reads from a shared feed.
- **No persistence.** Restarting the server reopens the market at fresh prices.
- **Polling, not streaming.** A real product would use a WebSocket. Polling is
  what the assignment allows and is far easier to reason about.
- **No trading holiday calendar** — the market shows as open on Diwali.
- **The shared core is duplicated** between `web/` and `mobile/` (~150 lines:
  types, simulation, formatting, search). A pnpm workspace would remove the
  duplication, but Metro's symlink resolution is a known time sink and was not
  worth the risk inside a two-hour budget. In a longer-lived project this is
  the first thing I would change.
- **Tests cover logic, not components.** 42 tests across the simulation, market
  hours, search, formatting and API response validation. Component and
  end-to-end tests would be the next addition; the pure logic and the network
  boundary are where the real bugs were.
- **Accessibility is good, not audited.** Colour is never the only signal
  (arrows and signs carry direction too), controls are real buttons, and the
  flash respects `prefers-reduced-motion` — but no screen-reader pass was done.

---

## AI tools used, and how

**Claude (Claude Code)** was the only AI assistant used, for the whole build.

What it was genuinely good for:

- Scaffolding boilerplate — Tailwind token blocks, `StyleSheet` objects, the
  repetitive parts of the state panels.
- Recalling API shapes I would otherwise have looked up, such as
  `Intl.NumberFormat` options and `react-native-svg`'s element names.
- Writing the first draft of the simulation, and then the *test* that proved
  the first draft was wrong.
- Explaining trade-offs I then decided on — for example whether to use a chart
  library, which I chose against.

What it was not trusted with: anything it asserted about library APIs. Next.js
16 and the MCP SDK have both changed shape recently, and generated code for
both was checked against primary sources before being used (see below).

### How AI-generated code was verified

Five separate gates, in order of how much they actually caught:

1. **Tests on the pure logic.** The simulation is a pure function, so it could
   be tested directly. This caught the biggest bug in the project.
2. **Attacking it on purpose.** Faking a malformed API response, hostile search
   input and out-of-order requests. This found a crash nothing else could: a
   bad payload took the whole app down, because `as T` is an assertion rather
   than a check.
3. **Running the API with `curl` before any UI existed.** Reading the raw JSON
   caught two contract problems the UI would have hidden.
4. **Looking at the rendered page.** Two bugs were only visible on screen and
   would have passed every automated check.
5. **`tsc --noEmit` and ESLint on every change.** ESLint's `react-hooks` rules
   caught a genuine React anti-pattern that worked fine but re-rendered twice.

Primary sources were read rather than trusted to recall in two places:
`node_modules/next/dist/docs/` for Next 16's route handlers, and the Context7
docs for the MCP SDK. Both had changed in ways that would have produced
plausible-looking broken code.

### Bugs AI introduced, and how they were debugged

Eleven, recorded honestly in **[`AI-LOG.md`](AI-LOG.md)** with the symptom, the
root cause, and the fix for each. The most interesting ones:

- A random walk with no anchor, which drifted SBIN to −9.6% over a simulated
  session. Caught by a test; fixed with mean reversion.
- `▼ -1.02 (0.00%)` on NIFTY — the arrow and the percentage disagreed, because
  `-0 < 0` is `false` in JavaScript.
- A chart that looked like static rather than a price, because each step was
  independent of the last.
- A malformed API response crashing the whole app, because `as T` is an
  assertion rather than a check. Found by faking a bad response on purpose;
  fixed with real runtime guards at the network boundary.

---

## Project structure

```
.
├── web/
│   ├── app/
│   │   ├── api/market/route.ts          the "backend"
│   │   ├── api/history/[symbol]/route.ts
│   │   ├── page.tsx                     Server Component
│   │   └── globals.css                  design tokens
│   ├── components/                      JSX, minimal logic
│   │   └── states/                      loading / error / empty
│   ├── lib/                             logic, no JSX
│   │   ├── simulation.ts                how prices move
│   │   ├── api.ts                       typed fetch client
│   │   ├── use-market.ts                polling hook
│   │   └── __tests__/
│   ├── data/instruments.ts              the seed fixture
│   └── types/market.ts                  the API/UI contract
├── mobile/                              same shape, React Native
├── mcp-server/                          dev-time MCP server
├── AI-LOG.md                            development log
└── ASSIGNMENT.txt                       text extracted from the brief
```

The split that matters: **`lib/` holds logic with no JSX, `components/` holds
JSX with minimal logic.** Everything stays testable and nothing turns into a
600-line component.
