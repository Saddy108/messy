// Arena helpers: hanging pieces, mate threats, commentary, labels, and mini-game generators.
import { describe, it, expect } from 'vitest';
import { Game } from '../../src/chess/rules';
import { commentary, hangingPieces, labelFor, mateInOne, reasonFor, threatWarnings } from '../../src/arena/analysis';
import { endings, knightDistance, mirrorFen, randomHangingQuestion, randomJump, randomNotationQuestion, seeded } from '../../src/arena/generators';

describe('analysis', () => {
  it('finds a hanging piece', () => {
    const g = new Game('4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1');
    expect(hangingPieces(g, 'b').map((h) => h.square)).toEqual(['d5']);
  });
  it('does not call a defended piece hanging', () => {
    const g = new Game('4k3/8/2p5/3n4/8/8/8/3QK3 w - - 0 1');
    expect(hangingPieces(g, 'b')).toEqual([]);
  });
  it('finds mate in one', () => {
    expect(mateInOne('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1', 'w')).toBe('Ra8#');
    expect(mateInOne('4k3/8/8/8/8/8/8/4K3 w - - 0 1', 'w')).toBeNull();
  });
  it('warns about mate threats', () => {
    const g = new Game('6k1/5ppp/8/8/8/8/8/R3K3 b - - 0 1');
    expect(threatWarnings(g, 'b').join(' ')).toContain('Mate threat');
  });
  it('comments on development', () => {
    const g = new Game();
    const m = g.move('g1', 'f3')!;
    expect(commentary(g, m, 1)).toContain('developed');
  });
  it('labels moves by evaluation drop', () => {
    expect(labelFor(-1)).toBe('Great');
    expect(labelFor(0)).toBe('Good');
    expect(labelFor(0.7)).toBe('Inaccuracy');
    expect(labelFor(1.5)).toBe('Mistake');
    expect(labelFor(5)).toBe('Blunder');
  });
  it('explains a missed mate in 1', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1';
    const g = new Game(fen);
    const m = g.move('e1', 'e2')!;
    expect(reasonFor(fen, m)).toContain('missed mate in 1');
  });
});

describe('generators', () => {
  it('mirrorFen is its own inverse', () => {
    const fen = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(mirrorFen(mirrorFen(fen))).toBe(fen);
  });
  it('every ending is valid and its result matches the position', () => {
    const list = endings();
    expect(list.length).toBeGreaterThan(10);
    list.forEach((e) => {
      expect(Game.isValidFen(e.fen)).toBe(true);
      const end = new Game(e.fen).end();
      expect(end.over, e.fen).toBe(true);
      if (end.over) expect(e.result).toBe(end.winner === 'w' ? 'White wins' : end.winner === 'b' ? 'Black wins' : 'Draw');
    });
  });
  it('hanging questions have valid positions and answers', () => {
    const rng = seeded(7);
    for (let i = 0; i < 10; i++) {
      const q = randomHangingQuestion(rng);
      expect(Game.isValidFen(q.fen)).toBe(true);
      expect(q.answer.length).toBeGreaterThanOrEqual(1);
    }
  });
  it('knight distances are right', () => {
    expect(knightDistance('a1', 'a1')).toBe(0);
    expect(knightDistance('a1', 'b3')).toBe(1);
    expect(randomJump(seeded(3)).min).toBeGreaterThanOrEqual(3);
  });
  it('notation questions include the right answer among distinct options', () => {
    const rng = seeded(11);
    for (let i = 0; i < 10; i++) {
      const q = randomNotationQuestion(rng);
      expect(q.options).toContain(q.san);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});
