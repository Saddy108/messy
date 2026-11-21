// Light index of the journey (ids + titles only) so the map and unlock logic never load lesson content.
// The data lives in curriculum.generated.ts, produced by `npm run gen` from the stage files; a unit test keeps them in sync.
import { CURRICULUM_DATA } from './curriculum.generated';

export interface LessonMeta {
  id: string;
  title: string;
  kind: 'lesson' | 'check' | 'boss';
}
export interface StageMeta {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  lessons: LessonMeta[]; // regular lessons only
  check: LessonMeta;
  boss: LessonMeta;
}

export const CURRICULUM: StageMeta[] = CURRICULUM_DATA as StageMeta[];

export const stageById = (id: string): StageMeta | undefined => CURRICULUM.find((s) => s.id === id);
export const allMetaLessons = (): LessonMeta[] => CURRICULUM.flatMap((s) => [...s.lessons, s.check, s.boss]);
export const stageOfLesson = (lessonId: string): StageMeta | undefined =>
  CURRICULUM.find((s) => [...s.lessons, s.check, s.boss].some((l) => l.id === lessonId));
