// Coordinate Rush: a square name appears, tap it fast. Used as a lesson step, a boss and a mini-game.
import { useEffect, useRef, useState } from 'react';
import { Board, type Mark } from '../../board/Board';
import { Coach } from '../../coach/Coach';
import { ALL_SQUARES, type Square } from '../../chess/types';
import { play } from '../../sound/sound';

export interface RushResult {
  correct: number;
  total: number;
  accuracy: number;
  bestCombo: number;
}

interface Props {
  seconds: number;
  flip?: boolean;
  coords?: boolean;
  prompt?: string;
  minCorrect?: number;
  minAccuracy?: number;
  onFinish: (r: RushResult, passed: boolean) => void;
  doneLabel?: string;
}

const randomSquare = (not?: Square): Square => {
  let s = ALL_SQUARES[Math.floor(Math.random() * 64)];
  while (s === not) s = ALL_SQUARES[Math.floor(Math.random() * 64)];
  return s;
};

export function RushView({ seconds, flip = false, coords = false, prompt, minCorrect = 0, minAccuracy = 0, onFinish, doneLabel = 'Next' }: Props) {
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState(seconds);
  const [target, setTarget] = useState<Square>(() => randomSquare());
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [flashSq, setFlashSq] = useState<{ sq: Square; ok: boolean } | null>(null);
  const [result, setResult] = useState<RushResult | null>(null);
  const reported = useRef(false);

  useEffect(() => {
    if (!started || result) return;
    if (left <= 0) {
      setResult({ correct, total, accuracy: total ? correct / total : 0, bestCombo });
      return;
    }
    const t = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(t);
  }, [started, left, result, correct, total, bestCombo]);

  const passed = result ? result.correct >= minCorrect && result.accuracy >= minAccuracy : false;

  useEffect(() => {
    if (result && !reported.current) {
      reported.current = true;
      play(passed ? 'success' : 'error');
    }
  }, [result, passed]);

  const onSquare = (s: Square) => {
    if (!started || result) return;
    const ok = s === target;
    setTotal((n) => n + 1);
    setFlashSq({ sq: s, ok });
    if (ok) {
      play('tap');
      setCorrect((n) => n + 1);
      const c = combo + 1;
      setCombo(c);
      setBestCombo((b) => Math.max(b, c));
      setTarget(randomSquare(target));
    } else {
      play('error');
      setCombo(0);
    }
  };

  const retry = () => {
    reported.current = false;
    setResult(null);
    setLeft(seconds);
    setCorrect(0);
    setTotal(0);
    setCombo(0);
    setBestCombo(0);
    setFlashSq(null);
    setStarted(false);
  };

  const marks: Partial<Record<Square, Mark>> = {};
  if (flashSq) marks[flashSq.sq] = flashSq.ok ? 'good' : 'bad';
  if (flashSq && !flashSq.ok) marks[target] = 'hint';

  const text = result
    ? passed
      ? `Great! ${result.correct} correct, ${Math.round(result.accuracy * 100)}% accuracy.`
      : `${result.correct} correct, ${Math.round(result.accuracy * 100)}% accuracy. You need ${minCorrect} correct and ${Math.round(minAccuracy * 100)}% accuracy. Try again!`
    : (prompt ?? 'Tap the named square as fast as you can.');

  return (
    <div className="step rush">
      <Coach mood={result ? (passed ? 'cheer' : 'oops') : 'happy'}>{text}</Coach>
      {started && !result && (
        <div className="rush-bar">
          <div className="rush-target" aria-live="polite">Tap <strong>{target}</strong></div>
          <div className="rush-stats">⏱ {left}s · ✔ {correct} · 🔥 {combo}</div>
        </div>
      )}
      <Board pieces={{}} orientation={flip ? 'b' : 'w'} coordinates={coords} marks={marks} onSquare={onSquare} label="Coordinate board" />
      <div className="goal-actions">
        {!started && !result && <button className="btn btn-primary" onClick={() => setStarted(true)} autoFocus>Start ({seconds}s)</button>}
        {result && !passed && <button className="btn btn-ghost" onClick={retry}>Try again</button>}
        {result && (passed || minCorrect === 0) && <button className="btn btn-primary" onClick={() => onFinish(result, passed)} autoFocus>{doneLabel} →</button>}
      </div>
    </div>
  );
}
