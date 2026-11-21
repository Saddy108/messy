// Journey map: stages as islands, lessons inside, daily goal, daily mix.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CURRICULUM } from '../../lessons/curriculum';
import { lessonState, nextLesson, progressPercent, stageComplete, stageUnlocked } from '../../progress/gates';
import { liveStreak, minutesToday, rankFor } from '../../progress/rewards';
import { dayNumber, dueIds } from '../../review/scheduler';
import { useSave } from '../../progress/store';
import { BRAND, COACH } from '../../content/brand';
import { Coach } from '../../coach/Coach';

const COLORS = ['#8bc34a', '#4fc3f7', '#ffb74d', '#ba68c8', '#f06292', '#4db6ac', '#ff8a65', '#7986cb', '#aed581', '#ffd54f', '#e57373', '#90a4ae', '#ffca28'];

export default function MapPage() {
  const save = useSave();
  const next = nextLesson(save);
  const rank = rankFor(save.xp);
  const mins = Math.round(minutesToday(save));
  const goalPct = Math.min(100, Math.round((mins / save.settings.dailyGoal) * 100));
  const due = dueIds(save.cards, dayNumber()).length;
  const [open, setOpen] = useState<string | null>(next?.stage.id ?? CURRICULUM[0]?.id ?? null);
  const fresh = Object.keys(save.lessons).length === 0;

  return (
    <div>
      {fresh ? (
        <section className="card">
          <Coach mood="cheer">{COACH.welcome}</Coach>
          <h1>{BRAND.name}</h1>
          <p>{BRAND.tagline} In small, fun lessons you will learn every rule, move every piece, and get ready to play online.</p>
          {next && <Link className="btn btn-primary btn-lg" to={`/lesson/${next.lessonId}`}>Start learning →</Link>}
        </section>
      ) : (
        <section className="card hero">
          <div className="rank-badge" aria-hidden="true">{rank.emoji}</div>
          <div className="hero-main">
            <h2>Hi {save.settings.name}! You are a {rank.name}.</h2>
            <p className="muted">
              {rank.next ? `${rank.next - save.xp} XP to the next rank` : 'Top rank reached!'} · {progressPercent(save)}% of the journey done
            </p>
            {next && <Link className="btn btn-primary btn-lg" to={`/lesson/${next.lessonId}`}>Continue →</Link>}
          </div>
          <div className="ring" style={{ ['--p' as string]: goalPct }} role="img" aria-label={`Daily goal: ${mins} of ${save.settings.dailyGoal} minutes`}>
            <div>{mins}/{save.settings.dailyGoal}<br />min</div>
          </div>
        </section>
      )}

      <section className="card daily" aria-label="Daily mix">
        <h2>Daily Mix</h2>
        <div className="row">
          <Link className="btn" to="/review">🧩 Review {due > 0 ? `(${due} due)` : '(all caught up)'}</Link>
          <Link className="btn" to="/arena/daily">🧠 Daily puzzle</Link>
          <Link className="btn" to="/arena/minigames">🎮 Mini-game</Link>
        </div>
        <p className="muted">🔥 Streak: {liveStreak(save)} day{liveStreak(save) === 1 ? '' : 's'}. Works offline!</p>
      </section>

      <h2>Your journey</h2>
      <div className="journey">
        {CURRICULUM.map((st, idx) => {
          const unlocked = stageUnlocked(save, idx);
          const complete = stageComplete(save, st);
          const items = [...st.lessons, st.check, st.boss];
          const doneCount = [...st.lessons, st.boss].filter((l) => (save.lessons[l.id]?.stars ?? 0) >= 1).length;
          const total = st.lessons.length + 1;
          return (
            <article key={st.id} className={`stage ${unlocked ? '' : 'locked'}`} style={{ ['--stage-color' as string]: COLORS[idx % COLORS.length] }}>
              <button className="stage-head" aria-expanded={open === st.id} onClick={() => setOpen(open === st.id ? null : st.id)}>
                <div className="stage-emoji" aria-hidden="true">{unlocked ? st.emoji : '🔒'}</div>
                <div className="stage-info">
                  <h3>Stage {st.number}: {st.title}</h3>
                  <p>{st.subtitle}{complete ? ' · ✅ Cleared' : ''}</p>
                  <div className="progress" aria-hidden="true"><div className="progress-fill" style={{ width: `${(doneCount / total) * 100}%` }} /></div>
                </div>
              </button>
              {open === st.id && (
                <div className="stage-body">
                  {!unlocked && <p className="muted">Clear the stage before this one (all lessons with 2+ stars and the boss) to unlock it.</p>}
                  {items.map((l) => {
                    const state = lessonState(save, st, l.id);
                    const stars = save.lessons[l.id]?.stars ?? 0;
                    const body = (
                      <>
                        <span aria-hidden="true">{state === 'done' ? '✅' : state === 'locked' ? '🔒' : '▶️'}</span>
                        <span className="lr-title">{l.title}</span>
                        {l.kind !== 'lesson' && <span className={`kind ${l.kind}`}>{l.kind === 'boss' ? 'Boss' : 'Test out'}</span>}
                        {stars > 0 && <span className="lr-stars" aria-label={`${stars} stars`}>{'★'.repeat(stars)}</span>}
                      </>
                    );
                    return state === 'locked' ? (
                      <div key={l.id} className="lesson-row locked" aria-disabled="true">{body}</div>
                    ) : (
                      <Link key={l.id} to={`/lesson/${l.id}`} className={`lesson-row ${state}`}>{body}</Link>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>
      {save.xp > 0 && CURRICULUM.every((s, i) => stageComplete(save, s) || i === CURRICULUM.length - 1) && (
        <p><Link className="btn btn-primary btn-lg" to="/exam">🎓 Take the Final Rules Exam</Link></p>
      )}
    </div>
  );
}
