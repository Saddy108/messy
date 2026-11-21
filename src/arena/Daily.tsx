// Daily Puzzle: the same tactic for everyone on a given day. Works offline.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Coach } from '../coach/Coach';
import { Game } from '../chess/rules';
import { dailyPuzzle, THEME_NAMES } from '../content/puzzles';
import { dayNumber } from '../review/scheduler';
import { recordMinigame, useSave } from '../progress/store';
import { MoveBoard } from './MiniGames';

export default function Daily() {
  const day = dayNumber();
  const puzzle = dailyPuzzle(day);
  const save = useSave();
  const key = `daily-${day}`;
  const [solved, setSolved] = useState(save.minigames[key] !== undefined);
  const turnName = new Game(puzzle.fen).turn() === 'w' ? 'White' : 'Black';

  return (
    <div>
      <div className="lesson-head">
        <div className="lesson-title"><strong>📅 Daily Puzzle · {THEME_NAMES[puzzle.theme]}</strong></div>
        <Link className="btn btn-ghost" to="/arena">Leave</Link>
      </div>
      {solved ? (
        <div className="card summary">
          <Coach mood="cheer">Solved! {puzzle.explain}</Coach>
          <p className="muted">Come back tomorrow for a new puzzle.</p>
          <Link className="btn btn-primary" to="/arena">Back to the Arena</Link>
        </div>
      ) : (
        <MoveBoard
          fen={puzzle.fen}
          hint={`${turnName} to move. Theme: ${THEME_NAMES[puzzle.theme]}. Find the best move!`}
          judge={(m) => m.uci === puzzle.solution || !!puzzle.alts?.includes(m.uci) || m.mate}
          onResult={(ok) => {
            if (!ok) return;
            recordMinigame(key, 1);
            setSolved(true);
          }}
        />
      )}
    </div>
  );
}
