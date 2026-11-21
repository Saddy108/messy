// Full-rules game wrapper around chess.js. UI code must use this, never chess.js directly.
import { Chess, type Move as CjsMove } from 'chess.js';
import {
  ALL_SQUARES, type Color, type Piece, type PieceType, type Pieces, type Square, other,
} from './types';
import { evaluateDraws, type DrawInfo } from './draws';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export interface LegalMove {
  from: Square;
  to: Square;
  san: string;
  uci: string;
  capture: boolean;
  promotion?: PieceType;
  castle?: 'king' | 'queen';
  enPassant: boolean;
  piece: PieceType;
  color: Color;
  check: boolean;
  mate: boolean;
  after: string;
}

export type EndReason =
  | 'checkmate' | 'stalemate' | 'insufficient' | 'threefold' | 'fivefold' | 'fifty' | 'seventyfive';
export type GameEnd =
  | { over: false }
  | { over: true; result: '1-0' | '0-1' | '1/2-1/2'; reason: EndReason; winner?: Color };

const toLegal = (m: CjsMove): LegalMove => ({
  from: m.from as Square,
  to: m.to as Square,
  san: m.san,
  uci: m.from + m.to + (m.promotion ?? ''),
  capture: m.isCapture() || m.isEnPassant(),
  promotion: m.promotion as PieceType | undefined,
  castle: m.isKingsideCastle() ? 'king' : m.isQueensideCastle() ? 'queen' : undefined,
  enPassant: m.isEnPassant(),
  piece: m.piece as PieceType,
  color: m.color as Color,
  check: m.san.includes('+') || m.san.includes('#'),
  mate: m.san.includes('#'),
  after: m.after,
});

export class Game {
  private chess: Chess;
  /** FEN after every ply, starting with the initial position. */
  private fens: string[];
  private moves: LegalMove[] = [];

  constructor(fen: string = START_FEN) {
    this.chess = new Chess(fen);
    this.fens = [this.chess.fen()];
  }

  static isValidFen(fen: string): boolean {
    try {
      new Chess(fen);
      return true;
    } catch {
      return false;
    }
  }

  clone(): Game {
    const g = new Game(this.fens[0]);
    this.moves.forEach((m) => g.move(m.from, m.to, m.promotion));
    return g;
  }

  fen(): string { return this.chess.fen(); }
  startFen(): string { return this.fens[0]; }
  turn(): Color { return this.chess.turn() as Color; }
  history(): LegalMove[] { return [...this.moves]; }
  positions(): string[] { return [...this.fens]; }
  plyCount(): number { return this.moves.length; }

  pieces(): Pieces {
    const out: Pieces = {};
    for (const row of this.chess.board()) {
      for (const p of row) if (p) out[p.square as Square] = { type: p.type as PieceType, color: p.color as Color };
    }
    return out;
  }
  pieceAt(s: Square): Piece | undefined {
    const p = this.chess.get(s);
    return p ? { type: p.type as PieceType, color: p.color as Color } : undefined;
  }

  /** Legal moves, optionally from one square. Promotions are listed once per promotion piece. */
  legalMoves(from?: Square): LegalMove[] {
    const list = from ? this.chess.moves({ square: from, verbose: true }) : this.chess.moves({ verbose: true });
    return list.map(toLegal);
  }
  legalTargets(from: Square): Square[] {
    return [...new Set(this.legalMoves(from).map((m) => m.to))];
  }
  /** Does this from→to need a promotion choice? */
  needsPromotion(from: Square, to: Square): boolean {
    return this.legalMoves(from).some((m) => m.to === to && !!m.promotion);
  }

  /** Play a move. Returns the move, or null if illegal (use explain.ts to say why). */
  move(from: Square, to: Square, promotion?: PieceType): LegalMove | null {
    try {
      const needs = this.needsPromotion(from, to);
      const m = this.chess.move({ from, to, promotion: needs ? (promotion ?? 'q') : undefined });
      const legal = toLegal(m);
      this.moves.push(legal);
      this.fens.push(this.chess.fen());
      return legal;
    } catch {
      return null;
    }
  }
  moveSan(san: string): LegalMove | null {
    try {
      const legal = toLegal(this.chess.move(san));
      this.moves.push(legal);
      this.fens.push(this.chess.fen());
      return legal;
    } catch {
      return null;
    }
  }
  undo(): LegalMove | null {
    const m = this.chess.undo();
    if (!m) return null;
    this.fens.pop();
    return this.moves.pop() ?? null;
  }

  inCheck(): boolean { return this.chess.isCheck(); }
  isCheckmate(): boolean { return this.chess.isCheckmate(); }
  isStalemate(): boolean { return this.chess.isStalemate(); }
  isAttacked(s: Square, by: Color): boolean { return this.chess.isAttacked(s, by); }
  attackers(s: Square, by: Color): Square[] { return this.chess.attackers(s, by) as Square[]; }
  kingSquare(c: Color): Square | null {
    return ALL_SQUARES.find((s) => { const p = this.chess.get(s); return p?.type === 'k' && p.color === c; }) ?? null;
  }
  /** Pieces giving check to the side to move. */
  checkers(): Square[] {
    const k = this.kingSquare(this.turn());
    return k ? this.attackers(k, other(this.turn())) : [];
  }
  /** Every square the given color attacks. */
  attackedSquares(by: Color): Square[] {
    return ALL_SQUARES.filter((s) => this.chess.isAttacked(s, by));
  }
  castlingRights(c: Color): { king: boolean; queen: boolean } {
    const r = this.chess.getCastlingRights(c);
    return { king: !!r.k, queen: !!r.q };
  }
  enPassantSquare(): Square | null {
    const ep = this.chess.fen().split(' ')[3];
    return ep && ep !== '-' ? (ep as Square) : null;
  }
  /** Every en passant target square that existed earlier in this game (and so has expired). */
  pastEnPassantSquares(): Square[] {
    const now = this.fens.length - 1;
    const out: Square[] = [];
    this.fens.forEach((f, i) => {
      const ep = f.split(' ')[3];
      if (i < now && ep && ep !== '-') out.push(ep as Square);
    });
    return out;
  }
  halfmoveClock(): number { return Number(this.chess.fen().split(' ')[4]); }

  drawInfo(): DrawInfo { return evaluateDraws(this.fens); }

  /** Full end-of-game status. With claimDraws, threefold and 50-move end the game (online-platform style). */
  end(opts: { claimDraws?: boolean } = { claimDraws: true }): GameEnd {
    if (this.chess.isCheckmate()) {
      return { over: true, result: this.turn() === 'w' ? '0-1' : '1-0', reason: 'checkmate', winner: other(this.turn()) };
    }
    if (this.chess.isStalemate()) return { over: true, result: '1/2-1/2', reason: 'stalemate' };
    if (this.chess.isInsufficientMaterial()) return { over: true, result: '1/2-1/2', reason: 'insufficient' };
    const d = this.drawInfo();
    if (d.fivefold) return { over: true, result: '1/2-1/2', reason: 'fivefold' };
    if (d.seventyFive) return { over: true, result: '1/2-1/2', reason: 'seventyfive' };
    if (opts.claimDraws && d.threefold) return { over: true, result: '1/2-1/2', reason: 'threefold' };
    if (opts.claimDraws && d.fifty) return { over: true, result: '1/2-1/2', reason: 'fifty' };
    return { over: false };
  }
  /** Could the side to move claim a draw right now (threefold or 50-move)? */
  canClaimDraw(): boolean {
    const d = this.drawInfo();
    return d.threefold || d.fifty;
  }
}

/** Build a game from a list of SAN moves. */
export function gameFromSan(sans: string[], fen: string = START_FEN): Game {
  const g = new Game(fen);
  for (const s of sans) {
    if (!g.moveSan(s)) throw new Error(`Illegal SAN "${s}" at ${g.fen()}`);
  }
  return g;
}
