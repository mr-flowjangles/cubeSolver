# v0.8

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
