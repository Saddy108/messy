// Settings: name, goal, themes, sound, export / import / reset progress.
import { useRef, useState } from 'react';
import { exportSave } from '../../progress/storage';
import { getSave, importProgress, resetProgress, setSettings, useSave } from '../../progress/store';
import { Board } from '../../board/Board';
import { parsePlacement } from '../../chess/sandbox';

const PREVIEW = parsePlacement('r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R');

export default function SettingsPage() {
  const save = useSave();
  const s = save.settings;
  const file = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const blob = new Blob([exportSave(getSave())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pips-chess-quest-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNote('Progress file downloaded.');
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    const ok = importProgress(await f.text());
    setNote(ok ? 'Progress imported!' : 'That file is not a valid progress file.');
  };

  return (
    <div>
      <h1>Settings</h1>
      <section className="card">
        <h2>You</h2>
        <p>
          <label htmlFor="name">Display name (used on your certificate)</label><br />
          <input id="name" value={s.name} maxLength={30} onChange={(e) => setSettings({ name: e.target.value })} />
        </p>
        <p>
          <label htmlFor="goal">Daily goal</label><br />
          <select id="goal" value={s.dailyGoal} onChange={(e) => setSettings({ dailyGoal: Number(e.target.value) as 5 | 10 | 15 })}>
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
          </select>
        </p>
      </section>
      <section className="card">
        <h2>Look &amp; sound</h2>
        <p>
          <label htmlFor="theme">App theme</label><br />
          <select id="theme" value={s.theme} onChange={(e) => setSettings({ theme: e.target.value as typeof s.theme })}>
            <option value="auto">Match my device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </p>
        <p>
          <label htmlFor="board">Board theme</label><br />
          <select id="board" value={s.board} onChange={(e) => setSettings({ board: e.target.value as typeof s.board })}>
            <option value="wood">Classic wood</option>
            <option value="green">Calm green</option>
            <option value="contrast">High contrast</option>
          </select>
        </p>
        <div style={{ maxWidth: 260 }}><Board pieces={PREVIEW} coordinates label="Board theme preview" /></div>
        <p><label><input type="checkbox" checked={s.sound} onChange={(e) => setSettings({ sound: e.target.checked })} /> Sound effects</label></p>
        <p><label><input type="checkbox" checked={s.coordinates} onChange={(e) => setSettings({ coordinates: e.target.checked })} /> Always show board coordinates (always on in Stages 1–9)</label></p>
        <p><label><input type="checkbox" checked={s.reducedMotion} onChange={(e) => setSettings({ reducedMotion: e.target.checked })} /> Reduce motion</label></p>
      </section>
      <section className="card">
        <h2>Your progress</h2>
        <p className="muted">Everything is saved on this device only. No account, no tracking. Export a file to keep a backup or to move to another device.</p>
        <div className="row">
          <button className="btn" onClick={download}>⬇ Export progress</button>
          <button className="btn" onClick={() => file.current?.click()}>⬆ Import progress</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
        {note && <p role="status"><strong>{note}</strong></p>}
        <hr />
        {!confirmReset ? (
          <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>Reset all progress…</button>
        ) : (
          <div role="alertdialog" aria-label="Confirm reset">
            <p><strong>This deletes all lessons, stars, XP and badges. It cannot be undone.</strong></p>
            <div className="row">
              <button className="btn btn-danger" onClick={() => { resetProgress(); setConfirmReset(false); setNote('Progress reset.'); }}>Yes, delete everything</button>
              <button className="btn" onClick={() => setConfirmReset(false)}>Keep my progress</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
