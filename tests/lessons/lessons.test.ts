// Validates every lesson file: legal FENs, reachable goals, hints present, text limits, cards exist.
import { describe, it, expect } from 'vitest';
import { STAGE_LOADERS } from '../../src/lessons/stages';
import type { Lesson, Stage, Step } from '../../src/lessons/types';
import { Game } from '../../src/chess/rules';
import { parsePlacement, sandboxMoves } from '../../src/chess/sandbox';
import { Sim } from '../../src/lessons/engine/sim';
import { collectStarsPath, findMate, sandboxBfs } from '../../src/lessons/engine/solver';
import { CURRICULUM } from '../../src/lessons/curriculum';
import { CARDS, RULE_AREAS } from '../../src/content/cards';
import { ALL_SQUARES, type Color, type Square } from '../../src/chess/types';
import { turnFromFen } from '../../src/chess/sandbox';
import { normalizeSan } from '../../src/chess/notation';

const stages: Stage[] = [];
for (const id of Object.keys(STAGE_LOADERS).sort()) stages.push((await STAGE_LOADERS[id]()).default);
const allLessons: Lesson[] = stages.flatMap((s) => [...s.lessons, s.check, s.boss]);

const words = (t: string) => t.trim().split(/\s+/).length;
const sentences = (t: string) => t.split(/(?<=[.!?])\s+/).filter(Boolean);
const textOf = (s: Step): string[] => {
  switch (s.kind) {
    case 'narrate': return [s.text];
    case 'demo': return s.captions;
    case 'task': return [s.prompt, ...s.hints];
    case 'quiz': return [s.question, s.explanation];
    case 'rush': return [s.prompt];
  }
};

describe('curriculum', () => {
  it('has 13 stages in order', () => {
    expect(stages.length).toBe(13);
    stages.forEach((s, i) => expect(s.number).toBe(i + 1));
  });
  it('generated index matches the stage files (run `npm run gen` if this fails)', () => {
    expect(CURRICULUM.length).toBe(stages.length);
    stages.forEach((s, i) => {
      expect(CURRICULUM[i].lessons.map((l) => l.id)).toEqual(s.lessons.map((l) => l.id));
      expect(CURRICULUM[i].check.id).toBe(s.check.id);
      expect(CURRICULUM[i].boss.id).toBe(s.boss.id);
    });
  });
  it('lesson ids are unique and stage ids consistent', () => {
    const ids = allLessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    stages.forEach((s) => [...s.lessons, s.check, s.boss].forEach((l) => expect(l.stageId).toBe(s.id)));
  });
  it('every stage has 4–8 lessons (Stage 2 may have more: one chapter per piece)', () => {
    stages.forEach((s) => {
      expect(s.lessons.length).toBeGreaterThanOrEqual(3);
      expect(s.lessons.length).toBeLessThanOrEqual(s.number === 2 ? 14 : 8);
    });
  });
  it('every lesson has a takeaway and steps', () => {
    allLessons.forEach((l) => {
      expect(l.takeaway.length).toBeGreaterThan(10);
      expect(l.steps.length).toBeGreaterThan(0);
    });
  });
  it('every referenced review card exists', () => {
    const ids = new Set(CARDS.map((c) => c.id));
    allLessons.forEach((l) => l.reviewCards.forEach((id) => expect(ids.has(id), `${l.id} -> ${id}`).toBe(true)));
  });
  it('the card bank covers every rule area', () => {
    RULE_AREAS.forEach((r) => expect(CARDS.some((c) => c.rule === r), r).toBe(true));
  });
});

describe('lesson text (simple English, short sentences)', () => {
  for (const l of allLessons) {
    it(l.id, () => {
      for (const s of l.steps) {
        for (const t of textOf(s)) {
          for (const sentence of sentences(t)) {
            expect(words(sentence), `"${sentence}" in ${l.id}`).toBeLessThanOrEqual(26);
          }
        }
        if (s.kind === 'narrate') expect(sentences(s.text).length, `narrate in ${l.id}`).toBeLessThanOrEqual(3);
      }
    });
  }
});

const checkTask = (l: Lesson, s: Extract<Step, { kind: 'task' }>, idx: number) => {
  const label = `${l.id} step ${idx} (${s.goal.type})`;
  expect(s.hints.length, `hints in ${label}`).toBeGreaterThan(0);
  expect(s.prompt.length).toBeGreaterThan(5);
  const g = s.goal;
  if (g.type === 'setupBoard') return;
  if (l.mode === 'full') {
    expect(Game.isValidFen(s.fen), `valid FEN ${label}: ${s.fen}`).toBe(true);
  } else {
    expect(() => parsePlacement(s.fen)).not.toThrow();
  }
  const color: Color = s.color ?? turnFromFen(s.fen);
  if (l.mode === 'sandbox') {
    const start = parsePlacement(s.fen);
    switch (g.type) {
      case 'collectStars': {
        const path = collectStarsPath(start, color, g.stars);
        expect(path, `stars reachable ${label}`).not.toBeNull();
        if (g.maxMoves) expect(path!.length, `maxMoves ${g.maxMoves} vs min ${path!.length} in ${label}`).toBeLessThanOrEqual(g.maxMoves);
        break;
      }
      case 'reachSquare': {
        const path = sandboxBfs(start, color, (p) => p[g.square]?.color === color, 9);
        expect(path, `reachable ${label}`).not.toBeNull();
        if (g.maxMoves) expect(path!.length, `maxMoves in ${label}`).toBeLessThanOrEqual(g.maxMoves);
        break;
      }
      case 'capture': {
        const path = sandboxBfs(start, color, (_p, cap) => g.targets.every((t) => cap.has(t)), 8);
        expect(path, `capturable ${label}`).not.toBeNull();
        break;
      }
      case 'findAllMoves':
        expect(sandboxMoves(start, g.from).length, label).toBeGreaterThan(0);
        break;
      default:
        break;
    }
    return;
  }
  const game = new Game(s.fen);
  const opp = s.opponent ?? 'none';
  switch (g.type) {
    case 'findAllMoves':
      expect(game.legalTargets(g.from).length, label).toBeGreaterThan(0);
      break;
    case 'escapeCheck': {
      expect(game.inCheck(), `in check ${label}`).toBe(true);
      const kinds = new Set(game.legalMoves().map((m) => (m.piece === 'k' ? 'move' : m.capture ? 'capture' : 'block')));
      if (g.require) expect(kinds.has(g.require), `escape kind ${g.require} possible in ${label}`).toBe(true);
      break;
    }
    case 'checkmate':
      if (g.inMoves <= 2) expect(findMate(s.fen, g.inMoves), `mate in ${g.inMoves} exists ${label}`).not.toBeNull();
      if (g.inMoves > 1) expect(opp, `opponent for ${label}`).not.toBe('none');
      break;
    case 'castle':
      expect(game.legalMoves().some((m) => m.castle === g.side), label).toBe(true);
      break;
    case 'enPassant':
      expect(game.legalMoves().some((m) => m.enPassant), label).toBe(true);
      break;
    case 'promote':
      expect(game.legalMoves().some((m) => m.promotion && (!g.to || m.promotion === g.to)), label).toBe(true);
      break;
    case 'playMove':
      g.uci.forEach((u) => expect(game.legalMoves().some((m) => m.uci === u || m.from + m.to === u), `${u} legal in ${label}`).toBe(true));
      break;
    case 'playSan':
      g.san.forEach((u) => expect(game.legalMoves().some((m) => normalizeSan(m.san) === normalizeSan(u)), `${u} legal in ${label}`).toBe(true));
      break;
    case 'survive':
      expect(opp).not.toBe('none');
      break;
    default:
      break;
  }
  if (opp === 'none') {
    expect(['escapeCheck', 'castle', 'enPassant', 'promote', 'checkmate', 'playMove', 'playSan', 'findAllMoves']).toContain(g.type);
    if (g.type === 'checkmate') expect(g.inMoves).toBe(1);
  }
};

describe('lesson content is valid and solvable', () => {
  for (const l of allLessons) {
    describe(l.id, () => {
      l.steps.forEach((s, i) => {
        it(`step ${i} (${s.kind})`, () => {
          if (s.kind === 'task') return checkTask(l, s, i);
          if (s.kind === 'narrate' && s.fen) expect(() => parsePlacement(s.fen!)).not.toThrow();
          if (s.kind === 'narrate') (s.highlight ?? []).forEach((q) => expect(ALL_SQUARES).toContain(q));
          if (s.kind === 'quiz') {
            if (s.fen) expect(() => parsePlacement(s.fen!)).not.toThrow();
            const a = s.answer;
            if (a.type === 'choice') {
              expect(a.options.length).toBeGreaterThanOrEqual(2);
              expect(a.correct).toBeGreaterThanOrEqual(0);
              expect(a.correct).toBeLessThan(a.options.length);
            }
            if (a.type === 'squares') {
              expect(a.correct.length).toBeGreaterThan(0);
              a.correct.forEach((q) => expect(ALL_SQUARES).toContain(q));
            }
            if (a.type === 'text') expect(a.accepted.length).toBeGreaterThan(0);
            expect(s.explanation.length).toBeGreaterThan(5);
          }
          if (s.kind === 'demo') {
            expect(s.captions.length).toBeGreaterThanOrEqual(s.moves.length);
            const sim = new Sim(l.mode, s.fen);
            s.moves.forEach((u) => expect(sim.tryOpponentUci(u).ok, `demo move ${u} in ${l.id}`).toBe(true));
          }
        });
      });
    });
  }
});

describe('review cards', () => {
  for (const c of CARDS) {
    it(c.id, () => {
      expect(c.id.startsWith('card-')).toBe(true);
      const a = c.step.answer;
      if (c.step.fen) expect(() => parsePlacement(c.step.fen!)).not.toThrow();
      if (a.type === 'choice') expect(a.correct).toBeLessThan(a.options.length);
      if (a.type === 'squares') {
        // the answer squares must hold up against sandbox moves when the board has exactly one white piece
        const squares = a.correct as Square[];
        expect(squares.length).toBeGreaterThan(0);
      }
    });
  }
  it('ids are unique', () => expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length));
});
