// Draw helpers: repetition, 50/75-move rule and dead-position (insufficient material) checks.
import { ALL_SQUARES, type Pieces } from './types';
import { isLightSquare } from './geometry';

export interface DrawInfo {
  /** How many times the current position has occurred. */
  repetitions: number;
  threefold: boolean; // may be CLAIMED
  fivefold: boolean; // automatic
  fifty: boolean; // may be CLAIMED (50 moves by each side = 100 plies)
  seventyFive: boolean; // automatic (150 plies)
  halfmoveClock: number;
}

/** Position identity: placement + side to move + castling + en passant (not the move counters). */
export const positionKey = (fen: string): string => fen.split(' ').slice(0, 4).join(' ');

export const halfmoveClockOf = (fen: string): number => Number(fen.split(' ')[4] ?? 0);

/** `fens` is every position of the game in order, the last one being the current position. */
export function evaluateDraws(fens: string[]): DrawInfo {
  const current = fens[fens.length - 1];
  const key = positionKey(current);
  const repetitions = fens.filter((f) => positionKey(f) === key).length;
  const clock = halfmoveClockOf(current);
  return {
    repetitions,
    threefold: repetitions >= 3,
    fivefold: repetitions >= 5,
    fifty: clock >= 100,
    seventyFive: clock >= 150,
    halfmoveClock: clock,
  };
}

/**
 * Dead position by the standard cases: K v K, K+minor v K, K+B v K+B with bishops on the same color.
 * Works on any piece map, so quizzes can use it.
 */
export function insufficientMaterial(pieces: Pieces): boolean {
  const others = ALL_SQUARES.filter((s) => pieces[s] && pieces[s]!.type !== 'k');
  if (others.length === 0) return true;
  if (others.some((s) => ['p', 'r', 'q'].includes(pieces[s]!.type))) return false;
  if (others.length === 1) return true; // a lone bishop or knight
  const allBishops = others.every((s) => pieces[s]!.type === 'b');
  if (allBishops) {
    const colors = new Set(others.map((s) => isLightSquare(s)));
    const sides = new Set(others.map((s) => pieces[s]!.color));
    return colors.size === 1 && sides.size === 2;
  }
  return false;
}
