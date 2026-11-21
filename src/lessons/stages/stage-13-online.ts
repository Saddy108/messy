// Stage 13 — Ready for Online Chess: clocks, online features, etiquette, over-the-board conduct, and the graduation exam.
import { boss, choice, lesson, nar, ruleCheck, stage, tf } from './helpers';

const S = 'stage-13';

const SPEEDS = ['Bullet', 'Blitz', 'Rapid', 'Classical'];

export const lessons = [
  lesson('online-1', S, 'Clocks and Time Controls', 'Each player has a clock. A time control like 10+5 means 10 minutes plus 5 seconds added after every move.', [
    nar('Online games use clocks. Your clock runs only on your turn. If it reaches zero, you lose on time (unless your opponent cannot checkmate).'),
    choice('What does "10+5" mean?', ['10 minutes, plus 5 seconds added after each move', '10 moves in 5 minutes', '5 minutes plus 10 seconds'], 0, 'The first number is the starting time. The second is the increment.'),
    choice('Which time control is the fastest?', SPEEDS, 0, 'Bullet is under 3 minutes per player. Classical is the slowest.'),
    choice('Which speed is best for learning?', SPEEDS, 2, 'Rapid (10 minutes or more per player) gives you time to think.'),
    tf('Running out of time always means you lose.', false, 'If your opponent can never checkmate you, the game is a draw.'),
  ], { mode: 'full', mnemonic: 'Start time + increment.', cards: ['card-increment', 'card-time-fast', 'card-time-loss'] }),

  lesson('online-2', S, 'Playing on a Website', 'Online sites block illegal moves and offer tools: resign, draw offer, premoves, rematch and ratings.', [
    nar('Websites enforce the rules and block illegal moves. But you still need to know WHY. That is what you learned here!'),
    choice('What does a draw offer do?', ['Asks your opponent to agree to a draw', 'Resigns the game', 'Adds time to your clock'], 0, 'If your opponent accepts, the game ends in a draw.'),
    choice('What is a premove?', ['A move you plan before the opponent has moved', 'A move you cannot undo', 'A rule of castling'], 0, 'It plays right away if it is legal. It is risky in tactical positions.'),
    choice('What does a rating tell you?', ['Roughly how strong you are', 'How many games you played', 'Your country'], 0, 'It goes up when you win and down when you lose, and finds fair opponents.'),
    tf('A rematch means playing the same opponent again.', true, 'You can ask for a rematch after a game ends.'),
  ], { mode: 'full', cards: ['card-agreement', 'card-resign'] }),

  lesson('online-3', S, 'Fair Play and Good Manners', 'Play fair, no engine help, no insults. Resign when you are clearly lost, and say "good game".', [
    nar('Chess is a friendly game. Play on your own and never use a program to choose moves. Be polite, win or lose.'),
    choice('Which is fair play?', ['Choosing your own moves', 'Asking a chess program for help', 'Playing two accounts against each other'], 0, 'Fair play means every move is your own thinking.'),
    tf('It is fine to leave without finishing the game.', false, 'Resign instead, or play on. Leaving wastes your opponent\'s time.'),
    tf('Saying "good game" at the end is polite.', true, 'Win or lose, be kind.'),
  ], { mode: 'full' }),

  lesson('online-4', S, 'Touch-Move and Over-the-Board Rules', 'On a real board, if you touch a piece, you must move it. Say "I adjust" before you straighten a piece.', [
    nar('On a real board, there is no program to stop an illegal move. If you touch your own piece, you must move it. If you touch an enemy piece, you must capture it.'),
    choice('You want to straighten a piece. What do you say first?', ['I adjust', 'Check', 'Time'], 0, '"I adjust" (or "j\'adoube") tells everyone you are only fixing the piece.'),
    choice('You touched your knight. What must you do?', ['Move the knight, if it can move', 'Move any piece', 'Take your hand back'], 0, 'Touch-move: a touched piece must move, if it has a legal move.'),
    tf('Move with one hand, and press the clock with the same hand.', true, 'This is the standard rule in tournaments.'),
    tf('A tournament lets you make an illegal move with no penalty.', false, 'Illegal moves are penalized, and repeated ones can lose the game.'),
  ], { mode: 'full', cards: ['card-touch-move', 'card-jadoube'] }),

  lesson('online-5', S, 'Ready to Play!', 'You know the rules. Next: take the Final Rules Exam, then play your first rapid games online.', [
    nar('You have learned every rule of chess. Your last step is the Final Rules Exam: 40 questions, and you need 85% to pass.'),
    nar('When you pass, you earn your Ready to Play certificate. Start with rapid games of 10 minutes or more. Have fun!'),
  ], { mode: 'full', mnemonic: 'Rapid games first. Have fun!' }),
];

export const check = ruleCheck(S, 'Online Chess', 'You know how clocks, etiquette and over-the-board rules work.', [
  choice('What does "5+3" mean?', ['5 minutes plus 3 seconds per move', '3 minutes plus 5 seconds', '5 moves in 3 minutes'], 0, 'Base time plus increment.'),
  tf('A touched piece must be moved, if it can move legally.', true, 'This is the touch-move rule.'),
  tf('Running out of time against a lone king is a loss.', false, 'A lone king cannot checkmate, so it is a draw.'),
  choice('Which is the best speed to start?', SPEEDS, 2, 'Rapid gives you time to think.'),
]);

export const bossLesson = boss(S, 'Graduation Review', 'You are ready to take the Final Rules Exam.', [
  choice('What does "10+5" mean?', ['10 minutes plus 5 seconds per move', '10 moves in 5 minutes'], 0, 'Base time plus increment.'),
  choice('You want to adjust a piece. You say...', ['I adjust', 'Check'], 0, 'Say it before you touch the piece.'),
  tf('Illegal moves are blocked online, but penalized over the board.', true, 'Learn the rules so you never need the protection.'),
  tf('It is fair to ask a chess program for help in a game.', false, 'Fair play means your own moves.'),
  choice('Which time control is the fastest?', SPEEDS, 0, 'Bullet.'),
  tf('A draw offer can be accepted or declined.', true, 'It only ends the game if your opponent agrees.'),
], 'full', { three: 0, two: 2 });

export default stage(S, 13, 'Ready for Online Chess', 'Graduation day', '🎓', lessons, check, bossLesson);
