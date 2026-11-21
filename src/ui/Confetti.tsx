// A burst of confetti (pure CSS, hidden for reduced-motion users).
import { useMemo } from 'react';

const COLORS = ['#f4c542', '#e5533d', '#2e8b57', '#2b6cff', '#b45be0', '#ff8fb1'];

export function Confetti({ count = 46 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.6,
        color: COLORS[i % COLORS.length],
        rot: Math.random() * 360,
        w: 6 + Math.random() * 6,
      })),
    [count],
  );
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          style={{ left: `${b.left}%`, background: b.color, width: b.w, height: b.w * 1.6, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, transform: `rotate(${b.rot}deg)` }}
        />
      ))}
    </div>
  );
}
