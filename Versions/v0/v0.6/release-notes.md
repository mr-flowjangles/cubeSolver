# v0.6

## v0.6.0 — Camera scan (2026-11-04)

### Problem

- M5: entering a cube meant tapping 48 stickers by hand.

### Solution

- Scan each face with the phone camera; colors are read against the cube's own centers, then checked on the flat map.

### New

- **Scan screen** (`#/solve/scan`). Live square view, 3×3 framing guide, middle cell ringed in the expected color, Capture / Retake, small previews of each scanned face.
- **Color reading** (`src/scan/classify.ts`). Centers as references, Lab distance, re-averaging, 9 per color, impossible-piece repair.
- **Face sampling** (`src/scan/sample.ts`). Median of each cell's middle.
- **Check note** on the flat map after a scan.
- **Scan button** on Solve my cube.
- **Test hook.** `?autoscan=1#/solve/scan`.
- **Doc.** `docs/04-camera-scan.md`.
- **Tests.** Color reading under 4 lights, sampling a drawn face; 97 total.

### Changed

- **Mission Control.** Scan on Home; 2 Glossary terms.

### Fixed

- None.

### Files Changed

| File | Change |
|------|--------|
| `src/scan/*` | New — color reading and sampling |
| `src/app/scan.ts` | New — scan screen |
| `src/app/solveMine.ts`, `src/app/styles.css` | Scan link, check note, styles |
| `tests/scan.test.ts` | New |
| `docs/04-camera-scan.md` | New |
| `docs/07-build-plan.md`, `docs/99-open-questions.md`, `CLAUDE.md`, `site/catalog.json` | M5 done, glossary |
| `Versions/v0/v0.6/release-notes.md` | New — this file |
