/**
 * Rows shaped like the real ones, so the layout doesn't jump when data lands.
 * A centred spinner would reflow the whole panel on arrival.
 */
export function LoadingRows({ count = 6 }: { count?: number }) {
  return (
    <ul className="divide-y divide-line" aria-busy="true" aria-label="Loading prices">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-center justify-between px-4 py-3.5">
          <span className="space-y-1.5">
            <span className="shimmer block h-3 w-20 rounded bg-elevated" />
            <span className="shimmer block h-2.5 w-32 rounded bg-elevated" />
          </span>
          <span className="space-y-1.5 text-right">
            <span className="shimmer ml-auto block h-3 w-16 rounded bg-elevated" />
            <span className="shimmer ml-auto block h-2.5 w-20 rounded bg-elevated" />
          </span>
        </li>
      ))}
    </ul>
  );
}
