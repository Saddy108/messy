// Every tactics puzzle: the solution is legal, and the bot engine agrees it is the best move.
import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { PUZZLES, dailyPuzzle } from '../../src/content/puzzles';
import { search } from '../../src/engine/search';

describe('tactics puzzles', () => {
  for (const p of PUZZLES) {
    it(p.id, () => {
      const chess = new Chess(p.fen);
      const legal = chess.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ''));
      [p.solution, ...(p.alts ?? [])].forEach((u) => expect(legal).toContain(u));
      const best = search(chess, 4, 4000, true)!;
      expect([p.solution, ...(p.alts ?? [])]).toContain(best.move.from + best.move.to + (best.move.promotion ?? ''));
    });
  }
  it('ids are unique', () => expect(new Set(PUZZLES.map((p) => p.id)).size).toBe(PUZZLES.length));
  it('the daily puzzle is deterministic and cycles', () => {
    expect(dailyPuzzle(100).id).toBe(dailyPuzzle(100).id);
    expect(dailyPuzzle(0).id).toBe(dailyPuzzle(PUZZLES.length).id);
    expect(() => dailyPuzzle(-3)).not.toThrow();
  });
});
