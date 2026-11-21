// Stage 2 — Meet the Army: how every piece moves (sandbox mode). Rook, Bishop, Queen, King, Knight, Pawn.
import { boss, choice, demo, lesson, nar, only, ruleCheck, stage, tap, task, tf } from './helpers';

const S = 'stage-02';
const H = (a: string, b?: string) => [a, b ?? 'Look at the glowing squares when you tap a piece.'];

export const lessons = [
  // ---------------- ROOK ----------------
  lesson('rook-1', S, 'The Rook: Straight Lines', 'The rook moves any number of squares in a straight line: up, down, left or right.', [
    nar('Meet the ROOK. It looks like a castle tower. It is worth 5 points, a strong piece!', { fen: only('R', 'd4') }),
    nar('Story: the rook guards the castle corners and rolls along straight roads. It cannot turn corners in one move.', { fen: only('R', 'd4'), highlight: ['d1', 'd2', 'd3', 'd5', 'd6', 'd7', 'd8', 'a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'h4'] }),
    demo(only('R', 'd4'), ['d4d8', 'd8h8', 'h8h1', 'h1a1'], ['The rook slides up the file.', 'Then it slides along the rank.', 'Down the whole board!', 'And back to the corner.', 'Straight lines only. Now you try!']),
    task('Tap every square the rook can move to.', '8/8/8/8/1P6/8/1R1P4/8 w - - 0 1', { type: 'findAllMoves', from: 'b2' }, H('Your own pawns block the way.', 'The rook cannot jump over or land on its own pieces.')),
    task('Tap every square the rook can reach. It may capture the black pawn.', '8/8/3P4/8/3R2p1/8/8/8 w - - 0 1', { type: 'findAllMoves', from: 'd4' }, H('Rooks capture by landing on enemy pieces.', 'It stops at the first piece in each direction.')),
    choice('How does a rook move?', ['In straight lines', 'In diagonals', 'In an L shape'], 0, 'Rooks roll on straight roads: up, down, left and right.'),
  ], { mnemonic: 'Rooks roll on straight roads.', cards: ['card-rook-moves'] }),

  lesson('rook-2', S, 'The Rook: Practice', 'A rook is blocked by pieces in its way, but can capture enemy pieces.', [
    task('Collect both stars with the rook. Use as few moves as you can!', '8/8/8/8/8/8/8/R7 w - - 0 1', { type: 'collectStars', stars: ['a8', 'h8'], maxMoves: 3 }, H('Go up first, then sideways.')),
    task('Collect all three stars.', '8/8/8/8/3R4/8/8/8 w - - 0 1', { type: 'collectStars', stars: ['h4', 'h1', 'a1'] }, H('Each star is in line with the next one.')),
    task('Your own pawn blocks the road. Find a way to both stars!', '8/8/8/8/8/8/8/R2P4 w - - 0 1', { type: 'collectStars', stars: ['e5', 'e1'] }, H('You cannot jump over the pawn. Go up and around.')),
    task('Capture both black pawns with the rook.', '8/8/8/3p3p/8/8/8/3R4 w - - 0 1', { type: 'capture', targets: ['d5', 'h5'] }, H('Capture the closest one first.')),
    tf('A rook can jump over other pieces.', false, 'Only the knight can jump. The rook must stop in front of any piece.'),
  ], { cards: ['card-rook-moves'] }),

  // ---------------- BISHOP ----------------
  lesson('bishop-1', S, 'The Bishop: Diagonals', 'The bishop moves any number of squares diagonally and always stays on the same color.', [
    nar('Meet the BISHOP. It has a pointed hat. It is worth 3 points.', { fen: only('B', 'd4') }),
    nar('The bishop slides on diagonals. It starts on one color and stays on that color for the whole game!', { fen: only('B', 'd4'), highlight: ['a1', 'b2', 'c3', 'e5', 'f6', 'g7', 'h8', 'a7', 'b6', 'c5', 'e3', 'f2', 'g1'] }),
    demo(only('B', 'c1'), ['c1h6', 'h6e3', 'e3a7', 'a7b8'], ['The bishop slides along a diagonal.', 'It can turn, but only onto another diagonal.', 'Always the same color of square.', 'Diagonals only!', 'Now you try!']),
    task('Tap every square the bishop can move to.', '8/8/8/8/8/4P3/8/2B5 w - - 0 1', { type: 'findAllMoves', from: 'c1' }, H('The pawn on e3 is in the way.')),
    task('Tap every square the bishop can reach. It may capture the black pawn.', '8/8/8/2P1P3/3B4/4p3/8/8 w - - 0 1', { type: 'findAllMoves', from: 'd4' }, H('Two of the diagonals are blocked by white pawns.')),
    tf('A bishop that starts on a light square can later stand on a dark square.', false, 'A bishop never changes color. That is why each side has one light-square and one dark-square bishop.'),
  ], { mnemonic: 'Bishops slide on diagonals and keep their color.', cards: ['card-bishop-moves', 'card-bishop-color'] }),

  lesson('bishop-2', S, 'The Bishop: Practice', 'Bishops can only reach squares of their own color.', [
    task('Collect both stars with the bishop.', '8/8/8/8/8/8/8/2B5 w - - 0 1', { type: 'collectStars', stars: ['f4', 'h6'], maxMoves: 3 }, H('Both stars are on one diagonal.')),
    task('Collect both stars. The pawn blocks one diagonal.', '8/8/8/8/8/8/3P4/2B5 w - - 0 1', { type: 'collectStars', stars: ['a3', 'c5'] }, H('Go to the corner side first.')),
    task('Capture both black pawns.', '8/2p5/8/8/5p2/8/8/2B5 w - - 0 1', { type: 'capture', targets: ['f4', 'c7'] }, H('The second pawn is on a diagonal from the first.')),
    choice('The bishop is on a dark square. Which star can it never reach?', ['a dark-square star', 'a light-square star'], 1, 'Bishops stay on their own color. A light square is out of reach for a dark-square bishop.', only('B', 'c1')),
  ], { cards: ['card-bishop-color'] }),

  // ---------------- QUEEN ----------------
  lesson('queen-1', S, 'The Queen: Power Piece', 'The queen moves like a rook and a bishop together. She is the strongest piece.', [
    nar('Meet the QUEEN. She is worth 9 points: the most powerful piece!', { fen: only('Q', 'd4') }),
    nar('She moves in straight lines AND diagonals, any distance. Rook powers plus bishop powers!', { fen: only('Q', 'd4'), highlight: ['d8', 'd1', 'a4', 'h4', 'a1', 'h8', 'g1', 'a7'] }),
    demo(only('Q', 'd4'), ['d4d8', 'd8h4', 'h4a4', 'a4e8'], ['Up like a rook.', 'Diagonal like a bishop.', 'Sideways like a rook.', 'Diagonal again. She cannot jump, though.', 'Great! Now you try.']),
    task('Tap every square the queen can move to.', '8/8/8/8/8/P1P5/8/Q1P5 w - - 0 1', { type: 'findAllMoves', from: 'a1' }, H('Your pawns block almost every direction.')),
    choice('The queen can move like...', ['a rook only', 'a bishop only', 'a rook and a bishop together'], 2, 'Straight lines plus diagonals: the queen is the strongest piece.'),
  ], { mnemonic: 'The queen = rook + bishop.', cards: ['card-queen-moves'] }),

  lesson('queen-2', S, 'The Queen: Practice', 'The queen cannot jump. Look at what blocks her.', [
    task('Collect both stars with the queen. Fewest moves wins!', '8/8/8/8/8/8/8/Q7 w - - 0 1', { type: 'collectStars', stars: ['h8', 'h1'], maxMoves: 3 }, H('Use the long diagonal first.')),
    task('The pawn blocks the diagonal. Collect both stars!', '8/8/8/8/8/8/1P6/Q7 w - - 0 1', { type: 'collectStars', stars: ['h8', 'a8'] }, H('Straight lines work too.')),
    task('Capture both black pawns.', '8/8/8/8/p5p1/8/8/3Q4 w - - 0 1', { type: 'capture', targets: ['a4', 'g4'] }, H('The queen can capture the first pawn, then the second.')),
    tf('The queen can jump over pieces.', false, 'Only the knight jumps.'),
  ], { cards: ['card-queen-moves'] }),

  // ---------------- KING ----------------
  lesson('king-1', S, 'The King: One Step', 'The king moves one square in any direction. Protect him: if he is lost, the game is lost.', [
    nar('Meet the KING. He is the most important piece, so he has no point value: he is priceless!', { fen: only('K', 'e4') }),
    nar('The king moves just ONE square in any direction. Slow, but very important to protect.', { fen: only('K', 'e4'), highlight: ['d3', 'e3', 'f3', 'd4', 'f4', 'd5', 'e5', 'f5'] }),
    demo(only('K', 'e4'), ['e4e5', 'e5f6', 'f6g5', 'g5f4'], ['One step up.', 'One step diagonally.', 'One step diagonally again.', 'One step at a time. Your turn!']),
    task('Tap every square the king can move to.', only('K', 'e4'), { type: 'findAllMoves', from: 'e4' }, H('The king can go to all squares touching him.')),
    task('Tap every square the king can move to. He may capture the black pawn.', '8/8/8/8/8/8/1p6/K7 w - - 0 1', { type: 'findAllMoves', from: 'a1' }, H('He is in the corner, so he has fewer squares.')),
    tf('The king can move three squares at a time.', false, 'Just one square, in any direction. (Castling is a special move you learn later.)'),
  ], { mnemonic: 'The king takes one small step.', cards: ['card-king-moves'] }),

  lesson('king-2', S, 'The King: Practice', 'Even the king can capture enemy pieces, one step at a time.', [
    task('Walk the king to both stars.', '8/8/8/8/8/8/8/K7 w - - 0 1', { type: 'collectStars', stars: ['b2', 'c3'], maxMoves: 2 }, H('Move diagonally.')),
    task('Walk the king to all the stars.', '8/8/8/8/8/8/8/4K3 w - - 0 1', { type: 'collectStars', stars: ['e3', 'f3', 'g3'] }, H('One step at a time.')),
    task('Capture both black pawns with the king.', '8/8/4p3/3p4/3K4/8/8/8 w - - 0 1', { type: 'capture', targets: ['d5', 'e6'] }, H('Step onto the pawn to capture it.')),
    choice('Which piece has no point value because it can never be lost?', ['The queen', 'The king', 'The rook'], 1, 'If the king is trapped, the game is over. So he is priceless.'),
  ], { cards: ['card-king-moves'] }),

  // ---------------- KNIGHT ----------------
  lesson('knight-1', S, 'The Knight: The Jumper', 'The knight moves in an L shape, jumps over pieces, and always changes color.', [
    nar('Meet the KNIGHT. It looks like a horse. It is worth 3 points.', { fen: only('N', 'd4') }),
    nar('The knight moves in an L: two squares one way, then one square to the side. It is the ONLY piece that can jump over others!', { fen: only('N', 'd4'), highlight: ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'], arrows: [['d4', 'e6'], ['d4', 'b3']] }),
    demo(only('N', 'b1'), ['b1c3', 'c3e4', 'e4g5', 'g5f7'], ['Two up, one to the side: an L.', 'Another L.', 'And another.', 'Each jump lands on the other color. Your turn!']),
    task('Tap every square the knight can move to.', only('N', 'd4'), { type: 'findAllMoves', from: 'd4' }, H('Count two squares, then one to the side. Eight squares in total.', 'Look at all the L shapes around the knight.')),
    task('The knight is surrounded by pawns, but it can jump! Tap every square it can go to.', '8/8/8/8/8/8/PPPPPPPP/6N1 w - - 0 1', { type: 'findAllMoves', from: 'g1' }, H('Jumping over pieces is allowed. Only landing on your own piece is not.')),
    tf('A knight always lands on a square of the opposite color.', true, 'Light to dark, dark to light. Every jump changes the color.'),
  ], { mnemonic: 'Knights make an L and always change color.', cards: ['card-knight-moves', 'card-knight-color', 'card-knight-jump'] }),

  lesson('knight-2', S, 'The Knight: Practice', 'A knight can reach any square if you give it enough jumps.', [
    task('Jump the knight to d4 in two moves.', '8/8/8/8/8/8/8/6N1 w - - 0 1', { type: 'reachSquare', square: 'd4', maxMoves: 3 }, H('Think backwards: which squares reach d4?')),
    task('Knight Jumper: reach e6 from the corner in three jumps.', '8/8/8/8/8/8/8/N7 w - - 0 1', { type: 'reachSquare', square: 'e6', maxMoves: 4 }, H('Try b3, then c5.')),
    task('Capture both black pawns with the knight.', '8/p7/8/1p6/3N4/8/8/8 w - - 0 1', { type: 'capture', targets: ['b5', 'a7'] }, H('The knight jumps in an L to land on the pawn.')),
    task('Collect both stars with the knight.', '8/8/8/8/8/8/8/1N6 w - - 0 1', { type: 'collectStars', stars: ['c3', 'e4'] }, H('The second star is one L from the first.')),
  ], { cards: ['card-knight-moves'] }),

  // ---------------- PAWN ----------------
  lesson('pawn-1', S, 'The Pawn: Small but Mighty', 'A pawn walks straight forward, but captures diagonally. It never moves backward.', [
    nar('Meet the PAWN. It is the smallest piece, worth 1 point. Each side has eight of them.', { fen: only('P', 'e2') }),
    nar('A pawn moves forward one square. From its starting square it may go two squares. It never goes backward!', { fen: only('P', 'e2'), highlight: ['e3', 'e4'] }),
    demo('8/8/3p4/8/8/8/4P3/8 w - - 0 1', ['e2e4', 'e4e5', 'e5d6'], ['On its first move, a pawn can jump two squares.', 'After that: one step at a time.', 'But it CAPTURES diagonally, one square forward. Your turn!']),
    task('Tap every square the pawn can move to.', only('P', 'e2'), { type: 'findAllMoves', from: 'e2' }, H('First move: one or two squares forward.')),
    task('Tap every square this pawn can move to. It is not on its first move.', '8/8/8/8/8/4P3/8/8 w - - 0 1', { type: 'findAllMoves', from: 'e3' }, H('Only one step now.')),
    task('Tap every piece the pawn can capture. The queen blocks the way straight ahead.', '8/8/8/3pqp2/4P3/8/8/8 w - - 0 1', { type: 'findAllMoves', from: 'e4' }, H('Pawns capture diagonally, never straight ahead.')),
    tf('A pawn can move backward when it is in danger.', false, 'Pawns only go forward. Never backward or sideways.'),
    nar('Special pawn tricks are coming later: promotion (a pawn becomes a queen!) and en passant. Pip is very excited about promotion.'),
  ], { mnemonic: 'Pawns walk straight, but capture sideways (diagonally).', cards: ['card-pawn-first', 'card-pawn-capture', 'card-pawn-back', 'card-pawn-blocked'] }),

  lesson('pawn-2', S, 'The Pawn: Practice', 'Use the two-step start to move fast, and capture diagonally.', [
    task('Pawn Race: walk the pawn to a6 in 3 moves. Remember the double step!', '8/8/8/8/8/8/P7/8 w - - 0 1', { type: 'reachSquare', square: 'a6', maxMoves: 4 }, H('Your first move can be two squares.')),
    task('Capture both black pawns, one after the other.', '8/8/5p2/4p3/3P4/8/8/8 w - - 0 1', { type: 'capture', targets: ['e5', 'f6'] }, H('Capture diagonally forward, then again.')),
    task('Collect the stars with the pawn.', '8/8/8/8/8/8/4P3/8 w - - 0 1', { type: 'collectStars', stars: ['e4', 'e6'] }, H('Start with the double step.')),
    tf('A pawn can capture the piece directly in front of it.', false, 'A piece straight ahead BLOCKS a pawn. Captures are diagonal.'),
  ], { cards: ['card-pawn-capture', 'card-pawn-blocked'] }),

  // ---------------- MIX ----------------
  lesson('army-mix', S, 'The Whole Army', 'Six pieces, six different moves. Know them all!', [
    choice('Which piece is the only one that can jump over others?', ['Rook', 'Bishop', 'Knight', 'Queen'], 2, 'Only the knight jumps.'),
    choice('Which piece moves only one square in any direction?', ['Pawn', 'King', 'Queen'], 1, 'The king takes one small step.'),
    task('Use the rook and the knight: capture both black pawns.', '8/8/8/p7/8/5p2/8/R5N1 w - - 0 1', { type: 'capture', targets: ['a5', 'f3'] }, H('Each piece takes one pawn.')),
    task('Use the bishop and the queen: collect both stars.', '8/8/8/8/8/8/8/Q1B5 w - - 0 1', { type: 'collectStars', stars: ['h8', 'g5'] }, H('The queen reaches the long diagonal.')),
    tap('Tap all the squares the knight can reach.', only('N', 'e5'), ['c4', 'c6', 'd3', 'd7', 'f3', 'f7', 'g4', 'g6'], 'Eight L-shaped jumps.'),
    tf('The bishop can move like a rook.', false, 'The bishop uses diagonals. The queen is the one who does both.'),
  ], { cards: ['card-knight-jump', 'card-queen-moves'] }),
];

export const check = ruleCheck(S, 'Piece Movement', 'You know how all six pieces move.', [
  tap('Tap every square this rook can reach.', '8/8/3P4/8/3R2p1/8/8/8 w - - 0 1', ['d5', 'd3', 'd2', 'd1', 'c4', 'b4', 'a4', 'e4', 'f4', 'g4'], 'Straight lines, stopping before your own pawn and at the enemy pawn.'),
  tap('Tap every square this bishop can reach.', '8/8/8/8/8/4P3/8/2B5 w - - 0 1', ['d2', 'b2', 'a3'], 'Diagonals only, and the pawn blocks.'),
  tap('Tap every square the king can reach.', only('K', 'e4'), ['d3', 'e3', 'f3', 'd4', 'f4', 'd5', 'e5', 'f5'], 'One step, any direction.'),
  tap('Tap every square this knight can reach.', '8/8/8/8/8/8/PPPPPPPP/6N1 w - - 0 1', ['f3', 'h3'], 'It jumps over pieces, but not onto its own.'),
  tap('Tap every square the pawn can reach.', only('P', 'd2'), ['d3', 'd4'], 'One or two steps on its first move.'),
  tf('The queen moves like a rook and a bishop together.', true, 'Straight and diagonal lines.'),
  tf('A pawn captures straight ahead.', false, 'Pawns capture diagonally forward.'),
  choice('Which piece is worth 5 points?', ['Bishop', 'Rook', 'Queen'], 1, 'Pawn 1, knight 3, bishop 3, rook 5, queen 9.'),
], 'sandbox');

export const bossLesson = boss(S, 'The Mixed Army', 'You can move all six pieces without thinking.', [
  task('Rook: capture both pawns.', '8/8/8/3p3p/8/8/8/3R4 w - - 0 1', { type: 'capture', targets: ['d5', 'h5'] }, H('Straight lines.')),
  task('Bishop: collect both stars.', '8/8/8/8/8/8/3P4/2B5 w - - 0 1', { type: 'collectStars', stars: ['a3', 'c5'] }, H('Diagonals.')),
  task('Queen: capture both pawns.', '8/8/8/8/p5p1/8/8/3Q4 w - - 0 1', { type: 'capture', targets: ['a4', 'g4'] }, H('Lines and diagonals.')),
  task('Knight: reach e6 in four jumps.', '8/8/8/8/8/8/8/N7 w - - 0 1', { type: 'reachSquare', square: 'e6', maxMoves: 4 }, H('L shapes.')),
  task('King: capture both pawns.', '8/8/4p3/3p4/3K4/8/8/8 w - - 0 1', { type: 'capture', targets: ['d5', 'e6'] }, H('One step.')),
  task('Pawn: capture both pawns.', '8/8/5p2/4p3/3P4/8/8/8 w - - 0 1', { type: 'capture', targets: ['e5', 'f6'] }, H('Diagonal captures.')),
  tf('Only the knight can jump over other pieces.', true, 'All other pieces must go around.'),
], 'sandbox', { three: 2, two: 5 });

export default stage(S, 2, 'Meet the Army', 'How every piece moves', '⚔️', lessons, check, bossLesson);
