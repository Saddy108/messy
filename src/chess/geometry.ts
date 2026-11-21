// Square maths: coordinates, lines between squares, colors of squares.
import { FILES, type Square, type File, type Rank } from './types';

export const fileIdx = (s: Square): number => FILES.indexOf(s[0] as File);
export const rankNum = (s: Square): number => Number(s[1]);
export const sq = (f: number, r: number): Square | null =>
  f < 0 || f > 7 || r < 1 || r > 8 ? null : (`${FILES[f]}${r as Rank}` as Square);

/** a1 is dark, h1 is light. A square is light when (file index + rank) is even. */
export const isLightSquare = (s: Square): boolean => (fileIdx(s) + rankNum(s)) % 2 === 0;

/** Squares strictly between two squares on a straight/diagonal line. Empty if not aligned. */
export function between(a: Square, b: Square): Square[] {
  const df = fileIdx(b) - fileIdx(a);
  const dr = rankNum(b) - rankNum(a);
  if (!(df === 0 || dr === 0 || Math.abs(df) === Math.abs(dr))) return [];
  const sf = Math.sign(df);
  const sr = Math.sign(dr);
  const out: Square[] = [];
  let f = fileIdx(a) + sf;
  let r = rankNum(a) + sr;
  while (f !== fileIdx(b) || r !== rankNum(b)) {
    out.push(sq(f, r) as Square);
    f += sf;
    r += sr;
  }
  return out;
}

/** The line from a to b including both ends (just both squares if not aligned). */
export function lineWithEnds(a: Square, b: Square): Square[] {
  return [a, ...between(a, b), b];
}

export const KNIGHT_DELTAS: [number, number][] = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
];
export const KING_DELTAS: [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
];
export const ROOK_DIRS: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const BISHOP_DIRS: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

export const squareToWords = (s: Square): string => s;
