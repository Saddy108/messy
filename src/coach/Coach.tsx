// Pip, the friendly little pawn coach, and the speech bubble.
import type { ReactNode } from 'react';

export type Mood = 'happy' | 'cheer' | 'think' | 'oops';

export function Pip({ mood = 'happy', size = 56 }: { mood?: Mood; size?: number }) {
  const mouth =
    mood === 'oops' ? 'M18 31q4.500-3 9 0' : mood === 'cheer' ? 'M17 28q5.500 7 11 0z' : mood === 'think' ? 'M19 30h7' : 'M18 29q4.500 4.500 9 0';
  return (
    <svg viewBox="0 0 45 45" width={size} height={size} role="img" aria-label="Pip the pawn" className={`pip pip-${mood}`}>
      <path d="M10.500 40h24v-3.500a2 2 0 0 0-2-2h-20a2 2 0 0 0-2 2z" fill="#f4c542" stroke="#8a5a00" strokeWidth="1.500" strokeLinejoin="round" />
      <path d="M13.500 35c0-6 3-9 9-14 6 5 9 8 9 14z" fill="#fff6dc" stroke="#8a5a00" strokeWidth="1.500" strokeLinejoin="round" />
      <circle cx="22.500" cy="20" r="11" fill="#fff6dc" stroke="#8a5a00" strokeWidth="1.500" />
      <circle cx="18.500" cy="18" r="1.800" fill="#3b2a12" />
      <circle cx="26.500" cy="18" r="1.800" fill="#3b2a12" />
      <circle cx="15.500" cy="23" r="2" fill="#ffb3a0" opacity=".7" />
      <circle cx="29.500" cy="23" r="2" fill="#ffb3a0" opacity=".7" />
      <path d={mouth} fill={mood === 'cheer' ? '#a33' : 'none'} stroke="#3b2a12" strokeWidth="1.400" strokeLinecap="round" />
      <path d="M17 10.500l2.500-3 3 2.500 3-2.500 2.500 3" fill="#ffd54a" stroke="#8a5a00" strokeWidth="1" strokeLinejoin="round" opacity={mood === 'cheer' ? 1 : 0} />
    </svg>
  );
}

export function Coach({ children, mood = 'happy', compact = false }: { children: ReactNode; mood?: Mood; compact?: boolean }) {
  return (
    <div className={`coach ${compact ? 'coach-compact' : ''}`}>
      <Pip mood={mood} size={compact ? 44 : 56} />
      <div className="bubble" role="status" aria-live="polite">
        {children}
      </div>
    </div>
  );
}
