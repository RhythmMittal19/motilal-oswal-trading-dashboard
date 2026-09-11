import { Delta } from "@/components/Delta";
import { LivePrice } from "@/components/LivePrice";
import type { Direction } from "@/lib/format";
import type { Quote } from "@/types/market";

interface IndexTickerProps {
  indices: Quote[];
  ticks: Record<string, Direction>;
  tickKey: string;
}

/**
 * A band rather than three cards. Cards read as a generic dashboard; a strip
 * of indices across the top is what a trading product actually looks like.
 */
export function IndexTicker({ indices, ticks, tickKey }: IndexTickerProps) {
  return (
    <div className="no-scrollbar flex gap-px overflow-x-auto border-y border-line bg-line">
      {indices.map((index) => (
        <div
          key={index.symbol}
          className="flex min-w-max flex-1 items-baseline gap-3 bg-canvas px-4 py-3"
        >
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {index.name}
          </span>
          <LivePrice
            value={index.price}
            tick={ticks[index.symbol]}
            tickKey={tickKey}
            className="text-sm font-semibold"
          />
          <Delta
            change={index.change}
            changePercent={index.changePercent}
            className="text-[11px]"
          />
        </div>
      ))}
    </div>
  );
}
