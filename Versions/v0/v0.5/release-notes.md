# v0.5

## v0.5.0 — Solve my cube (2026-11-04)

### Problem

- M4: players couldn't get help with their own real cube.

### Solution

- Tap the cube's colors into a flat map, check it, then follow a guided solve move by move.

### New

- **Flat cube map** (`#/solve`). Centers fixed; color palette with counts; empty stickers striped; saved for the browser tab.
- **Checks** (`src/cube/validate.ts`). Wrong color counts, pieces that can't exist, repeated pieces — with the stickers outlined.
- **Unsolvable check.** A flipped edge, twisted corner or swapped pair is caught when the solver can't finish.
- **Guided solve** (`#/solve/guide`). Stage name, what to do, moves with the current one underlined, progress bar, Back / Next move / Whole step.
- **Home link** to Solve my cube, always open.
- **Drawn shapes as SVG** for buttons and the flat map.
- **Test hooks.** `?cube=<54 letters>` and `&finish=1`.
- **Tests.** 6 validation tests; 91 total.

### Changed

- **Get ready step** uses the fewest whole-cube turns (z2, not x2 y2).
- **ADA support** toggle redraws screens without a 3D cube; `?ada=1` handled in settings.
- **Mission Control.** Solve my cube on Home; 3 Glossary terms.

### Fixed

- None.

### Files Changed

| File | Change |
|------|--------|
| `src/app/solveMine.ts` | New — flat map and guided solve |
| `src/cube/validate.ts` | New — entered-cube checks |
| `src/render/shapes.ts` | SVG shapes |
| `src/solver/beginner.ts` | Fewest-turn get-ready step |
| `src/app/shell.ts`, `src/app/settings.ts`, `src/app/home.ts`, `src/app/styles.css` | Route, ADA redraw, home link, styles |
| `tests/validate.test.ts` | New |
| `docs/07-build-plan.md`, `CLAUDE.md`, `site/catalog.json` | M4 done, glossary |
| `Versions/v0/v0.5/release-notes.md` | New — this file |
