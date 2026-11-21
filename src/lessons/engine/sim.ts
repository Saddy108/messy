// One interface over both move systems (sandbox and full rules) so the lesson runner stays simple.
import { Game } from '../../chess/rules';
import { explainMove, type Explanation } from '../../chess/explain';
import { parsePlacement, sandboxApply, sandboxMoves, turnFromFen } from '../../chess/sandbox';
import type { Color, Piece, PieceType, Pieces, Square } from '../../chess/types';
import { other } from '../../chess/types';

export interface SimMove {
  from: Square;
  to: Square;
  uci: string;
  san?: string;
  capture: boolean;
  captured?: Piece;
  piece: PieceType;
  color: Color;
  promotion?: PieceType;
  castle?: 'king' | 'queen';
  enPassant?: boolean;
  check?: boolean;
  mate?: boolean;
}

export type TryResult = { ok: true; move: SimMove } | { ok: false; explanation: Explanation };

export class Sim {
  readonly mode: 'sandbox' | 'full';
  readonly startFen: string;
  private game: Game | null = null;
  private board: Pieces = {};
  /** Whose pieces the learner moves. */
  readonly learner: Color;
  private sandboxTurn: Color;

  constructor(mode: 'sandbox' | 'full', fen: string, learner?: Color) {
    this.mode = mode;
    this.startFen = fen;
    this.sandboxTurn = turnFromFen(fen);
    if (mode === 'full') {
      this.game = new Game(fen);
      this.learner = learner ?? this.game.turn();
    } else {
      this.board = parsePlacement(fen);
      this.learner = learner ?? this.sandboxTurn;
    }
  }

  pieces(): Pieces { return this.game ? this.game.pieces() : this.board; }
  turn(): Color { return this.game ? this.game.turn() : this.sandboxTurn; }
  fullGame(): Game | null { return this.game; }
  fen(): string { return this.game ? this.game.fen() : this.startFen; }

  /** Destination squares for a piece (only if it is the mover's piece). */
  targets(from: Square): { to: Square; capture: boolean }[] {
    const p = this.pieces()[from];
    if (!p) return [];
    if (this.game) {
      if (p.color !== this.game.turn()) return [];
      const seen = new Map<Square, boolean>();
      this.game.legalMoves(from).forEach((m) => seen.set(m.to, m.capture));
      return [...seen].map(([to, capture]) => ({ to, capture }));
    }
    return sandboxMoves(this.board, from).map((m) => ({ to: m.to, capture: m.capture }));
  }

  needsPromotion(from: Square, to: Square): boolean {
    if (this.game) return this.game.needsPromotion(from, to);
    return sandboxMoves(this.board, from).some((m) => m.to === to && m.promotion);
  }

  /** Try a move for whoever's turn it is (learner or scripted opponent). */
  tryMove(from: Square, to: Square, promotion?: PieceType): TryResult {
    const pieces = this.pieces();
    const piece = pieces[from];
    if (this.game) {
      const g = this.game;
      const before = pieces[to];
      const m = g.move(from, to, promotion);
      if (!m) {
        return {
          ok: false,
          explanation: explainMove({ pieces, turn: g.turn(), game: g, playerColor: this.learner }, from, to) ?? {
            code: 'CANNOT_MOVE_LIKE_THAT', message: 'That move is not allowed.', highlight: [],
          },
        };
      }
      return {
        ok: true,
        move: {
          from, to, uci: m.uci, san: m.san, capture: m.capture, piece: m.piece, color: m.color,
          captured: m.enPassant ? { type: 'p', color: other(m.color) } : before,
          promotion: m.promotion, castle: m.castle, enPassant: m.enPassant, check: m.check, mate: m.mate,
        },
      };
    }
    const legal = piece && piece.color === this.learner && sandboxMoves(pieces, from).some((m) => m.to === to);
    if (!legal || !piece) {
      return {
        ok: false,
        explanation: explainMove({ pieces, turn: this.learner, playerColor: this.learner }, from, to) ?? {
          code: 'CANNOT_MOVE_LIKE_THAT', message: 'That move is not allowed.', highlight: [],
        },
      };
    }
    const captured = pieces[to];
    const promo = this.needsPromotion(from, to) ? (promotion ?? 'q') : undefined;
    this.board = sandboxApply(this.board, from, to, promo);
    return {
      ok: true,
      move: {
        from, to, uci: from + to + (promo ?? ''), capture: !!captured, captured, piece: piece.type,
        color: piece.color, promotion: promo,
      },
    };
  }

  /** Play a scripted/bot move given as UCI (e.g. "e7e5", "e7e8q"). The turn rules still apply in full mode. */
  tryUci(uci: string): TryResult {
    return this.tryMove(uci.slice(0, 2) as Square, uci.slice(2, 4) as Square, (uci[4] as PieceType) || undefined);
  }

  /** Sandbox opponent moves ignore whose turn it is. */
  tryOpponentUci(uci: string): TryResult {
    if (this.game) return this.tryUci(uci);
    const from = uci.slice(0, 2) as Square;
    const to = uci.slice(2, 4) as Square;
    const piece = this.board[from];
    if (!piece || !sandboxMoves(this.board, from).some((m) => m.to === to)) {
      return { ok: false, explanation: { code: 'CANNOT_MOVE_LIKE_THAT', message: 'Scripted move is not legal.', highlight: [] } };
    }
    const captured = this.board[to];
    this.board = sandboxApply(this.board, from, to);
    return { ok: true, move: { from, to, uci, capture: !!captured, captured, piece: piece.type, color: piece.color } };
  }

  inCheck(): boolean { return this.game?.inCheck() ?? false; }
  checkers(): Square[] { return this.game?.checkers() ?? []; }
  kingSquare(c: Color): Square | null { return this.game?.kingSquare(c) ?? null; }
  isMate(): boolean { return this.game?.isCheckmate() ?? false; }
  isStalemate(): boolean { return this.game?.isStalemate() ?? false; }
  legalCount(): number { return this.game ? this.game.legalMoves().length : 1; }
}
