// Tiny builders so lesson files stay short and readable. Data only: no logic.
import type { Goal, Lesson, Opponent, Square, Stage, Step } from '../types';

export type { Lesson, Stage, Step, Square };

export const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';
export const fenOf = (placement: string, turn: 'w' | 'b' = 'w'): string => `${placement} ${turn} - - 0 1`;

export const nar = (text: string, extra: { fen?: string; highlight?: Square[]; arrows?: [Square, Square][]; stars?: Square[] } = {}): Step => ({
  kind: 'narrate', text, ...extra,
});

export const demo = (fen: string, moves: string[], captions: string[]): Step => ({ kind: 'demo', fen, moves, captions });

interface TaskExtra {
  opponent?: Opponent;
  scripted?: Record<string, string>;
  color?: 'w' | 'b';
  success?: string;
}
export const task = (prompt: string, fen: string, goal: Goal, hints: string[] = [], extra: TaskExtra = {}): Step => ({
  kind: 'task', prompt, fen, goal, hints, ...extra,
});

export const choice = (question: string, options: string[], correct: number, explanation: string, fen?: string, flip?: boolean): Step => ({
  kind: 'quiz', question, fen, flip, answer: { type: 'choice', options, correct }, explanation,
});
export const tf = (question: string, correct: boolean, explanation: string, fen?: string): Step => ({
  kind: 'quiz', question, fen, answer: { type: 'truefalse', correct }, explanation,
});
export const tap = (question: string, fen: string, squares: Square[], explanation: string, flip?: boolean): Step => ({
  kind: 'quiz', question, fen, flip, answer: { type: 'squares', correct: squares }, explanation,
});
export const typed = (question: string, fen: string | undefined, accepted: string[], explanation: string, flip?: boolean): Step => ({
  kind: 'quiz', question, fen, flip, answer: { type: 'text', accepted }, explanation,
});

export const rush = (prompt: string, seconds: number, minCorrect: number, minAccuracy: number, flip = false, coords = false): Step => ({
  kind: 'rush', prompt, seconds, minCorrect, minAccuracy, flip, coords,
});

interface LessonOpts {
  mnemonic?: string;
  mode?: 'sandbox' | 'full';
  stars?: { three: number; two: number };
  cards?: string[];
  kind?: 'lesson' | 'check' | 'boss';
}

export const lesson = (id: string, stageId: string, title: string, takeaway: string, steps: Step[], o: LessonOpts = {}): Lesson => ({
  id, stageId, title, takeaway, mnemonic: o.mnemonic, mode: o.mode ?? 'sandbox', steps,
  stars: o.stars ?? { three: 1, two: 3 }, reviewCards: o.cards ?? [], kind: o.kind ?? 'lesson',
});

/** A rule check (test-out): needs 0 mistakes for 3 stars (>= 90%), at most 1 for the pass mark. */
export const ruleCheck = (stageId: string, title: string, takeaway: string, steps: Step[], mode: 'sandbox' | 'full' = 'full'): Lesson =>
  lesson(`${stageId}-check`, stageId, `Rule Check: ${title}`, takeaway, steps, { mode, kind: 'check', stars: { three: 0, two: 1 } });

export const boss = (stageId: string, title: string, takeaway: string, steps: Step[], mode: 'sandbox' | 'full' = 'full', stars = { three: 1, two: 3 }): Lesson =>
  lesson(`${stageId}-boss`, stageId, `Boss: ${title}`, takeaway, steps, { mode, kind: 'boss', stars });

export const stage = (id: string, number: number, title: string, subtitle: string, emoji: string, lessons: Lesson[], check: Lesson, bossLesson: Lesson): Stage => ({
  id, number, title, subtitle, emoji, lessons, check, boss: bossLesson,
});

/** Board with a single piece. Handy for tap quizzes. */
export const only = (piece: string, square: Square): string => {
  const f = square.charCodeAt(0) - 97;
  const r = Number(square[1]);
  const rows = Array.from({ length: 8 }, (_, i) => (8 - i === r ? (f ? String(f) : '') + piece + (7 - f ? String(7 - f) : '') : '8'));
  return rows.join('/') + ' w - - 0 1';
};
