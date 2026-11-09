# v0.8

## v0.8.8 — Swipe only (2026-11-09)

### Problem

The move buttons under the cube were not good. With swiping built in v0.8.7, they were in the way.

### Solution

Removed the buttons everywhere. The cube is turned only by swiping (plus the keyboard). Lessons point an arrow at the next swipe, and each turn flashes its letter. Design: docs/02-levels.md → Controls.

### New

- Arrow on the cube along the row to swipe next; whole-cube turns show the arrow beside the cube.
- Each turn flashes its letter over the cube.
- Swiping beside the cube turns the whole cube in lessons too.
- Walk through it renames the moves left after a whole-cube turn (after x, U becomes B).
- Pass checks work however the cube is held; the PLL level first turns white to the bottom.
- Half turns are two swipes; two-layer turns are two swipes (r is R then M').
- Keyboard: x and M added.

### Changed

- Removed: move buttons, See back button, the look-around drag.
- Level 0 text: teaches the moves by swiping.
- Beginner levels refuse middle-row swipes with a message; CFOP and free play allow them.
- docs/02-levels.md Controls rewritten, with footnotes for design decisions; docs/07-build-plan.md ticked.

### Verification

- 209 tests passed, lint clean, build clean.
- New tests: every move's swipes equal the move; renamed moves equal the original after whole-cube turns; every level's walk-through still finishes with whole-cube turns mixed in; Hint and Show me finish every level after any whole-cube turn.
- Browser, simulated touch events: level 0 arrow on R, swipe R accepted, arrow moved to U; in Middle edges, y swipe accepted, extra x renamed the next move U to B.
- Not checked on a real phone: needs a phone in hand.

### Files Changed

| File | Change |
|------|--------|
| `src/render/swipe.ts` | Moves as swipes; renaming after whole-cube turns |
| `src/render/cubeView.ts` | Next-move arrow; whole-cube swipes everywhere |
| `src/app/cubePanel.ts` | Buttons removed; letter flash; allowed turns |
| `src/app/stageLesson.ts`, `src/app/lesson.ts` | Arrow instead of glowing button; renaming; any-hold pass checks |
| `src/lessons/walkthrough.ts`, `src/lessons/index.ts`, `src/lessons/beginner.ts` | Guide split into swipes; any-hold check; level 0 text |
| `src/app/practice.ts`, `src/app/styles.css` | Free play turn set; button styles removed, letter style added |
| `docs/02-levels.md`, `docs/07-build-plan.md`, `site/catalog.json` | Controls design |
| `tests/*.test.ts` | New and updated tests |

## v0.8.7 — Touch controls (2026-11-09)

### Problem

Turning the cube meant tapping buttons below it. On a phone, Rob wanted to turn the cube by touching it.

### Solution

Swipe on the cube to turn the row or column under your finger. Swipe beside the cube in free play to turn the whole cube. Design: docs/02-levels.md → Controls → Touch controls (design decision, 2026-11-06).

### New

- Swipe a sticker: its layer turns the way the finger went.
- Free play: swipe beside the cube turns the whole cube (left/right y, up/down x); middle rows can be swiped.
- Lessons: dragging beside the cube is still the look-around that springs back.
- A swipe only makes moves the screen's buttons have; a middle-row swipe in a beginner level says to use a row with a button.

### Changed

- Free play hint and the cube's screen-reader label describe swiping.

### Verification

- 192 tests passed, including 4 new swipe tests.
- Every sticker × every direction checked against the move engine: the sticker moves the way the finger went.
- Lint clean; build clean.
- Browser, simulated touch events: front right column swiped up made R; swipe beside the cube made x and y; middle-row swipe in level "Middle edges" showed the message.
- Not checked on a real phone: needs a phone in hand.

### Files Changed

| File | Change |
|------|--------|
| `src/render/swipe.ts` | New: which move a swipe makes |
| `src/render/cubeView.ts` | Finger tracking, sticker hit test |
| `src/app/cubePanel.ts` | Only allowed moves; free-play option; label |
| `src/app/practice.ts` | Free play uses swipes; hint text |
| `docs/02-levels.md`, `site/catalog.json` | Touch controls marked built, with rules |
| `tests/swipe.test.ts` | New tests |

## v0.8.6 — Cube review fixes (2026-11-06)

### Problem

A Rubik's cube review of the whole app found two CFOP lessons giving wrong advice, a cube check that missed mirror-image corners (e.g. red and orange mixed up), level 7 practice cubes with a scrambled bottom, and some wrong or stale text.

### Solution

Fixed each proven finding, with a test for each. Also wrote the planned touch controls into the design doc.

### Fixed

- Level 11 (OLL 1): "L shape: hold it at front-right" — back-left turned the L into a dot.
- Level 13 (PLL 1): "Headlights: hold them on the left" — at the back, T-perm could not solve the corners.
- Cube check now catches a corner whose colors are in a mirror-image order, and says red and orange are easy to mix up.
- "Can't be solved" message now also names two swapped pieces.
- Level 7 practice: easier cubes have fewer twisted corners instead of being stopped part-way with the bottom scrambled.
- Solve my cube, bottom face: "tip the top away from you" (was "toward you").
- Glossary: a center "never moves when you turn a side" (M moves centers).

### Changed

- docs/02-levels.md: solver timings updated to the review's 500-scramble runs.
- docs/02-levels.md: new "Touch controls (planned)" section — swipe a sticker to turn its layer, swipe the background to turn the whole cube.

### Not changed

- The beginner "hold" step still skips turning to green-in-front when white is already down. Requiring green in front broke 5 tests: later stages turn the cube with y on purpose, so green is often not in front mid-solve.

### Files Changed

| File | Change |
|------|--------|
| `src/lessons/cfop.ts` | L shape and Headlights hold text |
| `src/cube/validate.ts` | Mirror-image corner check; unsolvable message |
| `src/lessons/position.ts` | Level 7 easier practice cubes |
| `src/app/solveMine.ts` | Bottom face tip direction |
| `CLAUDE.md`, `site/catalog.json` | Center glossary entry |
| `docs/02-levels.md` | Level 7 practice, timings, touch controls plan |
| `tests/*.test.ts` | Tests for each fix |

## v0.8.5 — Show updates right away (2026-11-04)

### Problem

- After v0.8.4 went live, Rob still saw the old White cross text.
- The offline copy updated in the background but the open page kept the old version until the next visit.

### Solution

- Reload the page once when a new version takes over.

### New

- None.

### Changed

- `src/main.ts`: reload on service worker change, skipped on first install.

### Fixed

- New versions show without closing and reopening the app.

### Files Changed

| File | Change |
|------|--------|
| `src/main.ts` | Reload when a new version takes over |

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
