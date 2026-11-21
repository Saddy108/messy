# Pip's Chess Quest

A static web app that takes a person with **zero chess knowledge** to someone who knows every rule of chess and is ready to play online. Learn by doing: a coach, instant feedback on every move, a journey map, rewards, and spaced-repetition review.

No backend, no accounts, no tracking. Everything is saved in the browser (`localStorage`, key `p2k:v1`).

## What is inside

- **13-stage journey**, 109 lessons, rule checks (test-out) and a boss for each stage.
- **Guided simulator**: legal moves glow, and every illegal move is explained (21 reason codes).
- **Practice Arena**: 8 bots, Guided / Normal / Challenge modes, clocks, post-game review, 7 mini-games, a daily puzzle.
- **Spaced repetition** (Leitner boxes at 0, 1, 3, 7, 14 and 30 days) and a Weak Rules screen.
- **Final Rules Exam** (40 questions, 85% to pass) and a printable certificate.
- Offline after the first visit (PWA).

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

## Check it

```bash
npm run lint         # ESLint + tsc --noEmit
npm run test         # Vitest: rules, lessons, engine, progress, arena
npm run build        # type-check, build to dist/, write dist/precache.json
npm run e2e          # Playwright (builds and previews the app first)
```

After editing a stage's lesson ids or titles, run `npm run gen` to refresh `src/lessons/curriculum.generated.ts` (a test fails if it is stale).

## Deploy

`npm run build` produces a fully static `dist/` folder. Host it anywhere.

**GitHub Pages:** the workflow in `.github/workflows/pages.yml` builds (`npm ci`, lint, test, `npm run build`) and publishes `dist/` on every push to `main`. In the repository settings, set *Pages → Source* to *GitHub Actions* (once per repo).

**Live site:** https://saddy108.github.io/messy/

**Netlify / Vercel / any static host:** build command `npm run build`, publish directory `dist`. The app uses hash routing and relative paths, so no rewrite rules are needed.

## Project map

```
src/board      SVG board, pieces, tap + drag + keyboard input
src/chess      rules (chess.js wrapper), sandbox, explain, notation, draws
src/engine     bot engine (runs in a Web Worker), 8 levels
src/lessons    lesson runner, goals, solvers; stages/ holds lesson data only
src/arena      game screen, review, mini-games, daily puzzle
src/review     spaced repetition scheduler
src/progress   XP, ranks, badges, streaks, gates, storage + migrations
src/content    all user-facing text, review cards, puzzles
tests          rules, lessons, engine, progress, arena, e2e
```

## Credits and licences

See the in-app About page. chess.js is BSD-2. The pieces and the mascot are original drawings. There is no third-party branding anywhere in the app.
