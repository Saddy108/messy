// Post-game review: every move of yours gets a label and, for weak moves, a plain-English reason.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coach } from '../coach/Coach';
import { Game } from '../chess/rules';
import { evalPositions } from '../engine/client';
import { labelFor, reasonFor, type Label } from './analysis';
import { getLastGame } from './lastGame';

interface Row {
  ply: number;
  san: string;
  label: Label;
  reason?: string;
  beforeFen: string;
}

const ICON: Record<Label, string> = { Great: '🌟', Good: '👍', Inaccuracy: '🤔', Mistake: '😬', Blunder: '😱' };

export default function Review() {
  const game = getLastGame();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!game) return;
    let live = true;
    const g = new Game(game.startFen);
    const fens = [g.fen()];
    game.moves.forEach((m) => {
      g.move(m.from, m.to, m.promotion);
      fens.push(g.fen());
    });
    evalPositions(fens, 2).then((scores) => {
      if (!live) return;
      const sign = game.me === 'w' ? 1 : -1;
      const out: Row[] = [];
      game.moves.forEach((m, i) => {
        if (m.color !== game.me) return;
        const drop = sign * (scores[i] - scores[i + 1]);
        const label = m.mate ? 'Great' : labelFor(drop);
        out.push({ ply: i, san: m.san, label, beforeFen: fens[i], reason: label === 'Mistake' || label === 'Blunder' || label === 'Inaccuracy' ? reasonFor(fens[i], m) : undefined });
      });
      setRows(out);
    });
    return () => {
      live = false;
    };
  }, [game]);

  if (!game) {
    return (
      <div className="card">
        <h1>Game review</h1>
        <Coach>Play a game first, then come back here to see how you did.</Coach>
        <Link className="btn btn-primary" to="/arena">Go to the Arena</Link>
      </div>
    );
  }

  const bad = rows?.filter((r) => r.label === 'Mistake' || r.label === 'Blunder').length ?? 0;
  return (
    <div className="card">
      <h1>Game review</h1>
      <Coach mood={bad ? 'happy' : 'cheer'}>
        {!rows ? 'Looking at your moves...' : bad ? `You made ${bad} big slip${bad > 1 ? 's' : ''}. Try those moves again below!` : 'No big mistakes. Great playing!'}
      </Coach>
      <ol className="review-list">
        {rows?.map((r) => (
          <li key={r.ply} className={`review-row ${r.label.toLowerCase()}`}>
            <span className="review-move">{Math.floor(r.ply / 2) + 1}{r.ply % 2 ? '...' : '.'} <strong>{r.san}</strong></span>
            <span className="review-label">{ICON[r.label]} {r.label}</span>
            {r.reason && <span className="review-reason muted">{r.reason}</span>}
            {(r.label === 'Mistake' || r.label === 'Blunder') && (
              <Link className="btn btn-ghost" to={`/arena/play?fen=${encodeURIComponent(r.beforeFen)}&color=${game.me}&level=${game.level}&mode=guided`}>Try again from here</Link>
            )}
          </li>
        ))}
      </ol>
      <Link className="btn" to="/arena">Back to the Arena</Link>
    </div>
  );
}
