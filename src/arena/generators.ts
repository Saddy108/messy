// Position and question generators for the mini-games (all deterministic when given a seeded rng).
import { Chess } from 'chess.js';
import { MATE_PUZZLES } from '../content/matePuzzles';
import { Game } from '../chess/rules';
import { KNIGHT_DELTAS, fileIdx, rankNum, sq } from '../chess/geometry';
import { ALL_SQUARES, PIECE_NAMES, type Square } from '../chess/types';
import { hangingPieces } from './analysis';

export type Rng = () => number;

/** Small seeded generator (mulberry32). */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(list: T[], rng: Rng): T => list[Math.floor(rng() * list.length)];

/** Swap colors and flip the board, so a White puzzle becomes a Black one. */
export function mirrorFen(fen: string): string {
  const [placement, turn, castling, ep] = fen.split(' ');
  const rows = placement.split('/').reverse().map((r) => r.replace(/[a-zA-Z]/g, (c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())));
  const cs = castling === '-' ? '-' : castling.split('').map((c) => (c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())).sort((a, b) => 'KQkq'.indexOf(a) - 'KQkq'.indexOf(b)).join('');
  const e = ep === '-' ? '-' : ep[0] + (9 - Number(ep[1]));
  return `${rows.join('/')} ${turn === 'w' ? 'b' : 'w'} ${cs} ${e} 0 1`;
}

// ---------- Win, Lose or Draw? ----------
export interface Ending {
  fen: string;
  result: 'White wins' | 'Black wins' | 'Draw';
  why: string;
}

const STALEMATES = [
  '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1',
  'k7/2Q5/1K6/8/8/8/8/8 b - - 0 1',
  '8/8/8/8/8/1q6/2k5/K7 w - - 0 1',
];
const INSUFFICIENT = [
  '8/8/4k3/8/8/3K4/8/8 w - - 0 1',
  '8/8/4k3/8/8/3KB3/8/8 w - - 0 1',
  '8/8/4k3/8/8/3KN3/8/8 b - - 0 1',
  '8/8/4kb2/8/8/3KB3/8/8 w - - 0 1',
  '8/8/4kn2/8/8/3K4/8/8 b - - 0 1',
];

export function endings(): Ending[] {
  const list: Ending[] = [];
  MATE_PUZZLES.forEach((p, i) => {
    const g = new Game(p.fen);
    g.move(p.answer.slice(0, 2) as Square, p.answer.slice(2, 4) as Square);
    list.push({ fen: g.fen(), result: 'White wins', why: 'Checkmate: Black is in check and cannot escape.' });
    if (i % 2 === 0) {
      const m = mirrorFen(g.fen());
      list.push({ fen: m, result: 'Black wins', why: 'Checkmate: White is in check and cannot escape.' });
    }
  });
  [...STALEMATES, ...STALEMATES.slice(0, 2).map(mirrorFen)].forEach((f) => {
    if (Game.isValidFen(f) && new Game(f).isStalemate()) list.push({ fen: f, result: 'Draw', why: 'Stalemate: the player to move is not in check but has no legal move.' });
  });
  INSUFFICIENT.forEach((f) => {
    if (Game.isValidFen(f) && new Game(f).end().over) list.push({ fen: f, result: 'Draw', why: 'Neither side has enough pieces to checkmate.' });
  });
  return list;
}

// ---------- Safe or Hanging? ----------
export interface HangingQuestion {
  fen: string;
  /** Black pieces that White can win material from. */
  answer: Square[];
}

export function randomHangingQuestion(rng: Rng): HangingQuestion {
  for (let tries = 0; tries < 500; tries++) {
    const taken = new Set<Square>();
    const put = (): Square => {
      let s = pick(ALL_SQUARES, rng);
      while (taken.has(s)) s = pick(ALL_SQUARES, rng);
      taken.add(s);
      return s;
    };
    const board: Partial<Record<Square, string>> = { [put()]: 'K', [put()]: 'k' };
    ['Q', 'R', 'B', 'N', 'N', 'B'].sort(() => rng() - 0.5).slice(0, 2 + Math.floor(rng() * 2)).forEach((p) => (board[put()] = p));
    ['n', 'b', 'r', 'p', 'p', 'q'].sort(() => rng() - 0.5).slice(0, 3 + Math.floor(rng() * 2)).forEach((p) => {
      const s = put();
      if (p === 'p' && (s[1] === '1' || s[1] === '8')) return;
      board[s] = p;
    });
    const rows: string[] = [];
    for (let r = 8; r >= 1; r--) {
      let row = '';
      let e = 0;
      for (const f of 'abcdefgh') {
        const p = board[`${f}${r}` as Square];
        if (!p) e++;
        else {
          if (e) row += e;
          e = 0;
          row += p;
        }
      }
      rows.push(row + (e || ''));
    }
    const fen = `${rows.join('/')} w - - 0 1`;
    if (!Game.isValidFen(fen) || new Chess(fen.replace(' w ', ' b ')).isCheck() || new Game(fen).inCheck()) continue;
    const g = new Game(fen);
    const answer = hangingPieces(g, 'b').map((h) => h.square);
    // keep it readable: at least one answer, at most three
    if (answer.length >= 1 && answer.length <= 3) return { fen, answer };
  }
  // fallback (never expected): a known position
  return { fen: '4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1', answer: ['d5'] };
}

// ---------- Knight Jumper ----------
export function knightDistance(from: Square, to: Square): number {
  if (from === to) return 0;
  let frontier: Square[] = [from];
  const seen = new Set<Square>([from]);
  for (let d = 1; d <= 6; d++) {
    const next: Square[] = [];
    for (const s of frontier) {
      for (const [df, dr] of KNIGHT_DELTAS) {
        const t = sq(fileIdx(s) + df, rankNum(s) + dr);
        if (!t || seen.has(t)) continue;
        if (t === to) return d;
        seen.add(t);
        next.push(t);
      }
    }
    frontier = next;
  }
  return 6;
}

export function randomJump(rng: Rng): { from: Square; to: Square; min: number } {
  for (;;) {
    const from = pick(ALL_SQUARES, rng);
    const to = pick(ALL_SQUARES, rng);
    const min = knightDistance(from, to);
    if (min >= 3 && min <= 5) return { from, to, min };
  }
}

// ---------- Notation Sprint ----------
export interface NotationQuestion {
  /** Position before the move. */
  fen: string;
  from: Square;
  to: Square;
  san: string;
  options: string[];
  /** Plain words, for screen readers. */
  words: string;
}

export function randomNotationQuestion(rng: Rng): NotationQuestion {
  for (;;) {
    const g = new Game();
    const plies = 4 + Math.floor(rng() * 24);
    for (let i = 0; i < plies; i++) {
      const moves = g.legalMoves();
      if (!moves.length) break;
      const m = pick(moves, rng);
      g.move(m.from, m.to, m.promotion);
    }
    const moves = g.legalMoves();
    if (moves.length < 6) continue;
    const move = pick(moves, rng);
    const others = moves.filter((m) => m.san !== move.san).sort((a, b) => (b.to === move.to ? 1 : 0) - (a.to === move.to ? 1 : 0) || (b.piece === move.piece ? 1 : 0) - (a.piece === move.piece ? 1 : 0));
    const wrong = others.slice(0, 6).sort(() => rng() - 0.5).slice(0, 3).map((m) => m.san);
    const options = [...wrong, move.san].sort(() => rng() - 0.5);
    return { fen: g.fen(), from: move.from, to: move.to, san: move.san, options, words: `${PIECE_NAMES[move.piece]} from ${move.from} to ${move.to}` };
  }
}
