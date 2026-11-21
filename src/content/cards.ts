// The review-card bank: every rule in the Rule Bible becomes cards that come back by spaced repetition.
// The Final Rules Exam also draws from this bank (at least one card per rule area).
import { choice, only, tap, tf, typed } from '../lessons/stages/helpers';
import type { Square } from '../lessons/stages/helpers';
import type { ReviewCard, Step } from '../lessons/types';

const EMPTY = '8/8/8/8/8/8/8/8 w - - 0 1';
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const sqs = (...s: string[]) => s as Square[];

const c = (id: string, rule: string, step: Step): ReviewCard => {
  if (step.kind !== 'quiz') throw new Error('cards must be quizzes');
  return { id: `card-${id}`, rule, step };
};

export const RULE_AREAS = [
  'board', 'setup', 'turns', 'movement', 'capture', 'castling', 'en-passant', 'promotion', 'check', 'pins', 'checkmate',
  'stalemate', 'insufficient', 'repetition', 'fifty-move', 'time', 'agreement', 'touch-move', 'notation', 'values', 'safety', 'time-controls',
  'openings', 'tactics', 'endgame',
] as const;

export const CARDS: ReviewCard[] = [
  // ---- board ----
  c('board-64', 'board', choice('How many squares are on a chess board?', ['32', '64', '100'], 1, '8 rows times 8 columns makes 64.', EMPTY)),
  c('light-right', 'board', tap('Tap the corner on White\'s right-hand side.', EMPTY, sqs('h1'), 'Light on the right! h1 is a light square.')),
  c('file-rank', 'board', choice('A row of the board (side to side) is called a...', ['file', 'rank', 'diagonal'], 1, 'Ranks are rows (1 to 8). Files are columns (a to h).')),
  c('square-names', 'board', tap('Tap the square f6.', EMPTY, sqs('f6'), 'File f, rank 6.')),
  c('diagonal', 'board', tap('Tap every square on the diagonal from b1 to h7.', EMPTY, sqs('b1', 'c2', 'd3', 'e4', 'f5', 'g6', 'h7'), 'A diagonal goes one file and one rank at a time, and stays on one color.')),
  // ---- setup ----
  c('queen-color', 'setup', tf('The white queen starts on a dark square.', false, 'The queen stands on her own color: the white queen on the light d1.', START)),
  c('king-square', 'setup', choice('On which square does the white king start?', ['d1', 'e1', 'e2'], 1, 'The king starts on e1. The queen is on d1.', START)),
  c('piece-count', 'setup', choice('How many pieces does each player start with?', ['8', '12', '16'], 2, '1 king, 1 queen, 2 rooks, 2 bishops, 2 knights and 8 pawns make 16.', START)),
  // ---- turns ----
  c('white-first', 'turns', tf('Black makes the first move of the game.', false, 'White always moves first. Then the players take turns.', START)),
  c('no-pass', 'turns', tf('If you have no good move, you may skip your turn.', false, 'You cannot pass. You must make one move on every turn.')),
  // ---- movement ----
  c('rook-moves', 'movement', tap('Tap every square the white rook can reach. The white pawn blocks, the black pawn can be captured.', '8/8/3P4/8/3R2p1/8/8/8 w - - 0 1', sqs('d5', 'd3', 'd2', 'd1', 'c4', 'b4', 'a4', 'e4', 'f4', 'g4'), 'The rook slides straight. It stops before its own pawn (d6) and may capture the enemy pawn (g4).')),
  c('bishop-moves', 'movement', tap('Tap every square the white bishop on c1 can reach.', '8/8/8/8/8/4P3/8/2B5 w - - 0 1', sqs('d2', 'b2', 'a3'), 'The bishop slides diagonally. Its own pawn on e3 blocks the way.')),
  c('bishop-color', 'movement', tf('A bishop can move to a square of the other color.', false, 'A bishop stays on the color it started on, forever.')),
  c('queen-moves', 'movement', tf('The queen moves like a rook and a bishop together.', true, 'Straight lines and diagonals, any distance. She cannot jump.')),
  c('king-moves', 'movement', tap('Tap every square the king can move to.', only('K', 'e4'), sqs('d3', 'e3', 'f3', 'd4', 'f4', 'd5', 'e5', 'f5'), 'The king moves one square in any direction.')),
  c('knight-moves', 'movement', tap('Tap every square the white knight on g1 can move to.', START, sqs('f3', 'h3'), 'The knight jumps in an L. The square e2 holds its own pawn.')),
  c('knight-color', 'movement', tf('A knight always lands on a square of the opposite color.', true, 'Light to dark, dark to light. Every time.')),
  c('knight-jump', 'movement', tf('A knight cannot jump over other pieces.', false, 'The knight is the only piece that can jump over others.')),
  c('pawn-first', 'movement', tap('Tap every square this pawn can move to.', only('P', 'e2'), sqs('e3', 'e4'), 'On its first move, a pawn can go one or two squares forward.')),
  c('pawn-capture', 'movement', tap('Tap every piece the white pawn can capture.', '8/8/8/3pqp2/4P3/8/8/8 w - - 0 1', sqs('d5', 'f5'), 'A pawn captures diagonally forward. The queen in front blocks it. It cannot capture straight ahead.')),
  c('pawn-back', 'movement', tf('A pawn can move backward to retreat.', false, 'Pawns only move forward. They never go backward or sideways.')),
  c('pawn-blocked', 'movement', tf('A pawn can capture the piece straight in front of it.', false, 'Pawns walk straight but capture diagonally. A piece in front blocks the pawn.')),
  // ---- capture ----
  c('capture-own', 'capture', tf('You may capture your own pieces.', false, 'You can only capture enemy pieces.')),
  c('king-never-captured', 'capture', tf('The king is captured like any other piece.', false, 'The king is never captured. The game ends with checkmate before that.')),
  // ---- castling ----
  c('castle-squares', 'castling', choice('How many squares does the king move when castling?', ['1', '2', '3'], 1, 'The king moves two squares toward the rook. The rook jumps over to the other side.')),
  c('castle-rook-f1', 'castling', choice('White castles kingside. Where does the rook go?', ['f1', 'g1', 'e1'], 0, 'King e1 to g1, and the rook from h1 to f1.')),
  c('castle-moved', 'castling', tf('You can castle if your king moved earlier and came back.', false, 'The king must never have moved in the whole game.')),
  c('castle-in-check', 'castling', choice('Can White castle here?', ['Yes, kingside', 'Yes, queenside', 'No'], 2, 'The black rook gives check. You can never castle out of check.', 'r3k2r/8/8/8/8/8/4r3/R3K2R w KQ - 0 1')),
  c('castle-through', 'castling', choice('Which side can White castle here?', ['Kingside only', 'Queenside only', 'Both sides', 'Neither side'], 1, 'The black rook on f2 attacks f1, so the king cannot pass it. Queenside is fine.', '4k3/8/8/8/8/8/5r2/R3K2R w KQ - 0 1')),
  c('castle-rook-attacked', 'castling', tf('White can castle kingside here, even though the h1 rook is attacked.', true, 'Only the king\'s squares matter. The rook may be attacked.', '4k3/8/8/8/8/8/7r/R3K2R w KQ - 0 1')),
  c('castle-between', 'castling', choice('Can White castle queenside here?', ['Yes', 'No'], 1, 'The knight on b1 is between the king and the rook. All squares between them must be empty.', 'r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 0 1')),
  c('castle-b1', 'castling', tf('White can castle queenside here, even though b1 is attacked.', true, 'The rook may pass over an attacked b1 square. The king only crosses d1 and c1.', '4k3/8/8/8/8/8/1r6/R3K3 w Q - 0 1')),
  // ---- en passant ----
  c('ep-when', 'en-passant', choice('When can you capture en passant?', ['Any time later', 'Only on the very next move', 'Only with a knight'], 1, 'Now or never! The chance disappears after one move.')),
  c('ep-yes', 'en-passant', tf('White can capture en passant right now (e5 takes d6).', true, 'Black\'s pawn just moved two squares and landed next to the white pawn.', 'rnbqkbnr/1pp1pppp/p7/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3')),
  c('ep-expired', 'en-passant', tf('Black\'s d-pawn moved two squares a move ago, but White played something else. White can still capture en passant.', false, 'The right to capture en passant lasts for one move only.', 'rnbqkbnr/1pp1pppp/p7/3pP3/8/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 3')),
  // ---- promotion ----
  c('promo-must', 'promotion', tf('A pawn that reaches the last rank may stay a pawn.', false, 'It must become a queen, rook, bishop or knight.')),
  c('promo-choices', 'promotion', choice('A pawn can promote to which pieces?', ['Only a queen', 'Queen, rook, bishop or knight', 'Only pieces that were captured'], 1, 'You choose! It does not matter which pieces are on the board.')),
  c('underpromo', 'promotion', tf('Promoting to a knight can be better than promoting to a queen.', true, 'A knight can give check from a new angle, or help to avoid a stalemate.')),
  c('promo-stalemate', 'promotion', choice('White promotes the pawn on b7. Which choice avoids stalemate?', ['Queen', 'Rook'], 1, 'A queen on b8 would leave Black with no move and no check: stalemate. A rook keeps the game going.', '8/1P6/8/8/8/8/8/5K1k w - - 0 1')),
  // ---- check ----
  c('check-def', 'check', choice('What is check?', ['The king is attacked', 'A piece is captured', 'The game ends'], 0, 'Check means the king is attacked. You must stop it right now.')),
  c('escapes', 'check', choice('Which is NOT a way to escape check?', ['Move the king', 'Capture the attacker', 'Move a different piece somewhere else'], 2, 'You must move the king, capture the attacker, or block the line.')),
  c('knight-check', 'check', tf('You can block a check from a knight.', false, 'Knights jump. There is no line to block. Move the king or capture the knight.')),
  c('double-check', 'check', tf('In double check you can capture one of the attackers and be safe.', false, 'Two pieces attack at once. Only a king move works.')),
  c('into-check', 'check', tf('The king may move to a square attacked by the enemy.', false, 'The king can never move into check.')),
  c('kings-touch', 'check', tf('The two kings may stand on neighboring squares.', false, 'Kings can never touch. Each would attack the other.')),
  c('block-which', 'check', choice('White is in check from the rook on e4. Which move blocks the check?', ['Be3', 'Ra4', 'Bc3'], 0, 'The bishop on e3 stands between the rook and the king.', '4k3/8/8/8/4r3/8/3B4/R3K3 w - - 0 1')),
  // ---- pins ----
  c('pin', 'pins', tf('White\'s rook on e2 can move to d2.', false, 'The rook is pinned. If it leaves the e-file, the black rook would attack the king.', '4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1')),
  c('pin-slide', 'pins', tf('A pinned piece may still move along the pin line.', true, 'The rook may slide up and down the e-file. It still shields the king.', '4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1')),
  // ---- checkmate ----
  c('mate-def', 'checkmate', choice('Checkmate means the king is in check and...', ['has no legal way out', 'can capture the queen', 'it is the 50th move'], 0, 'No move, capture or block helps. The game is over.')),
  c('mate-or-not', 'checkmate', choice('Black to move. Is this checkmate?', ['Yes', 'No'], 0, 'The rook checks along the back rank, and the black pawns block the king\'s escape squares.', 'R5k1/5ppp/8/8/8/8/8/4K3 b - - 1 1')),
  // ---- stalemate ----
  c('stalemate', 'stalemate', choice('Black to move. What is the result?', ['Checkmate', 'Stalemate: a draw', 'Black wins'], 1, 'Black is not in check, but has no legal move. That is stalemate, a draw.', '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')),
  c('stalemate-def', 'stalemate', tf('In stalemate, the player to move is in check.', false, 'Stalemate means NOT in check and no legal move.')),
  // ---- insufficient ----
  c('insuf-kk', 'insufficient', choice('Can anyone still win this game?', ['Yes', 'No, it is a draw'], 1, 'Two bare kings can never checkmate.', '8/8/4k3/8/8/3K4/8/8 w - - 0 1')),
  c('insuf-kbk', 'insufficient', tf('King and bishop against a lone king is a draw by insufficient material.', true, 'One minor piece cannot force checkmate.', '8/8/4k3/8/8/3KB3/8/8 w - - 0 1')),
  c('insuf-kr', 'insufficient', choice('Can White still win?', ['Yes', 'No'], 0, 'King and rook can checkmate a lone king.', '8/8/4k3/8/8/3KR3/8/8 w - - 0 1')),
  // ---- repetition ----
  c('three-rep', 'repetition', choice('A threefold repetition happens when...', ['the same position occurs 3 times', 'a player checks 3 times', 'three pieces are captured'], 0, 'Same position, same player to move, same rights. A player may claim a draw.')),
  c('five-rep', 'repetition', choice('Fivefold repetition is...', ['a draw you must claim', 'an automatic draw'], 1, 'At five repetitions the game is drawn automatically.')),
  // ---- fifty-move ----
  c('fifty', 'fifty-move', choice('The 50-move rule counts moves without...', ['a pawn move or a capture', 'a check', 'castling'], 0, '50 moves by each player with no pawn move and no capture: a player may claim a draw.')),
  c('seventyfive', 'fifty-move', choice('The 75-move rule draw is...', ['claimed by a player', 'automatic'], 1, 'After 75 moves each without a pawn move or capture, the game is drawn automatically.')),
  // ---- time ----
  c('time-loss', 'time', tf('If your clock runs out you always lose.', false, 'If your opponent can never checkmate you, the game is a draw.')),
  // ---- agreement ----
  c('agreement', 'agreement', tf('Both players can agree to a draw.', true, 'A draw offer that is accepted ends the game.')),
  c('resign', 'agreement', tf('A player can resign to give up the game.', true, 'Resigning means you lose and your opponent wins.')),
  // ---- touch-move ----
  c('touch-move', 'touch-move', choice('Over the board, if you touch your own piece you must...', ['move it, if it has a legal move', 'put it back', 'resign'], 0, 'This is the touch-move rule. Say "I adjust" first if you only want to straighten a piece.')),
  c('jadoube', 'touch-move', tf('You should say "I adjust" before straightening a piece.', true, 'It tells your opponent you are not about to move it.')),
  // ---- notation ----
  c('san-piece', 'notation', choice('In notation, which letter is the knight?', ['K', 'N', 'P'], 1, 'K is the king, so the knight is N. Pawns have no letter.')),
  c('san-capture', 'notation', choice('What does Bxc6 mean?', ['A bishop captures on c6', 'A bishop moves to c6 and checks', 'Black castles'], 0, 'B is the bishop and x means capture.')),
  c('san-castle', 'notation', choice('What does O-O-O mean?', ['Kingside castling', 'Queenside castling', 'Three checks'], 1, 'Short castling is O-O. Long (queenside) castling is O-O-O.')),
  c('san-pawn', 'notation', typed('Type the notation for a pawn moving to e4.', undefined, ['e4'], 'Pawn moves have no letter: just the square, e4.')),
  c('san-promo', 'notation', choice('What does e8=Q mean?', ['A pawn promotes to a queen on e8', 'A queen moves to e8', 'A queen is captured'], 0, '= shows the promotion piece.')),
  c('san-marks', 'notation', choice('What does # mean after a move?', ['check', 'checkmate', 'a good move'], 1, '+ is check. # is checkmate.')),
  // ---- values ----
  c('values', 'values', choice('Which is worth more?', ['A rook', 'A bishop'], 0, 'Pawn 1, knight 3, bishop 3, rook 5, queen 9.')),
  c('queen-value', 'values', choice('How many pawns is a queen worth?', ['5', '9', '3'], 1, 'The queen is worth about 9 pawns.')),
  c('trade', 'values', choice('You trade your knight (3) for the enemy rook (5). Is this a good trade?', ['Yes', 'No'], 0, 'You win 2 points of material.')),
  // ---- safety ----
  c('hanging', 'safety', tap('Tap the black piece White can capture for free (it has no defender).', '4k3/8/8/3n4/8/8/8/3QK3 w - - 0 1', sqs('d5'), 'The knight on d5 is attacked by the queen and nothing protects it.')),
  c('defended', 'safety', choice('Is capturing the knight on d5 with the queen a good idea?', ['Yes, it is free', 'No, the pawn on c6 protects it'], 1, 'A queen (9) for a knight (3) is a bad trade.', '4k3/8/2p5/3n4/8/8/8/3QK3 w - - 0 1')),
  // ---- time controls ----
  c('increment', 'time-controls', choice('What does 10+5 mean?', ['10 minutes plus 5 seconds added each move', '10 moves in 5 minutes', '5 minutes plus 10 seconds'], 0, 'The second number is the increment: seconds you gain after each move.')),
  c('time-fast', 'time-controls', choice('Which time control is the fastest?', ['Bullet', 'Rapid', 'Classical'], 0, 'Bullet games are under 3 minutes. Classical games are long.')),
  // ---- openings ----
  c('open-principles', 'openings', choice('Which is a good opening principle?', ['Control the center', 'Bring the queen out early', 'Move the same piece again and again'], 0, 'Fight for the center, develop knights and bishops, castle early.')),
  c('castle-early', 'openings', tf('Castling early helps keep your king safe.', true, 'It tucks the king away and brings a rook into play.')),
  c('scholar', 'openings', choice('Scholar\'s Mate aims at which square?', ['f7', 'a2', 'e4'], 0, 'f7 is guarded only by the black king at the start. Watch out for it!')),
  // ---- tactics ----
  c('fork', 'tactics', choice('A fork is...', ['one piece attacking two things at once', 'a piece that cannot move', 'castling'], 0, 'The enemy can only save one of them.')),
  c('pin-def', 'tactics', choice('A pin is...', ['a piece that cannot move without exposing a more valuable piece', 'a captured pawn', 'a draw'], 0, 'The pinned piece is stuck in front of something more important.')),
  c('skewer', 'tactics', choice('A skewer is like a pin, but...', ['the more valuable piece is in front and must move', 'it only works with pawns', 'it ends the game'], 0, 'The valuable piece moves away, and you capture the piece behind it.')),
  // ---- endgame ----
  c('opposition', 'endgame', choice('In a king and pawn endgame, the opposition means...', ['the kings face each other with one square between, and the other side must give way', 'trading queens', 'castling'], 0, 'The player who has to move must step aside. That helps the other king advance.')),
  c('square-rule', 'endgame', choice('The rule of the square tells you...', ['if a king can catch a passed pawn', 'who moves first', 'how to castle'], 0, 'Draw a square from the pawn to the last rank. If the king can step inside it, the king catches the pawn.')),
];

export const cardById = (id: string): ReviewCard | undefined => CARDS.find((x) => x.id === id);
