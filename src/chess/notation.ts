// Standard Algebraic Notation helpers and the notation trainer's building blocks.
import { PIECE_NAMES, colorName, type PieceType } from './types';
import type { LegalMove } from './rules';
import { Game } from './rules';

export const PIECE_LETTERS: Record<Exclude<PieceType, 'p'>, string> = { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N' };

/** Strip check/mate marks and annotation symbols; accept zero-castling and lowercase piece letters from typing. */
export function normalizeSan(input: string): string {
  let s = input.trim().replace(/[+#!?]/g, '');
  s = s.replace(/^[0oO]-[0oO]-[0oO]$/, 'O-O-O').replace(/^[0oO]-[0oO]$/, 'O-O');
  // Typed "nf3": a leading lowercase n/r/q/k followed by a square is a piece. 'b' stays a pawn file.
  if (/^[nrqk][a-h1-8x]/.test(s)) s = s[0].toUpperCase() + s.slice(1);
  return s;
}

/** Do two SAN strings mean the same move (ignoring + # ! ?)? */
export const sameSan = (a: string, b: string): boolean => normalizeSan(a) === normalizeSan(b);

/** Plain-words description used for screen readers and commentary. */
export function moveWords(m: LegalMove): string {
  const who = `${colorName(m.color)} ${PIECE_NAMES[m.piece]}`;
  if (m.castle) return `${colorName(m.color)} castles ${m.castle}side${m.mate ? ', checkmate' : m.check ? ', check' : ''}`;
  let s = `${who} from ${m.from} to ${m.to}`;
  if (m.capture) s += m.enPassant ? ', captures en passant' : ', captures';
  if (m.promotion) s += `, promotes to ${PIECE_NAMES[m.promotion]}`;
  if (m.mate) s += ', checkmate';
  else if (m.check) s += ', check';
  return s;
}

/** Explain how a SAN string is built, piece by piece (for the "Speak Chess" lessons). */
export function explainSan(san: string): string {
  const parts: string[] = [];
  const clean = san.replace(/[+#]/g, '');
  if (clean === 'O-O') parts.push('O-O = castle kingside');
  else if (clean === 'O-O-O') parts.push('O-O-O = castle queenside');
  else {
    const first = clean[0];
    if (/[KQRBN]/.test(first)) parts.push(`${first} = ${PIECE_NAMES[first.toLowerCase() as PieceType]}`);
    else parts.push('no letter = pawn');
    if (clean.includes('x')) parts.push('x = capture');
    const dest = clean.match(/([a-h][1-8])(=[QRBN])?$/);
    if (dest) parts.push(`${dest[1]} = destination square`);
    if (dest?.[2]) parts.push(`${dest[2]} = promotes to ${PIECE_NAMES[dest[2][1].toLowerCase() as PieceType]}`);
  }
  if (san.includes('#')) parts.push('# = checkmate');
  else if (san.includes('+')) parts.push('+ = check');
  return parts.join(' · ');
}

/** Wrong-answer options for "pick the correct notation": other legal moves in the position. */
export function sanDistractors(game: Game, correct: LegalMove, count = 3, seed = 1): string[] {
  const others = game
    .legalMoves()
    .filter((m) => m.san !== correct.san)
    // prefer moves that look similar: same destination, or same piece type
    .sort((a, b) => score(b, correct) - score(a, correct) || a.san.localeCompare(b.san));
  const picked = others.slice(0, Math.max(count * 2, count));
  // deterministic shuffle by seed so tests/e2e are stable
  const out = picked.map((m, i) => ({ san: m.san, k: (i * 7919 + seed * 104729) % 1013 })).sort((a, b) => a.k - b.k);
  return out.slice(0, count).map((o) => o.san);
}
const score = (m: LegalMove, ref: LegalMove): number =>
  (m.to === ref.to ? 3 : 0) + (m.piece === ref.piece ? 2 : 0) + (m.from === ref.from ? 1 : 0);

/** Replay a list of SAN moves, returning the game and each move (throws on illegal SAN). */
export function replay(sans: string[], fen?: string): { game: Game; moves: LegalMove[] } {
  const game = new Game(fen);
  const moves: LegalMove[] = [];
  for (const s of sans) {
    const m = game.moveSan(s);
    if (!m) throw new Error(`Illegal move ${s}`);
    moves.push(m);
  }
  return { game, moves };
}

/** Format a move list as "1. e4 e5 2. Nf3 Nc6". */
export function formatMoveList(sans: string[], startNumber = 1): string {
  const out: string[] = [];
  sans.forEach((s, i) => {
    if (i % 2 === 0) out.push(`${startNumber + i / 2}.`);
    out.push(s);
  });
  return out.join(' ');
}
