# v0.4

## v0.4.0 — Game layer (2026-11-04)

### Problem

- M3: levels had no reward and no memory between visits.

### Solution

- XP, ranks, badges and unlocks, saved in the browser on the device.

### New

- **Game rules** (`src/game/rules.ts`). XP, 6 ranks, 13 badges, unlocks, day streaks.
- **Saving** (`src/game/storage.ts`). Browser storage, guarded; falls back to memory for the visit.
- **Home progress card.** Rank, XP bar, streak, badge count.
- **Level states.** Locked 🔒, open, passed ✓, passed on your own ★.
- **Locked screen** with a link to the level before.
- **Pass rewards.** +XP, rank-ups and new badges on the "Level passed!" panel.
- **Badges screen** (`#/badges`).
- **Doc.** `docs/03-game.md`.
- **Tests.** 9 game rule tests; 85 total.

### Changed

- **Lessons** track Hint/Show me use, moves and time.
- **Mission Control.** Game on Home; 5 Glossary terms.

### Fixed

- None.

### Files Changed

| File | Change |
|------|--------|
| `src/game/*` | New — rules and saving |
| `src/app/home.ts`, `src/app/badges.ts`, `src/app/lesson.ts`, `src/app/shell.ts`, `src/app/styles.css` | Progress, locks, rewards, badges screen |
| `tests/game.test.ts` | New |
| `docs/03-game.md` | New |
| `docs/07-build-plan.md`, `docs/99-open-questions.md`, `CLAUDE.md`, `site/catalog.json` | M3 done, glossary |
| `Versions/v0/v0.4/release-notes.md` | New — this file |
