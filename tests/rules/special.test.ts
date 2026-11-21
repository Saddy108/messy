import { describe, it, expect } from 'vitest';
import { Game, gameFromSan } from '../../src/chess/rules';

const BOTH = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';

describe('castling (§5.5)', () => {
  it('kingside and queenside: king moves two squares, rook jumps over', () => {
    const g = new Game(BOTH);
    expect(g.move('e1', 'g1')!.san).toBe('O-O');
    expect(g.pieceAt('f1')?.type).toBe('r');
    expect(g.pieceAt('h1')).toBeUndefined();
    expect(g.move('e8', 'c8')!.san).toBe('O-O-O');
    expect(g.pieceAt('d8')?.type).toBe('r');
  });
  it('not allowed when the king has moved', () => {
    expect(new Game('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1').move('e1', 'g1')).toBeNull();
  });
  it('not allowed when pieces are between', () => {
    const g = new Game('r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 0 1');
    expect(g.move('e1', 'c1')).toBeNull();
    expect(g.move('e1', 'g1')).not.toBeNull();
  });
  it('not allowed while in check', () => {
    const g = new Game('4k3/8/8/8/8/8/4r3/R3K2R w KQ - 0 1');
    expect(g.inCheck()).toBe(true);
    expect(g.move('e1', 'g1')).toBeNull();
  });
  it('not allowed through an attacked square', () => {
    const g = new Game('4k3/8/8/8/8/8/5r2/R3K2R w KQ - 0 1');
    expect(g.move('e1', 'g1')).toBeNull();
    expect(g.move('e1', 'c1')).not.toBeNull();
  });
  it('not allowed onto an attacked square', () => {
    expect(new Game('4k3/8/8/8/8/8/6r1/R3K2R w KQ - 0 1').move('e1', 'g1')).toBeNull();
  });
  it('an attacked rook is fine, and the queenside rook may pass an attacked b1', () => {
    expect(new Game('4k3/8/8/8/8/8/1r5r/R3K2R w KQ - 0 1').move('e1', 'c1')).not.toBeNull();
    expect(new Game('4k3/8/8/8/8/8/7r/R3K2R w KQ - 0 1').move('e1', 'g1')).not.toBeNull();
  });
  it('moving a rook removes only that side\'s right', () => {
    const g = gameFromSan(['Rg1'], BOTH);
    expect(g.castlingRights('w')).toEqual({ king: false, queen: true });
  });
});

describe('en passant (§5.5)', () => {
  it('captures as if the pawn had moved one square', () => {
    const g = gameFromSan(['e4', 'a6', 'e5', 'd5']);
    expect(g.enPassantSquare()).toBe('d6');
    const m = g.move('e5', 'd6')!;
    expect(m.enPassant).toBe(true);
    expect(g.pieceAt('d5')).toBeUndefined();
  });
  it('is only available on the very next move', () => {
    const g = gameFromSan(['e4', 'a6', 'e5', 'd5', 'Nf3', 'a5']);
    expect(g.move('e5', 'd6')).toBeNull();
    expect(g.pastEnPassantSquares()).toContain('d6');
  });
  it('only pawns capture en passant', () => {
    const g = new Game('4k3/8/8/2pN4/8/8/8/4K3 w - c6 0 1');
    expect(g.legalMoves('d5').some((m) => m.enPassant)).toBe(false);
  });
});

describe('promotion (§5.5)', () => {
  it('offers queen, rook, bishop and knight — never king or pawn', () => {
    const g = new Game('8/P7/8/8/8/8/k7/4K3 w - - 0 1');
    expect(g.legalMoves('a7').map((m) => m.promotion).sort()).toEqual(['b', 'n', 'q', 'r']);
    expect(g.needsPromotion('a7', 'a8')).toBe(true);
  });
  it('replaces the pawn with the chosen piece', () => {
    const g = new Game('8/P7/8/8/8/8/k7/4K3 w - - 0 1');
    g.move('a7', 'a8', 'n');
    expect(g.pieceAt('a8')).toEqual({ type: 'n', color: 'w' });
  });
  it('under-promotion to a knight can give check (queen does not)', () => {
    const g = new Game('8/5P1k/8/8/8/8/8/4K3 w - - 0 1');
    expect(g.legalMoves('f7').find((m) => m.promotion === 'n')!.check).toBe(true);
    expect(g.legalMoves('f7').find((m) => m.promotion === 'q')!.check).toBe(false);
  });
  it('under-promotion to a rook avoids stalemate', () => {
    const fen = '8/1P6/8/8/8/8/8/5K1k w - - 0 1';
    const q = new Game(fen);
    q.move('b7', 'b8', 'q');
    expect(q.isStalemate()).toBe(true);
    const r = new Game(fen);
    r.move('b7', 'b8', 'r');
    expect(r.isStalemate()).toBe(false);
  });
});
