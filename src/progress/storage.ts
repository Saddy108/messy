// Versioned save data in localStorage (key "p2k:v1") with migrations, export and import.
// Every storage call is wrapped in try/catch: the app still runs if storage is blocked.
export const STORAGE_KEY = 'p2k:v1';
export const CURRENT_VERSION = 2;

export interface LessonResult {
  stars: number; // 0 = attempted but not passed (boss/check), 1-3 = completed
  best: number;
  at: number;
}
export interface CardState {
  box: number; // 0..5 → intervals 0,1,3,7,14,30 days
  due: number; // day number
  seen: number;
  misses: number;
}
export interface Settings {
  name: string;
  dailyGoal: 5 | 10 | 15;
  theme: 'auto' | 'light' | 'dark';
  board: 'wood' | 'green' | 'contrast';
  sound: boolean;
  coordinates: boolean;
  reducedMotion: boolean;
}
export interface ArenaStats {
  games: number;
  wins: number;
  draws: number;
  losses: number;
  winsByLevel: Record<string, number>;
}
export interface Save {
  v: number;
  settings: Settings;
  lessons: Record<string, LessonResult>;
  testedOut: Record<string, boolean>;
  xp: number;
  badges: Record<string, number>;
  streak: { count: number; best: number; lastDay: string; freezeWeek: string };
  minutes: Record<string, number>;
  cards: Record<string, CardState>;
  arena: ArenaStats;
  minigames: Record<string, number>;
  exam: { passed: boolean; best: number; date: number } | null;
  hintsUsed: number;
  createdAt: number;
}

export const defaultSave = (): Save => ({
  v: CURRENT_VERSION,
  settings: { name: 'Learner', dailyGoal: 10, theme: 'auto', board: 'wood', sound: true, coordinates: true, reducedMotion: false },
  lessons: {},
  testedOut: {},
  xp: 0,
  badges: {},
  streak: { count: 0, best: 0, lastDay: '', freezeWeek: '' },
  minutes: {},
  cards: {},
  arena: { games: 0, wins: 0, draws: 0, losses: 0, winsByLevel: {} },
  minigames: {},
  exam: null,
  hintsUsed: 0,
  createdAt: Date.now(),
});

type Raw = Record<string, unknown>;

/** Each migration upgrades a save by exactly one version. */
export const MIGRATIONS: Record<number, (s: Raw) => Raw> = {
  // v0 (early prototype) kept settings flat; v1 grouped them.
  0: (s) => ({ ...s, v: 1, settings: { name: s.name ?? 'Learner', ...(s.settings as Raw | undefined) } }),
  // v1 → v2: added exam, hintsUsed, testedOut, minutes.
  1: (s) => ({ exam: null, hintsUsed: 0, testedOut: {}, minutes: {}, ...s, v: 2 }),
};

/** Bring any older (or damaged) save up to the current version, filling gaps with defaults. */
export function migrate(input: unknown): Save {
  let raw: Raw = input && typeof input === 'object' ? { ...(input as Raw) } : {};
  let v = typeof raw.v === 'number' ? raw.v : 0;
  while (v < CURRENT_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) break;
    raw = step(raw);
    v = typeof raw.v === 'number' ? raw.v : v + 1;
  }
  const d = defaultSave();
  return {
    ...d,
    ...(raw as Partial<Save>),
    settings: { ...d.settings, ...((raw.settings as Partial<Settings>) ?? {}) },
    arena: { ...d.arena, ...((raw.arena as Partial<ArenaStats>) ?? {}) },
    streak: { ...d.streak, ...((raw.streak as Partial<Save['streak']>) ?? {}) },
    v: CURRENT_VERSION,
  };
}

let memory: string | null = null;

export function loadSave(): Save {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    if (text) return migrate(JSON.parse(text));
  } catch {
    /* storage blocked or corrupt: fall through */
  }
  if (memory) {
    try {
      return migrate(JSON.parse(memory));
    } catch {
      /* ignore */
    }
  }
  return defaultSave();
}

export function writeSave(save: Save): void {
  const text = JSON.stringify(save);
  memory = text;
  try {
    localStorage.setItem(STORAGE_KEY, text);
  } catch {
    /* storage blocked: progress lives in memory for this session */
  }
}

export const exportSave = (save: Save): string => JSON.stringify(save, null, 2);

/** Parse an imported file. Returns null if it is not a valid save. */
export function importSave(text: string): Save | null {
  try {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || typeof (data as Raw).v !== 'number') return null;
    return migrate(data);
  } catch {
    return null;
  }
}
