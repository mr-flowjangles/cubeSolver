# v0.2

## v0.2.1 — Drawn ADA Shapes (2026-11-04)

### Problem

- ADA shapes were font characters. iPhones can show ✖ and ★ as color emoji.

### Solution

- Draw each shape with canvas paths, so it looks the same on every device.

### New

- **`src/render/shapes.ts`.** The six shapes and which color gets which.

### Changed

- **3D cube.** Uses the drawn shapes.
- **`src/render/colors.ts`.** Shape list moved to `shapes.ts`.

### Fixed

- Possible emoji shapes on iPhone.

### Files Changed

| File | Change |
|------|--------|
| `src/render/shapes.ts` | New — drawn shapes |
| `src/render/cubeView.ts` | Uses drawn shapes |
| `src/render/colors.ts` | Shape list removed |
| `Versions/v0/v0.2/release-notes.md` | This entry |

## v0.2.0 — Cube and live site (2026-11-04)

### Problem

- M1: there was no app yet, only docs.

### Solution

- A 3D cube you can turn and scramble, installable and offline, deployed to GitHub Pages on every push to `main`.

### New

- **Cube model** (`src/cube/`). Cube state, every standard move (faces, wide, slices, whole-cube), scramble.
- **3D cube** (`src/render/`). Three.js drawing, animated turns, drag to look around, repainted from the cube state after every move.
- **ADA support.** Setting adds a shape to each color; saved on the device.
- **Practice screen** (`src/app/`). Move buttons, Scramble, Undo, Reset, keyboard turns, "Solved!" message.
- **Test hook.** `?moves=…&instant=1&ada=1` sets up the cube from the link, for headless checks.
- **PWA.** Manifest, icons, service worker; works offline.
- **Deploy.** `.github/workflows/deploy.yml`: lint, test, build, publish to GitHub Pages.
- **Icons.** `scripts/make-icons.py` writes them, standard library only.
- **Tests.** 61 cube model tests, including known results for R, U, F and the T-perm.

### Changed

- **Dockerfile.** Copies `vite.config.ts` and `public/`.
- **Prettier.** Line width 100.
- **Build plan.** M1 ticked; now M2.
- **Mission Control.** Live link on Home; ADA support in the Glossary.

### Fixed

- None.

### Files Changed

| File | Change |
|------|--------|
| `src/cube/*` | New — cube model |
| `src/render/*` | New — 3D cube and colors |
| `src/app/*` | New — practice screen, settings, styles |
| `src/main.ts`, `index.html` | App entry |
| `tests/cube.test.ts` | New — 61 tests |
| `vite.config.ts` | New — PWA setup, base path for Pages |
| `public/*`, `scripts/make-icons.py` | New — icons |
| `.github/workflows/deploy.yml` | New — Pages deploy |
| `Dockerfile`, `.prettierrc`, `.prettierignore`, `tsconfig.json`, `package*.json` | Build setup |
| `docs/07-build-plan.md`, `CLAUDE.md`, `site/catalog.json` | M1 done, glossary, live link |
| `Versions/v0/v0.2/release-notes.md` | New — this file |
