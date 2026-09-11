import { cn } from "@/lib/cn";
import { directionOf, formatSigned } from "@/lib/format";

interface DeltaProps {
  change: number;
  changePercent: number;
  className?: string;
}

/**
 * The arrow and the sign carry the meaning as well as the colour, so this
 * still reads correctly to someone who can't distinguish red from green.
 */
export function Delta({ change, changePercent, className }: DeltaProps) {
  const direction = directionOf(change);

  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-1",
        direction === "up" && "text-up",
        direction === "down" && "text-down",
        direction === "flat" && "text-muted",
        className,
      )}
    >
      <span aria-hidden="true">
        {direction === "up" ? "▲" : direction === "down" ? "▼" : "–"}
      </span>
      {formatSigned(change, direction)} ({formatSigned(changePercent, direction)}%)
    </span>
  );
}
