// Sounds made with the Web Audio API (no audio files, no licences). Soft by design.
import { getSave } from '../progress/store';

export type SoundName = 'move' | 'capture' | 'check' | 'castle' | 'promote' | 'success' | 'error' | 'tap';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Tone {
  f: number;
  t: number;
  d: number;
  type?: OscillatorType;
  v?: number;
}

function tones(list: Tone[]): void {
  const a = audio();
  if (!a) return;
  const now = a.currentTime;
  for (const tn of list) {
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = tn.type ?? 'sine';
    o.frequency.setValueAtTime(tn.f, now + tn.t);
    const v = tn.v ?? 0.12;
    g.gain.setValueAtTime(0.0001, now + tn.t);
    g.gain.exponentialRampToValueAtTime(v, now + tn.t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + tn.t + tn.d);
    o.connect(g).connect(a.destination);
    o.start(now + tn.t);
    o.stop(now + tn.t + tn.d + 0.02);
  }
}

const SOUNDS: Record<SoundName, Tone[]> = {
  tap: [{ f: 520, t: 0, d: 0.05, v: 0.05 }],
  move: [{ f: 220, t: 0, d: 0.09, type: 'triangle', v: 0.14 }],
  capture: [{ f: 160, t: 0, d: 0.12, type: 'triangle', v: 0.18 }, { f: 110, t: 0.04, d: 0.12, type: 'triangle', v: 0.12 }],
  check: [{ f: 660, t: 0, d: 0.1, v: 0.1 }, { f: 520, t: 0.1, d: 0.14, v: 0.1 }],
  castle: [{ f: 220, t: 0, d: 0.08, type: 'triangle' }, { f: 262, t: 0.1, d: 0.08, type: 'triangle' }],
  promote: [{ f: 392, t: 0, d: 0.1 }, { f: 523, t: 0.1, d: 0.1 }, { f: 784, t: 0.2, d: 0.2 }],
  success: [{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.12, d: 0.12 }, { f: 784, t: 0.24, d: 0.12 }, { f: 1047, t: 0.36, d: 0.25 }],
  error: [{ f: 200, t: 0, d: 0.16, type: 'sine', v: 0.09 }, { f: 170, t: 0.1, d: 0.18, type: 'sine', v: 0.07 }],
};

export function play(name: SoundName): void {
  if (!getSave().settings.sound) return;
  tones(SOUNDS[name]);
}
