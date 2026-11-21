// Bot brain: negamax + alpha-beta, iterative deepening, MVV-LVA ordering and quiescence search.
// Evaluation = material + piece-square tables + a little king safety. Runs inside a Web Worker.
import { Chess, type Move } from 'chess.js';

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
const MATE = 100000;

// Piece-square tables (White's point of view, a8 first). Classic "simplified evaluation" values.
const PST: Record<string, number[]> = {
  p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
};
const KING_END = [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50];

/** Static evaluation from the side to move's point of view (centipawns). */
export function evaluate(chess: Chess): number {
  const board = chess.board();
  let score = 0;
  let nonPawn = 0;
  const kings: { w?: [number, number]; b?: [number, number] } = {};
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      if (p.type !== 'p' && p.type !== 'k') nonPawn += VAL[p.type];
      if (p.type === 'k') kings[p.color] = [r, f];
    }
  }
  const endgame = nonPawn <= 2600;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      const idx = p.color === 'w' ? r * 8 + f : (7 - r) * 8 + f;
      const table = p.type === 'k' && endgame ? KING_END : PST[p.type];
      const v = VAL[p.type] + table[idx];
      score += p.color === 'w' ? v : -v;
    }
  }
  // Mop-up (endgame): when far ahead against a bare king, push that king to the edge and bring ours closer.
  if (endgame) {
    const mat = { w: 0, b: 0 };
    const hasPawn = { w: false, b: false };
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = board[r][f];
        if (!p || p.type === 'k') continue;
        mat[p.color] += VAL[p.type];
        if (p.type === 'p') hasPawn[p.color] = true;
      }
    }
    const mop = (loser: [number, number], winner: [number, number]) => {
      const edge = Math.max(3 - Math.min(loser[0], 7 - loser[0]), 0) + Math.max(3 - Math.min(loser[1], 7 - loser[1]), 0);
      const dist = Math.abs(loser[0] - winner[0]) + Math.abs(loser[1] - winner[1]);
      return 12 * edge + 5 * (14 - dist);
    };
    if (kings.w && kings.b) {
      if (mat.w - mat.b >= 300 && mat.b === 0 && !hasPawn.b) score += mop(kings.b, kings.w);
      else if (mat.b - mat.w >= 300 && mat.w === 0 && !hasPawn.w) score -= mop(kings.w, kings.b);
    }
  }
  // King safety (middlegame): reward pawns right in front of a castled king.
  if (!endgame) {
    for (const c of ['w', 'b'] as const) {
      const k = kings[c];
      if (!k) continue;
      const dir = c === 'w' ? -1 : 1;
      let shield = 0;
      for (let df = -1; df <= 1; df++) {
        const rr = k[0] + dir;
        const ff = k[1] + df;
        if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
        const q = board[rr][ff];
        if (q && q.type === 'p' && q.color === c) shield += 12;
      }
      score += c === 'w' ? shield : -shield;
    }
  }
  return chess.turn() === 'w' ? score : -score;
}

const orderScore = (m: Move): number => {
  let s = 0;
  if (m.captured) s += 10 * VAL[m.captured] - VAL[m.piece] + 1000;
  if (m.promotion) s += VAL[m.promotion] + 800;
  if (m.san.includes('+')) s += 50;
  return s;
};
const sortMoves = (moves: Move[]): Move[] => moves.sort((a, b) => orderScore(b) - orderScore(a));

export class Timeout extends Error {}

interface Ctx {
  chess: Chess;
  deadline: number;
  nodes: number;
  quiesce: boolean;
}

function quiescence(ctx: Ctx, alpha: number, beta: number, depth: number): number {
  const stand = evaluate(ctx.chess);
  if (depth <= 0) return stand;
  if (stand >= beta) return stand;
  if (stand > alpha) alpha = stand;
  const moves = sortMoves(ctx.chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion));
  for (const m of moves) {
    ctx.chess.move(m);
    const score = -quiescence(ctx, -beta, -alpha, depth - 1);
    ctx.chess.undo();
    if (score >= beta) return score;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(ctx: Ctx, depth: number, alpha: number, beta: number, ply: number): number {
  if ((++ctx.nodes & 255) === 0 && Date.now() > ctx.deadline) throw new Timeout();
  const moves = ctx.chess.moves({ verbose: true });
  if (moves.length === 0) return ctx.chess.isCheck() ? -MATE + ply : 0;
  if (ctx.chess.isInsufficientMaterial()) return 0;
  if (depth <= 0) return ctx.quiesce ? quiescence(ctx, alpha, beta, 4) : evaluate(ctx.chess);
  let best = -Infinity;
  for (const m of sortMoves(moves)) {
    ctx.chess.move(m);
    let score: number;
    try {
      score = -negamax(ctx, depth - 1, -beta, -alpha, ply + 1);
    } finally {
      ctx.chess.undo();
    }
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

export interface SearchResult {
  move: Move;
  score: number;
  depth: number;
  nodes: number;
}

/** Iterative deepening up to maxDepth within timeMs. Always returns a legal move if one exists. */
export function search(chess: Chess, maxDepth: number, timeMs: number, quiesce = true): SearchResult | null {
  const root = sortMoves(chess.moves({ verbose: true }));
  if (root.length === 0) return null;
  const ctx: Ctx = { chess, deadline: Date.now() + timeMs, nodes: 0, quiesce };
  let best: SearchResult = { move: root[0], score: 0, depth: 0, nodes: 0 };
  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      let alpha = -Infinity;
      let bestMove = root[0];
      for (const m of root) {
        chess.move(m);
        let score: number;
        try {
          score = -negamax(ctx, depth - 1, -Infinity, -alpha, 1);
        } finally {
          chess.undo();
        }
        if (score > alpha) {
          alpha = score;
          bestMove = m;
        }
      }
      best = { move: bestMove, score: alpha, depth, nodes: ctx.nodes };
      // search the previous best move first next iteration
      root.splice(root.indexOf(bestMove), 1);
      root.unshift(bestMove);
      if (Math.abs(alpha) > MATE - 100) break; // found a forced mate
    } catch (e) {
      if (e instanceof Timeout) break;
      throw e;
    }
  }
  return best;
}
