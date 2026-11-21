// XP, ranks, streaks and badges. Pure functions on the Save object so they are easy to test.
import type { Save } from './storage';
import { dayNumber } from '../review/scheduler';
import { CURRICULUM } from '../lessons/curriculum';

export const RANKS = [
  { name: 'Pawn', xp: 0, emoji: '♟️' },
  { name: 'Knight', xp: 200, emoji: '🐴' },
  { name: 'Bishop', xp: 600, emoji: '⛪' },
  { name: 'Rook', xp: 1400, emoji: '🏰' },
  { name: 'Queen', xp: 2800, emoji: '👑' },
  { name: 'King', xp: 5000, emoji: '🤴' },
];

export function rankFor(xp: number): { index: number; name: string; emoji: string; next: number | null; into: number } {
  let index = 0;
  RANKS.forEach((r, i) => {
    if (xp >= r.xp) index = i;
  });
  const next = RANKS[index + 1]?.xp ?? null;
  return { index, name: RANKS[index].name, emoji: RANKS[index].emoji, next, into: xp - RANKS[index].xp };
}

export const lessonXp = (stars: number, kind: 'lesson' | 'check' | 'boss' = 'lesson'): number =>
  (kind === 'boss' ? 60 : kind === 'check' ? 40 : 20) + stars * 5;

export const dayKey = (d: Date = new Date()): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const dayFromKey = (k: string): number => {
  const [y, m, d] = k.split('-').map(Number);
  return dayNumber(new Date(y, m - 1, d));
};
/** ISO-ish week key, used for the once-a-week streak freeze. */
export const weekKey = (d: Date = new Date()): string => {
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(monday);
};

/** Call when the learner does something useful today. Uses one free streak freeze per week when a day was missed. */
export function touchStreak(save: Save, now: Date = new Date()): Save {
  const today = dayKey(now);
  const s = save.streak;
  if (s.lastDay === today) return save;
  let count = 1;
  let freezeWeek = s.freezeWeek;
  if (s.lastDay) {
    const gap = dayFromKey(today) - dayFromKey(s.lastDay);
    if (gap === 1) count = s.count + 1;
    else if (gap === 2 && s.freezeWeek !== weekKey(now)) {
      count = s.count + 1; // freeze covers the one missed day
      freezeWeek = weekKey(now);
    }
  }
  return { ...save, streak: { count, best: Math.max(s.best, count), lastDay: today, freezeWeek } };
}

/** Streak shown to the learner: it only counts as alive if they played today or yesterday (or a freeze would cover it). */
export function liveStreak(save: Save, now: Date = new Date()): number {
  const s = save.streak;
  if (!s.lastDay) return 0;
  const gap = dayFromKey(dayKey(now)) - dayFromKey(s.lastDay);
  if (gap <= 1) return s.count;
  if (gap === 2 && s.freezeWeek !== weekKey(now)) return s.count;
  return 0;
}

export const freezeAvailable = (save: Save, now: Date = new Date()): boolean => save.streak.freezeWeek !== weekKey(now);

export const minutesToday = (save: Save, now: Date = new Date()): number => save.minutes[dayKey(now)] ?? 0;

export interface BadgeDef {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  earned: (s: Save) => boolean;
}

const done = (s: Save, id: string) => (s.lessons[id]?.stars ?? 0) >= 1;
const allDone = (s: Save, ids: string[]) => ids.every((id) => done(s, id));

export const BADGES: BadgeDef[] = [
  { id: 'first-lesson', title: 'First Step', desc: 'Finish your first lesson.', emoji: '🌱', earned: (s) => Object.values(s.lessons).some((l) => l.stars >= 1) },
  { id: 'three-stars', title: 'Shining Star', desc: 'Earn 3 stars on a lesson.', emoji: '⭐', earned: (s) => Object.values(s.lessons).some((l) => l.stars === 3) },
  { id: 'army-ready', title: 'Army Commander', desc: 'Pass the boss of Stage 2: Meet the Army.', emoji: '🛡️', earned: (s) => (s.lessons['stage-02-boss']?.stars ?? 0) >= 2 },
  { id: 'first-mate', title: 'First Checkmate', desc: 'Win a game or finish the Stage 6 boss.', emoji: '🏁', earned: (s) => (s.lessons['stage-06-boss']?.stars ?? 0) >= 2 || s.arena.wins > 0 },
  { id: 'castling-master', title: 'Castling Master', desc: 'Finish every castling lesson.', emoji: '🏰', earned: (s) => allDone(s, ['castle-1', 'castle-2', 'castle-3', 'castle-4']) },
  { id: 'en-passant-ninja', title: 'En Passant Ninja', desc: 'Learn the sneaky pawn capture.', emoji: '🥷', earned: (s) => done(s, 'enpassant-2') },
  { id: 'streak-3', title: '3-Day Streak', desc: 'Learn 3 days in a row.', emoji: '🔥', earned: (s) => s.streak.best >= 3 },
  { id: 'streak-7', title: '7-Day Streak', desc: 'Learn 7 days in a row.', emoji: '🌟', earned: (s) => s.streak.best >= 7 },
  { id: 'no-hint-stage', title: 'No-Hint Hero', desc: 'Earn 3 stars on every lesson in a stage.', emoji: '🧠', earned: (s) =>
    CURRICULUM.some((st) => st.lessons.length > 0 && st.lessons.every((l) => s.lessons[l.id]?.stars === 3)) },
  { id: 'review-20', title: 'Memory Builder', desc: 'Review 20 cards.', emoji: '🧩', earned: (s) => Object.values(s.cards).reduce((a, c) => a + c.seen, 0) >= 20 },
  { id: 'arena-win', title: 'Arena Victor', desc: 'Win a game in the Arena.', emoji: '⚔️', earned: (s) => s.arena.wins > 0 },
  { id: 'exam', title: 'Ready to Play', desc: 'Pass the Final Rules Exam.', emoji: '🎓', earned: (s) => !!s.exam?.passed },
];

/** Badges not yet owned that the save now qualifies for. */
export function newBadges(save: Save): string[] {
  return BADGES.filter((b) => !save.badges[b.id] && b.earned(save)).map((b) => b.id);
}

export function awardBadges(save: Save, now = Date.now()): { save: Save; added: string[] } {
  const added = newBadges(save);
  if (!added.length) return { save, added };
  const badges = { ...save.badges };
  added.forEach((id) => (badges[id] = now));
  return { save: { ...save, badges }, added };
}
