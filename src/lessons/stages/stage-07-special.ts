// Stage 7 — Special Moves: castling (and every reason it can fail), en passant and promotion.
import { boss, choice, lesson, nar, ruleCheck, stage, task, tf } from './helpers';

const S = 'stage-07';
const H = (...h: string[]) => h;

const BOTH = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
const SIDES = ['Kingside only', 'Queenside only', 'Both sides', 'Neither side'];
const YESNO = ['Yes, it can castle', 'No, it cannot'];

export const lessons = [
  lesson('castle-1', S, 'Castling: Kingside', 'Castling moves the king two squares toward a rook, and the rook jumps over to the other side of the king.', [
    nar('Castling is one move with two pieces. The king goes two squares toward a rook. That rook jumps to the square the king crossed.', { fen: BOTH, highlight: ['e1', 'g1', 'h1', 'f1'] }),
    task('Castle kingside. Move the king two squares toward the h1 rook.', BOTH, { type: 'castle', side: 'king' }, H('The king moves from e1 to g1.', 'Tap the king, then tap g1.'), { success: 'Castled! The king is safe and the rook is awake.' }),
    nar('Kingside castling is written O-O. The king lands on g1, and the rook lands on f1.'),
  ], { mode: 'full', mnemonic: 'King two steps, rook hops over.', cards: ['card-castle-rook-f1', 'card-castle-squares'] }),

  lesson('castle-2', S, 'Castling: Queenside', 'Queenside castling moves the king two squares toward the a-file rook. It is written O-O-O.', [
    nar('You can also castle toward the a1 rook. The king still moves only two squares. The rook jumps over the king.', { fen: BOTH, highlight: ['e1', 'c1', 'a1', 'd1'] }),
    task('Castle queenside. Move the king two squares toward the a1 rook.', BOTH, { type: 'castle', side: 'queen' }, H('The king goes from e1 to c1.', 'Tap the king, then tap c1.'), { success: 'Queenside castling: O-O-O!' }),
    choice('After castling queenside, where is the rook?', ['a1', 'd1', 'c1'], 1, 'The rook jumps to d1, the square the king crossed.', 'r3k2r/8/8/8/8/8/8/2KR3R b kq - 1 1'),
  ], { mode: 'full', cards: ['card-castle-b1', 'card-castle-squares'] }),

  lesson('castle-3', S, 'When Castling Is Not Allowed (1)', 'You cannot castle if the king or that rook has moved, or if pieces stand between them.', [
    nar('Three simple rules: the king and the rook must never have moved, and the squares between them must be empty.'),
    choice('The white king moved to e2 and came back to e1. Can White castle now?', YESNO, 1, 'The king has moved once, so castling is gone forever. Even if it comes back.', '4k3/8/8/8/8/8/8/R3K2R w - - 0 1'),
    choice('The white h1 rook moved earlier and came back. Which side can White castle?', SIDES, 1, 'The h1 rook moved, so no kingside castling. The a1 rook never moved, so queenside is fine.', 'r3k2r/8/8/8/8/8/8/R3K2R w Q kq - 0 1'),
    choice('A knight stands on b1. Which side can White castle?', SIDES, 0, 'The knight blocks the queenside. The kingside path is empty, so O-O is allowed.', 'r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 0 1'),
    tf('A bishop on f1 stops kingside castling.', true, 'All squares between the king and the rook must be empty.', 'r3k2r/8/8/8/8/8/8/R3KB1R w KQkq - 0 1'),
  ], { mode: 'full', mnemonic: 'Never moved. Nothing between.', cards: ['card-castle-moved', 'card-castle-between'] }),

  lesson('castle-4', S, 'When Castling Is Not Allowed (2)', 'You cannot castle out of check, through an attacked square, or into check. A rook under attack is fine.', [
    nar('The king is the careful one. It may not castle while in check. It also may not cross or land on a square the enemy attacks.'),
    choice('A black rook gives check on the e-file. Can White castle?', YESNO, 1, 'The king is in check. You can never castle out of check.', '4r1k1/8/8/8/8/8/8/R3K2R w KQ - 0 1'),
    choice('A black rook attacks f1. Which side can White castle?', SIDES, 1, 'The king would pass through f1, which is attacked. Queenside is safe.', '5r1k/8/8/8/8/8/8/R3K2R w KQ - 0 1'),
    choice('A black rook attacks g1. Which side can White castle?', SIDES, 1, 'The king would land on an attacked square. Queenside is safe.', '6rk/8/8/8/8/8/8/R3K2R w KQ - 0 1'),
    nar('Surprise! Only the KING must stay safe. The rook may be attacked, and the queenside rook may even pass an attacked b1.'),
    task('A black rook attacks b1. Castle queenside anyway!', '1r5k/8/8/8/8/8/8/R3K3 w Q - 0 1', { type: 'castle', side: 'queen' }, H('The king only crosses d1 and lands on c1.', 'Neither square is attacked. Tap the king, then c1.'), { success: 'Yes! Only the king\'s squares matter.' }),
  ], { mode: 'full', mnemonic: 'King safe all the way. Rook may be attacked.', cards: ['card-castle-in-check', 'card-castle-through', 'card-castle-rook-attacked'] }),

  lesson('enpassant-1', S, 'En Passant: The Sneaky Capture', 'If a pawn jumps two squares and lands beside your pawn, you may capture it as if it moved one square.', [
    nar('A pawn can jump two squares from its start. If it lands right next to an enemy pawn, that pawn may take it "in passing".', { fen: '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', highlight: ['d5', 'e5'] }),
    task('Black just played d7-d5. Capture it en passant with your e5 pawn.', '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', { type: 'enPassant' }, H('Your pawn captures diagonally forward.', 'Move the e5 pawn to d6, the square the black pawn jumped over.'), { success: 'En passant! Your pawn landed on d6 and the d5 pawn is gone.' }),
    choice('Where does your pawn land when it captures en passant?', ['On the black pawn\'s square', 'On the square it jumped over', 'Straight ahead'], 1, 'It lands behind the enemy pawn, on d6 here.', '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'),
  ], { mode: 'full', mnemonic: 'As if it moved only one step.', cards: ['card-ep-yes', 'card-ep-when'] }),

  lesson('enpassant-2', S, 'En Passant: Now or Never', 'En passant is possible only on the very next move. Only a pawn can capture, and only a pawn can be captured.', [
    nar('This right lasts for ONE move only. If you play something else, the chance is gone forever.'),
    choice('Black just played d7-d5 beside your pawn. Can you capture en passant?', YESNO, 0, 'Yes! The pawn jumped two squares and landed beside your pawn. Do it now.', '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'),
    choice('Black played d7-d5 last turn. You moved the king. Black moved the king. Can you capture en passant now?', YESNO, 1, 'No. The right ended after one move. It never comes back.', '8/4k3/8/3pP3/8/8/8/4K3 w - - 2 3'),
    choice('Black\'s pawn moved ONE square from d6 to d5. Can you capture en passant?', YESNO, 1, 'No. It only works after a two-square jump.', '4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1'),
    tf('A knight can capture en passant.', false, 'Only pawns can capture en passant, and only pawns can be captured that way.'),
  ], { mode: 'full', mnemonic: 'Now or never!', cards: ['card-ep-expired', 'card-ep-yes'] }),

  lesson('promo-1', S, 'Promotion', 'A pawn that reaches the last rank must become a queen, rook, bishop or knight of its own color.', [
    nar('March a pawn to the far end of the board and it changes! It must become a queen, rook, bishop or knight. Never a king, never a pawn.'),
    task('Push the pawn to the last rank and make a queen.', '4k3/P7/8/8/8/8/8/4K3 w - - 0 1', { type: 'promote', to: 'q' }, H('The pawn moves one step to a8.', 'Choose the queen when the choices appear.'), { success: 'A new queen!' }),
    choice('Which piece can a pawn NOT become?', ['Queen', 'Knight', 'King'], 2, 'A pawn can become a queen, rook, bishop or knight. Never a king.'),
    tf('You can only promote to a piece you have lost.', false, 'You can have two, three or more queens. The choice is yours.'),
  ], { mode: 'full', mnemonic: 'Last rank: choose Q, R, B or N.', cards: ['card-promo-choices', 'card-promo-must'] }),

  lesson('promo-2', S, 'Under-Promotion', 'Sometimes a knight or a rook is better than a queen: a knight can give check from far away, and a rook avoids stalemate.', [
    nar('A queen is usually best, but not always. A knight can give check in a way no queen can. A rook can avoid a stalemate.'),
    task('Promote to a KNIGHT. It will give check to the king on d7!', '8/1P1k4/8/8/8/8/8/4K3 w - - 0 1', { type: 'promote', to: 'n' }, H('Push the pawn to b8.', 'Pick the knight.'), { success: 'The knight on b8 gives check!' }),
    task('If you promote to a queen here, it is stalemate. Promote to a ROOK instead.', '8/1P6/8/8/8/8/8/5K1k w - - 0 1', { type: 'promote', to: 'r' }, H('Black\'s king has no moves. A queen on b8 would leave it with no legal move and no check.', 'Choose the rook.'), { success: 'Good thinking! A rook keeps the game going.' }),
    choice('When might you promote to a knight?', ['When it gives check or a fork', 'Never', 'Always'], 0, 'A knight attacks in a way the queen cannot.'),
  ], { mode: 'full', cards: ['card-underpromo', 'card-promo-stalemate'] }),
];

export const check = ruleCheck(S, 'Special Moves', 'You know castling, en passant and promotion.', [
  choice('A knight stands on g1. Can White castle kingside?', YESNO, 1, 'Pieces between the king and rook block castling.', 'r3k2r/8/8/8/8/8/8/R3K1NR w KQkq - 0 1'),
  choice('A black rook checks the white king. Can White castle?', YESNO, 1, 'You can never castle out of check.', '4r1k1/8/8/8/8/8/8/R3K2R w KQ - 0 1'),
  choice('A black rook attacks f1. Which side can White castle?', SIDES, 1, 'The king would cross f1. Queenside is fine.', '5r1k/8/8/8/8/8/8/R3K2R w KQ - 0 1'),
  tf('A rook that is attacked can still castle.', true, 'Only the king\'s squares must be safe.'),
  choice('Black played d7-d5 just now. Can White capture en passant?', YESNO, 0, 'Yes, on the very next move.', '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1'),
  tf('En passant can be played any time later.', false, 'It must be played on the very next move.'),
  choice('A pawn reaches the last rank. What happens?', ['It must promote', 'It stays', 'It becomes a king'], 0, 'It must become a queen, rook, bishop or knight.'),
  task('Castle queenside.', BOTH, { type: 'castle', side: 'queen' }, H('The king goes to c1.')),
]);

export const bossLesson = boss(S, 'Special Moves Master', 'You can use every special move at the right moment.', [
  task('Castle kingside.', BOTH, { type: 'castle', side: 'king' }, H('King from e1 to g1.')),
  task('A black rook attacks b1. Castle queenside.', '1r5k/8/8/8/8/8/8/R3K3 w Q - 0 1', { type: 'castle', side: 'queen' }, H('Only the king\'s squares matter.')),
  task('Capture en passant.', '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', { type: 'enPassant' }, H('Move the e5 pawn to d6.')),
  task('Capture en passant with the other pawn.', '4k3/8/8/2pPp3/8/8/8/4K3 w - e6 0 1', { type: 'enPassant' }, H('Only the pawn that just moved can be taken.', 'Move d5 to e6.')),
  task('Promote to a queen.', '4k3/P7/8/8/8/8/8/4K3 w - - 0 1', { type: 'promote', to: 'q' }, H('Push the pawn to a8.')),
  task('Avoid stalemate: promote to a rook.', '8/1P6/8/8/8/8/8/5K1k w - - 0 1', { type: 'promote', to: 'r' }, H('A queen would stalemate Black.')),
  choice('A black rook attacks g1. Which side can White castle?', SIDES, 1, 'The king would land on an attacked square.', '6rk/8/8/8/8/8/8/R3K2R w KQ - 0 1'),
  choice('The a1 rook moved earlier. Which side can White castle?', SIDES, 0, 'The a1 rook moved, so only the kingside is left.', 'r3k2r/8/8/8/8/8/8/R3K2R w Kkq - 0 1'),
], 'full', { three: 1, two: 3 });

export default stage(S, 7, 'Special Moves', 'Castling, en passant, promotion', '🏰', lessons, check, bossLesson);
