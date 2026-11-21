// Narrate step: a short coach message with an optional illustrated board.
import { Board, type Arrow, type Mark } from '../../board/Board';
import { Coach } from '../../coach/Coach';
import type { Square } from '../../chess/types';
import type { Step } from '../types';
import { piecesFromFen, type StepProps } from './common';

type NarrateStep = Extract<Step, { kind: 'narrate' }>;

export function NarrateView({ step, coordinates, onDone, last }: StepProps & { step: NarrateStep }) {
  const marks: Partial<Record<Square, Mark>> = {};
  step.highlight?.forEach((s) => (marks[s] = 'hint'));
  const arrows: Arrow[] = (step.arrows ?? []).map(([from, to]) => ({ from, to, kind: 'demo' }));
  return (
    <div className="step narrate">
      <Coach>{step.text}</Coach>
      {step.fen && <Board pieces={piecesFromFen(step.fen)} marks={marks} arrows={arrows} stars={step.stars} coordinates={coordinates} label="Illustration" />}
      <div className="goal-actions">
        <button className="btn btn-primary" onClick={onDone} autoFocus>{last ? 'Finish' : 'Next'} →</button>
      </div>
    </div>
  );
}
