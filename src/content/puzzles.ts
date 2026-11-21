// Tactics puzzles (White to move). Used by Stage 11, the Daily Puzzle and the mixed sets.
// Every puzzle is checked by tests/lessons/puzzles.test.ts: the solution is legal and is the engine's top choice.
export type Theme = 'fork' | 'pin' | 'skewer' | 'discovered' | 'double' | 'defender';

export interface Puzzle {
  id: string;
  theme: Theme;
  fen: string;
  /** Winning first move in UCI. */
  solution: string;
  /** Alternative winning first moves that are also accepted. */
  alts?: string[];
  explain: string;
}

export const THEME_NAMES: Record<Theme, string> = {
  fork: 'Fork',
  pin: 'Pin',
  skewer: 'Skewer',
  discovered: 'Discovered attack',
  double: 'Double attack',
  defender: 'Removing the defender',
};

export const PUZZLES: Puzzle[] = [
  { id: 'fork-1', theme: 'fork', fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', solution: 'b5c7', explain: 'The knight jumps to c7 and attacks the king and the rook at once. Black must save the king, so the rook falls.' },
  { id: 'fork-2', theme: 'fork', fen: 'r5k1/8/8/8/8/8/8/3QK3 w - - 0 1', solution: 'd1d5', explain: 'The queen checks the king from d5 and attacks the rook on a8 at the same time.' },
  { id: 'fork-3', theme: 'fork', fen: 'q3k3/8/8/3N4/8/8/8/4K3 w - - 0 1', solution: 'd5c7', explain: 'The knight on c7 checks the king and attacks the queen. The queen is lost.' },
  { id: 'pin-1', theme: 'pin', fen: '4k3/3n4/8/8/8/8/8/4KB2 w - - 0 1', solution: 'f1b5', explain: 'The bishop pins the knight to the king. The knight cannot move, so it will be attacked more.' },
  { id: 'skewer-1', theme: 'skewer', fen: 'r2k4/8/8/8/8/8/8/4K2R w - - 0 1', solution: 'h1h8', explain: 'The rook checks the king. When the king steps aside, the rook behind it is captured.' },
  { id: 'skewer-2', theme: 'skewer', fen: '8/6B1/3k4/8/1r6/8/8/4K3 w - - 0 1', solution: 'g7f8', explain: 'The bishop checks the king along the diagonal. After the king moves, the bishop takes the rook behind it.' },
  { id: 'double-1', theme: 'double', fen: '4k3/8/8/1n3b2/8/8/8/3QK3 w - - 0 1', solution: 'd1h5', explain: 'Qh5+ checks the king and attacks the bishop on f5. Black saves the king, and White takes the bishop.' },
  { id: 'double-2', theme: 'double', fen: '4k3/8/8/p3p3/8/8/8/3QK3 w - - 0 1', solution: 'd1h5', explain: 'Qh5+ checks the king and attacks the pawn on e5 at the same time.' },
  { id: 'disc-1', theme: 'discovered', fen: '4k3/3q4/8/8/4N3/8/8/4RK2 w - - 0 1', solution: 'e4f6', explain: 'The knight moves away and uncovers a check from the rook. It also checks the king and attacks the queen. Double check!' },
];

/** The Daily Puzzle: the same puzzle for everyone on a given day (works offline). */
export const dailyPuzzle = (dayNumber: number): Puzzle => PUZZLES[((dayNumber % PUZZLES.length) + PUZZLES.length) % PUZZLES.length];
