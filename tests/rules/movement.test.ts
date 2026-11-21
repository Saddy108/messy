import { describe, it, expect } from 'vitest';
import { Game } from '../../src/chess/rules';
import { parsePlacement, sandboxMoves } from '../../src/chess/sandbox';
import type { Square } from '../../src/chess/types';

const targets = (fen: string, from: Square) => sandboxMoves(parsePlacement(fen), from).map((m) => m.to).sort();
const isLight = (s: string) => (s.charCodeAt(0) - 97 + Number(s[1])) % 2 === 0;

describe('piece movement (§5.4)', () => {
  it('rook slides along lines, is blocked by own pieces, captures enemies', () => {
    const t = targets('8/8/3P4/8/3R2p1/8/8/8 w - - 0 1', 'd4');
    expect(t).toContain('d5');
    expect(t).not.toContain('d6');
    expect(t).toContain('g4');
    expect(t).not.toContain('h4');
    expect(t.length).toBe(10);
  });
  it('rook has 14 squares on an empty board', () => expect(targets('8/8/8/8/3R4/8/8/8 w - - 0 1', 'd4').length).toBe(14));
  it('bishop has 13 squares from d4 and only dark squares', () => {
    const t = targets('8/8/8/8/3B4/8/8/8 w - - 0 1', 'd4');
    expect(t.length).toBe(13);
    t.forEach((s) => expect(isLight(s)).toBe(isLight('d4')));
  });
  it('queen has 27 squares from d4', () => expect(targets('8/8/8/8/3Q4/8/8/8 w - - 0 1', 'd4').length).toBe(27));
  it('king moves one square (8 from d4, 3 from a1)', () => {
    expect(targets('8/8/8/8/3K4/8/8/8 w - - 0 1', 'd4').length).toBe(8);
    expect(targets('8/8/8/8/8/8/8/K7 w - - 0 1', 'a1').length).toBe(3);
  });
  it('knight jumps over pieces and always lands on the opposite color', () => {
    expect(targets('8/8/2PPP3/2PNP3/2PPP3/8/8/8 w - - 0 1', 'd5').length).toBe(8);
    const open = targets('8/8/8/8/3N4/8/8/8 w - - 0 1', 'd4');
    expect(open.length).toBe(8);
    open.forEach((s) => expect(isLight(s)).toBe(!isLight('d4')));
  });
  it('pawn: one step, two from start, blocked, diagonal capture only', () => {
    expect(targets('8/8/8/8/8/8/4P3/8 w - - 0 1', 'e2')).toEqual(['e3', 'e4']);
    expect(targets('8/8/8/8/8/4P3/8/8 w - - 0 1', 'e3')).toEqual(['e4']);
    expect(targets('8/8/8/8/8/4p3/4P3/8 w - - 0 1', 'e2')).toEqual([]);
    expect(targets('8/8/8/8/8/3p1p2/4P3/8 w - - 0 1', 'e2')).toEqual(['d3', 'e3', 'e4', 'f3']);
    expect(targets('8/8/8/8/4p3/8/4P3/8 w - - 0 1', 'e2')).toEqual(['e3']);
  });
  it('black pawns move down the board', () => expect(targets('8/4p3/8/8/8/8/8/8 b - - 0 1', 'e7')).toEqual(['e5', 'e6']));
  it('full game: the knight jumps, the bishop is blocked', () => {
    const g = new Game();
    expect(g.legalTargets('g1').sort()).toEqual(['f3', 'h3']);
    expect(g.legalTargets('f1')).toEqual([]);
  });
  it('captured piece is removed; own pieces cannot be captured', () => {
    const g = new Game('4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1');
    expect(g.move('e4', 'd5')).not.toBeNull();
    expect(g.pieceAt('d5')?.color).toBe('w');
    expect(g.pieces().e4).toBeUndefined();
    expect(new Game().move('a1', 'a2')).toBeNull();
  });
});
