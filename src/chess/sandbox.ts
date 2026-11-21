// Sandbox move generator for lesson positions with few pieces (no kings or check needed).
// Pieces move by their normal pattern; blocking and capturing work; check is ignored.
import {
  ALL_SQUARES, type Color, type Piece, type PieceType, type Pieces, type Square, other,
} from './types';
import { BISHOP_DIRS, KING_DELTAS, KNIGHT_DELTAS, ROOK_DIRS, fileIdx, rankNum, sq } from './geometry';

export interface SandboxMove {
  from: Square;
  to: Square;
  capture: boolean;
  promotion?: boolean;
}

/** Parse the piece-placement part of a FEN (works without kings). */
export function parsePlacement(fen: string): Pieces {
  const placement = fen.split(' ')[0];
  const rows = placement.split('/');
  if (rows.length !== 8) throw new Error(`Bad FEN rows: ${fen}`);
  const pieces: Pieces = {};
  rows.forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else {
        const s = sq(f, 8 - i);
        if (!s || !/[pnbrqkPNBRQK]/.test(ch)) throw new Error(`Bad FEN char in ${fen}`);
        pieces[s] = { type: ch.toLowerCase() as PieceType, color: ch === ch.toUpperCase() ? 'w' : 'b' };
        f++;
      }
    }
    if (f !== 8) throw new Error(`Bad FEN row width: ${fen}`);
  });
  return pieces;
}

export function turnFromFen(fen: string): Color {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

export const piecesToPlacement = (pieces: Pieces): string => {
  const rows: string[] = [];
  for (let r = 8; r >= 1; r--) {
    let row = '';
    let empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = pieces[sq(f, r) as Square];
      if (!p) empty++;
      else {
        if (empty) row += empty;
        empty = 0;
        row += p.color === 'w' ? p.type.toUpperCase() : p.type;
      }
    }
    rows.push(row + (empty || ''));
  }
  return rows.join('/');
};

const forwardDir = (c: Color): number => (c === 'w' ? 1 : -1);
export const startRank = (c: Color): number => (c === 'w' ? 2 : 7);
export const lastRank = (c: Color): number => (c === 'w' ? 8 : 1);

/** All moves for the piece on `from`. */
export function sandboxMoves(pieces: Pieces, from: Square): SandboxMove[] {
  const piece = pieces[from];
  if (!piece) return [];
  const out: SandboxMove[] = [];
  const f0 = fileIdx(from);
  const r0 = rankNum(from);
  const add = (s: Square | null): boolean => {
    // returns true if the ray may continue
    if (!s) return false;
    const t = pieces[s];
    if (t && t.color === piece.color) return false;
    out.push({ from, to: s, capture: !!t });
    return !t;
  };
  const slide = (dirs: [number, number][]) => {
    for (const [df, dr] of dirs) {
      let f = f0 + df;
      let r = r0 + dr;
      while (add(sq(f, r))) {
        f += df;
        r += dr;
      }
    }
  };
  switch (piece.type) {
    case 'r': slide(ROOK_DIRS); break;
    case 'b': slide(BISHOP_DIRS); break;
    case 'q': slide([...ROOK_DIRS, ...BISHOP_DIRS]); break;
    case 'n': KNIGHT_DELTAS.forEach(([df, dr]) => add(sq(f0 + df, r0 + dr))); break;
    case 'k': KING_DELTAS.forEach(([df, dr]) => add(sq(f0 + df, r0 + dr))); break;
    case 'p': {
      const d = forwardDir(piece.color);
      const one = sq(f0, r0 + d);
      if (one && !pieces[one]) {
        out.push({ from, to: one, capture: false });
        const two = sq(f0, r0 + 2 * d);
        if (r0 === startRank(piece.color) && two && !pieces[two]) out.push({ from, to: two, capture: false });
      }
      for (const df of [-1, 1]) {
        const t = sq(f0 + df, r0 + d);
        if (t && pieces[t] && pieces[t]!.color !== piece.color) out.push({ from, to: t, capture: true });
      }
      break;
    }
  }
  return out.map((m) => (piece.type === 'p' && rankNum(m.to) === lastRank(piece.color) ? { ...m, promotion: true } : m));
}

/** Squares the piece on `from` attacks/can reach (same as moves, plus pawn diagonals). */
export function sandboxTargets(pieces: Pieces, from: Square): Square[] {
  return sandboxMoves(pieces, from).map((m) => m.to);
}

/** Apply a move (no legality check beyond the caller's). Pawns reaching the last rank become queens. */
export function sandboxApply(pieces: Pieces, from: Square, to: Square, promoteTo: PieceType = 'q'): Pieces {
  const next: Pieces = { ...pieces };
  const p = next[from] as Piece;
  delete next[from];
  next[to] = p.type === 'p' && rankNum(to) === lastRank(p.color) ? { ...p, type: promoteTo } : p;
  return next;
}

export const piecesOf = (pieces: Pieces, color: Color): Square[] =>
  ALL_SQUARES.filter((s) => pieces[s]?.color === color);

export const countPieces = (pieces: Pieces, color: Color): number => piecesOf(pieces, color).length;

/** Is the square attacked by `by` in the sandbox sense (ignores pins/check)? */
export function sandboxAttacked(pieces: Pieces, target: Square, by: Color): boolean {
  return piecesOf(pieces, by).some((s) => {
    const p = pieces[s] as Piece;
    if (p.type === 'p') {
      const d = forwardDir(p.color);
      return rankNum(target) === rankNum(s) + d && Math.abs(fileIdx(target) - fileIdx(s)) === 1;
    }
    // Treat target as enemy-occupied so slides can end on it.
    const probe = { ...pieces, [target]: { type: 'p', color: other(by) } as Piece };
    return sandboxMoves(probe, s).some((m) => m.to === target);
  });
}
