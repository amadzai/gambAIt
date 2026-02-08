/**
 * Mapping from the first white move to an opening name.
 * Supports both SAN (e4, Nf3) and UCI (e2e4, g1f3) formats since the
 * backend stores agent openings in UCI while move history uses SAN.
 */
export const OPENING_NAMES: Record<string, string> = {
  // SAN keys (used by move history)
  e4: "King's Pawn Opening",
  d4: "Queen's Gambit",
  c4: 'English Opening',
  Nf3: 'Reti Opening',
  g3: "King's Fianchetto Opening",
  b3: "Larsen's Opening",
  f4: "Bird's Opening",
  // UCI keys (used by agent.opening from backend)
  e2e4: "King's Pawn Opening",
  d2d4: "Queen's Gambit",
  c2c4: 'English Opening',
  g1f3: 'Reti Opening',
  g2g3: "King's Fianchetto Opening",
  b2b3: "Larsen's Opening",
  f2f4: "Bird's Opening",
};

export function getOpeningName(move: string | undefined): string {
  if (!move) return 'Unknown';
  return OPENING_NAMES[move] ?? 'Uncommon Opening';
}
