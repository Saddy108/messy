// Stage 10 — Smart Openings: the ten-move plan, and how to beat early traps.
import { gameFromSan, START_FEN } from '../../chess/rules';
import { boss, choice, lesson, nar, ruleCheck, stage, task, tf } from './helpers';

const S = 'stage-10';
const H = (...h: string[]) => h;
const after = (sans: string[]): string => gameFromSan(sans).fen();

const E4E5 = after(['e4', 'e5']);
const DEVELOPED = after(['e4', 'e5', 'Nf3', 'Nc6']);
const READY_TO_CASTLE = after(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5']);
const SCHOLAR = after(['e4', 'e5', 'Bc4', 'Nc6', 'Qh5']);

export const lessons = [
  lesson('open-1', S, 'Control the Center', 'Pawns and pieces in the middle of the board control more squares and give your army room.', [
    nar('The four middle squares are d4, e4, d5 and e5. A piece in the center can reach both sides of the board fast.', { fen: START_FEN, highlight: ['d4', 'e4', 'd5', 'e5'] }),
    task('Start the game: put a pawn in the center.', START_FEN, { type: 'playMove', uci: ['e2e4', 'd2d4'] }, H('Which pawns can reach the center?', 'Move the e-pawn or the d-pawn two squares.'), { success: 'A strong start!' }),
    choice('Which first move controls the center?', ['a4', 'e4', 'h3'], 1, 'The e4 pawn stands in the center and opens lines for the queen and bishop.', START_FEN),
  ], { mode: 'full', mnemonic: 'Center first!', cards: ['card-open-principles'] }),

  lesson('open-2', S, 'Develop Your Pieces', 'Bring your knights and bishops out early. Pieces on their home squares do nothing.', [
    nar('Developing means moving your knights and bishops off the back rank to active squares. Knights first, then bishops.'),
    task('Black copied your pawn move. Develop a knight!', E4E5, { type: 'playMove', uci: ['g1f3', 'b1c3'] }, H('Which pieces are still on the back rank?', 'Move a knight toward the center.'), { success: 'Knights toward the center is the right idea.' }),
    task('Now develop a bishop.', DEVELOPED, { type: 'playMove', uci: ['f1c4', 'f1b5'] }, H('The f1 bishop now has a free diagonal.', 'Try Bc4 or Bb5.'), { success: 'Your bishop looks at the center.' }),
    tf('It is a good idea to move the same piece many times in the opening.', false, 'Use each move to bring a NEW piece into play, unless there is a good reason.'),
  ], { mode: 'full', mnemonic: 'Knights before bishops. New piece every move.', cards: ['card-open-principles'] }),

  lesson('open-3', S, 'Castle Early', 'Castling puts your king in a safe corner and brings a rook toward the center.', [
    nar('The king is safer in the corner, behind its pawns. Castling does this in one move and wakes up a rook. Do it early!'),
    task('You have developed. Now castle kingside.', READY_TO_CASTLE, { type: 'castle', side: 'king' }, H('The king moves two squares toward the h1 rook.', 'Tap the king, then g1.'), { success: 'Castled. Now your king is safe and your rook is ready.' }),
    tf('Castling early helps keep your king safe.', true, 'The king hides behind its pawns, and the rook joins the game.'),
  ], { mode: 'full', mnemonic: 'Castle early, castle often.', cards: ['card-castle-early'] }),

  lesson('open-4', S, 'Do Not Bring the Queen Out Early', 'The queen is powerful, but an early queen can be chased by small pieces.', [
    nar('The queen is your strongest piece. If she comes out early, enemy knights and bishops attack her and you lose time.'),
    choice('Which is the better second move for White here?', ['Qh5', 'Nf3'], 1, 'Nf3 develops a knight and attacks the e5 pawn. An early queen move can be chased away.', E4E5),
    tf('You should connect your rooks by moving all pieces off the back rank.', true, 'When nothing stands between the rooks, they protect each other. That is the end of the opening.'),
    choice('What should you do before launching an attack?', ['Develop your pieces first', 'Move the king pawn again', 'Push every pawn'], 0, 'Attack with a full army, not with one piece.'),
  ], { mode: 'full', mnemonic: 'Queen waits. Army first.', cards: ['card-open-principles'] }),

  lesson('open-5', S, "Beat Scholar's Mate", 'A quick trap threatens Qxf7#. You can stop it with a pawn move or by developing a knight.', [
    nar("Some beginners try to win in four moves. The queen and bishop aim at f7 together. This is called Scholar's Mate.", { fen: SCHOLAR, highlight: ['h5', 'c4', 'f7'] }),
    choice('White threatens a move that ends the game. Which?', ['Qxf7#', 'Qxh7', 'Bxf7'], 0, 'The queen takes f7, protected by the bishop, and it is checkmate.', SCHOLAR),
    task('Black to move. Stop Qxf7#! Attack the queen.', SCHOLAR, { type: 'playMove', uci: ['g7g6', 'g8f6'] }, H('Which move attacks the queen?', 'Try a knight to f6 or a pawn to g6.'), { success: 'You are safe, and the queen has to run.' }),
  ], { mode: 'full', mnemonic: 'Watch f7 (and f2).', cards: ['card-scholar'] }),

  lesson('open-6', S, 'The Ten-Move Plan', 'Center, develop, castle. Then look for a plan.', [
    nar('Your opening plan has three steps: take the center, develop your knights and bishops, and castle your king.'),
    choice('Which is NOT part of the plan?', ['Develop pieces', 'Castle', 'Move the queen out on move one'], 2, 'The early queen is the opposite of the plan.'),
    nar('Practice in the Arena in Guided mode. The coach comments on each move and warns you about hanging pieces.'),
  ], { mode: 'full', mnemonic: 'Center. Develop. Castle.', cards: ['card-open-principles', 'card-castle-early'] }),
];

export const check = ruleCheck(S, 'Openings', 'You know the opening principles.', [
  choice('What should you control first?', ['The center', 'The edge', 'The corner'], 0, 'The center gives your pieces room.'),
  tf('Develop knights and bishops early.', true, 'Pieces on the back rank do nothing.'),
  tf('Bring your queen out as early as possible.', false, 'An early queen gets chased.'),
  choice('White threatens Qxf7#. Which reply defends?', ['Nf6', 'a6', 'h6'], 0, 'The knight attacks the queen, so White has no time for Qxf7.', SCHOLAR),
  task('Castle kingside.', READY_TO_CASTLE, { type: 'castle', side: 'king' }, H('King to g1.')),
]);

export const bossLesson = boss(S, 'Opening Boss', 'You follow the ten-move plan.', [
  task('Take the center.', START_FEN, { type: 'playMove', uci: ['e2e4', 'd2d4'] }, H('A center pawn.')),
  task('Develop a knight.', E4E5, { type: 'playMove', uci: ['g1f3', 'b1c3'] }, H('Knights first.')),
  task('Develop a bishop.', DEVELOPED, { type: 'playMove', uci: ['f1c4', 'f1b5'] }, H('Bishops next.')),
  task('Castle.', READY_TO_CASTLE, { type: 'castle', side: 'king' }, H('King to g1.')),
  task('Stop Scholar\'s Mate.', SCHOLAR, { type: 'playMove', uci: ['g7g6', 'g8f6'] }, H('Attack the queen.')),
  tf('Moving the same piece three times in the opening is usually a waste.', true, 'Bring out new pieces instead.'),
], 'full', { three: 1, two: 3 });

export default stage(S, 10, 'Smart Openings', 'Start every game well', '🚀', lessons, check, bossLesson);
