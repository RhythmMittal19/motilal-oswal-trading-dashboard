/**
 * The same palette the web app defines as CSS variables. React Native has no
 * stylesheet cascade, so the tokens live as a plain object instead.
 */
export const theme = {
  canvas: "#0a0c10",
  surface: "#12151c",
  elevated: "#1a1e27",
  line: "#232936",
  ink: "#e8ebf0",
  muted: "#8a94a6",

  // Semantic only: price direction, never decoration.
  up: "#0ecb81",
  down: "#f6465d",

  accent: "#4a7dff",
} as const;

export function colorFor(direction: "up" | "down" | "flat"): string {
  if (direction === "up") return theme.up;
  if (direction === "down") return theme.down;
  return theme.muted;
}
