// Lazy loaders: each stage is its own chunk, fetched only when the learner opens one of its lessons.
import type { Lesson, Stage } from '../types';
import { stageOfLesson } from '../curriculum';

type Loader = () => Promise<{ default: Stage }>;

export const STAGE_LOADERS: Record<string, Loader> = {
  'stage-01': () => import('./stage-01-board'),
  'stage-02': () => import('./stage-02-army'),
  'stage-03': () => import('./stage-03-setup'),
  'stage-04': () => import('./stage-04-value'),
  'stage-05': () => import('./stage-05-check'),
  'stage-06': () => import('./stage-06-mate'),
  'stage-07': () => import('./stage-07-special'),
  'stage-08': () => import('./stage-08-draws'),
  'stage-09': () => import('./stage-09-notation'),
  'stage-10': () => import('./stage-10-openings'),
  'stage-11': () => import('./stage-11-tactics'),
  'stage-12': () => import('./stage-12-endgame'),
  'stage-13': () => import('./stage-13-online'),
};

export async function loadStage(id: string): Promise<Stage | null> {
  const loader = STAGE_LOADERS[id];
  return loader ? (await loader()).default : null;
}

export async function loadLesson(lessonId: string): Promise<{ lesson: Lesson; stage: Stage } | null> {
  const meta = stageOfLesson(lessonId);
  if (!meta) return null;
  const stage = await loadStage(meta.id);
  if (!stage) return null;
  const lesson = [...stage.lessons, stage.check, stage.boss].find((l) => l.id === lessonId);
  return lesson ? { lesson, stage } : null;
}
