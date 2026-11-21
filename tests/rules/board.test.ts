import { describe, it, expect } from 'vitest';
import { isLightSquare, between } from '../../src/chess/geometry';
import { Game, START_FEN } from '../../src/chess/rules';
import { ALL_SQUARES } from '../../src/chess/types';

describe('board (§5.1, §5.2, §5.3)', () => {
  it('has 64 squares', () => expect(ALL_SQUARES.length).toBe(64));
  it('h1 is light and a1 is dark ("light on the right")', () => {
    expect(isLightSquare('h1')).toBe(true);
    expect(isLightSquare('a1')).toBe(false);
    expect(isLightSquare('a8')).toBe(true);
    expect(isLightSquare('h8')).toBe(false);
  });
  it('squares alternate colors', () => {
    expect(isLightSquare('e4')).toBe(true);
    expect(isLightSquare('d4')).toBe(false);
  });
  it('between() returns the squares on a line', () => {
    expect(between('a1', 'a4')).toEqual(['a2', 'a3']);
    expect(between('a1', 'c3')).toEqual(['b2']);
    expect(between('a1', 'b3')).toEqual([]);
  });
  it('start position: queen on her color, kings face each other, 16 pieces each', () => {
    const p = new Game(START_FEN).pieces();
    expect(p.d1).toEqual({ type: 'q', color: 'w' });
    expect(isLightSquare('d1')).toBe(true);
    expect(p.d8).toEqual({ type: 'q', color: 'b' });
    expect(isLightSquare('d8')).toBe(false);
    expect(p.e1?.type).toBe('k');
    expect(p.e8?.type).toBe('k');
    const vals = Object.values(p);
    expect(vals.filter((x) => x!.color === 'w').length).toBe(16);
    expect(vals.filter((x) => x!.color === 'b').length).toBe(16);
  });
  it('White moves first; turns alternate; you cannot pass', () => {
    const g = new Game();
    expect(g.turn()).toBe('w');
    g.move('e2', 'e4');
    expect(g.turn()).toBe('b');
    expect(g.move('e2', 'e3')).toBeNull();
  });
});
