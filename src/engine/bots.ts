// The 8 bot levels. chooseMove() is synchronous; the Arena calls it inside a Web Worker (worker.ts).
import { Chess, type Move } from 'chess.js';
import { evaluate, search } from './search';

export interface BotInfo {
  level: number;
  name: string;
  emoji: string;
  blurb: string;
}

export const BOTS: BotInfo[] = [
  { level: 1, name: 'Sleepy Snail', emoji: '🐌', blurb: 'Moves at random. Loves to grab pieces.' },
  { level: 2, name: 'Greedy Goose', emoji: '🪿', blurb: 'Takes whatever is free. Does not look ahead.' },
  { level: 3, name: 'Curious Cat', emoji: '🐈', blurb: 'Thinks two moves ahead, but sometimes slips.' },
  { level: 4, name: 'Brave Badger', emoji: '🦡', blurb: 'Thinks three moves ahead and likes good squares.' },
  { level: 5, name: 'Clever Fox', emoji: '🦊', blurb: 'Sees trades and short tactics.' },
  { level: 6, name: 'Wise Heron', emoji: '🪶', blurb: 'Plans several moves ahead.' },
  { level: 7, name: 'Bold Lion', emoji: '🦁', blurb: 'Knows openings and calculates deeply.' },
  { level: 8, name: 'Iron Owl', emoji: '🦉', blurb: 'The strongest bot. Very hard to beat.' },
];

const PIECE_VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Tiny opening book: lines of SAN moves. The bot follows a random line that matches the game so far. */
export const BOOK: string[][] = [
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'],
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6'],
  ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4', 'd5'],
  ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'],
  ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e5', 'Nfd7'],
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5', 'Ng3', 'Bg6'],
  ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O'],
  ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'dxc4', 'a4', 'Bf5'],
  ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O', 'Bd3', 'd5'],
  ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O'],
  ['Nf3', 'd5', 'g3', 'Nf6', 'Bg2', 'e6', 'O-O', 'Be7', 'd3', 'O-O'],
  ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6', 'g3', 'd5', 'cxd5', 'Nxd5'],
];

export function bookMove(historySan: string[], rng: () => number = Math.random): string | null {
  const lines = BOOK.filter((l) => l.length > historySan.length && historySan.every((m, i) => l[i] === m));
  if (!lines.length) return null;
  return lines[Math.floor(rng() * lines.length)][historySan.length];
}

const pick = <T,>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

export interface Choice {
  uci: string;
  san: string;
  score?: number;
}

const toChoice = (m: Move, score?: number): Choice => ({ uci: m.from + m.to + (m.promotion ?? ''), san: m.san, score });

/** Pick a move for the given bot level. `historySan` lets level 7+ use the opening book. */
export function chooseMove(fen: string, level: number, historySan: string[] = [], rng: () => number = Math.random): Choice | null {
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  if (level <= 1) {
    const caps = moves.filter((m) => m.captured);
    return toChoice(pick(caps.length && rng() < 0.7 ? caps : moves, rng));
  }
  if (level === 2) {
    // Greedy: best immediate material gain (captures + promotion), otherwise random.
    const gain = (m: Move) => (m.captured ? PIECE_VAL[m.captured] : 0) + (m.promotion ? 8 : 0);
    const best = Math.max(...moves.map(gain));
    return toChoice(pick(best > 0 ? moves.filter((m) => gain(m) === best) : moves, rng));
  }
  if (level >= 7) {
    const b = bookMove(historySan, rng);
    if (b) {
      const m = moves.find((x) => x.san === b);
      if (m) return toChoice(m);
    }
  }
  const params: Record<number, { depth: number; ms: number; q: boolean }> = {
    3: { depth: 2, ms: 400, q: false },
    4: { depth: 3, ms: 700, q: false },
    5: { depth: 4, ms: 900, q: true },
    6: { depth: 5, ms: 1100, q: true },
    7: { depth: 6, ms: 1400, q: true },
    8: { depth: 8, ms: 1500, q: true },
  };
  const p = params[Math.min(level, 8)];
  if (level === 3 && rng() < 0.25) {
    // 25% weaker move: score every move at depth 1 and pick one of the worse ones.
    const scored = moves.map((m) => {
      chess.move(m);
      const s = -evaluate(chess);
      chess.undo();
      return { m, s };
    });
    scored.sort((a, b) => a.s - b.s);
    return toChoice(pick(scored.slice(0, Math.max(2, Math.ceil(scored.length / 2))), rng).m);
  }
  const r = search(chess, p.depth, p.ms, p.q);
  return r ? toChoice(r.move, r.score) : toChoice(moves[0]);
}

/** Rough evaluation in pawns from White's point of view (for post-game review). */
export function evalWhite(fen: string, depth = 2): number {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) return chess.turn() === 'w' ? -100 : 100;
  if (chess.isDraw()) return 0;
  const r = search(chess, depth, 600, true);
  const sc = r ? r.score : evaluate(chess);
  const white = chess.turn() === 'w' ? sc : -sc;
  return Math.max(-100, Math.min(100, white / 100));
}
