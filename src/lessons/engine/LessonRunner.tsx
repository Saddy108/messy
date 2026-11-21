// Runs a lesson step by step (Demo → Guided try → Independent try → Quick check) and scores it.
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Lesson } from '../types';
import { NarrateView } from './NarrateView';
import { DemoView } from './DemoView';
import { TaskView } from './TaskView';
import { QuizView } from './QuizView';
import { RushView } from './RushView';
import { Coach } from '../../coach/Coach';
import { COACH } from '../../content/brand';
import { SUMMARY } from '../../content/text';
import { Confetti } from '../../ui/Confetti';
import type { StepProps } from './common';
import { useSave, completeLesson } from '../../progress/store';

export interface LessonResult {
  stars: number; // 1..3 earned (0 = not passed)
  passed: boolean;
  mistakes: number;
  hints: number;
  xp: number;
}

export function starsFor(lesson: Lesson, mistakes: number, hints: number): number {
  const penalty = mistakes + hints;
  return penalty <= lesson.stars.three ? 3 : penalty <= lesson.stars.two ? 2 : 1;
}

interface Props {
  lesson: Lesson;
  stageNumber: number;
  onExit: () => void;
  onNextLesson?: () => void;
  /** Offered when the learner finishes a boss/check below the pass mark, or wants another go. */
  onRetry?: () => void;
}

export function LessonRunner({ lesson, stageNumber, onExit, onNextLesson, onRetry }: Props) {
  const save = useSave();
  const [i, setI] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState<LessonResult | null>(null);
  const mistakeRef = useRef(0);
  const hintRef = useRef(0);
  const step = lesson.steps[i];
  const kind = lesson.kind ?? 'lesson';
  const coordinates = save.settings.coordinates || stageNumber <= 9;

  const addMistake = useCallback((n = 1) => {
    mistakeRef.current += n;
    setMistakes(mistakeRef.current);
  }, []);
  const addHint = useCallback(() => {
    hintRef.current += 1;
    setHints(hintRef.current);
  }, []);

  const finish = useCallback(() => {
    const raw = starsFor(lesson, mistakeRef.current, hintRef.current);
    const passed = kind === 'lesson' ? true : raw >= 2;
    const stars = passed ? raw : 0;
    const xp = completeLesson({
      lessonId: lesson.id, stars, kind, stageId: lesson.stageId,
      mistakes: mistakeRef.current, hints: hintRef.current, cards: lesson.reviewCards,
    });
    setResult({ stars, passed, mistakes: mistakeRef.current, hints: hintRef.current, xp });
  }, [lesson, kind]);

  const next = useCallback(() => {
    if (i + 1 >= lesson.steps.length) finish();
    else setI(i + 1);
  }, [i, lesson.steps.length, finish]);

  const common = useMemo(
    () => ({ lessonMode: lesson.mode, coordinates, onDone: next, onMistake: addMistake, onHint: addHint, last: i === lesson.steps.length - 1 }),
    [lesson.mode, coordinates, next, addMistake, addHint, i, lesson.steps.length],
  );

  if (result) {
    const stageClear = kind === 'boss' && result.passed;
    return (
      <div className="summary">
        {result.passed && (result.stars === 3 || stageClear) && <Confetti />}
        <Coach mood={result.passed ? 'cheer' : 'oops'}>
          {result.passed ? (stageClear ? COACH.stageClear : SUMMARY.pass) : kind === 'boss' ? SUMMARY.bossFail : SUMMARY.checkFail}
        </Coach>
        <h2>{lesson.title}</h2>
        {result.passed && (
          <div className="stars" aria-label={`${result.stars} of 3 stars`}>
            {[1, 2, 3].map((n) => <span key={n} className={n <= result.stars ? 'star-on' : 'star-off'}>★</span>)}
          </div>
        )}
        <p className="stat-line">
          {result.mistakes} mistake{result.mistakes === 1 ? '' : 's'} · {result.hints} hint{result.hints === 1 ? '' : 's'}
          {result.xp > 0 && <> · <strong>+{result.xp} XP</strong></>}
        </p>
        <div className="takeaway">
          <h3>Remember</h3>
          <p>{lesson.takeaway}</p>
          {lesson.mnemonic && <p className="mnemonic">💡 {lesson.mnemonic}</p>}
        </div>
        <div className="goal-actions">
          {(!result.passed || result.stars < 3) && onRetry && <button className="btn btn-ghost" onClick={onRetry}>↺ {result.passed ? 'Try for 3 stars' : 'Try again'}</button>}
          <button className="btn btn-ghost" onClick={onExit}>Back to map</button>
          {result.passed && onNextLesson && <button className="btn btn-primary" onClick={onNextLesson} autoFocus>Next lesson →</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="lesson">
      <header className="lesson-head">
        <button className="btn btn-ghost" onClick={onExit} aria-label="Leave lesson">✕</button>
        <div className="lesson-title">
          <strong>{lesson.title}</strong>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={lesson.steps.length} aria-valuenow={i + 1} aria-label="Lesson progress">
            <div className="progress-fill" style={{ width: `${((i + 1) / lesson.steps.length) * 100}%` }} />
          </div>
        </div>
        <div className="lesson-score" aria-label={`${mistakes} mistakes, ${hints} hints`}>⚠ {mistakes} · 💡 {hints}</div>
      </header>
      <StepSwitch key={`${lesson.id}-${i}`} step={step} common={common} />
    </div>
  );
}

function StepSwitch({ step, common: c }: { step: Lesson['steps'][number]; common: StepProps }) {
  switch (step.kind) {
    case 'narrate': return <NarrateView {...c} step={step} />;
    case 'demo': return <DemoView {...c} step={step} />;
    case 'task': return <TaskView {...c} step={step} />;
    case 'quiz': return <QuizView {...c} step={step} />;
    case 'rush':
      return (
        <RushView
          seconds={step.seconds} flip={step.flip} coords={step.coords} prompt={step.prompt}
          minCorrect={step.minCorrect} minAccuracy={step.minAccuracy}
          onFinish={(r, passed) => {
            if (!passed) c.onMistake(5);
            c.onDone();
            void r;
          }}
        />
      );
  }
}
