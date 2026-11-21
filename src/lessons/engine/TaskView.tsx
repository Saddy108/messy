// Interactive task: the learner plays moves on the board toward a goal, with hints and explanations.
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Board, type Arrow, type Mark } from '../../board/Board';
import { Coach } from '../../coach/Coach';
import { COACH } from '../../content/brand';
import { chooseMove } from '../../engine/bots';
import { explainMove, findPin } from '../../chess/explain';
import { other, type Piece, type PieceType, type Square } from '../../chess/types';
import { lineWithEnds } from '../../chess/geometry';
import { play } from '../../sound/sound';
import type { Step } from '../types';
import { GoalTracker, type Verdict } from './goals';
import { Sim, type SimMove } from './sim';
import { suggest } from './solver';
import { sleep, type StepProps } from './common';
import { PieceIcon } from '../../board/pieces';
import { SetupView } from './SetupView';

type TaskStep = Extract<Step, { kind: 'task' }>;

const DEFAULT_HINTS = ['Read the goal again. What does it ask you to do?', 'Look at the highlighted piece. It can help.', 'Follow the arrow.'];
const cheer = (n: number): string => COACH.cheers[n % COACH.cheers.length];

interface Msg {
  text: string;
  kind: 'info' | 'good' | 'bad';
}

export function TaskView(props: StepProps & { step: TaskStep }) {
  const { step } = props;
  if (step.goal.type === 'setupBoard') return <SetupView {...props} step={step} />;
  return <PlayTask {...props} />;
}

function PlayTask({ step, lessonMode, coordinates, onDone, onMistake, onHint, last }: StepProps & { step: TaskStep }) {
  const goal = step.goal;
  const simRef = useRef(new Sim(lessonMode, step.fen, step.color));
  const trackerRef = useRef(new GoalTracker(goal));
  const [, redraw] = useReducer((x: number) => x + 1, 0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [flash, setFlash] = useState<{ squares: Square[]; bad?: Square } | null>(null);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [showAttacks, setShowAttacks] = useState(false);
  const [found, setFound] = useState<Square[]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  const sim = simRef.current;
  const learner = sim.learner;
  const flip = learner === 'b';
  const hints = step.hints.length ? step.hints : DEFAULT_HINTS;
  const isFind = goal.type === 'findAllMoves';
  const pieces = sim.pieces();

  const findTargets = useMemo(() => (isFind ? new Sim(lessonMode, step.fen, step.color).targets(goal.from).map((t) => t.to) : []), [isFind, goal, lessonMode, step]);

  const restart = () => {
    simRef.current = new Sim(lessonMode, step.fen, step.color);
    trackerRef.current.reset();
    setSelected(null);
    setLastMove(null);
    setFlash(null);
    setMoveCount(0);
    setBusy(false);
    redraw();
  };

  const finish = (text?: string) => {
    play('success');
    setDone(true);
    setBusy(false);
    setMsg({ text: `${cheer(moveCount)} ${text ?? step.success ?? ''}`.trim(), kind: 'good' });
  };

  const handleVerdict = async (v: Verdict): Promise<boolean> => {
    if (v.status === 'done') {
      finish(v.text);
      return true;
    }
    if (v.status === 'retry') {
      if (v.mistake) onMistake();
      play('error');
      setMsg({ text: v.reason, kind: 'bad' });
      setBusy(true);
      await sleep(1700);
      if (!alive.current) return true;
      restart();
      setMsg({ text: 'Try again from the start.', kind: 'info' });
      return true;
    }
    return false;
  };

  const soundFor = (m: SimMove) => play(m.mate || m.check ? 'check' : m.promotion ? 'promote' : m.castle ? 'castle' : m.capture ? 'capture' : 'move');

  const opponentReply = async (m: SimMove) => {
    const opp = step.opponent ?? 'none';
    if (opp === 'none') return;
    setBusy(true);
    await sleep(450);
    if (!alive.current) return;
    let uci: string | undefined;
    if (opp === 'scripted') uci = step.scripted?.[m.uci] ?? step.scripted?.['*'];
    if (!uci || opp === 'bot1') {
      if (opp === 'bot1' || sim.fullGame()) uci = chooseMove(sim.fen(), 1)?.uci ?? uci;
    }
    if (uci) {
      const r = sim.tryOpponentUci(uci);
      if (r.ok) {
        soundFor(r.move);
        setLastMove([r.move.from, r.move.to]);
        redraw();
        if (await handleVerdict(trackerRef.current.afterOpponent(sim))) return;
      }
    }
    setBusy(false);
  };

  const attempt = async (from: Square, to: Square, promotion?: PieceType) => {
    if (busy || done) return;
    if (sim.needsPromotion(from, to) && !promotion && sim.targets(from).some((t) => t.to === to)) {
      setPromo({ from, to });
      return;
    }
    const res = sim.tryMove(from, to, promotion);
    if (!res.ok) {
      onMistake();
      play('error');
      setMsg({ text: res.explanation.message, kind: 'bad' });
      setFlash({ squares: res.explanation.highlight, bad: to });
      return;
    }
    setFlash(null);
    setSelected(null);
    setHintLevel(0);
    setLastMove([from, to]);
    setMoveCount((n) => n + 1);
    soundFor(res.move);
    setMsg(null);
    redraw();
    const v = trackerRef.current.onMove(res.move, sim);
    if (await handleVerdict(v)) return;
    await opponentReply(res.move);
  };

  const tapFind = (s: Square) => {
    if (done || goal.type !== 'findAllMoves') return;
    if (s === goal.from) return;
    if (found.includes(s)) return;
    if (findTargets.includes(s)) {
      const next = [...found, s];
      setFound(next);
      setFlash(null);
      play('tap');
      if (next.length === findTargets.length) finish('You found every square!');
      else setMsg({ text: `Yes! ${findTargets.length - next.length} more to find.`, kind: 'good' });
    } else {
      onMistake();
      play('error');
      const e = explainMove({ pieces, turn: sim.turn(), game: sim.fullGame() ?? undefined }, goal.from, s);
      setMsg({ text: e?.message ?? 'The piece cannot go there.', kind: 'bad' });
      setFlash({ squares: e?.highlight ?? [], bad: s });
    }
  };

  const onSquare = (s: Square) => {
    if (done || busy) return;
    if (isFind) return tapFind(s);
    setFlash(null);
    const p: Piece | undefined = pieces[s];
    if (selected && s !== selected) {
      const legal = sim.targets(selected).some((t) => t.to === s);
      if (!legal && p && p.color === learner) {
        setSelected(s);
        return;
      }
      void attempt(selected, s);
      return;
    }
    if (selected === s) {
      setSelected(null);
      return;
    }
    if (p && p.color === learner) {
      play('tap');
      setSelected(s);
      setMsg(null);
    } else if (p) {
      setMsg({ text: 'That is not your piece. Tap one of yours.', kind: 'bad' });
    }
  };

  const onDrop = (from: Square, to: Square) => {
    if (done || busy || isFind) return;
    setSelected(null);
    void attempt(from, to);
  };

  const sug = useMemo(() => (hintLevel >= 2 ? suggest(step, sim.fen(), lessonMode) : null), [hintLevel, step, lessonMode, moveCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const askHint = () => {
    if (hintLevel >= 3 || done) return;
    setHintLevel(hintLevel + 1);
    onHint();
  };

  // ---------- marks, dots, arrows ----------
  const marks: Partial<Record<Square, Mark>> = {};
  if (lastMove) {
    marks[lastMove[0]] = 'last';
    marks[lastMove[1]] = 'last';
  }
  if (showAttacks && sim.fullGame()) sim.fullGame()!.attackedSquares(other(learner)).forEach((s) => (marks[s] = 'attacked'));
  if (sim.inCheck()) {
    sim.checkers().forEach((c) => {
      const k = sim.kingSquare(sim.turn());
      if (k) lineWithEnds(c, k).forEach((s) => (marks[s] = 'line'));
    });
    const k = sim.kingSquare(sim.turn());
    if (k) marks[k] = 'check';
  }
  if (selected && sim.fullGame()) {
    const pin = findPin(sim.fullGame()!, selected);
    if (pin) pin.forEach((s) => (marks[s] = 'pin'));
  }
  found.forEach((s) => (marks[s] = 'found'));
  flash?.squares.forEach((s) => (marks[s] = 'line'));
  if (flash?.bad) marks[flash.bad] = 'bad';
  const arrows: Arrow[] = [];
  if (hintLevel >= 2 && sug && !done) {
    marks[sug[0]] = 'hint';
    if (hintLevel >= 3) arrows.push({ from: sug[0], to: sug[1], kind: 'hint' });
  }
  const dots = selected && !isFind ? sim.targets(selected) : [];
  const stars = goal.type === 'collectStars' ? [...trackerRef.current.starsLeft] : [];
  if (isFind && goal.type === 'findAllMoves') marks[goal.from] = marks[goal.from] ?? 'hint';

  const progressText =
    goal.type === 'findAllMoves'
      ? `${found.length} / ${findTargets.length} squares found`
      : goal.type === 'collectStars'
        ? `${goal.stars.length - trackerRef.current.starsLeft.size} / ${goal.stars.length} stars${goal.maxMoves ? ` · ${moveCount} / ${goal.maxMoves} moves` : ''}`
        : goal.type === 'capture'
          ? `${trackerRef.current.captured.size} / ${goal.targets.length} captured`
          : goal.type === 'reachSquare' && goal.maxMoves
            ? `${moveCount} / ${goal.maxMoves} moves`
            : goal.type === 'checkmate' && goal.inMoves > 1
              ? `Move ${Math.min(moveCount + 1, goal.inMoves)} of ${goal.inMoves}`
              : '';

  const coachText = msg?.text ?? (hintLevel > 0 ? hints[Math.min(hintLevel, hints.length) - 1] : step.prompt);
  const mood = msg?.kind === 'good' ? 'cheer' : msg?.kind === 'bad' ? 'oops' : hintLevel > 0 ? 'think' : 'happy';

  return (
    <div className="step task">
      <Coach mood={mood}>{coachText}</Coach>
      <Board
        pieces={pieces}
        orientation={flip ? 'b' : 'w'}
        selected={selected}
        moves={dots}
        marks={marks}
        arrows={arrows}
        stars={stars}
        coordinates={coordinates}
        movable={(s) => !busy && !done && !isFind && pieces[s]?.color === learner}
        onSquare={onSquare}
        onDrop={onDrop}
        label="Lesson board"
      />
      {promo && (
        <div className="promo" role="dialog" aria-label="Choose a piece to promote to">
          <p>Promote your pawn to:</p>
          <div className="promo-row">
            {(['q', 'r', 'b', 'n'] as const).map((t) => (
              <button
                key={t}
                className="promo-btn"
                aria-label={`Promote to ${({ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' })[t]}`}
                onClick={() => {
                  const { from, to } = promo;
                  setPromo(null);
                  void attempt(from, to, t);
                }}
              >
                <PieceIcon type={t} color={learner} size={44} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="goal-bar">
        <div className="goal-text">
          <strong>Goal:</strong> {step.prompt}
          {progressText && <span className="goal-progress"> · {progressText}</span>}
        </div>
        <div className="goal-actions">
          {sim.fullGame() && (
            <button className="btn btn-ghost" aria-pressed={showAttacks} onClick={() => setShowAttacks(!showAttacks)}>
              {showAttacks ? 'Hide' : 'Show'} danger squares
            </button>
          )}
          <button className="btn btn-ghost" onClick={askHint} disabled={done || hintLevel >= 3}>
            💡 Hint {hintLevel > 0 ? `(${hintLevel}/3)` : ''}
          </button>
          {!done && moveCount > 0 && !isFind && (
            <button className="btn btn-ghost" onClick={() => { restart(); setMsg({ text: 'Back to the start. Try again!', kind: 'info' }); }}>
              ↺ Restart
            </button>
          )}
          {done && (
            <button className="btn btn-primary" onClick={onDone} autoFocus>
              {last ? 'Finish' : 'Next'} →
            </button>
          )}
        </div>
      </div>
      <TypeMove onMove={(from, to) => { if (!done && !busy && !isFind) { void attempt(from, to); } }} sim={sim} disabled={done || busy || isFind} />
    </div>
  );
}

/** Keyboard move entry: type e2e4 (or a SAN move such as Nf3). */
function TypeMove({ onMove, sim, disabled }: { onMove: (from: Square, to: Square) => void; sim: Sim; disabled: boolean }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    const t = text.trim();
    if (!t) return;
    const m = /^([a-h][1-8])\s*-?\s*([a-h][1-8])$/i.exec(t);
    if (m) {
      onMove(m[1].toLowerCase() as Square, m[2].toLowerCase() as Square);
      setText('');
      setErr('');
      return;
    }
    const g = sim.fullGame();
    if (g) {
      const clean = t.replace(/[+#]/g, '');
      const found = g.legalMoves().find((x) => x.san.replace(/[+#]/g, '').toLowerCase() === clean.toLowerCase());
      if (found) {
        onMove(found.from, found.to);
        setText('');
        setErr('');
        return;
      }
    }
    setErr('Type a move like e2e4' + (g ? ' or Nf3' : '') + '.');
  };
  return (
    <details className="typemove">
      <summary>Type a move instead</summary>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label className="sr-only" htmlFor="typemove">Move</label>
        <input id="typemove" value={text} onChange={(e) => setText(e.target.value)} placeholder="e2e4" disabled={disabled} autoComplete="off" autoCapitalize="off" />
        <button className="btn" type="submit" disabled={disabled}>Play</button>
        {err && <span className="field-error" role="alert">{err}</span>}
      </form>
    </details>
  );
}
