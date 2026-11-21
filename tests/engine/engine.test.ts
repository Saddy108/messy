import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { BOTS, bookMove, chooseMove } from '../../src/engine/bots';
import { search } from '../../src/engine/search';

describe('engine (§8.3)', () => {
  it('finds mate in 1', () => {
    const r = search(new Chess('6k1/5ppp/8/8/8/8/8/RR4K1 w - - 0 1'), 3, 3000)!;
    expect(r.move.san).toMatch(/#$/);
  });
  it('finds mate in 2', () => {
    const r = search(new Chess('7k/8/8/8/8/8/R7/1R4K1 w - - 0 1'), 4, 8000)!;
    const c = new Chess('7k/8/8/8/8/8/R7/1R4K1 w - - 0 1');
    c.move(r.move);
    const reply = chooseMove(c.fen(), 1)!;
    c.move(reply.san);
    const second = search(c, 3, 3000)!;
    c.move(second.move);
    expect(c.isCheckmate()).toBe(true);
  });
  it('never returns an illegal move at any level, and respects the time limit', () => {
    const fens = [
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 2 3',
      '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
    ];
    for (const fen of fens) {
      for (const bot of BOTS) {
        const t = Date.now();
        const c = chooseMove(fen, bot.level)!;
        expect(Date.now() - t).toBeLessThan(2600);
        const chess = new Chess(fen);
        expect(() => chess.move({ from: c.uci.slice(0, 2), to: c.uci.slice(2, 4), promotion: c.uci[4] })).not.toThrow();
      }
    }
  }, 60000);
  it('returns null when there is no legal move', () => {
    expect(chooseMove('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', 3)).toBeNull();
  });
  it('level 2 takes a free queen', () => {
    const c = chooseMove('4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1', 2)!;
    expect(c.uci).toBe('d1d5');
  });
  it('book lines are legal', () => {
    expect(bookMove([], () => 0)).toBe('e4');
    expect(bookMove(['e4', 'e5'], () => 0)).toBe('Nf3');
  });
});

describe('endgame technique', () => {
  it('level 6 mates a random defender with king and queen (at least 2 of 3 games)', () => {
    let mates = 0;
    for (let g = 0; g < 3; g++) {
      const c = new Chess('8/8/8/4k3/8/8/8/Q3K3 w - - 0 1');
      let plies = 0;
      while (!c.isGameOver() && plies < 100) {
        const m = c.turn() === 'w' ? chooseMove(c.fen(), 6) : chooseMove(c.fen(), 1);
        c.move({ from: m!.uci.slice(0, 2), to: m!.uci.slice(2, 4), promotion: m!.uci[4] });
        plies++;
      }
      if (c.isCheckmate()) mates++;
    }
    expect(mates).toBeGreaterThanOrEqual(2);
  }, 200000);
});
