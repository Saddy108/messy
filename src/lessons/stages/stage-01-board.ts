// Stage 1 — The Battlefield: the board, colors, files, ranks, diagonals and square names.
import { EMPTY, boss, choice, lesson, nar, only, rush, ruleCheck, stage, tap, tf, typed } from './helpers';
import type { Square } from './helpers';

const S = 'stage-01';
const file = (f: string): Square[] => [1, 2, 3, 4, 5, 6, 7, 8].map((r) => `${f}${r}` as Square);
const rank = (r: number): Square[] => 'abcdefgh'.split('').map((f) => `${f}${r}` as Square);
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const lessons = [
  lesson('board-1', S, 'The 64 Squares', 'A chess board has 64 squares: 8 rows and 8 columns, in two colors.', [
    nar('Welcome to the battlefield! A chess board is a big square made of smaller squares.', { fen: EMPTY }),
    nar('It has 8 rows and 8 columns. 8 × 8 = 64 squares. The colors take turns: light, dark, light, dark.', { fen: EMPTY }),
    choice('How many squares are on a chess board?', ['32', '64', '100'], 1, '8 rows times 8 columns makes 64 squares.', EMPTY),
    tf('The squares are all the same color.', false, 'They are light and dark, one after the other.', EMPTY),
  ], { cards: ['card-board-64'] }),

  lesson('board-2', S, 'Light on the Right', 'Light square on the right. Each player has a light square in the right-hand corner.', [
    nar('Always set the board so that each player has a LIGHT square in the right-hand corner. This is a classic rule.', { fen: EMPTY, highlight: ['h1', 'a8'] }),
    tap('You play White, at the bottom. Tap the corner square on YOUR right-hand side.', EMPTY, ['h1'], 'The bottom-right corner is h1. It is a light square. Light on the right!'),
    tap('Now you play Black. The board is turned around. Tap the corner on YOUR right-hand side.', EMPTY, ['a8'], 'From Black\'s side, the bottom-right corner is a8. It is also a light square.', true),
    choice('The corner square on the right of the player is...', ['dark', 'light'], 1, 'Light on the right! If it is dark, the board is turned the wrong way.', EMPTY),
    tf('The square a1 (bottom-left for White) is dark.', true, 'Yes. a1 is dark, h1 is light.', EMPTY),
  ], { mnemonic: 'Light on the right!', cards: ['card-light-right'] }),

  lesson('board-3', S, 'Files, Ranks & Diagonals', 'Files go up and down (a–h). Ranks go side to side (1–8). Diagonals are slanted lines of one color.', [
    nar('A FILE is a column. It goes up and down. The files are named with letters: a, b, c, d, e, f, g, h.', { fen: EMPTY, highlight: file('e') }),
    nar('A RANK is a row, going side to side. Ranks are numbered 1 to 8, and White starts on ranks 1 and 2.', { fen: EMPTY, highlight: rank(4) }),
    nar('A DIAGONAL is a slanted line. All its squares have the same color.', { fen: EMPTY, highlight: ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'] }),
    tap('Tap every square on the d-file.', EMPTY, file('d'), 'The d-file is the column with all the d squares: d1 to d8.'),
    tap('Tap every square on rank 5.', EMPTY, rank(5), 'Rank 5 is the row of squares a5, b5, c5 ... h5.'),
    tap('Tap every square on the long diagonal from a1 to h8.', EMPTY, ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'], 'The diagonal goes one step up and one step right each time.'),
    choice('A column on the chess board is called a...', ['rank', 'file', 'diagonal'], 1, 'Files are columns. Ranks are rows.'),
  ], { mnemonic: 'Files are Flagpoles (up and down). Ranks are Rows.', cards: ['card-file-rank'] }),

  lesson('board-4', S, 'Square Names', 'Every square has a name: the file letter first, then the rank number, like e4.', [
    nar('Every square has its own name. First the file letter, then the rank number. This square is e4.', { fen: only('P', 'e4'), highlight: ['e4'] }),
    nar('Here are the names of the starting squares. The white king stands on e1. The black king stands on e8.', { fen: START, highlight: ['e1', 'e8'] }),
    tap('Tap the square c3.', EMPTY, ['c3'], 'c is the third file and 3 is the third rank. So c3.'),
    tap('Tap the square g6.', EMPTY, ['g6'], 'g is the seventh file. Count up 6 ranks.'),
    tap('Tap the square a8.', EMPTY, ['a8'], 'a8 is the top-left corner for White.'),
    typed('Type the name of the square with the white king at the start of the game.', START, ['e1'], 'The white king starts on e1.'),
    rush('Coordinate Rush practice! Tap the square named on the screen. The labels are visible.', 20, 5, 0.6, false, true),
  ], { cards: ['card-square-names'] }),
];

export const check = ruleCheck(S, 'The Board', 'You know the board, the colors and every square name.', [
  choice('How many squares does a chess board have?', ['32', '64', '81'], 1, '8 × 8 = 64.', EMPTY),
  tap('Tap the corner on White\'s right-hand side.', EMPTY, ['h1'], 'Light on the right: h1.'),
  tap('Tap every square on the f-file.', EMPTY, file('f'), 'A file is a column: f1 to f8.'),
  tap('Tap every square on rank 2.', EMPTY, rank(2), 'A rank is a row: a2 to h2.'),
  tap('Tap the square d5.', EMPTY, ['d5'], 'File d, rank 5.'),
  tf('Ranks are the columns of the board.', false, 'Ranks are rows. Files are columns.', EMPTY),
], 'sandbox');

export const bossLesson = boss(S, 'Square Sprint', 'You can find any square fast.', [
  nar('Boss time! Tap 15 named squares in 45 seconds, with at least 80% right. The labels are hidden.'),
  rush('Tap each named square. 15 correct, 80% accuracy.', 45, 15, 0.8),
  rush('Now from Black\'s side! 10 correct, 80% accuracy.', 45, 10, 0.8, true),
], 'sandbox', { three: 2, two: 6 });

const stage01 = stage(S, 1, 'The Battlefield', 'Learn the board', '🗺️', lessons, check, bossLesson);
export default stage01;
