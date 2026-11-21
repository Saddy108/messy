// Spaced-repetition review: due cards (Leitner boxes 1, 3, 7, 14, 30 days) and the Weak Rules practice.
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CARDS, cardById } from '../../content/cards';
import { QuizView } from '../../lessons/engine/QuizView';
import { Coach } from '../../coach/Coach';
import { getSave, reviewAnswer, useSave } from '../../progress/store';
import { dayNumber, dueIds, weakIds } from '../../review/scheduler';

const SESSION = 10;

export default function ReviewPage() {
  const save = useSave();
  const [params] = useSearchParams();
  const weakMode = params.get('weak') === '1';
  const [round, setRound] = useState(0);
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);

  // Freeze the queue when a session starts, so answers do not reshuffle it.
  const queue = useMemo(() => {
    const s = getSave();
    const today = dayNumber();
    if (weakMode) return weakIds(s.cards, SESSION);
    const due = dueIds(s.cards, today).slice(0, SESSION);
    if (due.length) return due;
    return [];
  }, [weakMode, round]); // eslint-disable-line react-hooks/exhaustive-deps

  const [extra, setExtra] = useState<string[] | null>(null);
  const list = extra ?? queue;
  const learned = Object.keys(save.cards).length;

  const startExtra = () => {
    const pool = Object.keys(save.cards).sort(() => Math.random() - 0.5).slice(0, 6);
    setExtra(pool);
    setI(0);
    setRight(0);
    setWrong([]);
  };

  if (learned === 0 && !extra) {
    return (
      <div className="card">
        <h1>Review</h1>
        <Coach>Finish your first lesson, and I will start collecting review cards for you. Practice makes memories last!</Coach>
        <Link className="btn btn-primary" to="/">Go to the journey</Link>
      </div>
    );
  }

  if (list.length === 0) {
    const next = Object.values(save.cards).reduce((m, c) => Math.min(m, c.due), Infinity);
    return (
      <div className="card">
        <h1>Review</h1>
        <Coach mood="cheer">{weakMode ? 'No weak rules right now. Great job!' : 'You are all caught up! Your cards come back when it is time.'}</Coach>
        {Number.isFinite(next) && !weakMode && <p className="muted">Next card is due in {Math.max(0, next - dayNumber())} day(s).</p>}
        <div className="row">
          <button className="btn btn-primary" onClick={startExtra}>Practice anyway (6 cards)</button>
          <Link className="btn" to="/">Back to the journey</Link>
        </div>
      </div>
    );
  }

  if (i >= list.length) {
    return (
      <div className="card">
        <h1>Review done!</h1>
        <Coach mood="cheer">{right} of {list.length} right the first time. {wrong.length ? 'The ones you missed will come back soon.' : 'Perfect!'}</Coach>
        {wrong.length > 0 && (
          <>
            <h3>Rules to remember</h3>
            <ul>{wrong.map((id) => <li key={id}>{cardById(id)?.step.explanation}</li>)}</ul>
          </>
        )}
        <div className="row">
          <button className="btn btn-primary" onClick={() => { setExtra(null); setRound(round + 1); setI(0); setRight(0); setWrong([]); }}>More review</button>
          <Link className="btn" to="/">Back to the journey</Link>
        </div>
      </div>
    );
  }

  const card = cardById(list[i]) ?? CARDS[0];
  return (
    <div>
      <div className="lesson-head">
        <div className="lesson-title">
          <strong>{weakMode ? 'Weak rules' : 'Review'}: card {i + 1} of {list.length}</strong>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={i + 1}>
            <div className="progress-fill" style={{ width: `${((i + 1) / list.length) * 100}%` }} />
          </div>
        </div>
      </div>
      <QuizView
        key={`${card.id}-${i}`}
        step={card.step}
        lessonMode="sandbox"
        coordinates
        onMistake={() => undefined}
        onFirstTry={(ok) => {
          reviewAnswer(card.id, ok);
          if (ok) setRight((n) => n + 1);
          else setWrong((w) => [...w, card.id]);
        }}
        onDone={() => setI(i + 1)}
        doneLabel={i + 1 >= list.length ? 'Finish' : 'Next card'}
      />
    </div>
  );
}
