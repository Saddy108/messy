// Stage 8 — Draws: not every game has a winner.
import { boss, choice, lesson, nar, ruleCheck, stage, task, tf } from './helpers';

const S = 'stage-08';
const H = (...h: string[]) => h;

const STALE = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
const STALE2 = '8/8/8/8/8/1q6/2k5/K7 w - - 0 1';
const MATE = 'R5k1/5ppp/8/8/8/8/8/4K3 b - - 1 1';
const KBK = '8/8/4k3/8/8/3KB3/8/8 w - - 0 1';
const KRK = '8/8/4k3/8/8/3KR3/8/8 w - - 0 1';
const KK = '8/8/4k3/8/8/3K4/8/8 w - - 0 1';
const RESULT = ['White wins', 'Black wins', 'Draw'];
const CAN = ['Yes, someone can still win', 'No, it is a draw'];

export const lessons = [
  lesson('draw-1', S, 'Stalemate', 'Stalemate: the player to move is NOT in check, but has no legal move. The game is a draw.', [
    nar('Stalemate is a draw. The player to move is not in check, but every move is illegal. No one wins.', { fen: STALE, highlight: ['h8'] }),
    choice('Black to move. What is this?', ['Checkmate', 'Stalemate', 'Just a normal position'], 1, 'The king is not in check, but it has nowhere to go. That is stalemate: a draw.', STALE),
    choice('White to move. What is this?', ['Checkmate', 'Stalemate', 'White is winning'], 1, "White's king cannot move and White has no other piece. Not in check, so stalemate.", STALE2),
    tf('In stalemate, the player with no legal move loses.', false, 'It is a draw. A player must be in check as well to lose (that is checkmate).'),
  ], { mode: 'full', mnemonic: 'No check + no move = stalemate = draw.', cards: ['card-stalemate', 'card-stalemate-def'] }),

  lesson('draw-2', S, 'Do Not Stalemate by Accident', 'When you are winning, check that your move leaves the enemy king a legal move, or gives checkmate.', [
    nar('Stalemate is a big danger when you are winning. Before you move, ask: does the enemy have a legal move? Or is it checkmate?'),
    task('Mate in one! Be careful: Qc7 would be stalemate.', 'k7/8/1K6/8/8/8/8/6Q1 w - - 0 1', { type: 'checkmate', inMoves: 1 }, H('Look for a check on the 8th rank.', 'Move the queen to g8.'), { success: 'Checkmate, and not stalemate. Well done!' }),
    task('Another one. Give checkmate, not stalemate.', '7k/8/6K1/8/8/8/8/Q7 w - - 0 1', { type: 'checkmate', inMoves: 1 }, H('The queen must give check.', 'Try Qg7.'), { success: 'Checkmate!' }),
  ], { mode: 'full', cards: ['card-stalemate'] }),

  lesson('draw-3', S, 'Not Enough Pieces', 'If nobody can possibly checkmate, the game is a draw: king vs king, king and one minor piece vs king.', [
    nar('Some positions have too few pieces to checkmate. Two bare kings cannot mate; a king and one bishop cannot mate, nor can a king and one knight.'),
    choice('Can anyone still win?', CAN, 1, 'King against king: nobody can ever checkmate. It is a draw.', KK),
    choice('Can anyone still win?', CAN, 1, 'A king and a single bishop cannot checkmate a lone king.', KBK),
    choice('Can anyone still win?', CAN, 0, 'A rook and king CAN checkmate a lone king.', KRK),
    choice('Can anyone still win?', CAN, 1, 'Both sides have a king and a bishop on the same color. Neither bishop can ever mate.', '8/8/4kb2/8/8/3KB3/8/8 w - - 0 1'),
  ], { mode: 'full', mnemonic: 'Lone king + one small piece = draw.', cards: ['card-insuf-kk', 'card-insuf-kbk', 'card-insuf-kr'] }),

  lesson('draw-4', S, 'Repeating Positions', 'The same position three times: a player may claim a draw. Five times: the draw is automatic.', [
    nar('If the same position appears three times, with the same player to move, a player may claim a draw. This is threefold repetition.'),
    nar('If it appears five times, the game is drawn automatically. Nobody has to ask.'),
    choice('The same position appears for the third time. What can a player do?', ['Claim a draw', 'Nothing', 'Win the game'], 0, 'Threefold repetition: you may claim a draw.'),
    choice('The same position appears for the fifth time. What happens?', ['The game continues', 'The game is drawn automatically', 'White wins'], 1, 'Fivefold repetition ends the game as a draw. No claim needed.'),
    tf('The repeats must happen on consecutive moves.', false, 'They can be spread over the whole game.'),
  ], { mode: 'full', cards: ['card-three-rep', 'card-five-rep'] }),

  lesson('draw-5', S, '50 and 75 Moves, Agreement, Time', 'Long games with no pawn move or capture can be drawn. Players can also agree, and some time-outs are draws.', [
    nar('50 moves by each player with no capture and no pawn move: a player may claim a draw. At 75 moves, the draw is automatic.'),
    nar('Players can also agree to a draw. And if your time runs out but the other side cannot checkmate, it is a draw, not a loss.'),
    choice('50 moves each pass with no pawn move or capture. What can a player do?', ['Claim a draw', 'Win', 'Nothing'], 0, 'The 50-move rule lets a player claim a draw.'),
    choice('75 moves each pass with no pawn move or capture. What happens?', ['The game goes on', 'An automatic draw', 'A claim is needed'], 1, 'The 75-move rule is automatic.'),
    choice("White's clock runs out. Black has only a king. What is the result?", RESULT, 2, 'Black can never checkmate, so White does not lose on time. It is a draw.', '8/8/4k3/8/8/3KB3/8/8 w - - 0 1'),
    tf('Both players can agree to a draw.', true, 'A draw by agreement is allowed at any time.'),
  ], { mode: 'full', cards: ['card-fifty', 'card-seventyfive', 'card-agreement', 'card-time-loss'] }),

  lesson('draw-6', S, 'Win, Lose or Draw?', 'Look at the final position and decide: who won, or is it a draw?', [
    nar('Time to practice. Look at each final position. Is it a win, a loss or a draw?'),
    choice('White just moved. The game is over. What is the result?', RESULT, 0, 'Black is in check and cannot escape. It is checkmate: White wins.', MATE),
    choice('Black to move. The game is over. What is the result?', RESULT, 2, 'No check, but no legal move. It is stalemate: a draw.', STALE),
    choice('Result?', RESULT, 2, 'Only kings are left. Nobody can mate.', KK),
    choice('Result?', RESULT, 2, 'White cannot move and is not in check. Stalemate.', STALE2),
  ], { mode: 'full', cards: ['card-stalemate-def'] }),
];

export const check = ruleCheck(S, 'Draws', 'You know every way a game can be drawn.', [
  choice('Black to move. What is this?', ['Checkmate', 'Stalemate', 'Normal'], 1, 'Not in check, no legal move.', STALE),
  choice('Can anyone still win?', CAN, 1, 'Not enough pieces to mate.', KBK),
  choice('Can anyone still win?', CAN, 0, 'Rook and king can mate.', KRK),
  choice('Third time the same position appears. What can a player do?', ['Claim a draw', 'Nothing'], 0, 'Threefold repetition.'),
  choice('Fifth time the same position appears. What happens?', ['Automatic draw', 'A claim is needed'], 0, 'Fivefold repetition is automatic.'),
  tf('The 75-move rule is automatic.', true, 'The 50-move rule needs a claim. The 75-move rule does not.'),
]);

export const bossLesson = boss(S, 'Win, Lose or Draw Boss', 'You can name the result of any final position.', [
  choice('White just moved. Result?', RESULT, 0, 'Checkmate.', MATE),
  choice('Black to move. Result?', RESULT, 2, 'Stalemate.', STALE),
  choice('Result?', RESULT, 2, 'King against king.', KK),
  choice('Can anyone still win?', CAN, 0, 'The rook can help to mate.', KRK),
  task('Give checkmate, not stalemate.', 'k7/8/1K6/8/8/8/8/6Q1 w - - 0 1', { type: 'checkmate', inMoves: 1 }, H('Qg8 gives mate.')),
  choice("A player's time runs out. The other side has a lone king. Result?", RESULT, 2, 'The other side cannot checkmate. Draw.', KK),
  tf('A draw can end a game with a lot of pieces on the board.', true, 'Agreement and repetition can end any game.'),
  choice('White to move. Result?', RESULT, 2, 'No legal move and not in check.', STALE2),
], 'full', { three: 1, two: 3 });

export default stage(S, 8, 'Draws', 'Not every game has a winner', '🤝', lessons, check, bossLesson);
