// Shared bits for the step views.
import { parsePlacement } from '../../chess/sandbox';
import type { Pieces, Square } from '../../chess/types';
import type { Mark } from '../../board/Board';

export interface StepProps {
  lessonMode: 'sandbox' | 'full';
  coordinates: boolean;
  /** Learner finished this step. */
  onDone: () => void;
  onMistake: (n?: number) => void;
  onHint: () => void;
  /** True for the last step (button says "Finish"). */
  last: boolean;
}

export const piecesFromFen = (fen?: string): Pieces => (fen ? parsePlacement(fen) : {});

export const marksFrom = (squares: Square[] | undefined, mark: Mark): Partial<Record<Square, Mark>> => {
  const out: Partial<Record<Square, Mark>> = {};
  squares?.forEach((s) => (out[s] = mark));
  return out;
};

export const pick = <T,>(list: T[], seed: number): T => list[Math.abs(seed) % list.length];

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
