// Lesson data format. Lessons are pure data: no lesson logic lives in components.
import type { PieceType, Square } from '../chess/types';

export type { Square };

export type QuizAnswer =
  | { type: 'choice'; options: string[]; correct: number }
  | { type: 'truefalse'; correct: boolean }
  | { type: 'squares'; correct: Square[] } // tap squares on the board, then press Check
  | { type: 'text'; accepted: string[] }; // typed answer (e.g. notation)

export type Goal =
  | { type: 'collectStars'; stars: Square[]; maxMoves?: number }
  | { type: 'capture'; targets: Square[] }
  | { type: 'findAllMoves'; from: Square }
  | { type: 'escapeCheck'; require?: 'move' | 'capture' | 'block' }
  | { type: 'checkmate'; inMoves: number }
  | { type: 'castle'; side: 'king' | 'queen' }
  | { type: 'enPassant' }
  | { type: 'promote'; to?: Exclude<PieceType, 'p' | 'k'> }
  | { type: 'survive'; plies: number }
  | { type: 'reachSquare'; square: Square; maxMoves?: number }
  | { type: 'setupBoard'; timeLimit?: number }
  | { type: 'playMove'; uci: string[] } // play one of the listed moves (tactics / "find the move")
  | { type: 'playSan'; san: string[] }; // play the move written in notation

export type Opponent = 'none' | 'scripted' | 'bot1';

export type Step =
  | { kind: 'narrate'; text: string; fen?: string; highlight?: Square[]; arrows?: [Square, Square][]; stars?: Square[] }
  | { kind: 'demo'; fen: string; moves: string[]; captions: string[] }
  | {
      kind: 'task';
      prompt: string;
      fen: string;
      goal: Goal;
      hints: string[];
      opponent?: Opponent;
      scripted?: Record<string, string>;
      /** Side the learner plays (default: side to move in the FEN, or white). */
      color?: 'w' | 'b';
      success?: string;
    }
  | {
      kind: 'quiz';
      question: string;
      fen?: string;
      answer: QuizAnswer;
      explanation: string;
      /** For SAN questions: show the board from Black's side. */
      flip?: boolean;
    }
  | {
      /** Timed "name the square" game (Coordinate Rush). */
      kind: 'rush';
      prompt: string;
      seconds: number;
      /** Pass mark: correct answers and accuracy. */
      minCorrect: number;
      minAccuracy: number;
      flip?: boolean;
      /** Show the a–h / 1–8 labels on the board (default: hidden, it is a test). */
      coords?: boolean;
    };

export interface Lesson {
  id: string;
  stageId: string;
  title: string;
  takeaway: string;
  mnemonic?: string;
  mode: 'sandbox' | 'full';
  steps: Step[];
  stars: { three: number; two: number };
  reviewCards: string[];
  kind?: 'lesson' | 'check' | 'boss';
}

export interface Stage {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  emoji: string;
  lessons: Lesson[];
  check: Lesson;
  boss: Lesson;
}

/** A spaced-repetition card: one question the learner must recall (a board-based quiz where possible). */
export interface ReviewCard {
  id: string;
  /** Rule from section 5 this card trains (shown in the Weak Rules screen). */
  rule: string;
  step: Extract<Step, { kind: 'quiz' }>;
}
