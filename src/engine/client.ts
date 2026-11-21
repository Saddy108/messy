// Main-thread client for the bot worker (falls back to a direct call if workers are unavailable).
import { chooseMove } from './bots';
import type { WorkerRequest, WorkerResponse } from './worker';

type Pending = (r: WorkerResponse) => void;
let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      pending.get(e.data.id)?.(e.data);
      pending.delete(e.data.id);
    };
    worker.onerror = () => {
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

type NoId<T> = T extends unknown ? Omit<T, 'id'> : never;

function call(req: NoId<WorkerRequest>): Promise<WorkerResponse> {
  const w = getWorker();
  return new Promise((resolve, reject) => {
    if (!w) return reject(new Error('no worker'));
    const id = nextId++;
    pending.set(id, resolve);
    w.postMessage({ ...req, id });
  });
}

export async function botMove(fen: string, level: number, history: string[]): Promise<string | null> {
  try {
    const r = await call({ type: 'move', fen, level, history });
    return r.type === 'move' ? r.uci : null;
  } catch {
    return chooseMove(fen, level, history)?.uci ?? null;
  }
}

export async function evalPositions(fens: string[], depth = 2): Promise<number[]> {
  const r = await call({ type: 'eval', fens, depth });
  return r.type === 'eval' ? r.scores : [];
}
