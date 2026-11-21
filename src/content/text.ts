// Shared lesson-engine text.
import type { PieceType } from '../chess/types';

export const SETUP_TIPS: Record<PieceType, string> = {
  r: 'Rooks stand in the corners. Put the {color} rook on a corner square of its back row.',
  n: 'Knights stand next to the rooks, on the second square from the corner.',
  b: 'Bishops stand next to the knights, on the third square from the corner.',
  q: 'The queen stands on her own color. The white queen goes on the light square, the black queen on the dark square.',
  k: 'The king takes the last square in the middle, next to the queen.',
  p: 'Pawns fill the whole row in front of the pieces. White pawns are on row 2, black pawns on row 7.',
};

export const STEP_LABELS = {
  next: 'Next',
  finish: 'Finish',
  check: 'Check',
  replay: 'Replay',
  skip: 'Skip demo',
};

export const SUMMARY = {
  pass: 'Lesson complete!',
  bossFail: 'Not quite yet! Review the lessons and try again. You can do it.',
  checkFail: 'Almost there. Try the rule check again.',
};

export const ARENA_TEXT = {
  modes: {
    guided: { name: 'Guided', blurb: 'Unlimited undo, hints, warnings and a comment on every move.' },
    normal: { name: 'Normal', blurb: '3 undos. Hints when you ask.' },
    challenge: { name: 'Challenge', blurb: 'No undo and no hints. Like a real game.' },
  },
  yourTurn: 'Your move. Tap a piece to see where it can go.',
  inCheck: 'Your king is in check! Move it, block, or capture the attacker.',
  notYours: 'That is the enemy piece. Tap one of your own pieces first.',
  resigned: 'You resigned. Every game teaches something. Review it to learn what happened.',
  drawAccepted: 'Your opponent accepts the draw.',
  drawDeclined: 'Your opponent says no thanks. They want to keep playing.',
  flagDraw: 'Time ran out, but the other side cannot checkmate. It is a draw.',
  promoNames: { q: '♛ Queen', r: '♜ Rook', b: '♝ Bishop', n: '♞ Knight' } as Record<string, string>,
  endReasons: {
    checkmate: 'The king is in check and has no escape.',
    stalemate: 'Draw by stalemate: no legal move, but no check.',
    insufficient: 'Draw: neither side has enough pieces to checkmate.',
    threefold: 'Draw: the same position happened three times.',
    fivefold: 'Draw: the same position happened five times. This is automatic.',
    fifty: 'Draw by the 50-move rule: no pawn move or capture for 50 moves.',
    seventyfive: 'Draw by the 75-move rule: this one is automatic.',
  },
  presets: [
    { id: 'full', name: 'Full game', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
    { id: 'kq', name: 'King + Queen vs King', fen: '8/8/8/4k3/8/8/8/3QK3 w - - 0 1' },
    { id: 'kr', name: 'King + Rook vs King', fen: '8/8/8/4k3/8/8/8/3RK3 w - - 0 1' },
    { id: 'k2r', name: 'King + 2 Rooks vs King', fen: '8/8/8/4k3/8/8/8/R2RK3 w - - 0 1' },
    { id: 'pawn', name: 'King + Pawn vs King', fen: '8/8/8/4k3/8/4P3/4K3/8 w - - 0 1' },
  ],
};
