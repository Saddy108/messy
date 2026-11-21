// Stage 5 — Check!: what check is, the three escapes, knight/pawn/double checks, pins, kings never touch.
import { boss, choice, demo, lesson, nar, ruleCheck, stage, tap, task, tf } from './helpers';

const S = 'stage-05';
const H = (...h: string[]) => h;

const ROOK_CHECK = '4r1k1/8/8/8/8/8/8/4K3 w - - 0 1'; // king must move
const CAPTURE_CHECK = '4k3/8/8/8/2b5/8/4r3/3QK3 w - - 0 1'; // queen takes the rook (bishop guards it, so the king cannot)
const BLOCK_CHECK = '4k3/8/8/8/4r3/8/3B4/R3K3 w - - 0 1'; // bishop blocks on e3
const KNIGHT_CHECK = '4k3/8/8/8/8/5n2/8/R3K3 w - - 0 1';
const DOUBLE_CHECK = '4r1k1/8/8/8/1b5Q/8/8/4K3 w - - 0 1';
const PIN = '4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1';

export const lessons = [
  lesson('check-1', S, 'What Is Check?', 'Check means the king is attacked. You must get out of check right away.', [
    nar('When a piece attacks the enemy king, that is CHECK. The king is in danger!'),
    demo('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', ['a1a8'], ['The white rook slides to a8.', 'Check! The rook attacks the black king along the rank.']),
    tap('Black is in check. Tap the piece that gives check.', '4k3/8/8/7B/8/8/8/4K3 b - - 0 1', ['h5'], 'The bishop on h5 attacks the king on e8 along the diagonal.'),
    tf('When your king is in check, you can make any move you like.', false, 'You must get out of check right away.'),
  ], { mnemonic: 'Check = the king is attacked.', cards: ['card-check-def'] }),

  lesson('check-2', S, 'Escape 1: Move the King', 'One way out of check: move the king to a safe square.', [
    nar('There are three ways out of check: MOVE the king, CAPTURE the attacker, or BLOCK the line. First: move the king.'),
    task('Your king is in check from the rook. Move the king to a safe square.', ROOK_CHECK, { type: 'escapeCheck', require: 'move' }, H('What is attacking your king?', 'The king cannot stay on the e-file.'), { success: 'You moved the king out of the rook\'s line.' }),
  ], { mode: 'full', mnemonic: 'Escape: Move, Capture, or Block.', cards: ['card-escapes'] }),

  lesson('check-3', S, 'Escape 2: Capture the Attacker', 'Another way out: capture the piece that gives check.', [
    nar('If you can capture the checking piece, check is gone. But the king can only capture if the piece is not protected.'),
    task('The rook gives check and it is protected by a bishop. Capture it with the queen!', CAPTURE_CHECK, { type: 'escapeCheck', require: 'capture' }, H('Which of your pieces can take the rook?', 'The king cannot take it: the bishop protects the rook.'), { success: 'Capture the attacker: check is gone!' }),
  ], { mode: 'full', cards: ['card-escapes'] }),

  lesson('check-4', S, 'Escape 3: Block the Line', 'You can also block: put a piece between the attacker and the king.', [
    nar('A rook, bishop or queen attacks along a line. Put one of your pieces in that line to BLOCK it.'),
    task('The black rook checks your king along the e-file. Block with your bishop!', BLOCK_CHECK, { type: 'escapeCheck', require: 'block' }, H('Which square is between the rook and your king?', 'The bishop on d2 can reach e3.'), { success: 'Blocked! Your bishop shields the king.' }),
    choice('Which move blocks the check here?', ['Be3', 'Ra4', 'Bc3'], 0, 'The bishop on e3 stands between the rook and the king.', BLOCK_CHECK),
  ], { mode: 'full', cards: ['card-block-which', 'card-escapes'] }),

  lesson('check-5', S, 'Knight Checks and Double Checks', 'A knight check cannot be blocked. In double check, only the king can move.', [
    nar('A knight jumps, so there is no line to block. Move the king or capture the knight.'),
    task('A knight gives check. Escape!', KNIGHT_CHECK, { type: 'escapeCheck' }, H('You cannot block a knight.', 'Move the king to a safe square.'), { success: 'Only king moves (or capturing the knight) can help here.' }),
    tf('You can block a check from a knight.', false, 'Knights jump over everything, so they cannot be blocked.', KNIGHT_CHECK),
    nar('A DOUBLE CHECK means two pieces give check at once. You cannot block or capture both, so only a king move helps.', { fen: DOUBLE_CHECK, highlight: ['e8', 'b4'] }),
    task('Double check! Try to take the bishop with the queen... it will not work. Move the king instead.', DOUBLE_CHECK, { type: 'escapeCheck', require: 'move' }, H('Two pieces attack your king.', 'Only the king can move out of double check.'), { success: 'In double check, only the king can move.' }),
    tf('In double check you can capture one attacker and be safe.', false, 'The other attacker still gives check. Only a king move works.', DOUBLE_CHECK),
  ], { mode: 'full', cards: ['card-knight-check', 'card-double-check'] }),

  lesson('check-6', S, 'The Pin', 'A pinned piece cannot leave the line, because it shields its king.', [
    nar('A pinned piece stands between an attacker and its own king. If it leaves the line, the king would be in check. That is not allowed!', { fen: PIN, highlight: ['e8', 'e2', 'e1'] }),
    task('Your rook on e2 is pinned. Tap every square it can move to. It may stay on the e-file.', PIN, { type: 'findAllMoves', from: 'e2' }, H('It may only slide up and down the e-file.', 'Tap a square beside the rook to see why it cannot go there.'), { success: 'The pinned rook can slide along the pin line and even capture the pinner.' }),
    tf('A pinned piece may still move along the pin line.', true, 'It keeps shielding the king, so that is legal.', PIN),
    tf('The white rook on e2 can move to d2.', false, 'Then the black rook would attack the king. A pinned piece cannot leave the line.', PIN),
  ], { mode: 'full', mnemonic: 'A pinned piece is stuck to its king.', cards: ['card-pin', 'card-pin-slide'] }),

  lesson('check-7', S, 'The King Is Never in Danger Alone', 'A king can never move into check, and two kings can never touch.', [
    nar('The king may never step on a square the enemy attacks. And two kings can never stand next to each other.'),
    task('Your king is on e1. The black king is on d3. Tap every square your king can go to.', '8/8/8/8/8/3k4/8/4K3 w - - 0 1', { type: 'findAllMoves', from: 'e1' }, H('Squares next to the black king are forbidden.', 'Tap d2 or e2 to learn why.'), { success: 'The squares d2 and e2 touch the black king. They are not allowed.' }),
    tf('The two kings may stand on neighboring squares.', false, 'Each king would attack the other. That is never allowed.'),
    tf('A king can move to a square attacked by an enemy piece.', false, 'The king can never move into check.'),
  ], { mode: 'full', cards: ['card-kings-touch', 'card-into-check'] }),
];

export const check = ruleCheck(S, 'Check', 'You can recognise check and escape it.', [
  choice('What is check?', ['The king is attacked', 'A piece is captured', 'The game ends'], 0, 'Check means the king is attacked.'),
  choice('Which is NOT a way to escape check?', ['Move the king', 'Capture the attacker', 'Move another piece away from the action'], 2, 'Move, capture or block.'),
  tf('A check from a knight can be blocked.', false, 'Knights jump. Move the king or capture the knight.'),
  tf('In double check you can block both attackers.', false, 'Only the king can move.'),
  tf('The white rook can move to d2 here.', false, 'It is pinned on the e-file.', PIN),
  tf('Kings can stand next to each other.', false, 'Never.'),
], 'full');

const bossPos = (prompt: string, fen: string, require?: 'move' | 'capture' | 'block') =>
  task(prompt, fen, { type: 'escapeCheck', require }, H('What attacks the king?', 'Move, capture or block?'));

export const bossLesson = boss(S, 'Ten Escapes', 'You can always find a way out of check.', [
  bossPos('Escape the check by moving the king.', ROOK_CHECK, 'move'),
  bossPos('Escape by capturing the attacker.', CAPTURE_CHECK, 'capture'),
  bossPos('Escape by blocking.', BLOCK_CHECK, 'block'),
  bossPos('A knight checks. Escape!', KNIGHT_CHECK),
  bossPos('A bishop checks your king. Escape!', '4k3/8/8/8/1b6/8/8/R3K3 w - - 0 1'),
  bossPos('A pawn checks your king. Escape!', '4k3/8/8/8/8/8/3p4/4K3 w - - 0 1'),
  bossPos('You play Black. A rook checks. Escape!', '4k3/8/8/8/8/8/8/4R1K1 b - - 0 1', 'move'),
  bossPos('You play Black. Block with the knight!', '4k3/8/2n5/8/8/8/8/4Q1K1 b - - 0 1', 'block'),
  bossPos('Capture the bishop with your bishop!', '4k3/8/8/8/8/2b5/1B6/4K3 w - - 0 1', 'capture'),
  bossPos('Double check! Only the king can move.', DOUBLE_CHECK, 'move'),
], 'full', { three: 2, two: 5 });

export default stage(S, 5, 'Check!', 'Defend your king', '👑', lessons, check, bossLesson);
