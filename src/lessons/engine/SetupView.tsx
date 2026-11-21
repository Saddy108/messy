// "Set up the board" task: place every piece on its starting square (tap a piece, tap a square).
import { useEffect, useRef, useState } from 'react';
import { Board, type Mark } from '../../board/Board';
import { PieceIcon } from '../../board/pieces';
import { Coach } from '../../coach/Coach';
import { SETUP_TIPS } from '../../content/text';
import { parsePlacement } from '../../chess/sandbox';
import { START_FEN } from '../../chess/rules';
import { PIECE_NAMES, type Color, type Piece, type PieceType, type Pieces, type Square } from '../../chess/types';
import { play } from '../../sound/sound';
import type { Step } from '../types';
import type { StepProps } from './common';

type TaskStep = Extract<Step, { kind: 'task' }>;
const TARGET: Pieces = parsePlacement(START_FEN);
const ORDER: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'p'];
const TOTAL: Record<PieceType, number> = { r: 2, n: 2, b: 2, q: 1, k: 1, p: 8 };

export function SetupView({ step, coordinates, onDone, onMistake, onHint, last }: StepProps & { step: TaskStep }) {
  const goal = step.goal.type === 'setupBoard' ? step.goal : { type: 'setupBoard' as const };
  const [placed, setPlaced] = useState<Pieces>({});
  const [held, setHeld] = useState<Piece | null>(null);
  const [msg, setMsg] = useState<{ text: string; good?: boolean; bad?: boolean } | null>(null);
  const [bad, setBad] = useState<Square | null>(null);
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(0);
  const [left, setLeft] = useState<number | null>(goal.timeLimit ?? null);
  const started = useRef(false);
  const flip = step.color === 'b';

  const count = (p: Piece) => Object.values(placed).filter((x) => x!.type === p.type && x!.color === p.color).length;

  // countdown (only when the step has a time limit)
  useEffect(() => {
    if (left === null || done || !started.current) return;
    if (left <= 0) {
      setPlaced({});
      setHeld(null);
      started.current = false;
      setLeft(goal.timeLimit ?? null);
      setMsg({ text: "Time's up! The board is cleared. Try again, a little faster.", bad: true });
      onMistake();
      play('error');
      return;
    }
    const t = setTimeout(() => setLeft((l) => (l === null ? l : l - 1)), 1000);
    return () => clearTimeout(t);
  }, [left, done, goal.timeLimit, onMistake]);

  const place = (s: Square) => {
    if (done) return;
    const existing = placed[s];
    if (existing) {
      const next = { ...placed };
      delete next[s];
      setPlaced(next);
      setMsg(null);
      return;
    }
    if (!held) {
      setMsg({ text: 'First tap a piece in the tray, then tap a square.' });
      return;
    }
    const want = TARGET[s];
    if (!want || want.type !== held.type || want.color !== held.color) {
      onMistake();
      play('error');
      setBad(s);
      setMsg({ text: SETUP_TIPS[held.type].replace('{color}', held.color === 'w' ? 'white' : 'black'), bad: true });
      return;
    }
    started.current = true;
    play('move');
    setBad(null);
    const next = { ...placed, [s]: held };
    setPlaced(next);
    const complete = Object.keys(TARGET).every((k) => next[k as Square]?.type === TARGET[k as Square]!.type && next[k as Square]?.color === TARGET[k as Square]!.color);
    if (complete) {
      setDone(true);
      play('success');
      setMsg({ text: 'The army is ready! White moves first.', good: true });
    } else {
      setMsg(null);
      if (count(held) + 1 >= TOTAL[held.type]) setHeld(null);
    }
  };

  const nextMissing = (): Square | null => {
    for (const t of ORDER) for (const c of ['w', 'b'] as Color[])
      for (const s of Object.keys(TARGET) as Square[]) {
        if (TARGET[s]!.type === t && TARGET[s]!.color === c && !placed[s]) return s;
      }
    return null;
  };
  const marks: Partial<Record<Square, Mark>> = {};
  if (bad) marks[bad] = 'bad';
  if (hint >= 2) {
    const m = nextMissing();
    if (m) marks[m] = 'hint';
  }

  const hintTexts = step.hints.length ? step.hints : ['Start with the rooks in the corners.', 'Next come the knights, then the bishops.', 'Look at the highlighted square.'];

  return (
    <div className="step task">
      <Coach mood={msg?.good ? 'cheer' : msg?.bad ? 'oops' : 'happy'}>{msg?.text ?? (hint > 0 ? hintTexts[Math.min(hint, hintTexts.length) - 1] : step.prompt)}</Coach>
      <Board pieces={placed} orientation={flip ? 'b' : 'w'} marks={marks} coordinates={coordinates} onSquare={place} label="Setup board" />
      <div className="tray" role="group" aria-label="Piece tray">
        {(['w', 'b'] as Color[]).map((c) => (
          <div className="tray-row" key={c}>
            {ORDER.map((t) => {
              const remaining = TOTAL[t] - count({ type: t, color: c });
              const sel = held?.type === t && held.color === c;
              return (
                <button
                  key={t}
                  className={`tray-piece ${sel ? 'on' : ''}`}
                  disabled={remaining <= 0 || done}
                  aria-pressed={sel}
                  aria-label={`${c === 'w' ? 'White' : 'Black'} ${PIECE_NAMES[t]}, ${remaining} left`}
                  onClick={() => { setHeld({ type: t, color: c }); setMsg(null); play('tap'); }}
                >
                  <PieceIcon type={t} color={c} size={36} />
                  <span className="tray-count">×{remaining}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="goal-bar">
        <div className="goal-text">
          <strong>Goal:</strong> {step.prompt}
          {left !== null && started.current && <span className="goal-progress"> · ⏱ {left}s</span>}
        </div>
        <div className="goal-actions">
          <button className="btn btn-ghost" onClick={() => { if (hint < 3) { setHint(hint + 1); onHint(); } }} disabled={done || hint >= 3}>💡 Hint {hint > 0 ? `(${hint}/3)` : ''}</button>
          {!done && <button className="btn btn-ghost" onClick={() => { setPlaced({}); setHeld(null); setMsg(null); }}>Clear board</button>}
          {done && <button className="btn btn-primary" onClick={onDone} autoFocus>{last ? 'Finish' : 'Next'} →</button>}
        </div>
      </div>
    </div>
  );
}
