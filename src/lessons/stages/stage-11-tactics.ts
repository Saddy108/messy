// Stage 11 — Tactics Toolbox: fork, pin, skewer, double attack, discovered attack, removing the defender.
import { PUZZLES, THEME_NAMES, type Theme } from '../../content/puzzles';
import { boss, choice, lesson, nar, ruleCheck, stage, task, tf } from './helpers';

const S = 'stage-11';

const HINTS: Record<Theme, string[]> = {
  fork: ['Look for one piece that can attack two things at once.', 'Which move gives check and attacks something else?', 'Follow the arrow.'],
  pin: ['Which enemy piece stands in front of its king?', 'Attack the piece that cannot move.', 'Follow the arrow.'],
  skewer: ['Give check along a line with another piece behind the king.', 'Which check lines up with a second piece?', 'Follow the arrow.'],
  discovered: ['Which of your pieces blocks your own rook?', 'Move it with a threat. The rook behind it does the rest.', 'Follow the arrow.'],
  double: ['Find a move that makes two threats.', 'A check plus an attack is hard to answer.', 'Follow the arrow.'],
  defender: ['Which enemy piece protects the target?', 'Capture or chase the protector first.', 'Follow the arrow.'],
};

/** One task per puzzle of this theme, so lessons stay data-only. */
const puzzleTasks = (theme: Theme) =>
  PUZZLES.filter((p) => p.theme === theme).map((p) =>
    task(`White to move. Find the ${THEME_NAMES[theme].toLowerCase()}!`, p.fen, { type: 'playMove', uci: [p.solution, ...(p.alts ?? [])] }, HINTS[theme], { success: p.explain }),
  );

export const lessons = [
  lesson('tactic-1', S, 'The Fork', 'A fork is one piece attacking two enemy pieces at once. The enemy can only save one.', [
    nar('A tactic is a short trick that wins material. The fork is the most common one. One piece attacks two targets at the same time.'),
    ...puzzleTasks('fork'),
    choice('Which piece forks best?', ['The knight, because it jumps', 'The pawn only', 'The king'], 0, 'Knights can attack kings and queens at once, and cannot be blocked.'),
  ], { mode: 'full', mnemonic: 'One piece, two targets.', cards: ['card-fork'] }),

  lesson('tactic-2', S, 'The Pin', 'A pinned piece cannot move without exposing a more valuable piece behind it.', [
    nar('A pin attacks a piece that has something important behind it. If the pinned piece moves, you capture what was behind it. If the king is behind it, the piece cannot move at all.'),
    ...puzzleTasks('pin'),
    tf('A piece pinned against its king may move to any square.', false, 'It may not leave the line. Doing so would expose the king to check.'),
  ], { mode: 'full', mnemonic: 'Pinned: it cannot leave the line.', cards: ['card-pin-def', 'card-pin'] }),

  lesson('tactic-3', S, 'The Skewer', 'A skewer attacks a valuable piece, and when it moves away, you capture the piece behind it.', [
    nar('A skewer is a pin in reverse. You attack the BIG piece first. It must move, and you take the piece behind it.'),
    ...puzzleTasks('skewer'),
    choice('In a skewer, which piece is attacked first?', ['The more valuable one', 'The pawn', 'The less valuable one'], 0, 'The valuable piece must run, so you win what stands behind it.'),
  ], { mode: 'full', mnemonic: 'Skewer: big piece first, win the one behind.', cards: ['card-skewer'] }),

  lesson('tactic-4', S, 'Double Attack', 'A double attack makes two threats with one move. A check plus an attack is very strong.', [
    nar('A double attack is a move that makes two threats at once. The enemy cannot stop both. Check is the best partner for it.'),
    ...puzzleTasks('double'),
    tf('A double attack that includes check is hard to defend.', true, 'The king must answer the check, so the second threat succeeds.'),
  ], { mode: 'full', mnemonic: 'Two threats. They stop one.' }),

  lesson('tactic-5', S, 'Discovered Attack', 'Move a piece out of the way, and a piece behind it attacks. The moved piece can make a threat too.', [
    nar('A discovered attack opens a line. You move one piece, and the piece behind it suddenly attacks! Two things happen at once.'),
    ...puzzleTasks('discovered'),
    choice('In a discovered attack, who makes the attack?', ['The piece that was behind', 'The piece that moved only', 'Nobody'], 0, 'The piece behind it is "discovered". The moved piece can also threaten something.'),
  ], { mode: 'full', mnemonic: 'Open the line. Two threats.' }),

  lesson('tactic-6', S, 'Removing the Defender', 'If a piece is protected by another piece, take or chase away the protector first.', [
    nar('Sometimes a piece is safe only because another piece protects it. Remove the protector, and the target falls.'),
    choice('A rook is protected only by a knight. You capture the knight with a pawn. What is next?', ['Take the rook for free', 'Nothing happens', 'The rook captures you'], 0, 'The defender is gone. The rook is now unprotected.'),
    tf('Before attacking a piece, count how many defenders it has.', true, 'Defenders decide if a capture wins or loses material.'),
  ], { mode: 'full', mnemonic: 'Take the guard. Win the piece.' }),
];

export const check = ruleCheck(S, 'Tactics', 'You can name and spot the main tactics.', [
  choice('One piece attacks two enemy pieces at once. This is a...', ['Fork', 'Pin', 'Stalemate'], 0, 'A fork.'),
  choice('A piece cannot move because a more valuable piece is behind it. This is a...', ['Pin', 'Fork', 'Skewer'], 0, 'A pin.'),
  choice('You attack a big piece. It moves, and you take the piece behind. This is a...', ['Skewer', 'Pin', 'Draw'], 0, 'A skewer.'),
  ...puzzleTasks('fork').slice(0, 1),
  ...puzzleTasks('skewer').slice(0, 1),
]);

export const bossLesson = boss(S, 'Tactics Boss', 'You can find tactics on the board.', [
  ...PUZZLES.map((p) =>
    task(`${THEME_NAMES[p.theme]}: White to move. Find the best move!`, p.fen, { type: 'playMove', uci: [p.solution, ...(p.alts ?? [])] }, HINTS[p.theme], { success: p.explain }),
  ),
], 'full', { three: 2, two: 5 });

export default stage(S, 11, 'Tactics Toolbox', 'Win material with tricks', '🧰', lessons, check, bossLesson);
