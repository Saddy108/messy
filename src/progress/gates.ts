// Mastery gates (§9.2): what is unlocked, based on saved progress.
import type { Save } from './storage';
import { CURRICULUM, type StageMeta } from '../lessons/curriculum';

const stars = (s: Save, id: string): number => s.lessons[id]?.stars ?? 0;

/** All regular lessons finished with >= 2 stars (or the stage was tested out). */
export const lessonsMastered = (s: Save, st: StageMeta): boolean =>
  !!s.testedOut[st.id] || st.lessons.every((l) => stars(s, l.id) >= 2);

export const stageComplete = (s: Save, st: StageMeta): boolean => lessonsMastered(s, st) && stars(s, st.boss.id) >= 2;

export function stageUnlocked(s: Save, index: number, stages: StageMeta[] = CURRICULUM): boolean {
  return index === 0 || stageComplete(s, stages[index - 1]);
}

export type LessonState = 'locked' | 'open' | 'done';

export function lessonState(s: Save, st: StageMeta, lessonId: string, stages: StageMeta[] = CURRICULUM): LessonState {
  const idx = stages.indexOf(st);
  if (stars(s, lessonId) >= 1) return 'done'; // boss/check results below the pass mark are stored as 0 stars
  if (!stageUnlocked(s, idx, stages)) return 'locked';
  if (lessonId === st.check.id) return 'open'; // test-out is always available in an unlocked stage
  if (lessonId === st.boss.id) {
    return st.lessons.every((l) => stars(s, l.id) >= 1) || s.testedOut[st.id] ? 'open' : 'locked';
  }
  const i = st.lessons.findIndex((l) => l.id === lessonId);
  if (i <= 0) return 'open';
  return stars(s, st.lessons[i - 1].id) >= 1 || s.testedOut[st.id] ? 'open' : 'locked';
}

/** The next thing the learner should do (first open, not-done lesson in journey order). */
export function nextLesson(s: Save, stages: StageMeta[] = CURRICULUM): { stage: StageMeta; lessonId: string } | null {
  for (const st of stages) {
    for (const l of [...st.lessons, st.boss]) {
      if (lessonState(s, st, l.id, stages) === 'open') return { stage: st, lessonId: l.id };
    }
  }
  return null;
}

export const progressPercent = (s: Save, stages: StageMeta[] = CURRICULUM): number => {
  const all = stages.flatMap((st) => [...st.lessons, st.boss]);
  if (!all.length) return 0;
  return Math.round((all.filter((l) => stars(s, l.id) >= 1).length / all.length) * 100);
};
