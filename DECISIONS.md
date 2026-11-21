# DECISIONS

Small product and technical decisions, with the reason. Newest at the bottom.

| Decision | Reason |
|---|---|
| **FIDE Laws of Chess edition: the 2023 edition (in force from 1 January 2023).** Re-check fide.com before a public release; FIDE revises the Laws about every four years. | The rules in `tests/rules/` follow this edition: touch-move, 75-move and fivefold automatic draws, dead position, castling conditions, time-out vs insufficient mating material. This could not be re-verified online during the build. |
| Plain CSS with CSS variables instead of Tailwind. | Few dependencies, a small bundle, and theming (light/dark, three board themes) is just variables. |
| CSS transitions instead of Framer Motion. | The board animations are simple slides. This keeps the initial bundle small (about 60 KB gzipped). |
| Own SVG board and original hand-drawn piece SVGs. | Full control for highlights, arrows, stars and the ghost hand. No third-party licence or attribution is needed for the pieces. |
| HashRouter and `base: './'`. | The static `dist/` works from GitHub Pages sub-paths, file hosting and offline, with no server rewrite rules. |
| chess.js (BSD-2) wraps the full-rules game, and our own `sandbox.ts` handles lessons with no kings. | chess.js cannot represent positions without kings. UI code never calls chess.js directly (only `rules.ts`, the engine and the bots do). |
| Own engine (negamax, alpha-beta, iterative deepening, MVV-LVA, quiescence, PST, king safety, mop-up) in a Web Worker. **No Stockfish WASM.** | Stockfish is GPL, which conflicts with a permissively licensed static app. Level 8 is the strongest of our own engine. The worker falls back to a main-thread search if workers are unavailable. |
| Engine search uses chess.js move generation. | Fast enough for the time limits (at most 1.5 s per move), and always legal. |
| Hand-written service worker (`public/sw.js`) plus a build step that writes `dist/precache.json`. | No plugin dependency. The whole app, including the lazy stage chunks and the engine worker, is cached on the first visit. |
| Stage content is lazy-loaded; `curriculum.generated.ts` is an index produced by `npm run gen`. | The map and gates need only ids and titles, so the lesson text stays out of the first load. A test fails if the index is stale. |
| Stars = mistakes + hints compared against `{three, two}`. A check or boss needs 2 stars to pass. A check passed with 3 stars is a "test out" of the whole stage. | Matches the mastery-gate rules (§9.2) and the hint-ladder rule (hints cost stars but never block progress). |
| The Daily Puzzle cycles through the verified tactics set by day number. | Deterministic, works offline, and every puzzle is checked against the engine in tests. |
| "Removing the defender" is taught with concept questions, not a board puzzle. | No position could be verified to the same standard as the other puzzles. A wrong puzzle teaches the wrong thing. |
| Arena follows online-platform behaviour (threefold and 50-move end the game). Stage 8 teaches the official claim vs automatic difference. | §5.7 implementation note. |
| Draw offers in the Arena are accepted by the bot only when it is not behind and the game is long. | Simple, predictable, and never lets a learner farm draws early. |
| Progress is stored under `p2k:v1` with a versioned `migrate()`; all storage calls are wrapped in try/catch with an in-memory fallback. | §12. |
| Pip, the mascot, is an original drawing. | §7.3 and §15: no existing characters. |

## 2026-11-21 — Rename and GitHub Pages
- App renamed to "Pip's Chess Quest" (user-facing only). Reason: ties the name to the mascot; clearer than "Pawn to King". Storage key `p2k:v1` and cache name `p2k-v1` unchanged so saved progress keeps working.
- Workflow renamed to `pages.yml`; added `configure-pages`. `.nojekyll` lives in `public/` so Vite copies it into `dist/`.
- `base` stays `./` (relative) and routing is hash-based, so `/messy/` hosting works with no config change.
