// Stage 4 — Capture, Value & Safety: piece values, trades, hanging pieces, attackers and defenders.
import { boss, choice, lesson, nar, ruleCheck, stage, tap, task, tf } from './helpers';

const S = 'stage-04';
const H = (...h: string[]) => h;
const FREE_KNIGHT = '4k3/pp3ppp/8/3n4/8/8/PPP2PPP/3QK3 w - - 0 1'; // the d5 knight has no defender
const DEFENDED_KNIGHT = '4k3/pp3ppp/2p5/3n4/8/8/PPP2PPP/3QK3 w - - 0 1'; // the c6 pawn defends d5

export const lessons = [
  lesson('value-1', S, 'What Are Pieces Worth?', 'Pawn 1, knight 3, bishop 3, rook 5, queen 9. The king is priceless.', [
    nar('Pieces have a value in points. A pawn is worth 1. A knight and a bishop are worth 3 each.', { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' }),
    nar('A rook is worth 5. The queen is worth 9. The king is priceless: if he is lost, the game is over.'),
    choice('Which is worth more?', ['A rook', 'A bishop'], 0, 'Rook 5, bishop 3.'),
    choice('How many pawns is a queen worth?', ['5', '9', '3'], 1, 'The queen is worth 9 pawns.'),
    choice('Which two pieces are worth the same?', ['Knight and bishop', 'Rook and knight', 'Queen and rook'], 0, 'Both are worth 3 points.'),
  ], { mnemonic: '1 - 3 - 3 - 5 - 9: Pawn, Knight, Bishop, Rook, Queen.', cards: ['card-values', 'card-queen-value'] }),

  lesson('value-2', S, 'Good Trade, Bad Trade', 'Trade a smaller piece for a bigger one. Do not give a bigger piece for a smaller one.', [
    nar('A trade is when you capture and your opponent captures back. Add up the points you win and lose.'),
    choice('Your knight (3) takes their rook (5) and they take your knight back. Is this good for you?', ['Yes, you win 2 points', 'No, you lose 2 points'], 0, 'You gain 5 and lose 3. That is a good trade.'),
    choice('Your queen (9) takes a pawn (1) and they take your queen back. Is this good?', ['Yes', 'No, a terrible trade'], 1, 'You gain 1 and lose 9. Never trade your queen for a pawn!'),
    choice('Your rook (5) takes a knight (3), but a pawn takes your rook. Is this good?', ['Yes', 'No, you lose 2 points'], 1, 'You gain 3 and lose 5.', '4k3/8/2p5/3n4/8/8/8/3RK3 w - - 0 1'),
    choice('You trade your bishop (3) for their knight (3). Who gains points?', ['You', 'Your opponent', 'Nobody: it is an even trade'], 2, 'Equal values: an even trade.'),
  ], { cards: ['card-trade'] }),

  lesson('safety-1', S, 'Hanging Pieces', 'A hanging piece is attacked and has no defender. You can capture it for free.', [
    nar('A piece is HANGING when it can be captured and nothing protects it. Free pieces are the best gifts!', { fen: FREE_KNIGHT, highlight: ['d5'] }),
    task('The black knight on d5 is hanging. Capture it with the queen!', FREE_KNIGHT, { type: 'playMove', uci: ['d1d5'] }, H('Which piece attacks the knight?', 'Look along the d-file.'), { success: 'Free knight!' }),
    tap('Tap the black piece that White can capture for free.', '4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1', ['d5'], 'The knight on d5 is attacked by the queen and nothing protects it.'),
    choice('Is capturing the knight with the queen a good idea here?', ['Yes, it is free', 'No, the c6 pawn protects it'], 1, 'The pawn on c6 protects the knight. Queen (9) for knight (3) is a bad trade.', DEFENDED_KNIGHT),
  ], { cards: ['card-hanging', 'card-defended'] }),

  lesson('safety-2', S, 'Protect Your Pieces', 'Before you move, check: is any of my pieces hanging? Protect it or move it.', [
    nar('Your own pieces can hang too. After each move, ask: what can my opponent capture?'),
    task('The black pawn attacks your bishop. Capture the pawn!', '4k3/8/8/1p6/2B5/8/8/4K3 w - - 0 1', { type: 'playMove', uci: ['c4b5'] }, H('Which piece is in danger?', 'Your bishop can capture the attacker.'), { success: 'The attacker is gone and your bishop is safe.' }),
    tap('Which white piece is hanging? Tap it. (It is attacked by the black rook and no white piece protects it.)', '4k3/8/8/8/8/N3r3/8/6K1 w - - 0 1', ['a3'], 'The black rook on e3 attacks a3 along the rank, and nothing protects the knight.'),
    choice('Your knight is attacked. Which is NOT a way to save it?', ['Move it away', 'Protect it with another piece', 'Look the other way'], 2, 'Move it, protect it, or capture the attacker. Never ignore the danger!'),
  ], { cards: ['card-hanging'] }),

  lesson('safety-3', S, 'Attackers and Defenders', 'Count the attackers and the defenders. Win the trade if you have more attackers.', [
    nar('To win a piece, count how many pieces attack it and how many protect it. More attackers than defenders: you win it!'),
    choice('Your rook and queen attack a pawn. One enemy piece protects it. Can you win the pawn?', ['Yes: 2 attackers against 1 defender', 'No'], 0, 'Capture with the smaller piece first, so you lose less.'),
    choice('One of your pieces attacks a pawn that is protected once. Should you capture it with a rook?', ['Yes', 'No: you lose a rook for a pawn'], 1, 'One attacker against one defender loses your piece for a pawn.'),
    tf('When you capture, you should use the least valuable attacker first.', true, 'If it is traded, you lose less.'),
  ], { cards: ['card-defended'] }),
];

export const check = ruleCheck(S, 'Values and Safety', 'You know piece values and how to spot free pieces.', [
  choice('How many points is a rook worth?', ['3', '5', '9'], 1, 'Rook = 5.'),
  choice('How many points is a knight worth?', ['1', '3', '5'], 1, 'Knight = 3.'),
  tf('A queen is a fair trade for two pawns.', false, '9 points for 2 points is a very bad trade.'),
  tap('Tap the black piece that is hanging.', '4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1', ['d5'], 'Attacked by the queen, protected by nobody.'),
  choice('Your bishop takes their rook, and a pawn takes your bishop. Is this good for you?', ['Yes: 5 for 3', 'No'], 0, 'You win a rook (5) and lose a bishop (3).'),
  tf('The king can be captured like other pieces.', false, 'The king is never captured. The game ends with checkmate.'),
], 'sandbox');

export const bossLesson = boss(S, 'Smart Trader', 'You can count value and spot free pieces.', [
  task('Win the free knight.', FREE_KNIGHT, { type: 'playMove', uci: ['d1d5'] }, H('Hanging piece!')),
  choice('Is the knight on d5 free to capture here?', ['Yes', 'No, it is protected'], 1, 'The c6 pawn protects it.', DEFENDED_KNIGHT),
  choice('Queen takes a defended knight. Good or bad?', ['Good', 'Bad: 9 points for 3'], 1, 'Never lose your queen for a knight.', DEFENDED_KNIGHT),
  tap('Tap the hanging black piece.', '4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1', ['d5'], 'No protection!'),
  choice('Which trade is best for you?', ['Pawn for queen', 'Rook for bishop', 'Knight for rook'], 2, 'You gain 2 points: knight (3) for rook (5). The first option is even better, but nobody offers it!'),
  tf('A good player always counts attackers and defenders.', true, 'Count before you capture.'),
], 'full', { three: 1, two: 3 });

export default stage(S, 4, 'Capture, Value & Safety', 'Trade smartly', '⚖️', lessons, check, bossLesson);
