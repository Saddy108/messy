// Illegal-move explainer: every rejected move gets a reason code and a friendly message.
import { type Color, type PieceType, type Pieces, type Square, colorName, other, PIECE_NAMES } from './types';
import { between, fileIdx, lineWithEnds, rankNum } from './geometry';
import { sandboxAttacked, sandboxMoves, startRank } from './sandbox';
import { MOVE_TEXT } from '../content/explain';
import type { Game } from './rules';

export type ReasonCode =
  | 'NOT_YOUR_TURN' | 'NOT_YOUR_PIECE' | 'NO_PIECE' | 'CANNOT_MOVE_LIKE_THAT' | 'PATH_BLOCKED'
  | 'OWN_PIECE_ON_TARGET' | 'KING_INTO_CHECK' | 'KINGS_CANNOT_TOUCH' | 'PIECE_IS_PINNED'
  | 'MUST_ESCAPE_CHECK' | 'DOUBLE_CHECK_KING_MUST_MOVE' | 'PAWN_NO_BACKWARD'
  | 'PAWN_CAPTURES_DIAGONALLY' | 'PAWN_BLOCKED' | 'PAWN_DOUBLE_STEP_ONLY_FROM_START'
  | 'EN_PASSANT_EXPIRED' | 'CASTLE_KING_MOVED' | 'CASTLE_ROOK_MOVED' | 'CASTLE_PATH_BLOCKED'
  | 'CASTLE_IN_CHECK' | 'CASTLE_THROUGH_CHECK' | 'CASTLE_INTO_CHECK';

export const ALL_REASON_CODES: ReasonCode[] = Object.keys(MOVE_TEXT) as ReasonCode[];

export interface Explanation {
  code: ReasonCode;
  message: string;
  /** Squares to light up while the message is visible (e.g. the attack line). */
  highlight: Square[];
}

export interface ExplainContext {
  pieces: Pieces;
  /** Whose pieces the learner may move. */
  turn: Color;
  /** Full-rules game (check, pins, castling). Omit for sandbox mode. */
  game?: Game;
  /** If set and it is not this color's turn, the answer is NOT_YOUR_TURN. */
  playerColor?: Color;
}

const make = (code: ReasonCode, highlight: Square[] = [], vars: Record<string, string> = {}): Explanation => {
  let message = MOVE_TEXT[code];
  for (const [k, v] of Object.entries(vars)) message = message.replaceAll(`{${k}}`, v);
  return { code, message, highlight };
};

/** Pieces of color `by` that attack `target` (blocking by the other side's pieces is respected). */
const attackersOf = (pieces: Pieces, target: Square, by: Color): Square[] => {
  const mine = (Object.keys(pieces) as Square[]).filter((s) => pieces[s]!.color === by);
  const base: Pieces = { ...pieces };
  mine.forEach((s) => delete base[s]);
  return mine.filter((s) => sandboxAttacked({ ...base, [s]: pieces[s] }, target, by));
};

/** Pure movement-pattern check. Returns a reason code, or null if the pattern is fine. */
function patternProblem(pieces: Pieces, type: PieceType, color: Color, from: Square, to: Square): ReasonCode | null {
  const df = fileIdx(to) - fileIdx(from);
  const dr = rankNum(to) - rankNum(from);
  const adf = Math.abs(df);
  const adr = Math.abs(dr);
  const blocked = (): boolean => between(from, to).some((s) => pieces[s]);
  switch (type) {
    case 'n':
      return (adf === 1 && adr === 2) || (adf === 2 && adr === 1) ? null : 'CANNOT_MOVE_LIKE_THAT';
    case 'k':
      return adf <= 1 && adr <= 1 ? null : 'CANNOT_MOVE_LIKE_THAT';
    case 'r':
      if (!(df === 0 || dr === 0)) return 'CANNOT_MOVE_LIKE_THAT';
      return blocked() ? 'PATH_BLOCKED' : null;
    case 'b':
      if (adf !== adr) return 'CANNOT_MOVE_LIKE_THAT';
      return blocked() ? 'PATH_BLOCKED' : null;
    case 'q':
      if (!(df === 0 || dr === 0 || adf === adr)) return 'CANNOT_MOVE_LIKE_THAT';
      return blocked() ? 'PATH_BLOCKED' : null;
    case 'p': {
      const fwd = color === 'w' ? 1 : -1;
      const enemyOnTarget = pieces[to] && pieces[to]!.color !== color;
      if (dr * fwd < 0) return 'PAWN_NO_BACKWARD';
      if (dr === 0) return 'PAWN_NO_BACKWARD'; // sideways: same family of rule
      if (df === 0) {
        if (adr === 1) return pieces[to] ? 'PAWN_BLOCKED' : null;
        if (adr === 2) {
          if (rankNum(from) !== startRank(color)) return 'PAWN_DOUBLE_STEP_ONLY_FROM_START';
          return blocked() || pieces[to] ? 'PAWN_BLOCKED' : null;
        }
        return rankNum(from) === startRank(color) ? 'PAWN_DOUBLE_STEP_ONLY_FROM_START' : 'CANNOT_MOVE_LIKE_THAT';
      }
      if (adf === 1 && adr === 1) return enemyOnTarget ? null : 'PAWN_CAPTURES_DIAGONALLY';
      return 'CANNOT_MOVE_LIKE_THAT';
    }
  }
}

/**
 * Explain why from→to is not allowed. Returns null when the move is actually legal.
 * Works for sandbox lessons (no game) and full games.
 */
export function explainMove(ctx: ExplainContext, from: Square, to: Square): Explanation | null {
  const { pieces, game } = ctx;
  const piece = pieces[from];
  if (!piece) return make('NO_PIECE');
  if (ctx.playerColor && ctx.turn !== ctx.playerColor) return make('NOT_YOUR_TURN');
  if (game ? game.legalMoves(from).some((m) => m.to === to) : sandboxMoves(pieces, from).some((m) => m.to === to)) {
    return null;
  }
  if (piece.color !== ctx.turn) return make('NOT_YOUR_PIECE', [], { color: colorName(piece.color) });
  const name = PIECE_NAMES[piece.type];
  const target = pieces[to];
  if (target && target.color === piece.color) {
    return make('OWN_PIECE_ON_TARGET', [to], { piece: name, target: PIECE_NAMES[target.type] });
  }

  // Castling attempts (full mode only): king moves two squares sideways from its home square.
  if (game && piece.type === 'k' && rankNum(from) === (piece.color === 'w' ? 1 : 8) && from[0] === 'e' && Math.abs(fileIdx(to) - 4) === 2 && rankNum(to) === rankNum(from)) {
    return explainCastle(game, piece.color, from, to);
  }

  // En passant that is no longer available.
  if (game && piece.type === 'p' && !target && Math.abs(fileIdx(to) - fileIdx(from)) === 1 && rankNum(to) - rankNum(from) === (piece.color === 'w' ? 1 : -1)) {
    if (game.pastEnPassantSquares().includes(to)) return make('EN_PASSANT_EXPIRED', [to]);
  }

  const pattern = patternProblem(pieces, piece.type, piece.color, from, to);
  if (pattern) {
    const hl = pattern === 'PATH_BLOCKED' ? between(from, to).filter((s) => pieces[s]) : [];
    return make(pattern, hl, { piece: name, color: colorName(piece.color) });
  }
  if (!game) return make('CANNOT_MOVE_LIKE_THAT', [], { piece: name });

  // The pattern is fine, so the move must break a check rule.
  const enemy = other(piece.color);
  const kingSq = game.kingSquare(piece.color);
  const without = { ...pieces };
  delete without[from];
  if (piece.type === 'k') {
    const kingNear = (Object.keys(pieces) as Square[]).find(
      (s) => pieces[s]!.type === 'k' && pieces[s]!.color === enemy && Math.abs(fileIdx(s) - fileIdx(to)) <= 1 && Math.abs(rankNum(s) - rankNum(to)) <= 1,
    );
    if (kingNear) return make('KINGS_CANNOT_TOUCH', [kingNear, to]);
    const attacker = attackersOf(without, to, enemy)[0];
    return make('KING_INTO_CHECK', attacker ? lineWithEnds(attacker, to) : [to], {
      attacker: attacker ? PIECE_NAMES[pieces[attacker]!.type] : 'enemy piece',
    });
  }
  if (!kingSq) return make('CANNOT_MOVE_LIKE_THAT', [], { piece: name });
  const checkers = game.checkers();
  if (checkers.length >= 2) return make('DOUBLE_CHECK_KING_MUST_MOVE', [...checkers, kingSq]);
  if (checkers.length === 1) {
    return make('MUST_ESCAPE_CHECK', [...lineWithEnds(checkers[0], kingSq)]);
  }
  // Not in check: the piece must be pinned.
  const pinner = attackersOf(without, kingSq, enemy)[0];
  if (pinner) return make('PIECE_IS_PINNED', [...lineWithEnds(pinner, kingSq)], { piece: name });
  return make('KING_INTO_CHECK', [kingSq]);
}

function explainCastle(game: Game, color: Color, from: Square, to: Square): Explanation {
  const side = fileIdx(to) > fileIdx(from) ? 'king' : 'queen';
  const r = rankNum(from);
  const rookSq = `${side === 'king' ? 'h' : 'a'}${r}` as Square;
  const pieces = game.pieces();
  const enemy = other(color);
  const rights = game.castlingRights(color);
  const rook = pieces[rookSq];
  if (!rook || rook.type !== 'r' || rook.color !== color) return make('CASTLE_ROOK_MOVED', [rookSq]);
  if (!rights.king && !rights.queen) return make('CASTLE_KING_MOVED', [from]);
  if (!rights[side]) return make('CASTLE_ROOK_MOVED', [rookSq]);
  const mid = side === 'king' ? [`f${r}`, `g${r}`] : [`d${r}`, `c${r}`, `b${r}`];
  const inBetween = (mid as Square[]).filter((s) => pieces[s]);
  if (inBetween.length) return make('CASTLE_PATH_BLOCKED', inBetween);
  if (game.inCheck()) return make('CASTLE_IN_CHECK', [from, ...game.checkers()]);
  const passSq = (side === 'king' ? `f${r}` : `d${r}`) as Square;
  if (game.isAttacked(passSq, enemy)) return make('CASTLE_THROUGH_CHECK', [from, passSq, to]);
  return make('CASTLE_INTO_CHECK', [to]);
}

/** If the piece on `from` is pinned to its own king, the pin line (pinner to king), otherwise null. */
export function findPin(game: Game, from: Square): Square[] | null {
  const pieces = game.pieces();
  const piece = pieces[from];
  if (!piece || piece.type === 'k') return null;
  const kingSq = game.kingSquare(piece.color);
  if (!kingSq) return null;
  const enemy = other(piece.color);
  if (attackersOf(pieces, kingSq, enemy).length) return null; // already in check: not a pin
  const without = { ...pieces };
  delete without[from];
  const pinner = attackersOf(without, kingSq, enemy)[0];
  return pinner ? lineWithEnds(pinner, kingSq) : null;
}
