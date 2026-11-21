// Position analysis helpers: hanging pieces, mate threats, move commentary and the post-game review labels.
import { Chess } from 'chess.js';
import { Game, type LegalMove } from '../chess/rules';
import { PIECE_NAMES, PIECE_VALUES, other, type Color, type Square } from '../chess/types';

export interface Hanging {
  square: Square;
  piece: string;
  /** Cheapest enemy piece value that can take it. */
  cheapestAttacker: number;
}

/** Pieces of `color` that the other side can win material from: attacked, and either undefended or attacked by something cheaper. */
export function hangingPieces(game: Game, color: Color): Hanging[] {
  const out: Hanging[] = [];
  const pieces = game.pieces();
  for (const s of Object.keys(pieces) as Square[]) {
    const p = pieces[s]!;
    if (p.color !== color || p.type === 'k') continue;
    const attackers = game.attackers(s, other(color));
    if (!attackers.length) continue;
    const cheapest = Math.min(...attackers.map((a) => PIECE_VALUES[pieces[a]!.type] || 99));
    const defended = game.attackers(s, color).length > 0;
    if (!defended || cheapest < PIECE_VALUES[p.type]) out.push({ square: s, piece: PIECE_NAMES[p.type], cheapestAttacker: cheapest });
  }
  return out;
}

/** Does `color` have a mate in one right now (as if it were their turn)? Returns the SAN or null. */
export function mateInOne(fen: string, color: Color): string | null {
  const parts = fen.split(' ');
  parts[1] = color;
  parts[3] = '-';
  try {
    const c = new Chess(parts.join(' '));
    for (const m of c.moves({ verbose: true })) {
      c.move(m);
      const mate = c.isCheckmate();
      c.undo();
      if (mate) return m.san;
    }
  } catch {
    /* the position with the turn swapped is not legal (e.g. a king is in check) */
  }
  return null;
}

export const isDeveloping = (m: LegalMove): boolean =>
  (m.piece === 'n' || m.piece === 'b') && (m.from[1] === '1' || m.from[1] === '8');

/** One friendly line after the learner's move (Guided mode). `game` is the position AFTER the move. */
export function commentary(game: Game, move: LegalMove, ply: number): string | null {
  const me = move.color;
  if (move.mate) return 'Checkmate! You won the game.';
  const hanging = hangingPieces(game, me);
  if (hanging.length) {
    const h = hanging[0];
    return `Careful: your ${h.piece} on ${h.square} can be captured.`;
  }
  if (move.castle) return 'Good — castling keeps your king safe and wakes up a rook.';
  if (move.promotion) return `Wonderful — your pawn became a ${PIECE_NAMES[move.promotion]}!`;
  if (move.capture) return `Nice — you captured a piece with your ${PIECE_NAMES[move.piece]}.`;
  if (move.check) return 'Check! Keep an eye on where the enemy king can go.';
  if (ply <= 20 && isDeveloping(move)) return `Good — you developed a ${PIECE_NAMES[move.piece]}.`;
  if (ply <= 20 && move.piece === 'p' && ['e4', 'd4', 'e5', 'd5'].includes(move.to)) return 'Good — a pawn in the center gives your pieces room.';
  if (ply <= 12 && move.piece === 'q') return 'Careful: bringing the queen out early lets the enemy chase her with small pieces.';
  if (ply <= 16 && move.piece === 'k') return 'Moving the king by hand loses your castling right. Castling is usually better.';
  return null;
}

/** Warnings before the learner's turn: hanging pieces and mate threats. */
export function threatWarnings(game: Game, me: Color): string[] {
  const out: string[] = [];
  const mate = mateInOne(game.fen(), other(me));
  if (mate && !game.inCheck()) out.push(`Mate threat! ${other(me) === 'w' ? 'White' : 'Black'} threatens ${mate}.`);
  hangingPieces(game, me).slice(0, 2).forEach((h) => out.push(`Your ${h.piece} on ${h.square} is under attack.`));
  return out;
}

export type Label = 'Great' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder';

export function labelFor(dropInPawns: number): Label {
  if (dropInPawns <= -0.5) return 'Great';
  if (dropInPawns < 0.4) return 'Good';
  if (dropInPawns < 1) return 'Inaccuracy';
  if (dropInPawns < 2.5) return 'Mistake';
  return 'Blunder';
}

/** Plain-English reason a move was weak. `before` is the position before the move, `after` the position after it. */
export function reasonFor(beforeFen: string, move: LegalMove): string {
  const before = new Game(beforeFen);
  const me = move.color;
  const mate = mateInOne(beforeFen, me);
  if (mate && !move.mate) return `You missed mate in 1 with ${mate}.`;
  const after = new Game(move.after);
  const theirMate = after.legalMoves().find((m) => m.mate);
  if (theirMate) return `This lets the enemy play ${theirMate.san}: checkmate in 1.`;
  const hang = hangingPieces(after, me).filter((h) => h.square === move.to || !hangingPieces(before, me).some((b) => b.square === h.square));
  if (hang.length) return `It left your ${hang[0].piece} on ${hang[0].square} undefended.`;
  const free = before.legalMoves().find((m) => {
    if (!m.capture) return false;
    const g = before.clone();
    g.move(m.from, m.to, m.promotion);
    return !g.legalMoves().some((r) => r.to === m.to);
  });
  if (free && !move.capture) return `You missed a free capture: ${free.san}.`;
  return 'It gave away some of your advantage. Look for a safer or stronger move.';
}
