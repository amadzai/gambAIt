export type Playstyle = "Aggressive" | "Defensive" | "Balanced" | "Chaotic" | "Positional";

export type FirstMove = "e4" | "d4" | "c4" | "Nf3" | "g3" | "b3" | "f4";

export interface ChessAgent {
  id: string;
  name: string;
  personality: string;
  playstyle: Playstyle;
  firstMove: FirstMove;
  marketCap: number; // equals ELO
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  owner: string; // wallet address
  createdAt: Date;
}
