/**
 * Created once at module scope. Building an Intl formatter is comparatively
 * expensive, and these run on every row on every tick.
 *
 * The en-IN locale groups in lakhs (12,48,000.00) rather than thousands,
 * which is what Indian users expect to see.
 */
const inr = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export type Direction = "up" | "down" | "flat";

export function directionOf(change: number): Direction {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

export function formatPrice(value: number): string {
  return inr.format(value);
}

/**
 * Signed from an explicit direction, not from the value's own sign.
 *
 * A -0.004% move rounds to -0, and `-0 < 0` is false in JavaScript, so
 * deriving the sign per value made the arrow, the change and the percentage
 * disagree with each other on small index moves.
 */
export function formatSigned(value: number, direction: Direction): string {
  const sign = direction === "up" ? "+" : direction === "down" ? "-" : "";
  return `${sign}${inr.format(Math.abs(value))}`;
}

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** The server sends UTC; traders read IST. */
export function formatClock(iso: string): string {
  return clock.format(new Date(iso));
}
