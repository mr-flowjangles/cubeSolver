# v0.7

## v0.7.0 — CFOP levels (2026-11-04)

### Problem

- M6: players who finished the beginner method had nowhere to go next.

### Solution

- A CFOP solver and 8 CFOP levels (cross, F2L, 4-look last layer, full PLL, full solve), plus a timer for real-cube solves.

### New

- **CFOP solver** (`src/solver/cfop.ts`). Shortest cross, F2L pairs from 6 short inserts, 2-look OLL, 2-look PLL, full PLL.
- **Sequence lists.** 2 yellow-cross, 7 yellow-face, 2 corner, 4 edge, all 21 PLLs; each checked by the cube model.
- **CFOP levels 9–16** (`src/lessons/cfop.ts`). Unlock after Full solve.
- **Methods** (`src/lessons/index.ts`). One interface for beginner and CFOP, so lessons and the guide work with either.
- **CFOP buttons.** Extra row with M, M2, r, f, x.
- **Timer** (`#/timer`). Scramble, tap/Space start-stop, best, average of 5, last 12 times with delete.
- **Badges.** Pair Maker, 4-Look Last Layer, PLL Pro, CFOP Solver, Under a Minute, Under 30 Seconds.
- **Guided solve uses CFOP** once F2L pairs is passed.
- **Test hook.** `?unlock=1` opens a locked level.
- **Tests.** 100-scramble CFOP test, sequence checks, PLL cases, every CFOP sequence makeable with the buttons, timer stats; 149 total.

### Changed

- **Long sequence lists** fold into "Sequences (n)".
- **Home** has a CFOP section and the Timer.
- **Docs.** CFOP and Timer in `02-levels.md`; full OLL deferred to v2 in open questions.
- **Mission Control.** CFOP on Home; 4 Glossary terms.

### Fixed

- Move buttons slid under the action buttons on screens with many sequences.

### Files Changed

| File | Change |
|------|--------|
| `src/solver/cfop.ts` | New — CFOP solver and sequence lists |
| `src/lessons/cfop.ts`, `src/lessons/index.ts` | New — CFOP levels, methods |
| `src/lessons/beginner.ts`, `src/lessons/position.ts` | Method per level; PLL practice cubes |
| `src/app/timer.ts`, `src/game/times.ts` | New — timer |
| `src/app/lesson.ts`, `src/app/home.ts`, `src/app/solveMine.ts`, `src/app/cubePanel.ts`, `src/app/shell.ts`, `src/app/styles.css` | Both methods, CFOP buttons, home section, layout fix |
| `src/game/rules.ts` | CFOP and time badges |
| `tests/cfop.test.ts` | New |
| `tests/lessons.test.ts`, `tests/game.test.ts` | All levels, buttons, timer |
| `docs/02-levels.md`, `docs/07-build-plan.md`, `docs/99-open-questions.md`, `CLAUDE.md`, `site/catalog.json` | M6 done |
| `Versions/v0/v0.7/release-notes.md` | New — this file |
