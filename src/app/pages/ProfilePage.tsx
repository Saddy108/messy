// Profile: rank, XP, stats, badges.
import { Link } from 'react-router-dom';
import { BADGES, RANKS, liveStreak, rankFor } from '../../progress/rewards';
import { progressPercent } from '../../progress/gates';
import { useSave } from '../../progress/store';
import { weakIds } from '../../review/scheduler';

export default function ProfilePage() {
  const save = useSave();
  const rank = rankFor(save.xp);
  const lessonsDone = Object.values(save.lessons).filter((l) => l.stars >= 1).length;
  const stars = Object.values(save.lessons).reduce((n, l) => n + l.stars, 0);
  const reviews = Object.values(save.cards).reduce((n, c) => n + c.seen, 0);
  const a = save.arena;
  return (
    <div>
      <h1>{save.settings.name}</h1>
      <section className="card hero">
        <div className="rank-badge" aria-hidden="true">{rank.emoji}</div>
        <div className="hero-main">
          <h2>{rank.name}</h2>
          <p className="muted">{save.xp} XP{rank.next ? ` · next rank at ${rank.next} XP` : ''}</p>
          <div className="progress" aria-label="Progress to next rank"><div className="progress-fill" style={{ width: rank.next ? `${(rank.into / (rank.next - RANKS[rank.index].xp)) * 100}%` : '100%' }} /></div>
        </div>
      </section>
      <section className="card">
        <h2>Stats</h2>
        <div className="grid2">
          <div>🗺️ Journey: <strong>{progressPercent(save)}%</strong></div>
          <div>📘 Lessons done: <strong>{lessonsDone}</strong></div>
          <div>⭐ Stars: <strong>{stars}</strong></div>
          <div>🔥 Streak: <strong>{liveStreak(save)}</strong> (best {save.streak.best})</div>
          <div>🧩 Cards reviewed: <strong>{reviews}</strong></div>
          <div>⚠️ Weak rules: <strong>{weakIds(save.cards).length}</strong> {weakIds(save.cards).length > 0 && <Link to="/review?weak=1">Practice</Link>}</div>
          <div>⚔️ Games: <strong>{a.games}</strong> (W {a.wins} · D {a.draws} · L {a.losses})</div>
          <div>🎓 Exam: <strong>{save.exam?.passed ? `Passed (${save.exam.best}%)` : save.exam ? `Best ${save.exam.best}%` : 'Not taken'}</strong></div>
        </div>
        {save.exam?.passed && <p><Link className="btn btn-primary" to="/certificate">🏆 Open my certificate</Link></p>}
      </section>
      <section className="card">
        <h2>Badges</h2>
        <div className="badges">
          {BADGES.map((b) => {
            const got = !!save.badges[b.id];
            return (
              <div key={b.id} className={`badge ${got ? '' : 'off'}`}>
                <div className="e" aria-hidden="true">{b.emoji}</div>
                <strong>{b.title}</strong>
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>{got ? b.desc : `🔒 ${b.desc}`}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="card">
        <h2>Mini-game records</h2>
        {Object.keys(save.minigames).length === 0 ? <p className="muted">Play a mini-game in the Arena to set a record.</p> : (
          <ul>{Object.entries(save.minigames).map(([k, v]) => <li key={k}>{k}: <strong>{v}</strong></li>)}</ul>
        )}
      </section>
    </div>
  );
}
