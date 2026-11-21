// Spaced repetition (Leitner boxes). Intervals in days: 0, 1, 3, 7, 14, 30.
import type { CardState } from '../progress/storage';

export const INTERVALS = [0, 1, 3, 7, 14, 30];

/** Whole days since 1970 in the learner's local time. */
export const dayNumber = (d: Date = new Date()): number =>
  Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);

export const newCard = (today: number): CardState => ({ box: 0, due: today, seen: 0, misses: 0 });

/** Correct → next box; wrong → back to box 1 (index 0) and due again today. */
export function answerCard(card: CardState, correct: boolean, today: number): CardState {
  if (correct) {
    const box = Math.min(card.box + 1, INTERVALS.length - 1);
    return { ...card, box, due: today + INTERVALS[box], seen: card.seen + 1 };
  }
  return { ...card, box: 0, due: today, seen: card.seen + 1, misses: card.misses + 1 };
}

export const isDue = (card: CardState, today: number): boolean => card.due <= today;

export function dueIds(cards: Record<string, CardState>, today: number): string[] {
  return Object.entries(cards)
    .filter(([, c]) => isDue(c, today))
    .sort((a, b) => a[1].due - b[1].due || b[1].misses - a[1].misses)
    .map(([id]) => id);
}

export function weakIds(cards: Record<string, CardState>, limit = 10): string[] {
  return Object.entries(cards)
    .filter(([, c]) => c.misses > 0)
    .sort((a, b) => b[1].misses / Math.max(1, b[1].seen) - a[1].misses / Math.max(1, a[1].seen) || b[1].misses - a[1].misses)
    .slice(0, limit)
    .map(([id]) => id);
}
