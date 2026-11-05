/** Posições do mockup de ranking: maior pontuação primeiro; empate mantém a ordem de entrada. */
export function ranksOf(points: Readonly<Record<string, number>>, order: readonly string[]): Record<string, number> {
  const sorted = [...order].sort((a, b) => (points[b] ?? 0) - (points[a] ?? 0));
  return Object.fromEntries(sorted.map((id, index) => [id, index + 1]));
}

export type Movement = "up" | "down" | "same";

export function movementOf(previousRank: number | undefined, rank: number): Movement {
  if (previousRank === undefined || previousRank === rank) return "same";
  return rank < previousRank ? "up" : "down";
}

export const MOVEMENT_GLYPH: Record<Movement, string> = { up: "▲", down: "▼", same: "–" };
