// Practice Arena: setup screen plus routes for the game, review, mini-games and the daily puzzle.
import { Suspense, lazy, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { Coach } from '../../coach/Coach';
import { BOTS } from '../../engine/bots';
import { ARENA_TEXT } from '../../content/text';
import { useSave } from '../../progress/store';
import { dailyPuzzle } from '../../content/puzzles';
import { dayNumber } from '../../review/scheduler';
import type { Mode } from '../../arena/GameScreen';

const GameScreen = lazy(() => import('../../arena/GameScreen'));
const Review = lazy(() => import('../../arena/Review'));
const Daily = lazy(() => import('../../arena/Daily'));
const MiniGames = lazy(() => import('../../arena/MiniGames').then((m) => ({ default: m.MiniGameMenu })));
const MiniGamePage = lazy(() => import('../../arena/MiniGames').then((m) => ({ default: m.MiniGamePage })));

function Setup() {
  const nav = useNavigate();
  const save = useSave();
  const [level, setLevel] = useState(1);
  const [color, setColor] = useState<'w' | 'b'>('w');
  const [mode, setMode] = useState<Mode>('guided');
  const [clock, setClock] = useState(0);
  const [preset, setPreset] = useState('full');
  const daily = dailyPuzzle(dayNumber());
  const solvedToday = save.minigames[`daily-${dayNumber()}`] !== undefined;

  const go = () => {
    const fen = ARENA_TEXT.presets.find((p) => p.id === preset)!.fen;
    nav(`/arena/play?level=${level}&color=${color}&mode=${mode}&clock=${clock}${preset === 'full' ? '' : `&fen=${encodeURIComponent(fen)}`}`);
  };

  return (
    <div>
      <h1>Practice Arena</h1>
      <Coach>Pick a bot and play! {save.arena.games ? `Your record: ${save.arena.wins} wins, ${save.arena.draws} draws, ${save.arena.losses} losses.` : 'Start with the Sleepy Snail.'}</Coach>
      <div className="row arena-links">
        <Link className="btn" to="/arena/daily">📅 Daily Puzzle{solvedToday ? ' ✔' : ''} <span className="muted">({daily.theme})</span></Link>
        <Link className="btn" to="/arena/minigames">🎮 Mini-games</Link>
        <Link className="btn" to="/arena/review">🔍 Review last game</Link>
      </div>
      <h2>Choose your opponent</h2>
      <div className="options bots">
        {BOTS.map((b) => (
          <button key={b.level} className={`option ${level === b.level ? 'right' : ''}`} onClick={() => setLevel(b.level)} aria-pressed={level === b.level}>
            <span>{b.emoji}</span>
            <span><strong>Level {b.level}: {b.name}</strong><br /><span className="muted">{b.blurb}{save.arena.winsByLevel[b.level] ? ` · Won ${save.arena.winsByLevel[b.level]}×` : ''}</span></span>
          </button>
        ))}
      </div>
      <h2>Mode</h2>
      <div className="options">
        {(Object.keys(ARENA_TEXT.modes) as Mode[]).map((m) => (
          <button key={m} className={`option ${mode === m ? 'right' : ''}`} onClick={() => setMode(m)} aria-pressed={mode === m}>
            <span><strong>{ARENA_TEXT.modes[m].name}</strong><br /><span className="muted">{ARENA_TEXT.modes[m].blurb}</span></span>
          </button>
        ))}
      </div>
      <h2>Options</h2>
      <div className="row">
        <label>I play <select value={color} onChange={(e) => setColor(e.target.value as 'w' | 'b')}><option value="w">White</option><option value="b">Black</option></select></label>
        <label>Clock <select value={clock} onChange={(e) => setClock(Number(e.target.value))}><option value={0}>None</option><option value={5}>5 min</option><option value={10}>10 min</option><option value={15}>15 min</option></select></label>
        <label>Start from <select value={preset} onChange={(e) => setPreset(e.target.value)}>{ARENA_TEXT.presets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      </div>
      <p><button className="btn btn-primary btn-lg" onClick={go}>Play!</button></p>
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={<p className="muted">Loading...</p>}>
      <Routes>
        <Route index element={<Setup />} />
        <Route path="play" element={<GameScreen />} />
        <Route path="review" element={<Review />} />
        <Route path="daily" element={<Daily />} />
        <Route path="minigames" element={<MiniGames />} />
        <Route path="minigames/:id" element={<MiniGamePage />} />
      </Routes>
    </Suspense>
  );
}
