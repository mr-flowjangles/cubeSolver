# v0.1

## v0.1.0 — M0 Foundations (2026-11-04)

### Problem

- The repo had only template docs. Nothing said what the app is or how it will be built.

### Solution

- Filled in every design doc from the agreed decisions, and finished the M0 setup.

### New

- **Design docs.** Mission, overview, architecture (agreed), build plan M0–M7 (agreed), open questions.
- **Decisions recorded.** ADA support shapes, guided solve uses the learned method, no tracking, Docker kept for local testing.
- **Glossary.** 11 cube terms in `CLAUDE.md` → Mission Control's Glossary tab.
- **Docker image.** Builds the app and serves it with nginx; `make image`, `make smoke`, `make serve-image` on port 4027.
- **Make targets.** `make dev` (port 4026) and `make build`.
- **`index.html`.** Minimal app entry page so the build runs.

### Changed

- **Mission Control.** Home tab, repo link, and Status entries for the app and the Docker preview.
- **Design tab order.** `scripts/sync-catalog.py` lists the mission doc first.
- **`CLAUDE.md`.** Ownership block, stack section, standing go-ahead for M1–M7.
- **Bootstrap release notes.** Filled in.

### Fixed

- None.

### Files Changed

| File | Change |
|------|--------|
| `docs/*.md` | Filled in from agreed decisions |
| `CLAUDE.md` | Ownership, stack, glossary, go-ahead |
| `Dockerfile` | Real build: Node build stage, nginx serve stage |
| `Makefile` | `dev`, `build`, `image`, `smoke`, `serve-image` targets |
| `index.html` | New — app entry page |
| `scripts/sync-catalog.py` | Mission doc listed first |
| `site/catalog.json` | Regenerated; Home and Status filled in |
| `Versions/v0/v0.0/release-notes.md` | Bootstrap notes filled in |
| `Versions/v0/v0.1/release-notes.md` | New — this file |
