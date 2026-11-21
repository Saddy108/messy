// Final Rules Exam: 40 questions that cover every rule area. Pass mark 85%.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CARDS, RULE_AREAS } from '../../content/cards';
import { QuizView } from '../../lessons/engine/QuizView';
import { Coach } from '../../coach/Coach';
import { Confetti } from '../../ui/Confetti';
import { recordExam } from '../../progress/store';

export const EXAM_LENGTH = 40;
export const PASS_MARK = 0.85;

/** One card from every rule area first, then random extras up to 40 questions. */
export function buildExam(rng: () => number = Math.random): string[] {
  const shuffled = [...CARDS].sort(() => rng() - 0.5);
  const picked: string[] = [];
  RULE_AREAS.forEach((area) => {
    const c = shuffled.find((x) => x.rule === area);
    if (c) picked.push(c.id);
  });
  for (const c of shuffled) {
    if (picked.length >= EXAM_LENGTH) break;
    if (!picked.includes(c.id)) picked.push(c.id);
  }
  return picked.sort(() => rng() - 0.5);
}

export default function ExamPage() {
  const [started, setStarted] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const cards = useMemo(() => ids.map((id) => CARDS.find((c) => c.id === id)!), [ids]);

  const finished = started && cards.length > 0 && i >= cards.length;
  const passedNow = finished && correct / cards.length >= PASS_MARK;
  useEffect(() => {
    if (finished && !saved) {
      recordExam(Math.round((correct / cards.length) * 100), passedNow);
      setSaved(true);
    }
  }, [finished, saved, correct, cards.length, passedNow]);

  const start = () => {
    setIds(buildExam());
    setI(0);
    setCorrect(0);
    setMissed([]);
    setSaved(false);
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="card">
        <h1>🎓 Final Rules Exam</h1>
        <Coach>{EXAM_LENGTH} questions on every rule of chess. You need {Math.round(PASS_MARK * 100)}% to pass and earn your certificate. Take your time!</Coach>
        <button className="btn btn-primary btn-lg" onClick={start}>Start the exam</button>
      </div>
    );
  }

  if (i >= cards.length) {
    const score = Math.round((correct / cards.length) * 100);
    const passed = correct / cards.length >= PASS_MARK;
    return (
      <div className="card summary">
        {passed && <Confetti />}
        <Coach mood={passed ? 'cheer' : 'oops'}>{passed ? 'You passed! Pip is now a Queen, and you are ready to play real chess.' : 'Not this time. Review the rules below and try again. You can do it!'}</Coach>
        <h1>{score}%</h1>
        <p className="stat-line">{correct} of {cards.length} right the first time. Pass mark: {Math.round(PASS_MARK * 100)}%.</p>
        {missed.length > 0 && (
          <div className="takeaway">
            <h3>Rules to review</h3>
            <ul>{missed.map((id) => <li key={id}>{CARDS.find((c) => c.id === id)!.step.explanation}</li>)}</ul>
          </div>
        )}
        <div className="row" style={{ justifyContent: 'center' }}>
          {passed && <Link className="btn btn-primary btn-lg" to="/certificate">🏆 Get my certificate</Link>}
          <button className="btn" onClick={start}>Take it again</button>
          <Link className="btn btn-ghost" to="/">Back to the journey</Link>
        </div>
      </div>
    );
  }

  const card = cards[i];
  return (
    <div>
      <div className="lesson-head">
        <div className="lesson-title">
          <strong>Exam: question {i + 1} of {cards.length}</strong>
          <div className="progress"><div className="progress-fill" style={{ width: `${((i + 1) / cards.length) * 100}%` }} /></div>
        </div>
        <div className="lesson-score">✔ {correct}</div>
      </div>
      <QuizView
        key={`${card.id}-${i}`}
        step={card.step}
        lessonMode="sandbox"
        coordinates
        onMistake={() => undefined}
        onFirstTry={(ok) => (ok ? setCorrect((n) => n + 1) : setMissed((m) => [...m, card.id]))}
        onDone={() => setI(i + 1)}
        doneLabel={i + 1 >= cards.length ? 'See my score' : 'Next question'}
      />
    </div>
  );
}
