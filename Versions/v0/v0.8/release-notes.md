# v0.8

## v0.8.4 — Guided white cross (2026-11-04)

### Problem

- White cross said "find a white edge, turn it into place" and dropped the player on a scrambled cube. Not clear, and not a tutorial.

### Solution

- Every stage level now runs in three parts: Show it, Walk through it, Try it.
- White cross is taught with the daisy, every move with a plain-words reason.

### New

- Lesson parts: 1 Show it (app plays the demo cube slowly), 2 Walk through it (glowing button, wrong turns undone), 3 Try it.
- Lit squares: the piece being moved and the spot it goes to.
- Daisy solver for the beginner cross: Part 1 builds the daisy, Part 2 turns each edge down with F2.
- The daisy only turns top, front, right and the whole cube — sides the player can see.
- Practice ramp: cube 1 has one step left, cube 2 about three, cube 3 fully mixed; the level passes on cube 3.
- Tests: every stage level's walk-through finishes its stage; daisy rules; practice ramp.

### Changed

- White cross text rewritten: what an edge piece and a center are, then the two parts.
- Guided solve ("Solve my cube") and Hint use the daisy for the beginner cross.
- Level pass rewards moved to their own module.

### Fixed

- None.

### Files Changed

| File | Change |
|------|--------|
| `src/app/stageLesson.ts` | New: the three-part lesson screen |
| `src/app/reward.ts` | New: record a pass, show XP and badges |
| `src/lessons/walkthrough.ts` | New: demo cube and per-tap guide moves |
| `src/solver/beginner.ts` | Daisy cross with per-move reasons |
| `src/lessons/position.ts` | Practice ramp |
| `src/lessons/beginner.ts`, `index.ts` | Cross text; guide step fields |
| `src/app/lesson.ts`, `cubePanel.ts`, `styles.css` | Hand stage levels to the new screen; slow play; styles |
| `src/render/cubeView.ts`, `src/cube/pieces.ts` | Light up a piece; find a piece by colors |
| `tests/walkthrough.test.ts` | New tests |
| `docs/02-levels.md`, `docs/07-build-plan.md`, `CLAUDE.md` | How the parts are built; M8 ticks; glossary |

## v0.8.3 — Tutorial plan (2026-11-04)

### Problem

- Levels drop the player on a scrambled cube to figure out. That is a test, not a tutorial.

### Solution

- Write down the rule and plan the rebuild before any code changes.

### New

- **`02-levels.md` → Every level is a tutorial.** Show it, walk through it, then try it; rules that follow; daisy for the white cross.
- **Build plan M8 — Guided lessons.** Rebuild every level; must land before launch.
- **v1 done list.** Every level walks the player through.
- **Glossary.** Daisy.

### Changed

- **`CLAUDE.md`.** Tutorial rule added to working norms.
- **Now:** M8.

### Fixed

- None (the rebuild is M8).

### Files Changed

| File | Change |
|------|--------|
| `docs/02-levels.md`, `docs/07-build-plan.md` | Tutorial rule, M8 |
| `CLAUDE.md`, `site/catalog.json` | Norm, glossary |
| `Versions/v0/v0.8/release-notes.md` | This entry |

## v0.8.2 — Clear controls (2026-11-04)

### Problem

- The turn buttons seemed to have no rhyme or reason.
- It wasn't clear what a whole-cube turn does.
- Dragging the view to the back left R on the screen's left, so the buttons no longer matched what you saw.

### Solution

- Buttons grouped by side, each with its letter, side name and arrow.
- Fixed side tags next to the cube.
- The view springs back to the front; a See back button for the back.
- Based on research into how the main tutorials and cube viewers do it.

### New

- **Grouped buttons.** Top, Right, Front, Bottom, Left, Back, Whole cube; each shows letter, side and arrow (e.g. "R — Right ↑").
- **Side tags** next to the cube: FRONT · F, TOP · U (or BOTTOM · D), RIGHT · R. They stay put while the colors turn.
- **See back** button; any turn returns to the front first.
- **View limits.** Drag about 40° each way; springs back to the front on release.

### Changed

- **Learn the controls** explanation: letters are sides, front is whatever faces you, letters are places not colors.
- **CFOP levels** show letters only, plus a Middle and two-layer turns group.
- **Pinch zoom** off; drag smoothing off so the view springs back cleanly.
- **Docs.** Controls section in `02-levels.md`; 2 Glossary terms.

### Fixed

- Buttons stopped matching the screen after dragging the view.

### Files Changed

| File | Change |
|------|--------|
| `src/app/cubePanel.ts` | Grouped, labeled buttons; See back |
| `src/render/cubeView.ts` | Side tags, view limits, spring back, see back |
| `src/app/lesson.ts`, `src/app/styles.css` | Button groups per method, styles |
| `src/lessons/beginner.ts` | New level 0 explanation |
| `docs/02-levels.md`, `CLAUDE.md`, `site/catalog.json` | Controls, glossary |
| `Versions/v0/v0.8/release-notes.md` | This entry |

## v0.8.1 — Learn the controls (2026-11-04)

### Problem

- Level 0 didn't say plainly that it only teaches the buttons.

### Solution

- Renamed it and stated its purpose and task up front.

### New

- **Task line** on level 0: "Tap the glowing button. 10 taps and you're done."

### Changed

- **Level 0** renamed "Meet the cube" → "Learn the controls".
- **Level 0 top line:** "This level teaches the buttons. Each letter turns one side of the cube. You'll need these for every level after this."
- **Docs and badge text** use the new name.

### Fixed

- None.

### Files Changed

| File | Change |
|------|--------|
| `src/lessons/beginner.ts` | New name and top line |
| `src/app/lesson.ts`, `src/app/styles.css` | Task line |
| `src/game/rules.ts` | Badge text |
| `docs/02-levels.md`, `docs/03-game.md`, `docs/05-phone-check.md` | New name |
| `Versions/v0/v0.8/release-notes.md` | This entry |

## v0.8.0 — Launch (2026-11-04)

### Problem

- M7: the README still described an empty template.
- Real-phone checks had no written list.
- Meet the cube asked for turns like "R" without showing what they mean.

### Solution

- README with the play link and a quickstart.
- A phone checklist on Mission Control.
- Meet the cube now explains each turn, lights up that side and makes its button glow.

### New

- **Meet the cube.** Each prompt says what the turn does ("Right side — turns so its front edge goes up"); the side that will turn is lit and the rest dimmed; the button to tap glows.
- **3D cube highlight.** `highlight(move)` lights one layer.
- **Phone checklist** (`docs/05-phone-check.md`). Install, offline, levels, camera scan, timer.
- **Open question.** License for the public repo.

### Changed

- **README.** Play link, quickstart, current layout, license status.
- **Build plan.** README items ticked; phone testing marked blocked on real phones.

### Fixed

- Meet the cube was unclear about what each button does.

### Files Changed

| File | Change |
|------|--------|
| `src/lessons/beginner.ts` | Turn descriptions, clearer level text |
| `src/app/lesson.ts`, `src/app/styles.css` | Prompts, lit side, glowing button |
| `src/render/cubeView.ts` | Layer highlight |
| `README.md` | Rewritten |
| `docs/05-phone-check.md` | New |
| `docs/07-build-plan.md`, `docs/99-open-questions.md`, `site/catalog.json` | M7 progress, license question |
| `Versions/v0/v0.8/release-notes.md` | New — this file |
