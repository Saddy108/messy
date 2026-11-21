import { describe, it, expect } from 'vitest';
import { Game, gameFromSan } from '../../src/chess/rules';
import { ALL_REASON_CODES, explainMove, type ReasonCode } from '../../src/chess/explain';
import { parsePlacement } from '../../src/chess/sandbox';
import type { Color, Square } from '../../src/chess/types';

const full = (fen: string, from: Square, to: Square, playerColor?: Color) => {
  const game = new Game(fen);
  return explainMove({ pieces: game.pieces(), turn: game.turn(), game, playerColor }, from, to);
};

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const CASE: Record<ReasonCode, () => ReturnType<typeof full>> = {
  NOT_YOUR_TURN: () => full('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', 'e7', 'e5', 'w'),
  NOT_YOUR_PIECE: () => full(START, 'e7', 'e5'),
  NO_PIECE: () => full(START, 'e4', 'e5'),
  CANNOT_MOVE_LIKE_THAT: () => full(START, 'b1', 'b3'),
  PATH_BLOCKED: () => full(START, 'a1', 'a5'),
  OWN_PIECE_ON_TARGET: () => full(START, 'a1', 'a2'),
  KING_INTO_CHECK: () => full('4k3/8/8/8/8/8/3r4/4K3 w - - 0 1', 'e1', 'e2'),
  KINGS_CANNOT_TOUCH: () => full('8/8/8/8/8/3k4/8/4K3 w - - 0 1', 'e1', 'e2'),
  PIECE_IS_PINNED: () => full('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1', 'e2', 'd2'),
  MUST_ESCAPE_CHECK: () => full('4k3/8/8/8/4r3/8/3B4/R3K3 w - - 0 1', 'a1', 'a5'),
  DOUBLE_CHECK_KING_MUST_MOVE: () => full('4r1k1/8/8/8/1b5Q/8/8/4K3 w - - 0 1', 'h4', 'h5'),
  PAWN_NO_BACKWARD: () => full('4k3/8/8/8/4P3/8/8/4K3 w - - 0 1', 'e4', 'e3'),
  PAWN_CAPTURES_DIAGONALLY: () => full('4k3/8/8/8/4P3/8/8/4K3 w - - 0 1', 'e4', 'd5'),
  PAWN_BLOCKED: () => full('4k3/8/8/4p3/4P3/8/8/4K3 w - - 0 1', 'e4', 'e5'),
  PAWN_DOUBLE_STEP_ONLY_FROM_START: () => full('4k3/8/8/8/4P3/8/8/4K3 w - - 0 1', 'e4', 'e6'),
  EN_PASSANT_EXPIRED: () => {
    const g = gameFromSan(['e4', 'a6', 'e5', 'd5', 'Nf3', 'a5']);
    return explainMove({ pieces: g.pieces(), turn: g.turn(), game: g }, 'e5', 'd6');
  },
  CASTLE_KING_MOVED: () => full('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1', 'e1', 'g1'),
  CASTLE_ROOK_MOVED: () => full('r3k2r/8/8/8/8/8/8/R3K2R w Qkq - 0 1', 'e1', 'g1'),
  CASTLE_PATH_BLOCKED: () => full('r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 0 1', 'e1', 'c1'),
  CASTLE_IN_CHECK: () => full('4k3/8/8/8/8/8/4r3/R3K2R w KQ - 0 1', 'e1', 'g1'),
  CASTLE_THROUGH_CHECK: () => full('4k3/8/8/8/8/8/5r2/R3K2R w KQ - 0 1', 'e1', 'g1'),
  CASTLE_INTO_CHECK: () => full('4k3/8/8/8/8/8/6r1/R3K2R w KQ - 0 1', 'e1', 'g1'),
};

describe('illegal-move explainer (§7.2)', () => {
  it('covers every reason code listed in the spec', () => {
    expect(Object.keys(CASE).sort()).toEqual([...ALL_REASON_CODES].sort());
  });
  it.each(Object.keys(CASE) as ReasonCode[])('%s', (code) => {
    const e = CASE[code]();
    expect(e?.code).toBe(code);
    expect(e!.message.length).toBeGreaterThan(20);
    expect(e!.message).not.toMatch(/\{\w+\}/); // no unfilled placeholders
  });
  it('returns null for a legal move', () => {
    expect(full(START, 'e2', 'e4')).toBeNull();
  });
  it('highlights the attack line for a pin and for check', () => {
    expect(CASE.PIECE_IS_PINNED()!.highlight).toEqual(expect.arrayContaining(['e8', 'e1']));
    expect(CASE.MUST_ESCAPE_CHECK()!.highlight).toEqual(expect.arrayContaining(['e4', 'e1']));
  });
  it('works in sandbox mode (no kings)', () => {
    const pieces = parsePlacement('8/8/8/8/3R4/8/3P4/8 w - - 0 1');
    expect(explainMove({ pieces, turn: 'w' }, 'd4', 'e5')?.code).toBe('CANNOT_MOVE_LIKE_THAT');
    expect(explainMove({ pieces, turn: 'w' }, 'd4', 'd1')?.code).toBe('PATH_BLOCKED');
    expect(explainMove({ pieces, turn: 'w' }, 'd4', 'd2')?.code).toBe('OWN_PIECE_ON_TARGET');
    expect(explainMove({ pieces, turn: 'w' }, 'd4', 'd6')).toBeNull();
  });
});
