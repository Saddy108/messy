# PROGRESS

## Status: all milestones M1–M8 built

| Milestone | State |
|---|---|
| M1 Foundation: Vite + React + strict TS, own SVG board (tap, drag, keyboard), themes | Done |
| M2 Rules core: `rules.ts`, `sandbox.ts`, `explain.ts` (21 codes), `notation.ts`, `draws.ts`, tests for every §5 area | Done |
| M3 Lesson engine + Stages 1–2 | Done |
| M4 Stages 3–6 (setup, value, check, checkmate) | Done |
| M5 Engagement: map, XP, ranks, badges, streaks, gates, spaced repetition, sounds, confetti | Done |
| M6 Stages 7–13 (special moves, draws, notation, openings, tactics, endgames, online) + Final Exam + certificate | Done |
| M7 Arena: engine worker, 8 bots, 3 modes, clocks, post-game review, 7 mini-games, daily puzzle | Done |
| M8 PWA/offline, README, deploy workflow, About/credits, bundle check | Done (see known issues) |

## Numbers

- 13 stages, 109 lessons (including each stage's rule check and boss).
- About 100 review cards covering 25 rule areas. The exam draws from them.
- Initial JS: about 61 KB gzipped (budget 250 KB). Stages, engine, arena and mini-games are lazy chunks.
- Tests: Vitest (rules, lessons, puzzles, engine, progress, arena) plus Playwright (6 journeys, desktop and phone).

## Next ideas

- A real browser audit with Lighthouse (not run in this environment).
- More tactics puzzles (the Daily Puzzle cycles through a small verified set) and a verified "removing the defender" puzzle.
- Share-card for the certificate; more badges.
- Optional Stockfish for Level 8 (GPL: see DECISIONS.md before adding).

## Known issues

- Lighthouse scores and the Safari (iOS) / Firefox checks were not run here. Only Chromium (desktop and Pixel 7 emulation) was tested.
- The FIDE edition (2023) could not be re-checked online. Re-check before a public release.
- One ESLint warning in `DemoView.tsx` about a ref in an effect cleanup. It is harmless.
- Bot Level 8 is our own engine, not Stockfish. It is strong for a learner but beatable.
