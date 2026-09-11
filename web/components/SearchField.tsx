interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * A controlled input: React state is the single source of truth for what's in
 * the box, so clearing the query from anywhere updates the field too.
 */
export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <div className="p-3">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search symbol or company"
        aria-label="Search stocks by symbol or company name"
        className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
      />
    </div>
  );
}
