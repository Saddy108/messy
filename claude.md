# CLAUDE.md — "Pawn to King": The Chess Learning Web App

> Working title: **Pawn to King** (rename freely in `src/content/brand.ts`).
> This file is the single source of truth for this project. Read it fully before writing any code.

---

## 0. How Claude Code should work on this project

1. **Read this whole file first.** Then read `PROGRESS.md` and `DECISIONS.md` (create them if missing).
2. **Build in milestones** (see §13). Finish one milestone completely before starting the next.
3. After every milestone:
   - run `npm run lint`, `npm run test`, `npm run build` — all must pass;
   - update `PROGRESS.md` (what was done, what is next, known issues);
   - make a git commit with a clear message (`feat(m3): lesson engine + stage 1`).
4. **Never invent chess rules.** §5 (Rule Bible) is authoritative. It follows the official **FIDE Laws of Chess** (the rules used in the World Championship). If any rule is unclear, write a failing test first, then implement.
5. Make small product decisions yourself and log them in `DECISIONS.md` (date, decision, reason). Ask the user only about big product direction.
6. Keep all user-facing text in content files (`src/content/**`), never hard-coded inside components.
7. Prefer simple, readable code over clever code. Every module has a short header comment explaining its job.

---

## 1. Product vision

A **static web app** that takes a person with **zero chess knowledge** and turns them into someone who:

- knows **every rule** of chess, including the rare ones (castling conditions, en passant, promotion, all draw types);
- can **move every piece without thinking**;
- understands check, checkmate, stalemate and basic strategy;
- can read and write chess notation;
- feels **confident to start playing on chess.com** (or any online platform).

It is **a learning app first, a game app second.** It should feel like a fun video game tutorial: a guide at every step, instant feedback on every move, a journey map, rewards, and "just one more lesson" energy.

**The core promise:** *"Every mistake is explained. Every rule is practiced until remembered."*

---

## 2. Target learner

- Age 10+ to adult, total beginner. Has never touched a chess board.
- May not be a native English speaker → use **simple English**: short sentences (max ~18 words), common words, no jargon without a definition the first time it appears.
- Uses phone or laptop. **Mobile-first**, works perfectly on desktop too.
- Short sessions (5–15 minutes). Each lesson must be completable in **2–5 minutes**.

---

## 3. Learning design principles (non-negotiable)

These are what make the app "extraordinary" instead of just another chess site.

1. **Learn by doing, not reading.** Max 2 short sentences of text before the learner touches the board.
2. **One concept per lesson.** Never teach two new ideas at once.
3. **Guided simulator at every move.** The board always shows what is possible and explains what is not (§7).
4. **Every illegal move is a teaching moment.** Never just "Invalid move". Always say *why* (e.g. "Your king would be in check. That bishop is pinned.").
5. **Retrieval practice.** After learning, the learner must *recall* (quiz, find-all-moves, true/false on the board) — not just recognize.
6. **Spaced repetition.** Every rule becomes a review card that comes back after 1, 3, 7, 14, 30 days (§9.4).
7. **Interleaving.** Later lessons mix old pieces/rules with new ones.
8. **Mastery gating.** A stage unlocks only when the previous one is truly learned (§9.2).
9. **Memory hooks.** Every rule has a short mnemonic or story (e.g. "Light on the right", "Queen on her color", "Knight makes an L and always changes color").
10. **Immediate, kind feedback.** Celebrate success loudly; treat mistakes gently. No losing "lives" during lessons.
11. **Show, then guide, then test.** Every lesson follows: *Demo → Guided try → Independent try → Quick check.*

---

## 4. Tech stack & architecture

### 4.1 Stack
- **Vite + React 18 + TypeScript (strict mode)**.
- **Styling:** CSS Modules or Tailwind (choose one, log in `DECISIONS.md`). Use CSS variables for themes.
- **Animation:** Framer Motion (or CSS transitions for simple cases).
- **Rules engine:** [`chess.js`](https://github.com/jhlywa/chess.js) (BSD-2 licensed) wrapped in our own module. Never call chess.js directly from UI components.
- **Board:** our **own SVG board component** (full control for highlights, arrows, stars, ghost hands, animations). Do not depend on a third-party board.
- **Pieces:** an open-licensed SVG set (e.g. the "cburnett" set, CC BY-SA 3.0 — add attribution in an About page) OR our own original SVGs.
- **Sound:** generated with the Web Audio API (no licensing issues), or CC0 sound files.
- **Bot engine:** our own engine in a **Web Worker** (§8.3). Stockfish WASM is optional for the top levels later (note: GPL licence — log the decision).
- **Persistence:** `localStorage`, versioned schema with migrations. Export/Import progress as JSON.
- **Tests:** Vitest (unit), Playwright (end-to-end).
- **PWA:** service worker so the app works offline after first visit.
- **Output:** fully static `dist/` folder. Deployable to GitHub Pages / Netlify / Vercel. **No backend. No accounts. No tracking.**

### 4.2 Folder structure
```
src/
  app/                 # routing, layout, providers
  board/               # SVG board, pieces, highlights, arrows, drag & tap input
  chess/
    rules.ts           # wrapper around chess.js for full legal games
    sandbox.ts         # simplified move generator for lesson positions (see 4.3)
    explain.ts         # illegal-move explainer -> reason codes + messages
    notation.ts        # SAN helpers, notation trainer
    draws.ts           # repetition, 50/75-move, dead-position helpers
  engine/              # bot engine (web worker), evaluation, levels
  lessons/
    engine/            # lesson runner, step types, goal validators
    stages/            # stage-01-board.ts ... stage-13-online.ts (data only)
  review/              # spaced repetition cards + scheduler
  progress/            # XP, stars, streaks, badges, storage + migrations
  arena/               # practice games, mini-games, post-game review
  coach/               # coach character, hint system, narration bubbles
  content/             # all user-facing text, mnemonics, brand
  sound/
  ui/                  # shared components (buttons, modals, toasts, map)
tests/
  rules/               # one test file per rule area in §5
  e2e/
```

### 4.3 Two move systems (important)
- **Full rules (`rules.ts`)**: real chess positions with both kings, every FIDE rule enforced. Used in later stages and in the Arena.
- **Sandbox (`sandbox.ts`)**: for early lessons where the board has only one or a few pieces (e.g. "a rook alone collecting stars"). Pieces move by their normal pattern, blocking and capturing work, but kings/check are not required. chess.js cannot handle positions without kings, so this module is necessary.
- Each lesson declares which system it uses (`mode: 'sandbox' | 'full'`).

### 4.4 Lesson data format (data-driven, no lesson logic in components)
```ts
type Square = `${'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'}${1|2|3|4|5|6|7|8}`;

interface Lesson {
  id: string;                    // 'rook-1'
  stageId: string;               // 'stage-02'
  title: string;                 // 'The Rook: Straight Lines'
  takeaway: string;              // one sentence the learner must remember
  mnemonic?: string;             // 'Rooks roll on Roads (straight lines)'
  mode: 'sandbox' | 'full';
  steps: Step[];
  stars: { three: number; two: number }; // max mistakes allowed for 3★ / 2★
  reviewCards: string[];         // ids of spaced-repetition cards unlocked
}

type Step =
  | { kind: 'narrate'; text: string; fen?: string; highlight?: Square[]; arrows?: [Square, Square][] }
  | { kind: 'demo'; fen: string; moves: string[]; captions: string[] }         // auto-played with ghost hand
  | { kind: 'task'; fen: string; goal: Goal; hints: string[];
      opponent?: 'none' | 'scripted' | 'bot1'; scripted?: Record<string, string> }
  | { kind: 'quiz'; question: string; fen?: string;
      answer: QuizAnswer; explanation: string };                               // choice, true/false, tap squares

type Goal =
  | { type: 'collectStars'; stars: Square[]; maxMoves?: number }
  | { type: 'capture'; targets: Square[] }
  | { type: 'findAllMoves'; from: Square }          // tap every legal target square
  | { type: 'escapeCheck' }
  | { type: 'checkmate'; inMoves: number }
  | { type: 'castle'; side: 'king' | 'queen' }
  | { type: 'enPassant' }
  | { type: 'promote'; to?: 'q' | 'r' | 'b' | 'n' }
  | { type: 'survive'; plies: number }
  | { type: 'reachSquare'; square: Square }
  | { type: 'setupBoard' };                          // drag pieces to the start position
```
Every lesson file must be validated by a unit test (FENs legal for the chosen mode, goals reachable, hints present).

---

## 5. Chess Rule Bible (FIDE Laws of Chess)

Implement and teach **all** of these. Each bullet needs at least one unit test in `tests/rules/` and at least one lesson or quiz in the curriculum. Before finishing Milestone 2, check the current edition of the FIDE Laws of Chess at fide.com and note the edition in `DECISIONS.md`.

### 5.1 Board
- 8×8 board, 64 squares, alternating light and dark.
- Each player has a **light square in the right-hand corner** ("light on the right"). h1 is light, a1 is dark.
- **Files** = columns a–h (left to right from White's side). **Ranks** = rows 1–8 (White starts on 1–2, Black on 7–8). **Diagonals** = slanted lines of same-colored squares.
- Every square has a name: file + rank (e.g. e4).

### 5.2 Starting position
- White: rooks a1/h1, knights b1/g1, bishops c1/f1, **queen d1**, **king e1**, pawns on rank 2.
- Black mirrors: rooks a8/h8, knights b8/g8, bishops c8/f8, **queen d8**, **king e8**, pawns on rank 7.
- **Queen on her own color** (white queen on light d1, black queen on dark d8). Kings face each other on the e-file.
- Each side: 1 king, 1 queen, 2 rooks, 2 bishops, 2 knights, 8 pawns = 16 pieces.

### 5.3 Turns
- **White moves first.** Players alternate. Exactly one move per turn (castling counts as one move).
- **You cannot pass.** You must move, even if every move is bad.

### 5.4 How pieces move
- **King:** one square in any direction. Can never move to a square attacked by the opponent. The two kings can never stand next to each other.
- **Queen:** any number of squares straight (rank/file) or diagonally. Cannot jump.
- **Rook:** any number of squares along a rank or file. Cannot jump.
- **Bishop:** any number of squares diagonally. Cannot jump. **Stays on its starting color forever.**
- **Knight:** "L-shape" — two squares one way, then one square at a right angle. **The only piece that jumps over pieces.** Always lands on the opposite color.
- **Pawn:**
  - moves **forward one** square, only if that square is empty;
  - from its starting square it **may move two** squares forward if both squares are empty;
  - **captures one square diagonally forward** (never straight ahead);
  - never moves backward or sideways.
- **Capturing:** move onto a square with an enemy piece; that piece is removed. You can never capture your own piece. **The king is never captured** — the game ends with checkmate before that.

### 5.5 Special moves
- **Castling** (one move of king + rook):
  - King moves two squares toward a rook; that rook jumps to the square the king crossed.
  - Kingside: White K e1→g1, R h1→f1 (`O-O`). Queenside: K e1→c1, R a1→d1 (`O-O-O`). Same for Black on rank 8.
  - Allowed only if **all** are true: the king has never moved; that rook has never moved; all squares between them are empty; the king is **not in check now**; the king does **not pass through** an attacked square; the king does **not land on** an attacked square.
  - The **rook** may be attacked, and on the queenside the rook may pass through an attacked square (b1/b8) — castling is still legal.
  - Over the board, castling must be done by touching the king first (touch-move).
- **En passant:**
  - If a pawn moves two squares and lands right beside an enemy pawn, the enemy pawn may capture it **as if it had moved only one square**.
  - Allowed **only on the very next move**. If not done immediately, the right is gone forever.
  - Only pawns can capture en passant, and only pawns can be captured en passant.
- **Promotion:**
  - A pawn that reaches the last rank **must** be replaced by a queen, rook, bishop or knight of the same color (player's choice, not limited to captured pieces). Never a king, never stays a pawn.
  - Teach under-promotion (a knight that gives check; a rook/bishop to avoid stalemate).

### 5.6 Check
- **Check** = the king is attacked.
- You must get out of check immediately, in one of three ways: **move the king, capture the attacker, or block** the line.
  - A knight check or a pawn check cannot be blocked.
  - **Double check:** only a king move works.
- You may **never make a move that leaves or puts your own king in check.** A piece shielding its king from attack is **pinned** and may not leave that line.

### 5.7 How a game ends
- **Win:**
  - **Checkmate:** king is in check and there is no legal move to escape. Game ends immediately.
  - **Resignation:** a player gives up.
  - **Time:** a player whose clock runs out loses — **unless** the opponent cannot checkmate by any possible series of legal moves; then it is a draw.
- **Draw:**
  - **Stalemate:** the player to move is **not in check** and has **no legal move**.
  - **Dead position / insufficient material:** no checkmate is possible for either side. Standard cases: K vs K; K+B vs K; K+N vs K; K+B vs K+B with bishops on the same color.
  - **Agreement:** both players agree.
  - **Threefold repetition:** the same position occurs 3 times (same player to move, same castling and en passant rights) → a player may **claim** a draw.
  - **Fivefold repetition:** same position 5 times → **automatic** draw.
  - **50-move rule:** 50 moves by each player with no pawn move and no capture → a player may **claim** a draw.
  - **75-move rule:** 75 moves by each player with no pawn move and no capture → **automatic** draw (unless the last move was checkmate).
- Implementation note: in the Arena, follow online-platform behaviour (auto-apply threefold and 50-move), but **teach** the official claim vs automatic difference in Stage 8.

### 5.8 Over-the-board conduct (taught, not enforced)
- **Touch-move:** touch your own piece → you must move it (if legal). Touch an enemy piece → you must capture it (if legal). Say "I adjust" (j'adoube) before straightening a piece.
- Move with one hand; press the clock with the same hand.
- An illegal move in a tournament is penalized (time added to the opponent; repeated illegal moves can lose the game).
- Online apps simply block illegal moves.

### 5.9 Notation (Standard Algebraic Notation)
- Piece letters: **K** king, **Q** queen, **R** rook, **B** bishop, **N** knight. Pawns have no letter.
- `Nf3` knight to f3; `e4` pawn to e4; `x` capture (`Bxc6`, pawn capture `exd5`); `+` check; `#` checkmate; `O-O` / `O-O-O` castling; `=Q` promotion (`e8=Q`).
- Disambiguation when two same pieces can reach a square: `Nbd2`, `R1e2`.
- Results: `1-0`, `0-1`, `½-½`. Annotation symbols: `!`, `?`, `!!`, `??`.

### 5.10 Time controls (overview)
- Classical (long), Rapid (FIDE: more than 10 and less than 60 minutes per player), Blitz (10 minutes or less per player), Bullet (online term, under 3 minutes).
- Increment (e.g. 10+5 = 10 minutes + 5 seconds added per move).

---

## 6. Curriculum — the Journey

A visual **journey map** with 13 stages ("islands" / "kingdoms"). Each stage = 4–8 lessons + a **Rule Check** quiz + a **Boss Challenge**. Each lesson follows *Demo → Guided try → Independent try → Quick check.*

### Stage 1 — The Battlefield (the board)
- Lessons: 64 squares; light & dark; "light on the right" (rotate-the-board mini-game: tap the correct corner); files, ranks, diagonals; square names.
- Mini-game **Coordinate Rush**: a square name appears, tap it fast (30-second rounds, from White's and Black's view).
- Boss: name 15 squares in 45 seconds with ≥ 80% accuracy.

### Stage 2 — Meet the Army (piece movement) — the heart of the app
One sub-chapter per piece in this order: **Rook → Bishop → Queen → King → Knight → Pawn** (simple lines first, special pieces last).
For **each** piece:
1. Character intro: name, look, value, a one-line story + mnemonic.
2. Demo: ghost hand shows all moves; legal squares glow.
3. **Star collecting** puzzles (sandbox): collect all stars in minimum moves (3–5 puzzles, increasing difficulty, with blockers).
4. **Find All Moves**: tap every square the piece can reach (with own/enemy blockers).
5. **Capture** puzzles: take the enemy pieces without being captured.
6. Mixed review with previously learned pieces (interleaving).
- Pawn chapter must cover: one step, two steps from start, blocked straight ahead, diagonal capture, no backward moves. (Promotion and en passant come in Stage 7 — tease them here.)
- Mini-games unlocked here: **Knight Jumper** (reach a square in the fewest jumps), **Pawn Wars** (pawns only; first to reach the last rank wins).
- Boss: a mixed puzzle set with all six pieces.

### Stage 3 — Setting Up the Game
- Drag-and-drop the full starting position (`setupBoard` goal) with hints: rooks in corners, knights next, bishops next, queen on her color, king last.
- White moves first. Turn alternation. No passing.
- Boss: set up the board from empty in under 60 seconds, from both sides.

### Stage 4 — Capture, Value & Safety
- Piece values: pawn 1, knight 3, bishop 3, rook 5, queen 9, king = priceless.
- Good trade vs bad trade quizzes.
- **Hanging pieces:** spot undefended enemy pieces; protect your own.
- Attackers vs defenders counting.
- Mini-game **Safe or Hanging?**: tap pieces that can be taken for free.

### Stage 5 — Check!
- What check is; spot the check (which piece gives it).
- The three escapes: **Move, Capture, Block** (one lesson each, then mixed).
- Knight and pawn checks cannot be blocked. Double check → king must move.
- The king cannot walk into check. Kings can never touch.
- **Pins:** a pinned piece cannot move off the line. (The illegal-move explainer shines here.)
- Boss: escape 10 checks, choosing the best escape.

### Stage 6 — Checkmate
- Check vs checkmate vs safe — sorting quiz.
- Mate in 1 patterns: back-rank mate, queen + king mate, two-rook "ladder" mate, smothered mate (intro).
- Basic mates vs lone king: **K+Q vs K**, **K+2R vs K**, **K+R vs K** (guided with arrows, then solo against a defending bot).
- Boss: mate-in-1 marathon (10 puzzles) + K+Q vs K solo.

### Stage 7 — Special Moves
- **Castling:** kingside, queenside, then one lesson per forbidden condition (king moved, rook moved, pieces in between, in check, passing through check, landing in check) + "rook attacked is OK" surprise lesson. Quiz: "Can White castle here? Which side?"
- **En passant:** demo, timing ("now or never"), quiz "Is en passant possible right now?"
- **Promotion:** promote to queen; under-promotion to knight (check/fork); avoid stalemate by choosing a rook.
- Boss: mixed special-move scenarios.

### Stage 8 — Draws (Not Every Game Has a Winner)
- Stalemate (and how winners accidentally stalemate — practice avoiding it).
- Insufficient material (sorting game: "Can anyone still win?").
- Threefold / fivefold repetition, 50-move / 75-move rules (claim vs automatic), draw by agreement, time-out vs insufficient material.
- Quiz **Win, Lose or Draw?**: 20 final positions.

### Stage 9 — Speak Chess (Notation)
- Read notation: board plays a move, learner picks the correct SAN; then learner plays the move shown in SAN.
- Write notation: learner types the SAN of a shown move.
- Replay a short classic game move by move from notation (e.g. Morphy's "Opera Game", 1858) with commentary.
- Boss: notation drill, 15 moves, ≥ 85% accuracy.

### Stage 10 — Smart Openings
- Principles: control the center, develop knights and bishops, castle early, don't bring the queen out early, connect the rooks, don't move the same piece twice without reason.
- Defend against Scholar's Mate and other early traps.
- Play the first 10 moves vs a bot with coach feedback on each principle.

### Stage 11 — Tactics Toolbox
- Fork, pin, skewer, discovered attack, double attack, removing the defender.
- Each: concept demo → 5 puzzles → mixed set.
- **Daily Puzzle** source (deterministic by date, works offline).

### Stage 12 — Endgame Basics
- King becomes a fighter. Opposition. Rule of the square. Escorting a pawn to promotion.
- Review of K+Q and K+R mates under time pressure.

### Stage 13 — Ready for Online Chess (Graduation)
- Clocks and time controls; increments; flagging.
- Online etiquette and features explained generically (premoves, draw offers, resign, rematch, ratings, fair play). Use a **generic** mock interface — no third-party logos or branding.
- Touch-move and over-the-board conduct.
- **Final Rules Exam:** 40 questions covering every rule in §5 (board positions + text). Pass mark 85%.
- On pass: an in-app **"Ready to Play" certificate** (printable, with the learner's chosen name, date and stats) + suggestion to play rapid games (10+ minutes) as a first step online.

---

## 7. The Guided Simulator (the coach system)

This is the feature that makes the app special. It runs in lessons and in "Guided" Arena mode.

### 7.1 Board guidance
- Tap/hover a piece → all **legal destination squares** glow (dots for moves, rings for captures).
- **Attacked squares overlay** (toggle): shows squares the opponent controls — essential for king safety and castling lessons.
- **Arrows** for demos, threats and hints. **Ghost hand** animation for demo moves.
- **Check indicator:** king square pulses red; the checking piece and its line are highlighted.
- **Pin indicator:** when a pinned piece is selected, show the pin line and a lock icon.
- Coordinates always visible in Stages 1–9 (optional later).

### 7.2 Illegal-move explainer (`chess/explain.ts`)
Every rejected move returns a **reason code** and a friendly message. Minimum codes:
```
NOT_YOUR_TURN, NOT_YOUR_PIECE, CANNOT_MOVE_LIKE_THAT, PATH_BLOCKED,
OWN_PIECE_ON_TARGET, KING_INTO_CHECK, KINGS_CANNOT_TOUCH,
PIECE_IS_PINNED, MUST_ESCAPE_CHECK, DOUBLE_CHECK_KING_MUST_MOVE,
PAWN_NO_BACKWARD, PAWN_CAPTURES_DIAGONALLY, PAWN_BLOCKED,
PAWN_DOUBLE_STEP_ONLY_FROM_START, EN_PASSANT_EXPIRED,
CASTLE_KING_MOVED, CASTLE_ROOK_MOVED, CASTLE_PATH_BLOCKED,
CASTLE_IN_CHECK, CASTLE_THROUGH_CHECK, CASTLE_INTO_CHECK
```
Each message: what happened + the rule + a tiny tip. Example: *"Your king would walk into the bishop's line. A king can never move into check. Try a square the bishop does not reach."* Show the relevant attack line on the board while the message is visible. Every code needs a unit test.

### 7.3 Coach character
- An **original** mascot (e.g. a friendly little pawn called "Pip" who promotes to a queen at graduation). Never use existing characters.
- Speaks in short speech bubbles. Tones: encouraging, curious, celebratory. Never sarcastic.
- **Hint ladder** (3 levels): 1) a question ("What is attacking your king?"), 2) highlight the piece/area, 3) show the arrow of the answer. Using hints reduces stars, never blocks progress.

### 7.4 Move commentary (Arena Guided mode)
After each learner move, one line of feedback when useful: "Good — you developed a knight." / "Careful: your queen can be captured on d5." Before the bot moves, optionally warn about **hanging pieces** and **mate threats** (toggle).

---

## 8. Practice Arena

### 8.1 Bots
8 bot levels with original names and personalities (e.g. "Sleepy Snail" → "Iron Owl"). Level 1 must be beatable by someone who just finished Stage 6.

| Level | Behaviour |
|---|---|
| 1 | Random legal moves, prefers captures |
| 2 | Greedy: best immediate material gain, otherwise random |
| 3 | Depth 2 search, 25% chance of a weaker move |
| 4 | Depth 3, basic positional evaluation |
| 5 | Depth 3–4 + quiescence |
| 6 | Depth 4–5, iterative deepening, time-limited |
| 7 | Stronger: deeper search, opening book (small, built-in) |
| 8 | Strongest available (optionally Stockfish WASM, decided later) |

### 8.2 Modes
- **Guided:** unlimited undo, hints, threat warnings, move commentary (§7.4).
- **Normal:** 3 undos, hints on request.
- **Challenge:** no undo, no hints, optional clock.
- **Start from a lesson position** (e.g. practice K+R vs K).

### 8.3 Engine (`src/engine/`, in a Web Worker)
- Negamax with alpha-beta, iterative deepening, move ordering (MVV-LVA captures first), quiescence search.
- Evaluation: material + piece-square tables (simple, well-known approach) + king safety basics.
- Never blocks the UI. Hard time limit per move (e.g. 1.5 s max).
- All draw rules from §5.7 applied in Arena games.

### 8.4 Post-game review
- Move list with simple labels: **Great / Good / Inaccuracy / Mistake / Blunder** based on evaluation drop.
- Plain-English reason for each mistake: "left the knight undefended", "missed mate in 1", "missed a free capture".
- "Try again from here" button on any mistake.

### 8.5 Mini-games (fun + learning)
Pawn Wars, Knight Jumper, Coordinate Rush, Safe or Hanging?, Win-Lose-or-Draw?, Mate-in-1 Marathon, Notation Sprint. Each has a personal best and gives XP.

---

## 9. Engagement & motivation system ("healthy addictive")

### 9.1 Rewards
- **XP** for lessons, reviews, mini-games and games. **Stars (1–3)** per lesson based on mistakes and hints.
- **Ranks** (in-app only, not real FIDE titles): Pawn → Knight → Bishop → Rook → Queen → King.
- **Badges** for milestones (e.g. "First Checkmate", "Castling Master", "En Passant Ninja", "7-day streak", "No-hint stage").
- Big, satisfying feedback: confetti on stage clear, piece-specific sounds, combo counter in timed games.

### 9.2 Mastery gates
- Next lesson unlocks when the current one is completed.
- Next stage unlocks when **all lessons have ≥ 2 stars** and the **Boss is passed**.
- Optional "Test out" for learners who already know some chess (pass the stage's Rule Check at ≥ 90%).

### 9.3 Streaks & daily goal
- Daily goal options: 5 / 10 / 15 minutes. Streak counter with one free "streak freeze" per week.
- **Daily Mix:** due review cards + 1 daily puzzle + 1 mini-game. Works offline.

### 9.4 Spaced repetition (`src/review/`)
- Every rule and key fact is a **review card** (board-based where possible: "Can White castle kingside here?", "Tap all squares this knight can reach").
- Leitner boxes with intervals **0, 1, 3, 7, 14, 30 days**. Correct → next box; wrong → box 1 with an explanation.
- "Weak rules" screen lists the cards the learner misses most, with a one-tap practice session.

### 9.5 Respect the learner
- No dark patterns, no guilt messages, no fake urgency. After ~20 minutes, the coach suggests a break ("Great session! Your brain remembers more after a rest.").

---

## 10. Visual, sound & UX design

- **Distinctive, warm, game-like look** — not a generic dashboard. Journey map with illustrated stage islands, smooth transitions, playful but clean.
- Board themes: at least 3 (classic wood, calm green, high-contrast). Light/dark app theme via CSS variables, respects `prefers-color-scheme`.
- Board sizes to fit the screen; on phones the board takes the full width with a 16px margin.
- Input: **tap-tap and drag-and-drop** both supported, plus keyboard input (type `e2e4` or SAN).
- Board flips for Black-side lessons; always clear whose turn it is.
- Animations 150–300 ms; respect `prefers-reduced-motion`.
- Sounds: move, capture, check, castle, promote, success, error (soft, not harsh). Mute toggle, remembered.
- Lesson screen layout: coach bubble (top), board (center), goal + progress + hint button (bottom).

---

## 11. Accessibility, performance & quality bars

- WCAG 2.1 AA contrast. Never rely on color alone (use icons/patterns for highlights).
- Screen reader: an ARIA live region announces moves in plain words ("White knight from g1 to f3, check").
- Full keyboard navigation of the board and all menus. Visible focus states.
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 on mobile.
- Initial JS bundle ≤ 250 KB gzipped (lazy-load stages, engine and mini-games).
- Works offline after first load (PWA). Tested on latest Chrome, Safari (iOS), Firefox, Edge.

---

## 12. Data & storage

- `localStorage` key `p2k:v1` holding: profile (display name, settings), lesson progress and stars, XP, badges, streak data, review cards state, arena stats, mini-game bests.
- Versioned schema with a `migrate()` function and unit tests for each migration.
- Settings page: export progress (download JSON), import progress, reset progress (with confirmation).
- All storage access wrapped in try/catch; the app must still run if storage is blocked.

---

## 13. Milestones (build in this order)

**M1 — Foundation**
Vite + React + TS strict, lint/format, Vitest, Playwright, folder structure, routing (Home/Map, Lesson, Arena, Review, Profile, Settings), theme system. SVG board with pieces, tap + drag input, highlights, arrows, flip, coordinates, animations.
*Done when:* a static board demo page works on mobile and desktop.

**M2 — Rules core**
`rules.ts` wrapper, `sandbox.ts`, `explain.ts` with every reason code, `notation.ts`, `draws.ts`. Unit tests for **every bullet in §5**.
*Done when:* all rule tests pass, including edge cases (castling through attack, en passant timing, pins, double check, under-promotion, stalemate, all draw types).

**M3 — Lesson engine + Stages 1–2**
Lesson runner, all step and goal types, star scoring, hint ladder, coach bubble, lesson validation tests. Full content for Stages 1 and 2.
*Done when:* a new learner can go from zero to moving all six pieces, with a Playwright test covering one full lesson.

**M4 — Stages 3–6**
Setup, capture & value, check, checkmate (incl. basic mates against a defending bot level 1).

**M5 — Engagement layer**
Journey map, XP, ranks, badges, streaks, daily goal, mastery gates, spaced repetition + review screen, sounds, celebrations.

**M6 — Stages 7–13**
Special moves, draws, notation, openings, tactics, endgames, online-ready + Final Exam + certificate.

**M7 — Practice Arena**
Engine worker, 8 bots, Guided/Normal/Challenge modes, post-game review, mini-games.

**M8 — Polish & ship**
PWA/offline, accessibility audit, Lighthouse pass, performance budget, About/credits page (licences), README with deploy steps (GitHub Pages workflow).

---

## 14. Testing strategy

- **Rules:** one test file per area (`board`, `movement`, `castling`, `en-passant`, `promotion`, `check`, `checkmate`, `draws`, `notation`, `explain`). Use FEN positions in tests.
- **Lessons:** an automated test loads every lesson file and checks: valid FENs for its mode, goals are achievable (solve with a simple search where possible), hints exist, text length limits respected.
- **Engine:** finds mate in 1 and mate in 2 test positions; never returns an illegal move; respects time limit.
- **E2E (Playwright):** first-time user journey (Stage 1 lesson 1 → complete), castling lesson, an Arena game vs Level 1 to checkmate (scripted), progress persists after reload, offline load.

---

## 15. Conventions & "don'ts"

- TypeScript strict; no `any` without a comment explaining why.
- Components are small; logic lives in `chess/`, `lessons/engine/`, `progress/`, `review/`.
- All text in `src/content/` (ready for translation later).
- **Don't** use copyrighted characters, brand names, logos or third-party UI copies. The online-chess section uses generic mock screens.
- **Don't** add a backend, login, analytics or ads.
- **Don't** skip a rule from §5 because it is rare. Rare rules are exactly what this app must teach.
- **Don't** show a raw "illegal move" without an explanation.

---

## 16. Definition of done (whole project)

- A complete beginner can open the site, finish all 13 stages and pass the Final Rules Exam without any outside help.
- Every rule in §5 is (a) implemented, (b) tested, (c) taught in a lesson, (d) reviewed by spaced repetition.
- Every illegal move in the app is explained.
- The app is fast, offline-capable, accessible and works great on a phone.
- `README.md` explains how to run, test, build and deploy.