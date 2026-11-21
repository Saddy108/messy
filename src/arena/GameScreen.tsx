// The Arena game screen: play a bot in Guided, Normal or Challenge mode, with every illegal move explained.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Board, type Arrow, type Mark } from '../board/Board';
import { Coach } from '../coach/Coach';
import { Game, START_FEN, type EndReason, type LegalMove } from '../chess/rules';
import { explainMove } from '../chess/explain';
import { colorName, other, type Color, type PieceType, type Square } from '../chess/types';
import { BOTS } from '../engine/bots';
import { botMove } from '../engine/client';
import { play } from '../sound/sound';
import { recordGame, useSave } from '../progress/store';
import { ARENA_TEXT } from '../content/text';
import { commentary, threatWarnings } from './analysis';
import { setLastGame } from './lastGame';

export type Mode = 'guided' | 'normal' | 'challenge';
const UNDOS: Record<Mode, number> = { guided: Infinity, normal: 3, challenge: 0 };

const fmt = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;

export default function GameScreen() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const save = useSave();
  const level = Math.min(8, Math.max(1, Number(params.get('level') ?? 1)));
  const me: Color = params.get('color') === 'b' ? 'b' : 'w';
  const mode = (['guided', 'normal', 'challenge'].includes(params.get('mode') ?? '') ? params.get('mode') : 'guided') as Mode;
  const startFen = params.get('fen') && Game.isValidFen(params.get('fen')!) ? params.get('fen')! : START_FEN;
  const minutes = Number(params.get('clock') ?? 0);
  const bot = BOTS[level - 1];

  const game = useRef(new Game(startFen));
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  const [selected, setSelected] = useState<Square | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lineMarks, setLineMarks] = useState<Square[]>([]);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState<Arrow | null>(null);
  const [undosUsed, setUndosUsed] = useState(0);
  const [over, setOver] = useState<{ text: string; outcome: 'win' | 'draw' | 'loss' } | null>(null);
  const [clock, setClock] = useState<Record<Color, number>>({ w: minutes * 60, b: minutes * 60 });
  const recorded = useRef(false);
  const [announce, setAnnounce] = useState('');

  const g = game.current;
  const turn = g.turn();
  const myTurn = turn === me && !over;

  const finish = useCallback((text: string, outcome: 'win' | 'draw' | 'loss') => {
    if (recorded.current) return;
    recorded.current = true;
    setOver({ text, outcome });
    setLastGame({ startFen: g.startFen(), moves: g.history(), me, level });
    if (startFen === START_FEN) recordGame(outcome, level);
    play(outcome === 'win' ? 'success' : outcome === 'draw' ? 'tap' : 'error');
  }, [g, me, level, startFen]);

  const checkEnd = useCallback((): boolean => {
    const e = g.end({ claimDraws: true });
    if (!e.over) return false;
    const reasons: Record<EndReason, string> = ARENA_TEXT.endReasons as Record<EndReason, string>;
    const outcome = e.winner ? (e.winner === me ? 'win' : 'loss') : 'draw';
    const head = e.winner ? `${colorName(e.winner)} wins by checkmate. ` : '';
    finish(`${head}${reasons[e.reason]}`, outcome);
    return true;
  }, [g, me, finish]);

  const describe = (m: LegalMove): string => `${colorName(m.color)} ${m.san}${m.mate ? ', checkmate' : m.check ? ', check' : ''}`;

  const afterMove = (m: LegalMove, byMe: boolean) => {
    play(m.mate || m.check ? 'check' : m.castle ? 'castle' : m.promotion ? 'promote' : m.capture ? 'capture' : 'move');
    setAnnounce(describe(m));
    setHint(null);
    setSelected(null);
    setLineMarks([]);
    if (byMe && mode === 'guided') setMessage(commentary(g, m, g.plyCount()));
    else if (byMe) setMessage(null);
    bump();
  };

  // Bot's turn
  useEffect(() => {
    if (over || turn === me || g.end({ claimDraws: true }).over) return;
    let cancelled = false;
    setThinking(true);
    const started = Date.now();
    botMove(g.fen(), level, g.history().map((m) => m.san)).then((uci) => {
      const wait = Math.max(0, 450 - (Date.now() - started));
      setTimeout(() => {
        if (cancelled) return;
        setThinking(false);
        if (!uci) return;
        const m = g.move(uci.slice(0, 2) as Square, uci.slice(2, 4) as Square, uci[4] as PieceType | undefined);
        if (!m) return;
        afterMove(m, false);
        if (!checkEnd() && mode === 'guided') {
          const w = threatWarnings(g, me);
          setMessage(w.length ? w.join(' ') : null);
        }
      }, wait);
    });
    return () => {
      cancelled = true;
      setThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, over, g.plyCount()]);

  // Clock
  useEffect(() => {
    if (!minutes || over) return;
    const t = setInterval(() => {
      if (g.plyCount() === 0 && me === 'b') return; // wait for White's first move
      setClock((c) => {
        const next = { ...c, [g.turn()]: c[g.turn()] - 1 };
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [minutes, over, g, me]);
  useEffect(() => {
    if (!minutes || over) return;
    const loser = (['w', 'b'] as Color[]).find((c) => clock[c] <= 0);
    if (!loser) return;
    const winnerPieces = Object.values(g.pieces()).filter((p) => p.color === other(loser) && p.type !== 'k');
    if (!winnerPieces.length) finish(ARENA_TEXT.flagDraw, 'draw');
    else finish(`${colorName(loser)} ran out of time. ${colorName(other(loser))} wins.`, other(loser) === me ? 'win' : 'loss');
  }, [clock, minutes, over, g, me, finish]);

  const tryMove = (from: Square, to: Square, promotion?: PieceType) => {
    if (!myTurn || thinking) return;
    if (g.pieceAt(from)?.color === me && g.needsPromotion(from, to) && !promotion) {
      setPromo({ from, to });
      return;
    }
    const m = g.move(from, to, promotion);
    if (m) {
      setPromo(null);
      afterMove(m, true);
      checkEnd();
      return;
    }
    const why = explainMove({ pieces: g.pieces(), turn: g.turn(), game: g, playerColor: me }, from, to);
    if (why) {
      setMessage(why.message);
      setLineMarks(why.highlight);
      play('error');
    }
    setSelected(null);
  };

  const onSquare = (s: Square) => {
    if (!myTurn || thinking) return;
    const p = g.pieceAt(s);
    if (selected) {
      if (s === selected) return setSelected(null);
      if (p?.color === me) return setSelected(s);
      return tryMove(selected, s);
    }
    if (p?.color === me) {
      setSelected(s);
      setMessage(null);
      setLineMarks([]);
    } else if (p) {
      setMessage(ARENA_TEXT.notYours);
    }
  };

  const undo = () => {
    if (!myTurn || thinking || undosUsed >= UNDOS[mode] || g.plyCount() === 0) return;
    // take back my last move and the bot's reply (or just the bot's move when it opened as White)
    if (g.history().at(-1)?.color !== me) g.undo();
    g.undo();
    setUndosUsed((n) => n + 1);
    setMessage(null);
    setHint(null);
    setSelected(null);
    bump();
  };

  const askHint = async () => {
    if (!myTurn || mode === 'challenge') return;
    const uci = await botMove(g.fen(), 6, g.history().map((m) => m.san));
    if (uci) setHint({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, kind: 'hint' });
  };

  const resign = () => finish(ARENA_TEXT.resigned, 'loss');
  const offerDraw = () => {
    const pawns = g.pieces();
    const material = Object.values(pawns).reduce((n, p) => n + (p.color === me ? 1 : -1) * ({ p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }[p.type]), 0);
    if (material <= 0 && g.plyCount() > 30) finish(ARENA_TEXT.drawAccepted, 'draw');
    else setMessage(ARENA_TEXT.drawDeclined);
  };

  const marks = useMemo(() => {
    const out: Partial<Record<Square, Mark>> = {};
    const last = g.history().at(-1);
    if (last) {
      out[last.from] = 'last';
      out[last.to] = 'last';
    }
    const ks = g.kingSquare(turn);
    if (g.inCheck() && ks) {
      out[ks] = 'check';
      g.checkers().forEach((c) => (out[c] = 'line'));
    }
    lineMarks.forEach((s) => (out[s] = 'line'));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.plyCount(), lineMarks, turn]);

  const moves = selected ? g.legalMoves(selected).map((m) => ({ to: m.to, capture: m.capture })) : [];
  const undosLeft = UNDOS[mode] - undosUsed;
  const history = g.history();

  return (
    <div className="arena-game">
      <div className="lesson-head">
        <div className="lesson-title">
          <strong>{bot.emoji} {bot.name} · {ARENA_TEXT.modes[mode].name}</strong>
        </div>
        <Link className="btn btn-ghost" to="/arena">Leave</Link>
      </div>
      {minutes > 0 && (
        <div className="arena-clocks" role="timer">
          <span className={`chip ${turn === other(me) && !over ? 'fire' : ''}`}>{bot.emoji} {fmt(clock[other(me)])}</span>
          <span className={`chip ${turn === me && !over ? 'fire' : ''}`}>You {fmt(clock[me])}</span>
        </div>
      )}
      <Coach mood={over ? (over.outcome === 'win' ? 'cheer' : 'happy') : 'happy'}>
        {over ? over.text : message ?? (thinking ? `${bot.name} is thinking...` : myTurn ? (g.inCheck() ? ARENA_TEXT.inCheck : ARENA_TEXT.yourTurn) : '')}
      </Coach>
      <Board
        pieces={g.pieces()}
        orientation={me}
        selected={selected}
        moves={moves}
        marks={marks}
        arrows={hint ? [hint] : []}
        coordinates={save.settings.coordinates}
        movable={(s) => myTurn && !thinking && g.pieceAt(s)?.color === me}
        onSquare={onSquare}
        onDrop={(f, t) => tryMove(f, t)}
        label="Game board"
        animate
      />
      <div className="sr-only" aria-live="polite">{announce}</div>
      {promo && (
        <div className="card promo" role="dialog" aria-label="Choose a piece">
          <p><strong>Promotion!</strong> Choose your new piece:</p>
          <div className="row">
            {(['q', 'r', 'b', 'n'] as PieceType[]).map((t) => (
              <button key={t} className="btn" onClick={() => tryMove(promo.from, promo.to, t)}>{ARENA_TEXT.promoNames[t]}</button>
            ))}
            <button className="btn btn-ghost" onClick={() => setPromo(null)}>Cancel</button>
          </div>
        </div>
      )}
      {!over ? (
        <div className="goal-actions arena-actions">
          <button className="btn" onClick={undo} disabled={!myTurn || undosLeft <= 0 || history.length === 0}>↶ Undo{Number.isFinite(undosLeft) ? ` (${undosLeft})` : ''}</button>
          <button className="btn" onClick={askHint} disabled={!myTurn || mode === 'challenge'}>💡 Hint</button>
          <button className="btn" onClick={offerDraw} disabled={!myTurn}>½ Draw</button>
          <button className="btn btn-ghost" onClick={resign}>🏳 Resign</button>
        </div>
      ) : (
        <div className="goal-actions arena-actions">
          <button className="btn btn-primary" onClick={() => nav('/arena/review')}>🔍 Review my game</button>
          <button className="btn" onClick={() => nav(0)}>Play again</button>
          <Link className="btn btn-ghost" to="/arena">Back to the Arena</Link>
        </div>
      )}
      {history.length > 0 && (
        <p className="muted arena-moves" aria-label="Move list">
          {history.map((m, i) => `${i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}${m.san}`).join(' ')}
        </p>
      )}
    </div>
  );
}
