// Quiz step: multiple choice, true/false, tap-the-squares and type-the-answer. Wrong answers are always explained.
import { useState } from 'react';
import { Board, type Mark } from '../../board/Board';
import { Coach } from '../../coach/Coach';
import { COACH } from '../../content/brand';
import { normalizeSan } from '../../chess/notation';
import type { Square } from '../../chess/types';
import { play } from '../../sound/sound';
import type { Step } from '../types';
import { piecesFromFen, type StepProps } from './common';

type QuizStep = Extract<Step, { kind: 'quiz' }>;

interface QuizProps extends Omit<StepProps, 'last' | 'onHint'> {
  step: QuizStep;
  last?: boolean;
  onHint?: () => void;
  /** Used by Review: called once with whether the first try was correct. */
  onFirstTry?: (correct: boolean) => void;
  doneLabel?: string;
}

export function QuizView({ step, coordinates, onDone, onMistake, last, onFirstTry, doneLabel }: QuizProps) {
  const a = step.answer;
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<number[]>([]);
  const [picked, setPicked] = useState<Square[]>([]);
  const [text, setText] = useState('');
  const [bad, setBad] = useState(false);
  const [first, setFirst] = useState(true);
  const [reveal, setReveal] = useState(false);

  const wrongAnswer = () => {
    onMistake();
    play('error');
    setBad(true);
    if (first) {
      setFirst(false);
      onFirstTry?.(false);
    }
  };
  const rightAnswer = () => {
    play('success');
    setBad(false);
    setSolved(true);
    if (first) {
      setFirst(false);
      onFirstTry?.(true);
    }
  };

  const chooseOption = (i: number) => {
    if (solved || wrong.includes(i) || a.type !== 'choice') return;
    if (i === a.correct) rightAnswer();
    else {
      setWrong([...wrong, i]);
      wrongAnswer();
    }
  };
  const chooseBool = (v: boolean) => {
    if (solved || a.type !== 'truefalse') return;
    if (v === a.correct) rightAnswer();
    else {
      setWrong([...wrong, v ? 1 : 0]);
      wrongAnswer();
    }
  };
  const tapSquare = (s: Square) => {
    if (solved || a.type !== 'squares') return;
    setBad(false);
    setPicked(picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s]);
  };
  const checkSquares = () => {
    if (a.type !== 'squares') return;
    const ok = picked.length === a.correct.length && a.correct.every((s) => picked.includes(s));
    if (ok) rightAnswer();
    else wrongAnswer();
  };
  const submitText = () => {
    if (a.type !== 'text' || solved) return;
    const t = normalizeSan(text);
    if (a.accepted.some((x) => normalizeSan(x) === t)) rightAnswer();
    else wrongAnswer();
  };

  const marks: Partial<Record<Square, Mark>> = {};
  if (a.type === 'squares') {
    picked.forEach((s) => (marks[s] = 'hint'));
    if (solved || reveal) a.correct.forEach((s) => (marks[s] = 'good'));
    else if (bad) picked.forEach((s) => { if (!a.correct.includes(s)) marks[s] = 'bad'; });
  }

  const mood = solved ? 'cheer' : bad ? 'oops' : 'think';
  const showExplain = solved || bad;
  const coachText = solved
    ? `${COACH.cheers[step.question.length % COACH.cheers.length]} ${step.explanation}`
    : bad
      ? `${COACH.gentle[step.question.length % COACH.gentle.length]} ${step.explanation}`
      : step.question;

  return (
    <div className="step quiz">
      <Coach mood={mood}>{coachText}</Coach>
      {step.fen && (
        <Board
          pieces={piecesFromFen(step.fen)}
          orientation={step.flip ? 'b' : 'w'}
          coordinates={coordinates}
          marks={marks}
          onSquare={a.type === 'squares' ? tapSquare : undefined}
          label="Quiz board"
        />
      )}
      {showExplain && <p className="sr-only" role="status">{step.explanation}</p>}

      {a.type === 'choice' && (
        <div className="options" role="group" aria-label="Answers">
          {a.options.map((o, i) => (
            <button
              key={i}
              className={`option ${wrong.includes(i) ? 'wrong' : ''} ${solved && i === a.correct ? 'right' : ''}`}
              disabled={solved || wrong.includes(i)}
              onClick={() => chooseOption(i)}
            >
              <span className="option-mark" aria-hidden="true">{solved && i === a.correct ? '✓' : wrong.includes(i) ? '✗' : String.fromCharCode(65 + i)}</span>
              {o}
            </button>
          ))}
        </div>
      )}
      {a.type === 'truefalse' && (
        <div className="options two" role="group" aria-label="True or false">
          {[true, false].map((v) => {
            const idx = v ? 1 : 0;
            return (
              <button
                key={String(v)}
                className={`option ${wrong.includes(idx) ? 'wrong' : ''} ${solved && v === a.correct ? 'right' : ''}`}
                disabled={solved || wrong.includes(idx)}
                onClick={() => chooseBool(v)}
              >
                <span className="option-mark" aria-hidden="true">{solved && v === a.correct ? '✓' : wrong.includes(idx) ? '✗' : v ? 'T' : 'F'}</span>
                {v ? 'True' : 'False'}
              </button>
            );
          })}
        </div>
      )}
      {a.type === 'squares' && (
        <div className="goal-actions">
          <span className="goal-progress">{picked.length} selected</span>
          {!solved && <button className="btn btn-ghost" onClick={() => setReveal(true)} disabled={!bad} title="Show the answer after a wrong try">Show answer</button>}
          {!solved && <button className="btn btn-primary" onClick={checkSquares} disabled={picked.length === 0}>Check</button>}
        </div>
      )}
      {a.type === 'text' && !solved && (
        <form className="text-answer" onSubmit={(e) => { e.preventDefault(); submitText(); }}>
          <label className="sr-only" htmlFor="quiz-text">Your answer</label>
          <input id="quiz-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type the move, e.g. Nf3" autoComplete="off" autoCapitalize="off" spellCheck={false} />
          <button className="btn btn-primary" type="submit">Check</button>
        </form>
      )}
      {(solved || reveal) && (
        <div className="goal-actions">
          <button className="btn btn-primary" onClick={onDone} autoFocus>{doneLabel ?? (last ? 'Finish' : 'Next')} →</button>
        </div>
      )}
    </div>
  );
}
