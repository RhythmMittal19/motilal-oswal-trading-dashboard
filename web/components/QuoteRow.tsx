import { Delta } from "@/components/Delta";
import { LivePrice } from "@/components/LivePrice";
import { cn } from "@/lib/cn";
import type { Direction } from "@/lib/format";
import type { Quote } from "@/types/market";

interface QuoteRowProps {
  quote: Quote;
  tick?: Direction;
  tickKey: string;
  selected: boolean;
  onSelect: (symbol: string) => void;
}

/**
 * A real <button>, not a clickable <div>: keyboard focus, Enter and Space all
 * work without reimplementing them.
 */
export function QuoteRow({
  quote,
  tick,
  tickKey,
  selected,
  onSelect,
}: QuoteRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(quote.symbol)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-center justify-between gap-3 border-l-2 px-4 py-3 text-left transition-colors",
        "hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
        selected ? "border-accent bg-elevated" : "border-transparent",
      )}
    >
      <span className="min-w-0">
        <span className="block font-mono text-[13px] font-medium">
          {quote.symbol}
        </span>
        <span className="block truncate text-[11px] text-muted">
          {quote.name}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <LivePrice
          value={quote.price}
          tick={tick}
          tickKey={tickKey}
          className="block text-sm font-medium"
        />
        <Delta
          change={quote.change}
          changePercent={quote.changePercent}
          className="text-[11px]"
        />
      </span>
    </button>
  );
}
