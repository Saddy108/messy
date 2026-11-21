// Stage 9 — Speak Chess: reading and writing algebraic notation, then replaying the Opera Game.
import { gameFromSan, START_FEN } from '../../chess/rules';
import { boss, choice, demo, lesson, nar, ruleCheck, stage, task, tf, typed } from './helpers';

const S = 'stage-09';
const H = (...h: string[]) => h;

const after = (sans: string[]): string => gameFromSan(sans).fen();
const uci = (sans: string[], from: number, to: number): string[] => gameFromSan(sans).history().slice(from, to).map((m) => m.uci);

// Morphy vs. the Duke of Brunswick and Count Isouard, Paris, 1858.
const OPERA = ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3', 'Qxf3', 'dxe5', 'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6', 'Bg5', 'b5', 'Nxb5', 'cxb5', 'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8', 'Rxd7', 'Rxd7', 'Rd1', 'Qe6', 'Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8', 'Rd8#'];

const MID = after(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6']);
const TWO_N = 'r3k3/8/8/8/8/8/8/1N2KN2 w - - 0 1';
const TWO_R = '4k3/8/8/8/R6R/8/8/4K3 w - - 0 1';

export const lessons = [
  lesson('notation-1', S, 'Pieces and Squares', 'A move is the piece letter plus the square it goes to. Pawns have no letter.', [
    nar('Chess has a writing system called algebraic notation. Each piece has a letter: K king, Q queen, R rook, B bishop, N knight. A pawn has no letter.'),
    choice('Which letter is the knight?', ['K', 'N', 'H'], 1, 'The king already uses K, so the knight is N.'),
    choice('What does "Nf3" mean?', ['A knight moves to f3', 'A pawn moves to f3', 'A bishop moves to f3'], 0, 'N is the knight. f3 is the square it goes to.'),
    choice('What does "e4" mean?', ['A pawn moves to e4', 'A knight moves to e4', 'A king moves to e4'], 0, 'No letter means a pawn move.'),
    task('Play the move e4.', START_FEN, { type: 'playSan', san: ['e4'] }, H('It is a pawn move: no letter.', 'Move the pawn from e2 to e4.'), { success: 'e4! The most popular first move.' }),
    task('Play the move Nf3.', START_FEN, { type: 'playSan', san: ['Nf3'] }, H('N is the knight.', 'The knight from g1 goes to f3.'), { success: 'Nf3!' }),
  ], { mode: 'full', mnemonic: 'K, Q, R, B, N. Pawns: no letter.', cards: ['card-san-piece', 'card-san-pawn'] }),

  lesson('notation-2', S, 'Captures, Checks and Castling', 'x means capture, + means check, # means checkmate, O-O means castling.', [
    nar('Special marks tell the story: x means capture, + means check, and # means checkmate.'),
    choice('What does "Bxc6" mean?', ['Bishop captures on c6', 'Bishop moves to c6 safely', 'Bishop gives check'], 0, 'The x means the bishop captures something on c6.'),
    choice('What does the "+" in "Qh5+" mean?', ['Check', 'Capture', 'Good move'], 0, 'A plus sign means the move gives check.'),
    choice('How do we write a pawn on e4 capturing on d5?', ['exd5', 'Pxd5', 'e4d5'], 0, 'A pawn capture starts with the pawn\'s file letter, then x, then the square.'),
    choice('Which notation means castling queenside?', ['O-O', 'O-O-O', 'K-C'], 1, 'Kingside is O-O. Queenside is O-O-O.'),
    nar('Promotion adds an equals sign and a letter: e8=Q means a pawn reached e8 and became a queen.'),
    typed('Write the notation for this move: the pawn on e7 reaches e8 and becomes a queen.', undefined, ['e8=Q', 'e8Q'], 'e8 is the square, =Q is the promotion piece.'),
  ], { mode: 'full', mnemonic: 'x takes, + checks, # mates.', cards: ['card-san-capture', 'card-san-castle', 'card-san-promo', 'card-san-marks'] }),

  lesson('notation-3', S, 'Read It: Play the Notation', 'When you see a move in notation, find the piece, then find the square.', [
    nar('Now read some moves and play them on the board. Find the piece letter first. Then find the square.'),
    task('Play Bb5, a bishop move.', after(['e4', 'e5', 'Nf3', 'Nc6']), { type: 'playSan', san: ['Bb5'] }, H('B is the bishop.', 'The bishop from f1 goes to b5.'), { success: 'Bb5 pins the knight\'s defender.' }),
    task('Play O-O (castle kingside).', after(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6']), { type: 'playSan', san: ['O-O'] }, H('Castle kingside.', 'Move the king two squares toward h1.'), { success: 'Castled!' }),
    task('Play Bxc6, a capture.', MID, { type: 'playSan', san: ['Bxc6'] }, H('x means capture.', 'The bishop on b5 takes the knight on c6.'), { success: 'Bxc6!' }),
    task('Play exd5, a pawn capture.', after(['e4', 'd5']), { type: 'playSan', san: ['exd5'] }, H('The e-pawn captures on d5.'), { success: 'exd5!' }),
  ], { mode: 'full', cards: ['card-san-capture', 'card-san-castle'] }),

  lesson('notation-4', S, 'Write It: Say the Move', 'To write a move, name the piece, add x if it captures, then the square.', [
    nar('Now you write! Name the piece, add an x if it captures, and finish with the square. Add + if it gives check.'),
    typed('The knight on g1 jumps to f3. Write the move.', START_FEN, ['Nf3'], 'N for the knight, f3 for the square.'),
    typed('The pawn on e2 moves to e4. Write the move.', START_FEN, ['e4'], 'Pawns have no letter.'),
    typed('The bishop on b5 captures the knight on c6. Write the move.', MID, ['Bxc6'], 'B, x for capture, c6 for the square.'),
    typed('White castles on the kingside. Write the move.', after(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6']), ['O-O', '0-0'], 'Two O letters for the short side.'),
  ], { mode: 'full', cards: ['card-san-piece', 'card-san-pawn', 'card-san-capture'] }),

  lesson('notation-5', S, 'Two Pieces, Same Square', 'When two same pieces can reach a square, add a letter or number to say which one.', [
    nar('Sometimes two knights can go to the same square. Then we add the starting file (or rank) so the move is clear. Nbd2 means the knight from b1.', { fen: TWO_N, highlight: ['b1', 'f1', 'd2'] }),
    choice('Both knights can reach d2. Which move sends the b1 knight?', ['Nbd2', 'Nfd2', 'Nd2'], 0, 'The b means the knight from the b-file.', TWO_N),
    task('Play Rhd4: the rook from the h-file goes to d4.', TWO_R, { type: 'playSan', san: ['Rhd4'] }, H('Two rooks can reach d4. The h means the rook from the h-file.', 'Move the h4 rook to d4.'), { success: 'Rhd4!' }),
    tf('If only one knight can reach a square, we write the move as Nd2 with no extra letter.', true, 'We only add a letter when it would be unclear.'),
  ], { mode: 'full', mnemonic: 'Unclear? Add the file or rank.' }),

  lesson('notation-6', S, 'The Opera Game', 'You can replay a real game from its notation. This one was played in 1858.', [
    nar('Paul Morphy played this game at the opera in Paris in 1858. It is one of the most famous games ever. Let us replay it!'),
    task('Move 1: play e4.', START_FEN, { type: 'playSan', san: ['e4'] }, H('Move the king pawn two squares.'), { success: 'Black answers e5.' }),
    task('Move 2: play Nf3.', after(OPERA.slice(0, 2)), { type: 'playSan', san: ['Nf3'] }, H('The g1 knight to f3.'), { success: 'Black plays d6.' }),
    task('Move 3: play d4.', after(OPERA.slice(0, 4)), { type: 'playSan', san: ['d4'] }, H('The d-pawn two squares.'), { success: 'Black pins your knight with Bg4.' }),
    task('Move 4: play dxe5.', after(OPERA.slice(0, 6)), { type: 'playSan', san: ['dxe5'] }, H('The d-pawn captures on e5.'), { success: 'Black takes the knight: Bxf3.' }),
    task('Move 5: play Qxf3.', after(OPERA.slice(0, 8)), { type: 'playSan', san: ['Qxf3'] }, H('The queen takes the bishop on f3.'), { success: 'Black recaptures: dxe5.' }),
    task('Move 6: play Bc4.', after(OPERA.slice(0, 10)), { type: 'playSan', san: ['Bc4'] }, H('The f1 bishop to c4.'), { success: 'Black plays Nf6.' }),
    task('Move 7: play Qb3, a double attack.', after(OPERA.slice(0, 12)), { type: 'playSan', san: ['Qb3'] }, H('The queen attacks f7 and b7.'), { success: 'Black defends with Qe7.' }),
    demo(after(OPERA.slice(0, 14)), uci(OPERA, 14, 32), [
      'Nc3: White brings out another piece.',
      'Black plays c6.',
      'Bg5 pins the knight to the queen.',
      'Black plays b5, trying to chase the bishop.',
      'Nxb5! A knight takes a pawn.',
      'Black takes the knight with cxb5.',
      'Bxb5+ is check!',
      'Black blocks with Nbd7.',
      'White castles queenside: O-O-O.',
      'Black plays Rd8.',
      'Rxd7 takes a knight.',
      'Black takes back: Rxd7.',
      'Rd1 attacks the knight again.',
      'Black defends with Qe6.',
      'Bxd7+ is check.',
      'Black takes the bishop: Nxd7.',
      'Qb8+! A queen sacrifice.',
      'The knight takes the queen.',
    ]),
    task('The final move. Play Rd8 for checkmate!', after(OPERA.slice(0, 32)), { type: 'playSan', san: ['Rd8#'] }, H('The rook on d1 gives mate.', 'Move it to d8.'), { success: 'Checkmate! Morphy wins in 17 moves.' }),
  ], { mode: 'full', cards: ['card-san-marks'] }),
];

export const check = ruleCheck(S, 'Notation', 'You can read and write chess moves.', [
  choice('Which letter is the bishop?', ['B', 'K', 'N'], 0, 'B is the bishop.'),
  choice('What does "Qxd5+" mean?', ['Queen captures on d5, check', 'Queen moves to d5', 'Pawn takes d5'], 0, 'Q is the queen, x a capture, + a check.'),
  choice('Which notation means kingside castling?', ['O-O', 'O-O-O'], 0, 'The short one is kingside.'),
  typed('Write the move: the knight on g1 jumps to f3.', START_FEN, ['Nf3'], 'N and the square.'),
  tf('Pawn moves start with the letter P.', false, 'Pawns have no letter.'),
  task('Play Nf3.', START_FEN, { type: 'playSan', san: ['Nf3'] }, H('The knight from g1.')),
]);

export const bossLesson = boss(S, 'Notation Drill', 'You can read and write moves quickly and correctly.', [
  task('Play e4.', START_FEN, { type: 'playSan', san: ['e4'] }, H('Pawn, no letter.')),
  task('Play Nf3.', START_FEN, { type: 'playSan', san: ['Nf3'] }, H('The g1 knight.')),
  task('Play Bxc6.', MID, { type: 'playSan', san: ['Bxc6'] }, H('Capture with the bishop.')),
  task('Play exd5.', after(['e4', 'd5']), { type: 'playSan', san: ['exd5'] }, H('Pawn captures.')),
  typed('Write the move: the pawn on e2 moves to e4.', START_FEN, ['e4'], 'No letter.'),
  typed('Write: the bishop on b5 takes the knight on c6.', MID, ['Bxc6'], 'B, x, square.'),
  choice('Which means castling queenside?', ['O-O', 'O-O-O'], 1, 'Longer castling gets the longer notation.'),
  choice('What does # mean?', ['Checkmate', 'Check', 'Capture'], 0, 'The hash sign means checkmate.'),
  choice('Both knights can reach d2. Which move sends the b1 knight?', ['Nbd2', 'Nfd2'], 0, 'Name the file the piece starts from.', TWO_N),
  task('Play Rhd4 (rook from h4).', TWO_R, { type: 'playSan', san: ['Rhd4'] }, H('Two rooks can go to d4.')),
], 'full', { three: 1, two: 3 });

export default stage(S, 9, 'Speak Chess', 'Read and write moves', '📜', lessons, check, bossLesson);
