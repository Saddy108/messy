// Stage 12 — Endgame Basics: active king, opposition, rule of the square, pawn escorts, and the basic mates.
import { boss, choice, lesson, nar, ruleCheck, stage, task, tf } from './helpers';

const S = 'stage-12';
const H = (...h: string[]) => h;

const WHO = ['White', 'Black'];
const YESNO = ['Yes, it catches the pawn', 'No, the pawn promotes'];
const FACING = '8/8/8/4k3/8/4K3/8/8 w - - 0 1';
const INSIDE = '8/8/2k5/P7/8/8/8/6K1 w - - 0 1';
const OUTSIDE = '6k1/8/8/P7/8/8/8/6K1 w - - 0 1';

export const lessons = [
  lesson('end-1', S, 'The King Is a Fighter', 'In the endgame there is little danger of checkmate, so the king should walk to the center and help.', [
    nar('In the opening, the king hides. In the endgame, it fights! With fewer pieces on the board, the king is strong and safe.'),
    task('Bring your king toward the center. Reach e3.', '6k1/8/8/8/8/8/8/6K1 w - - 0 1', { type: 'reachSquare', square: 'e3' }, H('The king moves one square at a time.', 'Go f2, then e3.'), { opponent: 'bot1', success: 'A king in the center is a strong king.' }),
    tf('In the endgame, you should keep your king hidden in the corner.', false, 'The king is a strong fighting piece when few pieces remain.'),
  ], { mode: 'full', mnemonic: 'Endgame: the king joins the fight.', cards: ['card-opposition'] }),

  lesson('end-2', S, 'Opposition', 'The kings face each other with one square between. The player who must move has to step aside.', [
    nar('Kings cannot touch. When they face each other with one square between, the player who must move has to give way. The other player has the opposition.', { fen: FACING, highlight: ['e3', 'e5', 'e4'] }),
    choice('White to move. Who has the opposition?', WHO, 1, 'White must move, and must step aside. So Black has the opposition.', FACING),
    choice('Which kings are in opposition?', ['Kings face each other with one square between', 'Kings touch', 'Kings are far away'], 0, 'One empty square between the kings, in a line.'),
  ], { mode: 'full', mnemonic: 'Face to face: whoever moves, gives way.', cards: ['card-opposition'] }),

  lesson('end-3', S, 'Rule of the Square', 'Draw a square from the pawn to the last rank. If the king can step into it, the king catches the pawn.', [
    nar('How can you tell if a king can catch a running pawn? Imagine a square from the pawn to the last rank. If the king can enter that square, it catches the pawn.'),
    choice('White to move. The pawn runs from a5. Can the black king catch it?', YESNO, 0, 'The king on c6 is already inside the square, so it catches the pawn.', INSIDE),
    choice('White to move. The pawn runs from a5. Can the black king catch it?', YESNO, 1, 'The king on g8 is outside the square. The pawn runs through.', OUTSIDE),
  ], { mode: 'full', mnemonic: 'Draw the square. Inside? Caught!', cards: ['card-square-rule'] }),

  lesson('end-4', S, 'Escort the Pawn', 'A king in front of its pawn clears the way. When the pawn reaches the last rank, it becomes a queen.', [
    nar('A lone pawn is easy to stop. A pawn with its king beside it is strong. Walk both toward the last rank.'),
    task('Push the pawn to e8!', '8/8/4P3/4K3/8/8/8/6k1 w - - 0 1', { type: 'reachSquare', square: 'e8' }, H('The pawn moves one square at a time.', 'Push e7, then e8.'), { opponent: 'bot1', success: 'A new queen!' }),
    task('Now push this pawn to d8.', '8/8/3P4/3K4/8/8/8/6k1 w - - 0 1', { type: 'reachSquare', square: 'd8' }, H('Keep going: d7, then d8.'), { opponent: 'bot1', success: 'Promoted!' }),
  ], { mode: 'full', cards: ['card-promo-must'] }),

  lesson('end-5', S, 'Basic Mates Under Pressure', 'You can mate with king and queen or king and rook. Practice until it is easy.', [
    nar('Checkmating a lone king is a must-have skill. Take your time and think about stalemate!'),
    task('Mate with king and queen.', '8/8/4k3/8/8/8/8/3QK3 w - - 0 1', { type: 'checkmate', inMoves: 30 }, H('Box the king in with the queen.', 'Bring your king closer.', 'Follow the arrow.'), { opponent: 'bot1', success: 'Mate!' }),
    task('Mate with king and rook.', '8/8/4k3/8/8/8/8/3RK3 w - - 0 1', { type: 'checkmate', inMoves: 45 }, H('Cut the king off with the rook.', 'Bring your king opposite theirs.', 'Follow the arrow.'), { opponent: 'bot1', success: 'Mate!' }),
  ], { mode: 'full', cards: ['card-stalemate'] }),
];

export const check = ruleCheck(S, 'Endgames', 'You understand the basic endgame ideas.', [
  tf('In the endgame, the king should come to the center.', true, 'The king is a fighter when few pieces remain.'),
  choice('White to move. Who has the opposition?', WHO, 1, 'The player who does not have to move.', FACING),
  choice('White to move. Can the black king catch the pawn?', YESNO, 0, 'Inside the square.', INSIDE),
  choice('White to move. Can the black king catch the pawn?', YESNO, 1, 'Outside the square.', OUTSIDE),
]);

export const bossLesson = boss(S, 'Endgame Boss', 'You can finish the game with the basic endgame skills.', [
  task('Mate with king and queen.', '8/8/8/3k4/8/8/8/Q3K3 w - - 0 1', { type: 'checkmate', inMoves: 30 }, H('Box in the king. Avoid stalemate.', 'Bring your king closer.', 'Follow the arrow.'), { opponent: 'bot1' }),
  task('Mate with king and rook.', '8/8/8/3k4/8/8/8/R3K3 w - - 0 1', { type: 'checkmate', inMoves: 45 }, H('Cut the king off with the rook.', 'Bring your king opposite theirs.', 'Follow the arrow.'), { opponent: 'bot1' }),
  task('Escort the pawn to e8.', '8/8/4P3/4K3/8/8/8/6k1 w - - 0 1', { type: 'reachSquare', square: 'e8' }, H('e7, then e8.'), { opponent: 'bot1' }),
  choice('White to move. Can the black king catch the pawn?', YESNO, 0, 'Inside the square.', INSIDE),
], 'full', { three: 3, two: 8 });

export default stage(S, 12, 'Endgame Basics', 'Finish what you started', '🏁', lessons, check, bossLesson);
