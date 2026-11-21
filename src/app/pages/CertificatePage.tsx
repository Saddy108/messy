// Printable "Ready to Play" certificate.
import { Link } from 'react-router-dom';
import { BRAND } from '../../content/brand';
import { Pip } from '../../coach/Coach';
import { useSave, setSettings } from '../../progress/store';
import { progressPercent } from '../../progress/gates';
import { rankFor } from '../../progress/rewards';

export default function CertificatePage() {
  const save = useSave();
  if (!save.exam?.passed) {
    return (
      <div className="card">
        <h2>Certificate locked</h2>
        <p>Pass the Final Rules Exam (85% or more) to earn your certificate.</p>
        <Link className="btn btn-primary" to="/exam">Go to the exam</Link>
      </div>
    );
  }
  const stars = Object.values(save.lessons).reduce((n, l) => n + l.stars, 0);
  return (
    <div>
      <div className="cert" role="img" aria-label="Ready to Play certificate">
        <Pip mood="cheer" size={90} />
        <h1>Ready to Play</h1>
        <p>This certifies that</p>
        <div className="big">{save.settings.name}</div>
        <p>has learned every rule of chess, passed the Final Rules Exam with <strong>{save.exam.best}%</strong>, and is ready to play real games online.</p>
        <p>Rank: <strong>{rankFor(save.xp).name}</strong> · XP: <strong>{save.xp}</strong> · Stars: <strong>{stars}</strong> · Journey: <strong>{progressPercent(save)}%</strong></p>
        <p>{new Date(save.exam.date || Date.now()).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
        <p><em>{BRAND.name}</em></p>
      </div>
      <p className="no-print">
        <label htmlFor="cname">Name on certificate: </label>
        <input id="cname" value={save.settings.name} maxLength={30} onChange={(e) => setSettings({ name: e.target.value })} />{' '}
        <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print</button>
      </p>
      <p className="no-print muted">Next step: play rapid games of 10 minutes or more. Slow games give you time to think and are the best way to improve.</p>
    </div>
  );
}
