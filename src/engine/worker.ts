// Web Worker: runs the bot so the UI never freezes.
import { chooseMove, evalWhite } from './bots';

export type WorkerRequest =
  | { id: number; type: 'move'; fen: string; level: number; history: string[] }
  | { id: number; type: 'eval'; fens: string[]; depth: number };
export type WorkerResponse =
  | { id: number; type: 'move'; uci: string | null; san: string | null }
  | { id: number; type: 'eval'; scores: number[] };

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const req = e.data;
  if (req.type === 'move') {
    const c = chooseMove(req.fen, req.level, req.history);
    const res: WorkerResponse = { id: req.id, type: 'move', uci: c?.uci ?? null, san: c?.san ?? null };
    self.postMessage(res);
  } else {
    const scores = req.fens.map((f) => evalWhite(f, req.depth));
    const res: WorkerResponse = { id: req.id, type: 'eval', scores };
    self.postMessage(res);
  }
};
