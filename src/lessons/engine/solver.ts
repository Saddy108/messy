// Small solvers: power the 3rd-level hint (show the answer arrow) and the lesson-validation tests.
import { Chess } from 'chess.js';
import { Game } from '../../chess/rules';
import { parsePlacement, sandboxApply, sandboxMoves, piecesToPlacement, turnFromFen } from '../../chess/sandbox';
import type { Color, Pieces, Square } from '../../chess/types';
import { search } from '../../engine/search';
import type { Goal, Step } from '../types';

type TaskStep = Extract<Step, { kind: 'task' }>;
export type MovePair = [Square, Square];

/** Breadth-first search over sandbox positions. Returns the shortest list of moves reaching `done`. */
export function sandboxBfs(
  start: Pieces,
  color: Color,
  done: (pieces: Pieces, captured: Set<Square>) => boolean,
  maxDepth = 8,
  limit = 150000,
): MovePair[] | null {
  interface Node { pieces: Pieces; path: MovePair[]; captured: Square[] }
  const key = (n: Node) => piecesToPlacement(n.pieces) + '|' + [...n.captured].sort().join(',');
  let frontier: Node[] = [{ pieces: start, path: [], captured: [] }];
  const seen = new Set([key(frontier[0])]);
  if (done(start, new Set())) return [];
  let count = 0;
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: Node[] = [];
    for (const n of frontier) {
      for (const s of Object.keys(n.pieces) as Square[]) {
        if (n.pieces[s]!.color !== color) continue;
        for (const m of sandboxMoves(n.pieces, s)) {
          const np = sandboxApply(n.pieces, m.from, m.to);
          const captured = m.capture ? [...n.captured, m.to] : n.captured;
          const node: Node = { pieces: np, path: [...n.path, [m.from, m.to]], captured };
          if (done(np, new Set(captured))) return node.path;
          const k = key(node);
          if (!seen.has(k)) {
            seen.add(k);
            next.push(node);
          }
          if (++count > limit) return null;
        }
      }
    }
    frontier = next;
  }
  return null;
}

/** Does the side to move have a forced mate within `n` of its own moves? */
function mateWithin(chess: Chess, n: number): boolean {
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    let ok = chess.isCheckmate();
    if (!ok && n > 1 && !chess.isDraw()) {
      const replies = chess.moves({ verbose: true });
      ok = replies.length > 0 && replies.every((r) => {
        chess.move(r);
        const res = mateWithin(chess, n - 1);
        chess.undo();
        return res;
      });
    }
    chess.undo();
    if (ok) return true;
  }
  return false;
}

/** Find the first move of a forced mate in at most `n` moves for the side to move (UCI), or null. */
export function findMate(fen: string, n: number): string | null {
  const chess = new Chess(fen);
  for (const m of chess.moves({ verbose: true })) {
    chess.move(m);
    let ok = chess.isCheckmate();
    if (!ok && n > 1 && !chess.isDraw()) {
      const replies = chess.moves({ verbose: true });
      ok = replies.length > 0 && replies.every((r) => {
        chess.move(r);
        const res = mateWithin(chess, n - 1);
        chess.undo();
        return res;
      });
    }
    chess.undo();
    if (ok) return m.from + m.to + (m.promotion ?? '');
  }
  return null;
}

/** All first moves that win a "playMove"/"playSan" style task are listed in the goal. */
export function suggestFromGoal(goal: Goal, fen: string): MovePair | null {
  if (goal.type === 'playMove') return [goal.uci[0].slice(0, 2) as Square, goal.uci[0].slice(2, 4) as Square];
  if (goal.type === 'playSan') {
    const g = new Game(fen);
    const m = g.legalMoves().find((x) => goal.san.some((s) => s.replace(/[+#]/g, '') === x.san.replace(/[+#]/g, '')));
    return m ? [m.from, m.to] : null;
  }
  return null;
}

/** Best next move to show as the final hint, or null if there is no good suggestion. */
export function suggest(step: TaskStep, fen: string, mode: 'sandbox' | 'full'): MovePair | null {
  const goal = step.goal;
  const direct = suggestFromGoal(goal, fen);
  if (direct) return direct;
  const color: Color = step.color ?? turnFromFen(fen);
  if (mode === 'sandbox') {
    const start = parsePlacement(fen);
    let path: MovePair[] | null = null;
    if (goal.type === 'collectStars') {
      path = collectStarsPath(start, color, goal.stars);
    } else if (goal.type === 'reachSquare') {
      path = sandboxBfs(start, color, (p) => p[goal.square]?.color === color);
    } else if (goal.type === 'capture') {
      path = sandboxBfs(start, color, (_p, cap) => goal.targets.every((t) => cap.has(t)));
    } else if (goal.type === 'promote') {
      path = sandboxBfs(start, color, (p) => (Object.keys(p) as Square[]).some((s) => p[s]!.color === color && p[s]!.type !== 'p' && s[1] === (color === 'w' ? '8' : '1')));
    }
    return path && path.length ? path[0] : null;
  }
  const game = new Game(fen);
  if (goal.type === 'castle') return game.legalMoves().filter((m) => m.castle === goal.side).map((m) => [m.from, m.to] as MovePair)[0] ?? null;
  if (goal.type === 'enPassant') return game.legalMoves().filter((m) => m.enPassant).map((m) => [m.from, m.to] as MovePair)[0] ?? null;
  if (goal.type === 'promote') return game.legalMoves().filter((m) => m.promotion && (!goal.to || m.promotion === goal.to)).map((m) => [m.from, m.to] as MovePair)[0] ?? null;
  if (goal.type === 'escapeCheck') {
    const wanted = game.legalMoves().filter((m) => {
      const kind = m.piece === 'k' ? 'move' : m.capture ? 'capture' : 'block';
      return !goal.require || goal.require === kind;
    });
    return wanted[0] ? [wanted[0].from, wanted[0].to] : null;
  }
  if (goal.type === 'checkmate') {
    const n = Math.min(goal.inMoves, 2);
    const mate = findMate(fen, n);
    if (mate) return [mate.slice(0, 2) as Square, mate.slice(2, 4) as Square];
    const r = search(new Chess(fen), 3, 800);
    return r ? [r.move.from as Square, r.move.to as Square] : null;
  }
  if (goal.type === 'survive') {
    const r = search(new Chess(fen), 3, 600);
    return r ? [r.move.from as Square, r.move.to as Square] : null;
  }
  return null;
}

/** Shortest route for any piece to land on every star (stars are not blockers). */
export function collectStarsPath(start: Pieces, color: Color, stars: Square[], maxDepth = 9): MovePair[] | null {
  interface Node { pieces: Pieces; left: Square[]; path: MovePair[] }
  const key = (n: Node) => piecesToPlacement(n.pieces) + '|' + n.left.join(',');
  let frontier: Node[] = [{ pieces: start, left: stars, path: [] }];
  const seen = new Set([key(frontier[0])]);
  for (let d = 0; d < maxDepth; d++) {
    const next: Node[] = [];
    for (const n of frontier) {
      for (const s of Object.keys(n.pieces) as Square[]) {
        if (n.pieces[s]!.color !== color) continue;
        for (const m of sandboxMoves(n.pieces, s)) {
          const np = sandboxApply(n.pieces, m.from, m.to);
          const left = n.left.filter((x) => x !== m.to);
          const node: Node = { pieces: np, left, path: [...n.path, [m.from, m.to]] };
          if (left.length === 0) return node.path;
          const k = key(node);
          if (!seen.has(k)) {
            seen.add(k);
            next.push(node);
          }
        }
      }
    }
    frontier = next;
    if (frontier.length > 100000) return null;
  }
  return null;
}
