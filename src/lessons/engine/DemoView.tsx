// Demo step: the board plays moves by itself while a ghost hand shows what is happening.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Board, type Mark } from '../../board/Board';
import { Coach } from '../../coach/Coach';
import type { Pieces, Square } from '../../chess/types';
import { play } from '../../sound/sound';
import type { Step } from '../types';
import { Sim } from './sim';
import { prefersReducedMotion, sleep, type StepProps } from './common';

type DemoStep = Extract<Step, { kind: 'demo' }>;

export function DemoView({ step, lessonMode, coordinates, onDone, last }: StepProps & { step: DemoStep }) {
  const [pieces, setPieces] = useState<Pieces>(() => new Sim(lessonMode, step.fen).pieces());
  const [ghost, setGhost] = useState<Square | null>(null);
  const [caption, setCaption] = useState(step.captions[0] ?? 'Watch closely.');
  const [marks, setMarks] = useState<Partial<Record<Square, Mark>>>({});
  const [dots, setDots] = useState<{ to: Square; capture: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const [run, setRun] = useState(0);
  const token = useRef(0);

  const playDemo = useCallback(async () => {
    const my = ++token.current;
    const slow = prefersReducedMotion() ? 0.3 : 1;
    const sim = new Sim(lessonMode, step.fen);
    setPieces(sim.pieces());
    setFinished(false);
    setMarks({});
    await sleep(400 * slow);
    for (let i = 0; i < step.moves.length; i++) {
      if (token.current !== my) return;
      const uci = step.moves[i];
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      setCaption(step.captions[i] ?? step.captions[step.captions.length - 1] ?? '');
      setGhost(from);
      setDots(sim.targets(from));
      setMarks({ [from]: 'hint' });
      await sleep(900 * slow);
      if (token.current !== my) return;
      setGhost(to);
      await sleep(650 * slow);
      if (token.current !== my) return;
      const r = sim.tryOpponentUci(uci);
      setDots([]);
      if (r.ok) {
        play(r.move.capture ? 'capture' : 'move');
        setPieces(sim.pieces());
        setMarks({ [from]: 'last', [to]: 'last' });
      }
      await sleep(900 * slow);
    }
    if (token.current !== my) return;
    setGhost(null);
    setFinished(true);
    setCaption(step.captions[step.moves.length] ?? step.captions[step.captions.length - 1] ?? 'Now you know how it works!');
  }, [lessonMode, step]);

  useEffect(() => {
    void playDemo();
    return () => {
      token.current++;
    };
  }, [playDemo, run]);

  return (
    <div className="step demo">
      <Coach mood="think">{caption}</Coach>
      <Board pieces={pieces} ghost={ghost} marks={marks} moves={dots} coordinates={coordinates} label="Demonstration board" />
      <div className="goal-actions">
        <button className="btn btn-ghost" onClick={() => setRun(run + 1)}>↺ Replay</button>
        <button className="btn btn-primary" onClick={() => { token.current++; onDone(); }} autoFocus={finished}>
          {finished ? (last ? 'Finish' : 'Next') : 'Skip demo'} →
        </button>
      </div>
    </div>
  );
}
