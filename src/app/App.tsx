// App shell: theme, navigation, toasts, session timer and routes (pages load lazily).
import { Suspense, lazy, useEffect, useState, useSyncExternalStore } from 'react';
import { NavLink, Route, Routes, Link, useLocation } from 'react-router-dom';
import { BRAND, COACH, NAV } from '../content/brand';
import { addMinutes, pushToast, subscribeToasts, toastQueue, useSave } from '../progress/store';
import { liveStreak, rankFor } from '../progress/rewards';
import { Pip } from '../coach/Coach';

const MapPage = lazy(() => import('./pages/MapPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const ArenaPage = lazy(() => import('./pages/ArenaPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ExamPage = lazy(() => import('./pages/ExamPage'));
const CertificatePage = lazy(() => import('./pages/CertificatePage'));

function Toasts() {
  const [items, setItems] = useState<{ id: number; text: string }[]>([]);
  useEffect(
    () =>
      subscribeToasts(() => {
        const t = toastQueue.shift();
        if (!t) return;
        setItems((l) => [...l, t]);
        setTimeout(() => setItems((l) => l.filter((x) => x.id !== t.id)), 3500);
      }),
    [],
  );
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">{t.text}</div>
      ))}
    </div>
  );
}

/** Counts active minutes (for the daily goal) and suggests a break after ~20 minutes. */
function useSessionTimer() {
  useEffect(() => {
    let seconds = 0;
    let warned = false;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      seconds += 30;
      addMinutes(0.5);
      if (!warned && seconds >= 20 * 60) {
        warned = true;
        pushToast(COACH.breakTime);
      }
    }, 30000);
    return () => clearInterval(id);
  }, []);
}

const useOnline = () =>
  useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb);
      window.addEventListener('offline', cb);
      return () => {
        window.removeEventListener('online', cb);
        window.removeEventListener('offline', cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );

export function App() {
  const save = useSave();
  const loc = useLocation();
  const online = useOnline();
  useSessionTimer();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = save.settings.theme;
    root.dataset.board = save.settings.board;
    root.dataset.motion = save.settings.reducedMotion ? 'reduce' : 'normal';
  }, [save.settings.theme, save.settings.board, save.settings.reducedMotion]);

  const rank = rankFor(save.xp);
  const streak = liveStreak(save);
  const inLesson = loc.pathname.startsWith('/lesson/') || loc.pathname.startsWith('/arena/play') || loc.pathname.startsWith('/exam');

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label={`${BRAND.name} home`}>
          <Pip size={34} />
          <span>{BRAND.name}</span>
        </Link>
        <nav className="nav-top" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}>{n.label}</NavLink>
          ))}
        </nav>
        <div className="spacer" />
        {!online && <span className="chip" title="You are offline. Everything still works.">📴 Offline</span>}
        <span className="chip fire" title="Learning streak (days)">🔥 {streak}</span>
        <span className="chip" title={`Rank: ${rank.name}`}>{rank.emoji} {save.xp} XP</span>
      </header>
      <main id="main" className={`main ${loc.pathname.startsWith('/arena') ? 'wide' : ''}`}>
        <Suspense fallback={<p className="muted" role="status">Loading…</p>}>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/lesson/:id" element={<LessonPage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/arena/*" element={<ArenaPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/exam" element={<ExamPage />} />
            <Route path="/certificate" element={<CertificatePage />} />
            <Route path="*" element={<MapPage />} />
          </Routes>
        </Suspense>
      </main>
      {!inLesson && (
        <footer className="footer">
          <Link to="/about">About &amp; credits</Link> · {BRAND.promise}
        </footer>
      )}
      <nav className="nav-bottom" aria-label="Main">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}>
            <span className="i" aria-hidden="true">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <Toasts />
    </div>
  );
}
