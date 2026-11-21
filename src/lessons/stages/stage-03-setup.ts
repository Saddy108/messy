// Stage 3 — Setting Up the Game: the starting position, who moves first, taking turns.
import { EMPTY, boss, choice, lesson, nar, ruleCheck, stage, tap, task, tf } from './helpers';

const S = 'stage-03';
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const H = (...h: string[]) => h;

export const lessons = [
  lesson('setup-1', S, 'The Back Row', 'Rooks go in the corners, knights next to them, then the bishops.', [
    nar('Each player has 16 pieces. The 8 strong pieces stand on the back row. The 8 pawns stand in front.', { fen: START }),
    nar('Start in the corners with the ROOKS. Next to the rooks stand the KNIGHTS. Next to the knights stand the BISHOPS.', { fen: START, highlight: ['a1', 'h1', 'b1', 'g1', 'c1', 'f1'] }),
    tap('Tap the squares where the white rooks start.', START, ['a1', 'h1'], 'The rooks stand in the corners: a1 and h1.'),
    tap('Tap the squares where the white knights start.', START, ['b1', 'g1'], 'The knights stand next to the rooks: b1 and g1.'),
    tap('Tap the squares where the white bishops start.', START, ['c1', 'f1'], 'The bishops stand next to the knights: c1 and f1.'),
  ], { mnemonic: 'Corners first: Rook, Knight, Bishop.', cards: ['card-piece-count'] }),

  lesson('setup-2', S, 'Queen and King', 'The queen stands on her own color. The king takes the last square next to her.', [
    nar('Two squares are left in the middle: d1 and e1. The QUEEN goes on her own color. The KING goes on the other square.', { fen: START, highlight: ['d1', 'e1'] }),
    tap('The white queen is light. Tap the square where she starts.', START, ['d1'], 'd1 is a light square. The white queen stands on her own color.'),
    tap('Now tap the square where the white king starts.', START, ['e1'], 'The king stands on e1, next to his queen.'),
    tap('Tap the square where the black queen starts. She is dark, so she stands on a dark square.', START, ['d8'], 'd8 is dark. The black queen also stands on her own color. The kings face each other on the e-file.'),
    tf('The white queen starts on a dark square.', false, 'She starts on the light square d1. Queen on her own color!', START),
  ], { mnemonic: 'Queen on her own color.', cards: ['card-queen-color', 'card-king-square'] }),

  lesson('setup-3', S, 'The Pawns', 'Eight pawns fill the row in front of the pieces. White uses row 2, Black uses row 7.', [
    nar('The pawns stand in front of the pieces. White pawns fill row 2. Black pawns fill row 7.', { fen: START, highlight: ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'] }),
    tap('Tap all the squares where the black pawns start.', START, ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'], 'Black pawns fill rank 7.'),
    choice('How many pieces does each player have at the start?', ['8', '16', '32'], 1, 'One king, one queen, two rooks, two bishops, two knights and eight pawns: 16.', START),
    choice('Black\'s pieces stand on rank 8. Which black piece stands on e8?', ['The queen', 'The king', 'A rook'], 1, 'Black mirrors White. The black king is on e8, facing the white king.', START),
  ], { cards: ['card-piece-count'] }),

  lesson('setup-4', S, 'Build the Board', 'You can set up all 32 pieces yourself, without any help.', [
    nar('Now you build the whole army! Tap a piece in the tray, then tap its starting square. Tap a piece on the board to take it back.'),
    task('Place all 32 pieces on their starting squares.', EMPTY, { type: 'setupBoard' }, H('Start with the rooks in the corners.', 'Next come the knights and the bishops. Then the queens and the kings.', 'Look at the glowing square.'), { success: 'You built the board all by yourself!' }),
  ], { mnemonic: 'Light on the right. Queen on her color.', cards: ['card-queen-color'] }),

  lesson('setup-5', S, 'White Moves First', 'White moves first. Then the players take turns, one move each. You can never pass.', [
    nar('The game begins with WHITE. Then Black moves, then White, then Black. One move each, again and again.', { fen: START }),
    tf('Black makes the first move.', false, 'White always moves first.', START),
    tf('If you have no good move, you can skip your turn.', false, 'You cannot pass. On your turn you must make a move, even if every move is bad.'),
    task('Play two moves as White. Watch how Black answers after each one.', START, { type: 'survive', plies: 4 }, H('Try moving a pawn two squares, like e2 to e4.', 'Tap a pawn, then tap a glowing square.'), { opponent: 'bot1', success: 'Turns alternate: you, then Black, you, then Black.' }),
  ], { mode: 'full', mnemonic: 'White first. Then take turns. No passing.', cards: ['card-white-first', 'card-no-pass'] }),
];

export const check = ruleCheck(S, 'Setup and Turns', 'You can set up the board and you know who moves.', [
  tap('Tap the white queen\'s starting square.', START, ['d1'], 'Queen on her own color: d1.'),
  tap('Tap where the black knights start.', START, ['b8', 'g8'], 'Next to the rooks: b8 and g8.'),
  choice('Which piece stands in the corner?', ['Knight', 'Bishop', 'Rook'], 2, 'Rooks stand in the corners.', START),
  tf('Black moves first.', false, 'White always moves first.', START),
  tf('A player may skip a turn.', false, 'You cannot pass. You must move.'),
  choice('How many pawns does each player have?', ['6', '8', '10'], 1, 'Eight pawns each.', START),
], 'sandbox');

export const bossLesson = boss(S, 'Fast Builder', 'You can set up the board quickly from either side.', [
  nar('Boss time! Set up the whole board in under 60 seconds. First from White\'s side, then from Black\'s side.'),
  task('Set up all the pieces in 60 seconds, from White\'s side.', EMPTY, { type: 'setupBoard', timeLimit: 60 }, H('Rooks, knights, bishops, queen, king, then pawns.')),
  task('Now from Black\'s side! The board is turned around. 60 seconds.', EMPTY, { type: 'setupBoard', timeLimit: 60 }, H('The pieces are still the same. Only your view changed.'), { color: 'b' }),
], 'sandbox', { three: 2, two: 6 });

export default stage(S, 3, 'Setting Up the Game', 'Build the army', '🏗️', lessons, check, bossLesson);
