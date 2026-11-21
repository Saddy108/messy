// Storage migrations, spaced repetition, streaks, ranks and mastery gates.
import { describe, it, expect } from 'vitest';
import { CURRENT_VERSION, defaultSave, exportSave, importSave, migrate } from '../../src/progress/storage';
import { INTERVALS, answerCard, dueIds, newCard, weakIds } from '../../src/review/scheduler';
import { liveStreak, rankFor, touchStreak } from '../../src/progress/rewards';
import { lessonState, stageUnlocked } from '../../src/progress/gates';
import { CURRICULUM } from '../../src/lessons/curriculum';

describe('storage migrations', () => {
  it('upgrades a v0 prototype save (flat settings)', () => {
    const s = migrate({ name: 'Ada', xp: 40 });
    expect(s.v).toBe(CURRENT_VERSION);
    expect(s.settings.name).toBe('Ada');
    expect(s.xp).toBe(40);
    expect(s.minutes).toEqual({});
  });
  it('upgrades a v1 save without losing progress', () => {
    const s = migrate({ v: 1, xp: 90, lessons: { 'rook-1': { stars: 3, best: 3, at: 1 } }, settings: { name: 'Bo' } });
    expect(s.v).toBe(CURRENT_VERSION);
    expect(s.lessons['rook-1'].stars).toBe(3);
    expect(s.exam).toBeNull();
    expect(s.settings.sound).toBe(true);
  });
  it('survives garbage input', () => {
    expect(migrate(null).v).toBe(CURRENT_VERSION);
    expect(migrate('nope').xp).toBe(0);
  });
  it('export then import round-trips', () => {
    const s = { ...defaultSave(), xp: 123 };
    expect(importSave(exportSave(s))?.xp).toBe(123);
    expect(importSave('{ not json')).toBeNull();
  });
});

describe('spaced repetition (Leitner 0, 1, 3, 7, 14, 30)', () => {
  it('uses the specified intervals', () => expect(INTERVALS).toEqual([0, 1, 3, 7, 14, 30]));
  it('moves up a box on a correct answer and schedules the next review', () => {
    let c = newCard(10);
    const due = [11, 13, 17, 24, 40];
    due.forEach((d, i) => {
      c = answerCard(c, true, 10);
      expect(c.box).toBe(i + 1);
      expect(c.due).toBe(d);
    });
    expect(answerCard(c, true, 10).box).toBe(5);
  });
  it('a wrong answer returns to box 1 and is due today', () => {
    const c = answerCard({ box: 4, due: 50, seen: 3, misses: 0 }, false, 20);
    expect(c).toMatchObject({ box: 0, due: 20, misses: 1 });
  });
  it('lists due cards and the weakest cards', () => {
    const cards = { a: { box: 0, due: 5, seen: 2, misses: 2 }, b: { box: 2, due: 9, seen: 3, misses: 0 }, c: { box: 1, due: 5, seen: 4, misses: 3 } };
    expect(dueIds(cards, 5)).toEqual(['c', 'a']);
    expect(weakIds(cards, 5)).toEqual(['a', 'c']); // ranked by miss rate; never-missed cards are not weak
  });
});

describe('streaks and ranks', () => {
  const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
  it('counts consecutive days', () => {
    let s = touchStreak(defaultSave(), at(2026, 3, 1));
    s = touchStreak(s, at(2026, 3, 2));
    s = touchStreak(s, at(2026, 3, 3));
    expect(s.streak.count).toBe(3);
  });
  it('does not double count the same day', () => {
    const s = touchStreak(defaultSave(), at(2026, 3, 1));
    expect(touchStreak(s, at(2026, 3, 1)).streak.count).toBe(1);
  });
  it('a free weekly freeze covers one missed day, but only once a week', () => {
    let s = touchStreak(defaultSave(), at(2026, 3, 2));
    s = touchStreak(s, at(2026, 3, 4));
    expect(s.streak.count).toBe(2);
    s = touchStreak(s, at(2026, 3, 6));
    expect(s.streak.count).toBe(1);
  });
  it('a long gap ends the streak', () => {
    const s = touchStreak(defaultSave(), at(2026, 3, 1));
    expect(liveStreak(s, at(2026, 3, 10))).toBe(0);
  });
  it('ranks climb with XP', () => {
    expect(rankFor(0).name).toBe('Pawn');
    expect(rankFor(100000).name).toBe('King');
  });
});

describe('mastery gates', () => {
  const [s1, s2] = CURRICULUM;
  it('only stage 1 is open at the start', () => {
    const s = defaultSave();
    expect(stageUnlocked(s, 0)).toBe(true);
    expect(stageUnlocked(s, 1)).toBe(false);
  });
  it('stage 2 unlocks when all lessons have 2+ stars and the boss is passed', () => {
    const s = defaultSave();
    s1.lessons.forEach((l) => (s.lessons[l.id] = { stars: 2, best: 2, at: 1 }));
    expect(stageUnlocked(s, 1)).toBe(false);
    s.lessons[s1.boss.id] = { stars: 2, best: 2, at: 1 };
    expect(stageUnlocked(s, 1)).toBe(true);
  });
  it('one-star lessons do not unlock the next stage', () => {
    const s = defaultSave();
    s1.lessons.forEach((l) => (s.lessons[l.id] = { stars: 1, best: 1, at: 1 }));
    s.lessons[s1.boss.id] = { stars: 3, best: 3, at: 1 };
    expect(stageUnlocked(s, 1)).toBe(false);
  });
  it('lessons unlock one at a time', () => {
    const s = defaultSave();
    expect(lessonState(s, s1, s1.lessons[0].id)).toBe('open');
    expect(lessonState(s, s1, s1.lessons[1].id)).toBe('locked');
    s.lessons[s1.lessons[0].id] = { stars: 1, best: 1, at: 1 };
    expect(lessonState(s, s1, s1.lessons[1].id)).toBe('open');
    expect(lessonState(s, s2, s2.lessons[0].id)).toBe('locked');
  });
  it('testing out of a stage opens every lesson in it', () => {
    const s = defaultSave();
    s.testedOut[s1.id] = true;
    expect(lessonState(s, s1, s1.lessons[3].id)).toBe('open');
    expect(lessonState(s, s1, s1.boss.id)).toBe('open');
  });
});
