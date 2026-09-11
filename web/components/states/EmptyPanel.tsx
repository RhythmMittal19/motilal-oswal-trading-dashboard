interface EmptyPanelProps {
  title: string;
  description: string;
}

/** One component for "nothing here yet" and "nothing matched" — same shape, different words. */
export function EmptyPanel({ title, description }: EmptyPanelProps) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  );
}
