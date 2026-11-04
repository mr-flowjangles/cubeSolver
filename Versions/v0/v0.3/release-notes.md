# v0.3

## v0.3.0 — Beginner levels (2026-11-04)

### Problem

- M2: the app had a cube but taught nothing.

### Solution

- A beginner solver that only uses taught sequences, 9 levels built on it, and a home screen to pick them.

### New

- **Beginner solver** (`src/solver/`). 7 stages, white on the bottom; cross by fewest turns, later stages by taught sequences only.
- **Pieces** (`src/cube/pieces.ts`). Slots, and checks against center colors.
- **Levels** (`src/lessons/`). Levels 0–8 as data; practice cubes with earlier stages done.
- **Home screen.** Level list plus Free play.
- **Lesson screen.** How it works, sequences, Hint, Show me, Undo, New cube, "Level passed!" with Next.
- **Notation drill.** Level 0 asks for 10 turns, undoing wrong ones.
- **View from below** for levels 1–2, so the white side shows.
- **Test hook.** `?autoshow=1#/level/<id>` applies every Show me step and checks the pass.
- **Doc.** `docs/02-levels.md`.
- **Tests.** 200-scramble solver test, per-level practice-cube tests; 75 total.

### Changed

- **Move buttons.** Two rows: U R F y / D L B y'.
- **Free play** moved to `#/play`, sharing the cube panel with lessons.
- **Colors** moved from `src/render/` to `src/cube/`.
- **Mission Control.** Levels on Home; 7 new Glossary terms.

### Fixed

- Hints during the twist stage no longer re-plan from the deliberately messy bottom.

### Files Changed

| File | Change |
|------|--------|
| `src/solver/*` | New — beginner solver and search |
| `src/cube/pieces.ts`, `src/cube/moves.ts` | Pieces; move targets, merge turns |
| `src/cube/colors.ts` | Moved from `src/render/` |
| `src/lessons/*` | New — level data, practice cubes |
| `src/app/*` | Shell, home, lesson, cube panel; free play reworked |
| `src/render/cubeView.ts` | View from below |
| `tests/beginner.test.ts`, `tests/lessons.test.ts` | New |
| `docs/02-levels.md` | New |
| `docs/07-build-plan.md`, `docs/99-open-questions.md`, `CLAUDE.md`, `site/catalog.json` | M2 done, levels decided, glossary |
| `Versions/v0/v0.3/release-notes.md` | New — this file |
