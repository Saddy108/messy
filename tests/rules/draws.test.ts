import { describe, it, expect } from 'vitest';
import { Game } from '../../src/chess/rules';
import { evaluateDraws, insufficientMaterial, positionKey } from '../../src/chess/draws';
import { parsePlacement } from '../../src/chess/sandbox';

const shuffle = ['Nf3', 'Nf6', 'Ng1', 'Ng8'];

describe('draws (§5.7)', () => {
  it('stalemate: not in check and no legal move', () => {
    const g = new Game('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(g.inCheck()).toBe(false);
    expect(g.isStalemate()).toBe(true);
    expect(g.end()).toMatchObject({ over: true, result: '1/2-1/2', reason: 'stalemate' });
  });
  it.each([
    ['K v K', '8/8/4k3/8/8/3K4/8/8 w - - 0 1'],
    ['K+B v K', '8/8/4k3/8/8/3KB3/8/8 w - - 0 1'],
    ['K+N v K', '8/8/4k3/8/8/3KN3/8/8 w - - 0 1'],
    ['K+B v K+B same color', '8/8/4kb2/8/8/3KB3/8/8 w - - 0 1'],
  ])('dead position: %s', (_n, fen) => {
    expect(insufficientMaterial(parsePlacement(fen))).toBe(true);
    expect(new Game(fen).end()).toMatchObject({ over: true, reason: 'insufficient' });
  });
  it('mating material is not insufficient', () => {
    expect(insufficientMaterial(parsePlacement('8/8/4k3/8/8/3KR3/8/8 w - - 0 1'))).toBe(false);
    expect(insufficientMaterial(parsePlacement('8/8/4k3/8/8/3KP3/8/8 w - - 0 1'))).toBe(false);
    expect(insufficientMaterial(parsePlacement('8/8/4kb2/8/8/3K1B2/8/8 w - - 0 1'))).toBe(false); // opposite colors
    expect(insufficientMaterial(parsePlacement('8/8/4k3/8/8/3KNN2/8/8 w - - 0 1'))).toBe(false);
  });
  it('threefold repetition: claimable, not automatic', () => {
    const g = new Game();
    [...shuffle, ...shuffle].forEach((s) => g.moveSan(s));
    const d = g.drawInfo();
    expect(d.repetitions).toBe(3);
    expect(d.threefold).toBe(true);
    expect(d.fivefold).toBe(false);
    expect(g.canClaimDraw()).toBe(true);
    expect(g.end({ claimDraws: false }).over).toBe(false);
    expect(g.end()).toMatchObject({ over: true, reason: 'threefold' });
  });
  it('fivefold repetition ends the game automatically', () => {
    const g = new Game();
    for (let i = 0; i < 4; i++) shuffle.forEach((s) => g.moveSan(s));
    expect(g.drawInfo().fivefold).toBe(true);
    expect(g.end({ claimDraws: false })).toMatchObject({ over: true, reason: 'fivefold' });
  });
  it('same piece placement with different castling rights is a different position', () => {
    expect(positionKey('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')).not.toBe(positionKey('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1'));
  });
  it('50-move rule: claimable at 100 plies, 75-move automatic at 150', () => {
    const fen = (n: number) => `4k3/8/8/8/8/8/8/R3K3 w - - ${n} 80`;
    expect(evaluateDraws([fen(99)])).toMatchObject({ fifty: false, seventyFive: false });
    expect(evaluateDraws([fen(100)])).toMatchObject({ fifty: true, seventyFive: false });
    expect(evaluateDraws([fen(150)])).toMatchObject({ fifty: true, seventyFive: true });
    expect(new Game(fen(100)).end({ claimDraws: false }).over).toBe(false);
    expect(new Game(fen(100)).end()).toMatchObject({ reason: 'fifty' });
    expect(new Game(fen(150)).end({ claimDraws: false })).toMatchObject({ reason: 'seventyfive' });
  });
  it('checkmate wins over the 75-move rule', () => {
    const g = new Game('R5k1/5ppp/8/8/8/8/8/4K3 b - - 149 80');
    expect(g.isCheckmate()).toBe(true);
    expect(g.end()).toMatchObject({ reason: 'checkmate' });
  });
});
