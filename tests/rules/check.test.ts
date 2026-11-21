import { describe, it, expect } from 'vitest';
import { Game } from '../../src/chess/rules';

describe('check (§5.6)', () => {
  it('detects check and the checking piece', () => {
    const g = new Game('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');
    expect(g.inCheck()).toBe(true);
    expect(g.checkers()).toEqual(['e2']);
  });
  it('escape by moving the king', () => {
    const g = new Game('4k3/8/8/8/4r3/8/3B4/R3K3 w - - 0 1');
    expect(g.legalMoves().some((m) => m.piece === 'k')).toBe(true);
  });
  it('escape by blocking', () => {
    const g = new Game('4k3/8/8/8/4r3/8/3B4/R3K3 w - - 0 1');
    expect(g.legalMoves().some((m) => m.piece === 'b' && m.to === 'e3')).toBe(true);
  });
  it('escape by capturing the attacker', () => {
    const g = new Game('4k3/8/8/8/8/8/4r3/3QK3 w - - 0 1');
    expect(g.legalMoves().some((m) => m.piece === 'q' && m.to === 'e2' && m.capture)).toBe(true);
  });
  it('knight checks cannot be blocked: only king moves help here', () => {
    const g = new Game('4k3/8/8/8/8/5n2/8/R3K3 w - - 0 1');
    expect(g.inCheck()).toBe(true);
    expect(g.legalMoves().every((m) => m.piece === 'k')).toBe(true);
  });
  it('double check: only the king can move, even if a piece could capture one checker', () => {
    const g = new Game('4r1k1/8/8/8/1b5Q/8/8/4K3 w - - 0 1');
    expect(g.checkers().length).toBe(2);
    expect(g.legalMoves('h4')).toEqual([]);
    expect(g.legalMoves().length).toBeGreaterThan(0);
    expect(g.legalMoves().every((m) => m.piece === 'k')).toBe(true);
  });
  it('a pinned piece may not leave the pin line', () => {
    const g = new Game('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1');
    expect(g.legalMoves('e2').every((m) => m.to[0] === 'e')).toBe(true);
    expect(g.legalMoves('e2').length).toBeGreaterThan(0);
  });
  it('the king cannot move into check, and kings cannot touch', () => {
    const g = new Game('8/8/8/8/8/3k4/8/4K3 w - - 0 1');
    const t = g.legalTargets('e1');
    expect(t).not.toContain('d2');
    expect(t).not.toContain('e2');
    expect(t).toContain('f1');
    expect(t).toContain('f2');
  });
  it('a move that leaves the king in check is illegal', () => {
    const g = new Game('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1');
    expect(g.move('e2', 'd2')).toBeNull();
  });
});

describe('checkmate (§5.7)', () => {
  it('fool\'s mate', () => {
    const g = new Game();
    ['f3', 'e5', 'g4', 'Qh4'].forEach((s) => g.moveSan(s));
    expect(g.isCheckmate()).toBe(true);
    expect(g.end()).toMatchObject({ over: true, result: '0-1', reason: 'checkmate', winner: 'b' });
  });
  it('back-rank mate', () => {
    const g = new Game('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1');
    g.moveSan('Ra8#');
    expect(g.isCheckmate()).toBe(true);
  });
  it('check with an escape is not checkmate', () => {
    const g = new Game('4k3/8/8/8/8/8/4r3/4K3 w - - 0 1');
    expect(g.isCheckmate()).toBe(false);
  });
});
