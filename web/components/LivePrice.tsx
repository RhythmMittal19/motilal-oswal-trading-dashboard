import { cn } from "@/lib/cn";
import { formatPrice, type Direction } from "@/lib/format";

interface LivePriceProps {
  value: number;
  tick?: Direction;
  /**
   * Changes on every poll. A new key makes React replace the element, which
   * restarts the CSS animation — simpler than tracking animation state.
   */
  tickKey?: string;
  className?: string;
}

export function LivePrice({ value, tick, tickKey, className }: LivePriceProps) {
  return (
    <span
      key={tickKey}
      className={cn(
        "tnum -mx-1 rounded-sm px-1",
        tick === "up" && "flash-up",
        tick === "down" && "flash-down",
        className,
      )}
    >
      {formatPrice(value)}
    </span>
  );
}
