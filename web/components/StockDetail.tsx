"use client";

import { Delta } from "@/components/Delta";
import { IntradayChart } from "@/components/IntradayChart";
import { ErrorPanel } from "@/components/states/ErrorPanel";
import { directionOf, formatPrice } from "@/lib/format";
import type { HistoryState } from "@/lib/use-history";
import type { Quote } from "@/types/market";

interface StockDetailProps {
  quote: Quote;
  history: HistoryState;
  onBack: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted">{label}</dt>
      <dd className="tnum mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

export function StockDetail({ quote, history, onBack }: StockDetailProps) {
  // Yesterday's close is implied by the two numbers we already have, so the
  // API doesn't need to send it separately.
  const referencePrice = quote.price - quote.change;

  const prices = history.status === "ready" ? history.points.map((p) => p.price) : [];

  return (
    <div className="border border-line bg-surface">
      <div className="border-b border-line p-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 text-xs text-muted hover:text-ink lg:hidden"
        >
          ← Watchlist
        </button>

        <p className="font-mono text-sm font-semibold">{quote.symbol}</p>
        <p className="text-xs text-muted">{quote.name}</p>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="tnum text-3xl font-semibold">
            ₹{formatPrice(quote.price)}
          </span>
          <Delta
            change={quote.change}
            changePercent={quote.changePercent}
            className="text-sm"
          />
        </div>
      </div>

      <div className="p-4">
        {history.status === "loading" && (
          <div className="shimmer h-44 w-full rounded bg-elevated" />
        )}

        {history.status === "error" && (
          // Retrying is handled by reselecting the stock; the chart failing
          // shouldn't offer a button that reloads the whole dashboard.
          <ErrorPanel error={history.error} onRetry={onBack} />
        )}

        {history.status === "ready" && (
          <>
            <IntradayChart
              points={history.points}
              referencePrice={referencePrice}
              direction={directionOf(quote.change)}
            />

            <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
              <Stat label="Prev close" value={formatPrice(referencePrice)} />
              {/* The live price is included because history is fetched once
                  per selection while the price keeps ticking — otherwise the
                  current price can drift above the stated day high. */}
              <Stat
                label="Day high"
                value={formatPrice(Math.max(...prices, quote.price))}
              />
              <Stat
                label="Day low"
                value={formatPrice(Math.min(...prices, quote.price))}
              />
            </dl>
          </>
        )}
      </div>
    </div>
  );
}

