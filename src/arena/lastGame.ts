// Remembers the most recent Arena game in memory so the review screen can analyse it.
import type { LegalMove } from '../chess/rules';
import type { Color } from '../chess/types';

export interface FinishedGame {
  startFen: string;
  moves: LegalMove[];
  me: Color;
  level: number;
}

let last: FinishedGame | null = null;
export const setLastGame = (g: FinishedGame): void => {
  last = g;
};
export const getLastGame = (): FinishedGame | null => last;
