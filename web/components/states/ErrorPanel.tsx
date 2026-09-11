import type { ApiError } from "@/types/market";

interface ErrorPanelProps {
  error: ApiError;
  onRetry: () => void;
}

/**
 * Shows the server's own message, never a stack trace. The code is included
 * because it is the thing worth quoting in a bug report.
 */
export function ErrorPanel({ error, onRetry }: ErrorPanelProps) {
  return (
    <div role="alert" className="px-4 py-10 text-center">
      <p className="text-sm font-medium">Couldn&apos;t load market data</p>
      <p className="mt-1 text-xs text-muted">{error.message}</p>
      <p className="mt-0.5 font-mono text-[10px] text-muted/70">{error.code}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md border border-line bg-elevated px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Try again
      </button>
    </div>
  );
}
