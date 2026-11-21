// Stage 6 — Checkmate: check vs checkmate, mate-in-1 patterns, and basic mates against a lone king.
import { MATE_PUZZLES } from '../../content/matePuzzles';
import { boss, choice, lesson, nar, ruleCheck, stage, task, tf } from './helpers';

const S = 'stage-06';
const H = (...h: string[]) => h;

const JUST_CHECK = '4k3/8/8/8/8/8/4r3/4K3 w - - 0 1';
const MATE = 'R5k1/5ppp/8/8/8/8/8/4K3 b - - 1 1';
const SAFE = '4k3/8/8/8/8/8/8/R3K3 b - - 0 1';
const KIND = ['Just check: the king can escape', 'Checkmate!', 'Not even check'];

const mate1 = (prompt: string, fen: string, hints: string[] = H('Look for a check where the king has no escape.', 'Which squares can the king reach? Cover them all.')) =>
  task(prompt, fen, { type: 'checkmate', inMoves: 1 }, hints, { success: 'Checkmate! The king cannot escape.' });

export const lessons = [
  lesson('mate-1', S, 'Check, Checkmate or Safe?', 'Checkmate is check with no escape. The game ends and the player who gives mate wins.', [
    nar('CHECKMATE is check when the king has no way out: no move, no capture, no block. The game ends and you win!'),
    choice('White to move. What is this?', KIND, 0, 'The king is in check, but it can capture the rook on e2. So it is NOT checkmate.', JUST_CHECK),
    choice('Black to move. What is this?', KIND, 1, 'The rook gives check. The black pawns block the king\'s escape squares, and nothing can capture or block. Checkmate!', MATE),
    choice('Black to move. What is this?', KIND, 2, 'No piece attacks the black king. It is safe for now.', SAFE),
    tf('When you give checkmate, the game ends right away.', true, 'The player who gave checkmate wins.'),
  ], { mode: 'full', mnemonic: 'Check + no escape = checkmate.', cards: ['card-mate-def', 'card-mate-or-not'] }),

  lesson('mate-2', S, 'Back-Rank Mate', 'A rook or queen on the back rank can give mate when the king is blocked by its own pawns.', [
    nar('The king hides behind its pawns. A rook on the back rank gives check, and the king cannot step forward!', { fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1', highlight: ['a8', 'g8'] }),
    mate1('Checkmate in one move! Use the rook.', '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1'),
    mate1('Another back-rank mate. Take the rook and give mate!', '3r2k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1'),
  ], { mode: 'full', cards: ['card-mate-or-not'] }),

  lesson('mate-3', S, 'Queen and King Mate', 'The queen and the king work together. The king protects the queen so the enemy king cannot capture her.', [
    nar('A queen next to the enemy king is captured, unless your own king protects her. Use your king as a bodyguard!'),
    mate1('Checkmate in one with the queen.', '7k/8/5K2/8/8/8/8/6Q1 w - - 0 1', H('Put the queen where your king protects her.', 'Look at g7.')),
    mate1('Checkmate in one again.', '7k/5K2/8/8/8/8/8/6Q1 w - - 0 1', H('The queen must give check and cover the escape squares.')),
  ], { mode: 'full', mnemonic: 'The king guards the queen.', cards: ['card-mate-def'] }),

  lesson('mate-4', S, 'Two Rooks: the Ladder', 'Two rooks can mate by taking turns: one cuts off a rank, the other gives check, like climbing a ladder.', [
    nar('Two rooks climb the board like a ladder. One rook blocks a rank, the other gives check. Then they swap!'),
    mate1('Rook a7 already guards the 7th rank. Finish with the other rook!', '7k/R7/8/8/8/8/8/1R4K1 w - - 0 1', H('The king cannot go down to the 7th rank.', 'Check on the 8th rank.')),
    task('Now try the whole ladder against the bot. Checkmate the black king!', '8/8/8/4k3/8/8/R7/1R2K3 w - - 0 1', { type: 'checkmate', inMoves: 15 }, H('Push the king to the edge with one rook.', 'Use the other rook to give check on the next rank.', 'Follow the arrow.'), { opponent: 'bot1', success: 'The ladder works!' }),
  ], { mode: 'full', cards: ['card-mate-def'] }),

  lesson('mate-5', S, 'Smothered Mate (Preview)', 'A smothered mate: the king is trapped by its own pieces and a knight gives check.', [
    nar('A knight can give a surprise mate. The king is smothered by its own pieces, and the knight jumps in with check.', { fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', highlight: ['f7', 'h8'] }),
    mate1('Checkmate in one with the knight!', '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', H('The black king has no free squares.', 'Which square lets the knight attack h8?')),
  ], { mode: 'full' }),

  lesson('mate-6', S, 'King and Queen vs King', 'Use the queen to box in the king, bring your own king closer, and avoid stalemate.', [
    nar('Keep the queen a knight\'s jump away, to box the king in. Then bring your king closer and give mate. Watch out for stalemate!'),
    task('Checkmate the black king with your queen and king.', '8/8/8/4k3/8/8/8/Q3K3 w - - 0 1', { type: 'checkmate', inMoves: 30 }, H('Do not take away ALL the king\'s squares without giving check: that is stalemate.', 'Walk your king up to help the queen.', 'Follow the arrow.'), { opponent: 'bot1', success: 'You mated with king and queen!' }),
  ], { mode: 'full', mnemonic: 'Box in the king. Bring your king. Beware stalemate!', cards: ['card-stalemate'] }),

  lesson('mate-7', S, 'King and Rook vs King', 'The rook cuts the king off along a rank. Then your king steps up, and the rook gives mate on the edge.', [
    nar('With one rook you need your king too. The rook cuts off a whole row, your king walks forward, and the rook gives the final check.'),
    task('Checkmate the black king with your rook and king.', '8/8/8/4k3/8/8/8/R3K3 w - - 0 1', { type: 'checkmate', inMoves: 45 }, H('Use the rook to cut the king off along a rank.', 'Bring your king opposite the enemy king, then check with the rook.', 'Follow the arrow.'), { opponent: 'bot1', success: 'King and rook mate!' }),
  ], { mode: 'full', cards: ['card-stalemate'] }),
];

export const check = ruleCheck(S, 'Checkmate', 'You know what checkmate is.', [
  choice('Checkmate means...', ['check and no way out', 'a capture', 'the 50th move'], 0, 'No move, capture or block saves the king.'),
  choice('Black to move. What is this?', KIND, 1, 'Check, and no escape.', MATE),
  choice('White to move. What is this?', KIND, 0, 'The king can capture the rook.', JUST_CHECK),
  tf('After checkmate, the game goes on until someone resigns.', false, 'Checkmate ends the game immediately.'),
  tf('A back-rank mate works when the king is blocked by its own pawns.', true, 'The pawns take away the escape squares.'),
  tf('To mate with king and queen, your king helps.', true, 'The king helps box the enemy king in.'),
], 'full');

export const bossLesson = boss(S, 'Mate Marathon', 'You can find mate in one, and mate a lone king.', [
  ...MATE_PUZZLES.map((p, i) => mate1(`Mate in 1 (${i + 1} of ${MATE_PUZZLES.length}). White to move.`, p.fen)),
  task('Final: checkmate the lone king with king and queen.', '8/8/8/3k4/8/8/8/Q3K3 w - - 0 1', { type: 'checkmate', inMoves: 30 }, H('Box the king in. Bring your king. Avoid stalemate.', 'Keep the queen a knight\'s jump from the king.', 'Follow the arrow.'), { opponent: 'bot1' }),
], 'full', { three: 3, two: 8 });

export default stage(S, 6, 'Checkmate', 'Win the game', '🏁', lessons, check, bossLesson);
