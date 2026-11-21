// Goal validators: decide, after each learner move, whether a task is finished, still going, or must restart.
import type { Goal } from '../types';
import type { Sim, SimMove } from './sim';
import type { Square } from '../../chess/types';
import { normalizeSan } from '../../chess/notation';

export type Verdict =
  | { status: 'continue' }
  | { status: 'done'; text?: string }
  /** The position is reset. `mistake` adds to the lesson's mistake count. */
  | { status: 'retry'; reason: string; mistake: boolean };

export class GoalTracker {
  readonly goal: Goal;
  moves = 0;
  readonly captured = new Set<Square>();
  readonly starsLeft: Set<Square>;

  constructor(goal: Goal) {
    this.goal = goal;
    this.starsLeft = new Set(goal.type === 'collectStars' ? goal.stars : []);
  }

  reset(): void {
    this.moves = 0;
    this.captured.clear();
    if (this.goal.type === 'collectStars') this.goal.stars.forEach((s) => this.starsLeft.add(s));
  }

  /** Called after a legal learner move has been played on `sim`. */
  onMove(move: SimMove, sim: Sim): Verdict {
    const g = this.goal;
    this.moves++;
    const tooMany = (max?: number): Verdict | null =>
      max !== undefined && this.moves >= max ? { status: 'retry', reason: `That took ${this.moves} moves. Try to do it in ${max} or fewer.`, mistake: false } : null;

    switch (g.type) {
      case 'collectStars': {
        this.starsLeft.delete(move.to);
        if (this.starsLeft.size === 0) return { status: 'done' };
        return tooMany(g.maxMoves) ?? { status: 'continue' };
      }
      case 'capture': {
        if (move.capture && g.targets.includes(move.to)) this.captured.add(move.to);
        return this.captured.size >= g.targets.length ? { status: 'done' } : { status: 'continue' };
      }
      case 'reachSquare':
        if (move.to === g.square) return { status: 'done' };
        return tooMany(g.maxMoves) ?? { status: 'continue' };
      case 'escapeCheck': {
        const kind = move.piece === 'k' ? 'move' : move.capture ? 'capture' : 'block';
        const text = kind === 'move' ? 'You moved the king out of check.' : kind === 'capture' ? 'You captured the attacker!' : 'You blocked the check!';
        if (g.require && g.require !== kind) {
          const want = { move: 'move the king', capture: 'capture the attacker', block: 'block the line' }[g.require];
          return { status: 'retry', reason: `That works, but this lesson asks you to ${want}. Try that one.`, mistake: false };
        }
        return { status: 'done', text };
      }
      case 'checkmate': {
        if (move.mate) return { status: 'done' };
        if (sim.isStalemate()) return { status: 'retry', reason: 'Stalemate! The game is a draw, not a win. Try again, and give check before the king runs out of moves.', mistake: true };
        if (this.moves >= g.inMoves) {
          return { status: 'retry', reason: g.inMoves === 1 ? 'That is not checkmate. Look for a check where the king has no escape.' : `Not checkmate within ${g.inMoves} moves. Try again.`, mistake: true };
        }
        return { status: 'continue' };
      }
      case 'castle':
        return move.castle === g.side ? { status: 'done' } : { status: 'retry', reason: `That is a fine move, but this lesson wants you to castle ${g.side}side. Select the king and tap the glowing castling square.`, mistake: true };
      case 'enPassant':
        return move.enPassant ? { status: 'done' } : { status: 'retry', reason: 'Look for the pawn capture that takes the pawn that just moved two squares.', mistake: true };
      case 'promote':
        if (move.promotion && (!g.to || g.to === move.promotion)) return { status: 'done' };
        return { status: 'retry', reason: move.promotion ? 'That promotion works, but try the piece the lesson asks for.' : 'Push the pawn all the way to the last rank to promote it.', mistake: !move.promotion };
      case 'survive':
        if (sim.isMate()) return { status: 'retry', reason: 'Checkmate! Try again and keep your king safe.', mistake: true };
        return this.moves >= Math.ceil(g.plies / 2) ? { status: 'done' } : { status: 'continue' };
      case 'playMove': {
        const ok = g.uci.some((u) => u === move.uci || u === move.from + move.to);
        return ok ? { status: 'done' } : { status: 'retry', reason: 'That is a legal move, but not the best one here. Look again!', mistake: true };
      }
      case 'playSan': {
        const ok = move.san !== undefined && g.san.some((s) => normalizeSan(s) === normalizeSan(move.san!));
        return ok ? { status: 'done' } : { status: 'retry', reason: `That move is written ${move.san ?? '?'}. Find the move ${g.san[0]}.`, mistake: true };
      }
      default:
        return { status: 'continue' };
    }
  }

  /** After the opponent replies: did the learner just get mated or stalemated unexpectedly? */
  afterOpponent(sim: Sim): Verdict {
    const g = this.goal;
    if ((g.type === 'checkmate' || g.type === 'survive') && sim.isMate()) {
      return { status: 'retry', reason: 'Oh no, you were checkmated! Try again.', mistake: true };
    }
    if (g.type === 'checkmate' && sim.isStalemate()) {
      return { status: 'retry', reason: 'Stalemate — a draw. Be careful not to trap the king without check.', mistake: true };
    }
    return { status: 'continue' };
  }
}
