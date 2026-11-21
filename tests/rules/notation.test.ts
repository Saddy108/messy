import { describe, it, expect } from 'vitest';
import { Game } from '../../src/chess/rules';
import { explainSan, formatMoveList, moveWords, normalizeSan, replay, sameSan, sanDistractors } from '../../src/chess/notation';

describe('notation (§5.9)', () => {
  it('pawn, piece, capture, check, mate', () => {
    const g = new Game();
    expect(g.moveSan('e4')!.san).toBe('e4');
    expect(g.moveSan('e5')!.san).toBe('e5');
    expect(g.moveSan('Nf3')!.san).toBe('Nf3');
    expect(g.moveSan('Nc6')!.san).toBe('Nc6');
    expect(g.moveSan('Bb5')!.san).toBe('Bb5');
  });
  it('captures use x (pieces and pawns)', () => {
    const { moves } = replay(['e4', 'd5', 'exd5', 'Qxd5']);
    expect(moves[2].san).toBe('exd5');
    expect(moves[3].san).toBe('Qxd5');
  });
  it('castling and promotion notation', () => {
    const g = new Game('r3k2r/1P6/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(g.moveSan('O-O')!.castle).toBe('king');
    const h = new Game('r3k2r/1P6/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(h.legalMoves('b7').map((m) => m.san)).toContain('bxa8=Q+');
    expect(h.legalMoves('b7').map((m) => m.san)).toContain('b8=N');
  });
  it('disambiguation when two same pieces can reach a square', () => {
    const g = new Game('4k3/8/8/8/R6R/8/8/4K3 w - - 0 1');
    expect(g.legalMoves().map((m) => m.san)).toContain('Rad4');
    const h = new Game('4k3/8/8/8/8/1N3N2/8/4K3 w - - 0 1');
    expect(h.legalMoves().map((m) => m.san)).toContain('Nbd4');
    expect(h.legalMoves().map((m) => m.san)).toContain('Nfd4');
    const r = new Game('4k3/R7/8/8/8/8/R7/4K3 w - - 0 1');
    expect(r.legalMoves().map((m) => m.san)).toContain('R7a4');
  });
  it('normalizes typed input', () => {
    expect(normalizeSan('nf3')).toBe('Nf3');
    expect(normalizeSan('0-0')).toBe('O-O');
    expect(normalizeSan('Qh5+')).toBe('Qh5');
    expect(sameSan('Qxf7#', 'Qxf7')).toBe(true);
  });
  it('describes moves in words and explains SAN', () => {
    const g = new Game();
    expect(moveWords(g.moveSan('Nf3')!)).toBe('White knight from g1 to f3');
    expect(explainSan('Bxc6+')).toContain('x = capture');
    expect(explainSan('O-O')).toContain('castle');
  });
  it('formats move lists and makes wrong options', () => {
    expect(formatMoveList(['e4', 'e5', 'Nf3'])).toBe('1. e4 e5 2. Nf3');
    const g = new Game();
    const m = g.legalMoves().find((x) => x.san === 'Nf3')!;
    const d = sanDistractors(g, m, 3);
    expect(d.length).toBe(3);
    expect(d).not.toContain('Nf3');
  });
});
