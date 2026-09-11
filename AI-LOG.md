# AI development log

Every issue below actually occurred during this build, in the order it
occurred. Nothing here is invented to look thorough.

**AI assistant:** Claude (Claude Code).

---

## 1 — Next.js 16 changed an API my recall was wrong about

**Feature:** API route handlers.

**What happened:** Before writing `/api/history/[symbol]`, I checked the docs
bundled at `node_modules/next/dist/docs/` rather than writing from memory. Two
things were different from what I would have written:

- `params` is now a `Promise` and must be awaited.
- `GET` handlers are no longer cached by default (changed in 15.0.0-RC).

**Why it mattered:** `params.symbol` is correct for Next 13/14 and is what most
AI-generated Next.js code still produces. It fails in 16.

**How it was caught:** Read the primary source before writing the code. This is
the cheapest kind of verification — no bug ever existed.

**What I learned:** When a framework's own `AGENTS.md` says "this is NOT the
Next.js you know", believe it. Recall is training data, not documentation.

---

## 2 — The random walk had nothing anchoring it

**Feature:** Price simulation.

**AI generated:** A straightforward random walk — each tick nudges the price by
a random amount scaled to the instrument's volatility.

**What I verified:** Wrote a test asserting that after one simulated trading
session (~11,250 ticks at 2s each) no instrument has moved more than ±5%.

**Problem discovered:** It failed.

```
expected [ 'INFY -6.6%', …(2) ] to deeply equal []
+ [ "INFY -6.6%", "ICICIBANK -5.5%", "SBIN -9.6%" ]
```

A random walk is unbiased but unbounded — given enough steps it wanders
arbitrarily far. Real intraday prices oscillate around a level instead.

**How it was fixed:** Added a mean-reversion term that pulls the price back
toward the previous close in proportion to how far it has strayed, plus a hard
clamp at ±2× the day's expected range as a safety net.

```ts
const noise = (Math.random() - 0.5) * dailyRange * 0.12;
const reversion = (seed.previousClose - current) * REVERSION;
const next = Math.min(ceiling, Math.max(floor, current + noise + reversion));
```

**What I learned:** This is the clearest case in the project for testing pure
logic. The bug is invisible over ten seconds of watching the screen and
obvious over a simulated six-hour session. Only a test finds that.

---

## 3 — My own test was wrong, not the code

**Feature:** Quote rounding.

**What happened:** I rounded prices to two decimals at the API boundary, and
the existing test immediately failed:

```
expected -0.57 to be close to -0.5675376991907597, expected 5e-7
```

**Problem discovered:** The test asserted six decimal places of precision
against a value that is deliberately rounded to two. The code was right; the
assertion was wrong.

**How it was fixed:** Rewrote the test to assert the actual contract — that
`change` equals `round2(price - previousClose)` exactly — rather than an
arbitrary precision.

**What I learned:** A failing test is not automatically a bug in the code. The
useful question is "which of these two is stating the intended behaviour?"

---

## 4 — Every instrument opened at exactly +0.00%

**Feature:** Initial simulation state.

**What happened:** `curl`ing `/api/market` showed every single instrument at
`change: 0, changePercent: 0`.

**Problem discovered:** Not a logic error — the simulation started every price
at its previous close, so before the first tick nothing had moved. Correct
code, but a dashboard where all 17 rows read `+0.00%` looks broken on first
load. You don't open a trading app at the exact opening bell.

**How it was fixed:** Seeded opening prices spread across each instrument's
daily range, so the first paint shows a realistic mix of gainers and losers.

**What I learned:** "Correct" and "looks right" are different bars. Checking
the API output with `curl` before building any UI is what surfaced it.

---

## 5 — Inconsistent rounding between two endpoints

**Feature:** Intraday history endpoint.

**What happened:** Reading the `curl` output for `/api/history/RELIANCE`:

```json
{ "time": "09:15", "price": 1406.3821338224457 }
```

**Problem discovered:** Quotes were rounded to two decimals but the history
series was not. Two endpoints in the same API returning numbers in different
formats is a contract inconsistency a client would eventually trip over.

**How it was fixed:** Applied the same `round2` at the series boundary.

**What I learned:** Reading raw API responses catches things the UI hides —
the chart would have rendered those floats perfectly happily.

---

## 6 — ESLint caught a React anti-pattern that "worked"

**Feature:** The data-fetching hooks.

**AI generated:** A hook that calls `setState({ status: "loading" })` at the
top of its effect to reset state when the symbol changes.

**What I verified:** `npx eslint lib/`.

```
Avoid calling setState() directly within an effect
react-hooks/set-state-in-effect
```

**Problem discovered:** It worked, but caused an extra render pass on every
change — render, effect fires, setState, render again.

**How it was fixed:** Not by suppressing the rule. The better design is to stop
*storing* "loading" and instead **derive** it: having no result for the current
symbol *is* the loading state.

```ts
return entry?.symbol === symbol ? entry.state : { status: "loading" };
```

**What I learned:** A lint rule pointing at working code is often pointing at a
design problem. The fix removed state rather than adding a suppression comment.

---

## 7 — The arrow and the percentage disagreed

**Feature:** Change and percentage display.

**What happened:** Visible only in a screenshot of the running app:

```
NIFTY 50   24,835.28   ▼ -1.02 (0.00%)
```

**Problem discovered:** `-1.02 / 24836.3 × 100 = -0.0041%`, which rounds to
`-0`. The sign was being derived from each value independently, and in
JavaScript **`-0 < 0` is `false`** — so the percentage got no minus sign while
the arrow and the absolute change both said "down".

**How it was fixed:** Derive every sign from a single `Direction` computed once
from `change`, instead of from each value's own sign.

```ts
export function formatSigned(value: number, direction: Direction): string {
  const sign = direction === "up" ? "+" : direction === "down" ? "-" : "";
  return `${sign}${inr.format(Math.abs(value))}`;
}
```

Regression tests added for both the `-0` case and the flat case.

**What I learned:** Negative zero is a real JavaScript trap, and it only shows
up when a small value meets a rounding step — exactly the case for an index
worth 24,000 points. No type checker would have caught this; only looking at
the screen did.

---

## 8 — The chart looked like static, not a price

**Feature:** Intraday series generation.

**What happened:** The chart rendered correctly but looked wrong — a dense
zig-zag with no shape, nothing like a real intraday chart.

**Problem discovered:** Each 5-minute step drew an independent random number.
Independent samples produce noise. Real prices have **momentum**: a move in one
direction tends to continue for a while.

**How it was fixed:** Made each step carry most of the previous step's move
forward — an AR(1) process — so the line trends instead of oscillating.

```ts
move = move * MOMENTUM + shock;   // MOMENTUM = 0.7
```

**What I learned:** "Random" and "realistic" are not the same thing. The fix
was three lines and transformed how the whole product reads.

---

## 9 — The day high could sit below the current price

**Feature:** Stock detail statistics.

**What happened:** Spotted while comparing two screenshots taken a minute
apart: the live price kept updating while "Day high" did not.

**Problem discovered:** History is fetched **once** per selection; the quote
polls every **2 seconds**. Given enough time the live price can climb past the
day high computed at selection time, showing a self-contradictory panel.

**How it was fixed:** Include the live price in the calculation.

```tsx
value={formatPrice(Math.max(...prices, quote.price))}
```

**What I learned:** Whenever two pieces of data on one screen refresh at
different rates, ask what happens when they disagree. That is where this class
of bug lives.

---

## 10 — "No stock selected" while a stock was selected

**Feature:** Error state.

**What happened:** With MARUTI selected, toggling the failure switch made the
detail panel say *"No stock selected."*

**Problem discovered:** `selectedSymbol` was still set, but the quote lookup
returned `undefined` because there was no snapshot to look it up in. The empty
state conflated two different situations: "you haven't picked anything" and
"we can't reach the data for what you picked".

**How it was fixed:** Distinguished them.

```tsx
{selectedSymbol
  ? <EmptyPanel title="Price unavailable" … />
  : <EmptyPanel title="No stock selected" … />}
```

**What I learned:** Empty states carry meaning. Showing the wrong one tells the
user something false about their own actions.

---

## Summary

| # | Found by | Would other checks have caught it? |
| --- | --- | --- |
| 1 | Reading primary docs | No — the code compiles and fails at runtime |
| 2 | Unit test | No — invisible without simulating a full session |
| 3 | Unit test | n/a — the test itself was the bug |
| 4 | `curl` on the API | No — types and tests both pass |
| 5 | `curl` on the API | No — the UI renders unrounded floats fine |
| 6 | ESLint | No — the code worked |
| 7 | Looking at the screen | No — no type or test error |
| 8 | Looking at the screen | No — mathematically valid output |
| 9 | Comparing two screenshots | No — needs elapsed time to appear |
| 10 | Clicking through the demo | No — needs a specific interaction order |

Four different verification methods, and **each one caught bugs the others
could not**. The screen caught three that no automated check would have; the
tests caught one that no amount of watching would have.
