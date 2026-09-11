import { cn } from "@/lib/cn";
import type { MarketStatus } from "@/types/market";

const LABELS: Record<MarketStatus, string> = {
  OPEN: "Market open",
  PRE_OPEN: "Pre-open",
  CLOSED: "Market closed",
};

export function MarketStatusPill({ status }: { status: MarketStatus }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          status === "OPEN" && "bg-up",
          status === "PRE_OPEN" && "bg-accent",
          status === "CLOSED" && "bg-muted",
        )}
      />
      {LABELS[status]}
    </span>
  );
}
