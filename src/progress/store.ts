// The app-wide progress store (tiny external store + React hook) and every action that changes progress.
import { useSyncExternalStore } from 'react';
import { defaultSave, importSave, loadSave, writeSave, type CardState, type Save, type Settings } from './storage';
import { BADGES, awardBadges, dayKey, lessonXp, touchStreak } from './rewards';
import { answerCard, dayNumber, newCard } from '../review/scheduler';

let state: Save = loadSave();
const listeners = new Set<() => void>();
export const toastQueue: { id: number; text: string }[] = [];
let toastId = 1;
const toastListeners = new Set<() => void>();

export const getSave = (): Save => state;
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useSave = (): Save => useSyncExternalStore(subscribe, getSave);

export function pushToast(text: string): void {
  toastQueue.push({ id: toastId++, text });
  toastListeners.forEach((l) => l());
}
export const subscribeToasts = (l: () => void): (() => void) => {
  toastListeners.add(l);
  return () => {
    toastListeners.delete(l);
  };
};

/** Replace the save, persist it, award any new badges, notify the UI. */
function commit(next: Save): void {
  const { save, added } = awardBadges(next);
  state = save;
  writeSave(state);
  listeners.forEach((l) => l());
  added.forEach((id) => pushToast(`New badge: ${BADGES.find((b) => b.id === id)?.title ?? id}!`));
}
export const update = (fn: (s: Save) => Save): void => commit(fn(state));

export function setSettings(patch: Partial<Settings>): void {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
}

export interface LessonOutcome {
  lessonId: string;
  stars: number; // 0 = not passed
  kind: 'lesson' | 'check' | 'boss';
  stageId: string;
  mistakes: number;
  hints: number;
  cards: string[];
}

/** Record a finished lesson. Returns the XP gained. */
export function completeLesson(o: LessonOutcome): number {
  let gained = 0;
  update((s) => {
    const prev = s.lessons[o.lessonId];
    const firstTime = !prev || prev.stars === 0;
    const best = Math.max(prev?.stars ?? 0, o.stars);
    const lessons = { ...s.lessons, [o.lessonId]: { stars: best, best, at: Date.now() } };
    gained = o.stars > 0 ? (firstTime ? lessonXp(o.stars, o.kind) : Math.max(0, lessonXp(o.stars, o.kind) - 15)) : 5;
    const testedOut = { ...s.testedOut };
    if (o.kind === 'check' && o.stars >= 3) testedOut[o.stageId] = true;
    const today = dayNumber();
    const cards = { ...s.cards };
    if (o.stars > 0) o.cards.forEach((id) => { if (!cards[id]) cards[id] = newCard(today); });
    return touchStreak({ ...s, lessons, testedOut, cards, xp: s.xp + gained, hintsUsed: s.hintsUsed + o.hints });
  });
  return gained;
}

export function addXp(amount: number): void {
  update((s) => touchStreak({ ...s, xp: s.xp + amount }));
}

export function addMinutes(min: number): void {
  const k = dayKey();
  update((s) => ({ ...s, minutes: { ...s.minutes, [k]: (s.minutes[k] ?? 0) + min } }));
}

/** Record a review answer (creates the card if the learner is practising it for the first time). */
export function reviewAnswer(cardId: string, correct: boolean): void {
  update((s) => {
    const today = dayNumber();
    const prev: CardState = s.cards[cardId] ?? newCard(today);
    return touchStreak({ ...s, cards: { ...s.cards, [cardId]: answerCard(prev, correct, today) }, xp: s.xp + (correct ? 2 : 0) });
  });
}

export function recordGame(result: 'win' | 'draw' | 'loss', level: number): void {
  update((s) => {
    const a = s.arena;
    return touchStreak({
      ...s,
      xp: s.xp + (result === 'win' ? 30 + level * 5 : result === 'draw' ? 15 : 8),
      arena: {
        ...a,
        games: a.games + 1,
        wins: a.wins + (result === 'win' ? 1 : 0),
        draws: a.draws + (result === 'draw' ? 1 : 0),
        losses: a.losses + (result === 'loss' ? 1 : 0),
        winsByLevel: result === 'win' ? { ...a.winsByLevel, [level]: (a.winsByLevel[level] ?? 0) + 1 } : a.winsByLevel,
      },
    });
  });
}

/** Save a mini-game score; returns true if it is a new personal best. */
export function recordMinigame(id: string, score: number, lowerIsBetter = false): boolean {
  const prev = state.minigames[id];
  const better = prev === undefined || (lowerIsBetter ? score < prev : score > prev);
  update((s) => touchStreak({ ...s, xp: s.xp + Math.min(40, 5 + Math.round(Math.abs(score) / 2)), minigames: better ? { ...s.minigames, [id]: score } : s.minigames }));
  return better;
}

export function recordExam(score: number, passed: boolean): void {
  update((s) => ({
    ...s,
    xp: s.xp + (passed && !s.exam?.passed ? 150 : 10),
    exam: { passed: passed || !!s.exam?.passed, best: Math.max(score, s.exam?.best ?? 0), date: passed ? Date.now() : (s.exam?.date ?? 0) },
  }));
}

export function importProgress(text: string): boolean {
  const s = importSave(text);
  if (!s) return false;
  commit(s);
  return true;
}
export function resetProgress(): void {
  commit(defaultSave());
}
