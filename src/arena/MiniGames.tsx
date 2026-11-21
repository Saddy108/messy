// The seven mini-games. Each one keeps a personal best and gives XP through recordMinigame().
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Board, type Arrow, type Mark } from '../board/Board';
import { Coach } from '../coach/Coach';
import { Game } from '../chess/rules';
import { explainMove } from '../chess/explain';
import { parsePlacement, piecesOf, sandboxApply, sandboxMoves, sandboxTargets, lastRank } from '../chess/sandbox';
import { other, type Color, type Pieces, type Square } from '../chess/types';
import { MATE_PUZZLES } from '../content/matePuzzles';
import { RushView } from '../lessons/engine/RushView';
import { play } from '../sound/sound';
import { recordMinigame, useSave } from '../progress/store';
import { endings, randomHangingQuestion, randomJump, randomNotationQuestion, type Ending } from './generators';

export const MINIGAMES = [
  { id: 'rush', name: 'Coordinate Rush', emoji: '⚡', blurb: 'Tap the named square. 30 seconds.', best: 'correct taps' },
  { id: 'knight', name: 'Knight Jumper', emoji: '🐴', blurb: 'Reach the star in the fewest jumps.', best: 'extra jumps (lower is better)' },
  { id: 'pawnwars', name: 'Pawn Wars', emoji: '♟️', blurb: 'Pawns only. First to the last rank wins.', best: 'fewest moves to win' },
  { id: 'hanging', name: 'Safe or Hanging?', emoji: '🎣', blurb: 'Tap the pieces you can win for free.', best: 'correct out of 5' },
  { id: 'wld', name: 'Win, Lose or Draw?', emoji: '⚖️', blurb: 'Decide how each game ended.', best: 'correct out of 10' },
  { id: 'mate1', name: 'Mate-in-1 Marathon', emoji: '👑', blurb: 'Ten checkmates, as fast as you can.', best: 'seconds (lower is better)' },
  { id: 'notation', name: 'Notation Sprint', emoji: '✍️', blurb: 'Name the move shown on the board.', best: 'correct out of 10' },
] as const;

const shuffle = <T,>(list: T[]): T[] => [...list].sort(() => Math.random() - 0.5);

/** Saves the score once and shows the personal best. */
function Result({ id, score, unit, lowerIsBetter, onAgain, children }: { id: string; score: number; unit: string; lowerIsBetter?: boolean; onAgain: () => void; children?: ReactNode }) {
  const save = useSave();
  const saved = useRef<boolean | null>(null);
  if (saved.current === null) saved.current = recordMinigame(id, score, lowerIsBetter);
  const best = save.minigames[id] ?? score;
  return (
    <div className="card summary">
      <Coach mood="cheer">{saved.current ? 'New personal best!' : 'Nice round!'} {children}</Coach>
      <h1>{score} {unit}</h1>
      <p className="stat-line">Personal best: {best} {unit}</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary btn-lg" onClick={onAgain}>Play again</button>
        <Link className="btn" to="/arena/minigames">All games</Link>
      </div>
    </div>
  );
}

/** A board where the learner makes one legal move; `judge` decides if it is the right one. */
export function MoveBoard({ fen, judge, onResult, hint }: { fen: string; judge: (m: ReturnType<Game['move']> & object) => boolean; onResult: (ok: boolean) => void; hint?: string }) {
  const game = useRef(new Game(fen));
  const [selected, setSelected] = useState<Square | null>(null);
  const [msg, setMsg] = useState<string | null>(hint ?? null);
  const [marks, setMarks] = useState<Partial<Record<Square, Mark>>>({});
  const [, bump] = useState(0);
  const g = game.current;
  const me = g.turn();

  const tryMove = (from: Square, to: Square) => {
    const m = g.move(from, to);
    if (!m) {
      const why = explainMove({ pieces: g.pieces(), turn: me, game: g, playerColor: me }, from, to);
      setMsg(why?.message ?? 'That move is not allowed.');
      setMarks(Object.fromEntries((why?.highlight ?? []).map((s) => [s, 'line' as Mark])));
      play('error');
      setSelected(null);
      return;
    }
    if (judge(m)) {
      play('success');
      bump((n) => n + 1);
      onResult(true);
    } else {
      g.undo();
      play('error');
      setMsg('Legal, but not the right one. Look again!');
      setMarks({});
      onResult(false);
    }
    setSelected(null);
  };
  const onSquare = (s: Square) => {
    const p = g.pieceAt(s);
    if (selected && s !== selected && p?.color !== me) return tryMove(selected, s);
    setSelected(p?.color === me ? s : null);
  };
  return (
    <>
      {msg && <Coach>{msg}</Coach>}
      <Board pieces={g.pieces()} orientation={me} selected={selected} moves={selected ? g.legalMoves(selected).map((m) => ({ to: m.to, capture: m.capture })) : []} marks={marks} coordinates movable={(s) => g.pieceAt(s)?.color === me} onSquare={onSquare} onDrop={tryMove} label="Puzzle board" animate />
    </>
  );
}

// ---------- 1. Coordinate Rush ----------
function Rush() {
  const [score, setScore] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  if (score !== null) return <Result id="rush" score={score} unit="correct" onAgain={() => { setScore(null); setRound(round + 1); }} />;
  return <RushView key={round} seconds={30} coords prompt="Tap the named square as fast as you can." doneLabel="See score" onFinish={(r) => setScore(r.correct)} />;
}

// ---------- 2. Knight Jumper ----------
function KnightJumper() {
  const [round, setRound] = useState(0);
  const puzzles = useMemo(() => Array.from({ length: 5 }, () => randomJump(Math.random)), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [pos, setPos] = useState<Square>(puzzles[0].from);
  const [jumps, setJumps] = useState(0);
  const [extra, setExtra] = useState(0);
  const [msg, setMsg] = useState('Jump the knight to the star. Fewest jumps wins!');
  const [done, setDone] = useState(false);

  if (done) return <Result id="knight" score={extra} unit="extra jumps" lowerIsBetter onAgain={() => { setRound(round + 1); setI(0); setPos(puzzles[0].from); setJumps(0); setExtra(0); setDone(false); }} />;
  const p = puzzles[i];
  const pieces: Pieces = { [pos]: { type: 'n', color: 'w' } };
  const onSquare = (s: Square) => {
    if (!sandboxTargets(pieces, pos).includes(s)) {
      play('error');
      setMsg('A knight jumps in an L: two squares one way, then one to the side.');
      return;
    }
    play('move');
    const n = jumps + 1;
    if (s === p.to) {
      const over = Math.max(0, n - p.min);
      setExtra(extra + over);
      setMsg(over === 0 ? 'Perfect: the fewest jumps!' : `${over} extra jump${over > 1 ? 's' : ''}. The best was ${p.min}.`);
      if (i + 1 >= puzzles.length) return setDone(true);
      setI(i + 1);
      setPos(puzzles[i + 1].from);
      setJumps(0);
    } else {
      setPos(s);
      setJumps(n);
    }
  };
  return (
    <div>
      <Coach>{msg}</Coach>
      <p className="stat-line">Puzzle {i + 1} of {puzzles.length} · jumps: {jumps}</p>
      <Board pieces={pieces} stars={[p.to]} coordinates movable={() => true} onSquare={onSquare} label="Knight Jumper board" animate />
    </div>
  );
}

// ---------- 3. Pawn Wars ----------
const pawnStart = (): Pieces => parsePlacement('8/pppppppp/8/8/8/8/PPPPPPPP/8 w - - 0 1');
function botPawnMove(pieces: Pieces, color: Color): { from: Square; to: Square } | null {
  const all = piecesOf(pieces, color).flatMap((from) => sandboxMoves(pieces, from).map((m) => ({ from, to: m.to })));
  if (!all.length) return null;
  const win = all.find((m) => m.to[1] === String(lastRank(color)));
  if (win) return win;
  const safe = all.filter((m) => {
    const next = sandboxApply(pieces, m.from, m.to);
    return !piecesOf(next, other(color)).some((o) => sandboxMoves(next, o).some((x) => x.to === m.to));
  });
  const caps = (safe.length ? safe : all).filter((m) => pieces[m.to]);
  const list = caps.length ? caps : safe.length ? safe : all;
  return list[Math.floor(Math.random() * list.length)];
}

function PawnWars() {
  const [pieces, setPieces] = useState<Pieces>(pawnStart);
  const [selected, setSelected] = useState<Square | null>(null);
  const [moves, setMoves] = useState(0);
  const [msg, setMsg] = useState('You are White. Be first to reach the top rank!');
  const [end, setEnd] = useState<'win' | 'loss' | null>(null);
  const [round, setRound] = useState(0);

  if (end === 'win') return <Result id="pawnwars" score={moves} unit="moves" lowerIsBetter onAgain={() => { setPieces(pawnStart()); setMoves(0); setEnd(null); setRound(round + 1); setMsg('You are White. Be first to reach the top rank!'); }} />;
  if (end === 'loss') {
    return (
      <div className="card summary">
        <Coach mood="oops">{msg}</Coach>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => { setPieces(pawnStart()); setMoves(0); setEnd(null); setMsg('You are White. Be first to reach the top rank!'); }}>Try again</button>
          <Link className="btn" to="/arena/minigames">All games</Link>
        </div>
      </div>
    );
  }
  const targets = selected ? sandboxTargets(pieces, selected) : [];
  const onSquare = (s: Square) => {
    const p = pieces[s];
    if (selected && targets.includes(s)) {
      let next = sandboxApply(pieces, selected, s);
      play(pieces[s] ? 'capture' : 'move');
      setSelected(null);
      setMoves(moves + 1);
      if (s[1] === '8') {
        setPieces(next);
        return setEnd('win');
      }
      const reply = botPawnMove(next, 'b');
      if (!reply) {
        setPieces(next);
        return setEnd('win');
      }
      next = sandboxApply(next, reply.from, reply.to);
      setPieces(next);
      if (reply.to[1] === '1') {
        setMsg('Black reached your side first. Black wins this round.');
        return setEnd('loss');
      }
      if (!piecesOf(next, 'w').some((f) => sandboxTargets(next, f).length)) {
        setMsg('You have no pawn that can move. You lose this round.');
        return setEnd('loss');
      }
      return;
    }
    if (p?.color === 'w') setSelected(s);
    else {
      setSelected(null);
      if (selected) setMsg('A pawn moves forward, and captures diagonally forward.');
    }
  };
  return (
    <div>
      <Coach>{msg}</Coach>
      <Board pieces={pieces} selected={selected} moves={targets.map((to) => ({ to, capture: !!pieces[to] }))} coordinates movable={(s) => pieces[s]?.color === 'w'} onSquare={onSquare} label="Pawn Wars board" animate />
    </div>
  );
}

// ---------- 4. Safe or Hanging? ----------
function Hanging() {
  const [round, setRound] = useState(0);
  const qs = useMemo(() => Array.from({ length: 5 }, () => randomHangingQuestion(Math.random)), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<Square[]>([]);
  const [score, setScore] = useState(0);
  const [shown, setShown] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);
  if (done) return <Result id="hanging" score={score} unit="of 5" onAgain={() => { setRound(round + 1); setI(0); setScore(0); setPicked([]); setShown(null); setDone(false); }} />;
  const q = qs[i];
  const pieces = parsePlacement(q.fen);
  const marks: Partial<Record<Square, Mark>> = {};
  picked.forEach((s) => (marks[s] = 'hint'));
  if (shown !== null) q.answer.forEach((s) => (marks[s] = picked.includes(s) ? 'good' : 'found'));
  const check = () => {
    const ok = q.answer.length === picked.length && q.answer.every((s) => picked.includes(s));
    setShown(ok);
    if (ok) setScore(score + 1);
    play(ok ? 'success' : 'error');
  };
  const next = () => {
    if (i + 1 >= qs.length) return setDone(true);
    setI(i + 1);
    setPicked([]);
    setShown(null);
  };
  return (
    <div>
      <Coach mood={shown === null ? 'happy' : shown ? 'cheer' : 'oops'}>
        {shown === null ? 'Tap every Black piece that White can win for free (undefended, or attacked by a cheaper piece).' : shown ? 'Correct!' : 'Not quite. The glowing squares show the pieces that were hanging.'}
      </Coach>
      <p className="stat-line">Question {i + 1} of {qs.length} · score {score}</p>
      <Board pieces={pieces} marks={marks} coordinates onSquare={(s) => shown === null && pieces[s]?.color === 'b' && setPicked(picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s])} label="Hanging pieces board" />
      <div className="goal-actions">{shown === null ? <button className="btn btn-primary" onClick={check}>Check</button> : <button className="btn btn-primary" onClick={next}>{i + 1 >= qs.length ? 'See score' : 'Next'}</button>}</div>
    </div>
  );
}

// ---------- 5. Win, Lose or Draw? ----------
function WinLoseDraw() {
  const [round, setRound] = useState(0);
  const qs = useMemo<Ending[]>(() => shuffle(endings()).slice(0, 10), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  if (done) return <Result id="wld" score={score} unit={`of ${qs.length}`} onAgain={() => { setRound(round + 1); setI(0); setScore(0); setAnswer(null); setDone(false); }} />;
  const q = qs[i];
  const choose = (a: string) => {
    if (answer) return;
    setAnswer(a);
    if (a === q.result) setScore(score + 1);
    play(a === q.result ? 'success' : 'error');
  };
  return (
    <div>
      <Coach mood={answer ? (answer === q.result ? 'cheer' : 'oops') : 'happy'}>{answer ? `${q.result}. ${q.why}` : 'The game just ended in this position. How did it end?'}</Coach>
      <p className="stat-line">Question {i + 1} of {qs.length} · score {score}</p>
      <Board pieces={parsePlacement(q.fen)} coordinates label="Final position" />
      <div className="options">
        {['White wins', 'Black wins', 'Draw'].map((o) => (
          <button key={o} className={`option ${answer && o === q.result ? 'right' : answer === o ? 'wrong' : ''}`} onClick={() => choose(o)} disabled={!!answer}>{o}</button>
        ))}
      </div>
      {answer && <div className="goal-actions"><button className="btn btn-primary" onClick={() => (i + 1 >= qs.length ? setDone(true) : (setI(i + 1), setAnswer(null)))}>{i + 1 >= qs.length ? 'See score' : 'Next'}</button></div>}
    </div>
  );
}

// ---------- 6. Mate-in-1 Marathon ----------
function Marathon() {
  const [round, setRound] = useState(0);
  const puzzles = useMemo(() => shuffle(MATE_PUZZLES).slice(0, 10), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState(0);
  const start = useRef(Date.now());
  const [secs, setSecs] = useState<number | null>(null);
  if (secs !== null) return <Result id="mate1" score={secs} unit="seconds" lowerIsBetter onAgain={() => { setRound(round + 1); setI(0); setWrong(0); setSecs(null); start.current = Date.now(); }}>{wrong ? `${wrong} wrong tries added no penalty. Fewer next time!` : 'No wrong tries!'}</Result>;
  const p = puzzles[i];
  return (
    <div>
      <p className="stat-line">Mate in 1: puzzle {i + 1} of {puzzles.length} · wrong tries {wrong}</p>
      <MoveBoard
        key={`${round}-${i}`}
        fen={p.fen}
        hint="White to move. Find the checkmate!"
        judge={(m) => m.mate}
        onResult={(ok) => {
          if (!ok) return setWrong((n) => n + 1);
          if (i + 1 >= puzzles.length) setSecs(Math.round((Date.now() - start.current) / 1000));
          else setTimeout(() => setI(i + 1), 500);
        }}
      />
    </div>
  );
}

// ---------- 7. Notation Sprint ----------
function Notation() {
  const [round, setRound] = useState(0);
  const qs = useMemo(() => Array.from({ length: 10 }, () => randomNotationQuestion(Math.random)), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  if (done) return <Result id="notation" score={score} unit={`of ${qs.length}`} onAgain={() => { setRound(round + 1); setI(0); setScore(0); setAnswer(null); setDone(false); }} />;
  const q = qs[i];
  const g = new Game(q.fen);
  const arrow: Arrow = { from: q.from, to: q.to, kind: 'demo' };
  const choose = (o: string) => {
    if (answer) return;
    setAnswer(o);
    if (o === q.san) setScore(score + 1);
    play(o === q.san ? 'success' : 'error');
  };
  return (
    <div>
      <Coach mood={answer ? (answer === q.san ? 'cheer' : 'oops') : 'happy'}>{answer ? `The move is ${q.san}: ${q.words}.` : 'Which notation matches the arrow?'}</Coach>
      <p className="stat-line">Question {i + 1} of {qs.length} · score {score}</p>
      <Board pieces={g.pieces()} orientation={g.turn()} arrows={[arrow]} coordinates label={`Move shown: ${q.words}`} />
      <div className="options">
        {q.options.map((o) => (
          <button key={o} className={`option ${answer && o === q.san ? 'right' : answer === o ? 'wrong' : ''}`} onClick={() => choose(o)} disabled={!!answer}>{o}</button>
        ))}
      </div>
      {answer && <div className="goal-actions"><button className="btn btn-primary" onClick={() => (i + 1 >= qs.length ? setDone(true) : (setI(i + 1), setAnswer(null)))}>{i + 1 >= qs.length ? 'See score' : 'Next'}</button></div>}
    </div>
  );
}

const GAMES: Record<string, () => JSX.Element> = { rush: Rush, knight: KnightJumper, pawnwars: PawnWars, hanging: Hanging, wld: WinLoseDraw, mate1: Marathon, notation: Notation };

export function MiniGameMenu() {
  const save = useSave();
  return (
    <div>
      <h1>Mini-games</h1>
      <div className="stage-grid">
        {MINIGAMES.map((m) => (
          <Link key={m.id} to={`/arena/minigames/${m.id}`} className="card minigame">
            <h3>{m.emoji} {m.name}</h3>
            <p className="muted">{m.blurb}</p>
            <p className="stat-line">{save.minigames[m.id] !== undefined ? `Best: ${save.minigames[m.id]}` : 'Not played yet'}</p>
          </Link>
        ))}
      </div>
      <Link className="btn" to="/arena">Back to the Arena</Link>
    </div>
  );
}

export function MiniGamePage() {
  const { id = '' } = useParams();
  const meta = MINIGAMES.find((m) => m.id === id);
  const Game_ = GAMES[id];
  if (!meta || !Game_) return <Coach mood="oops">That game does not exist.</Coach>;
  return (
    <div>
      <div className="lesson-head">
        <div className="lesson-title"><strong>{meta.emoji} {meta.name}</strong></div>
        <Link className="btn btn-ghost" to="/arena/minigames">Leave</Link>
      </div>
      <Game_ />
    </div>
  );
}
