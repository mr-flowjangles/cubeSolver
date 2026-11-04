# v0.0

## v0.0.0 — Initial Design (2026-11-04)

### Problem

- Start a public, game-style Rubik's cube tutorial app.

### Solution

- Starter-pack scaffold and toolchain. No app code yet.

### New

- **Project scaffold.** README, CLAUDE.md, Makefile, Dockerfile stub, `.gitignore` / `.dockerignore`, `infra/terraform/` placeholder, `scripts/new-version.sh` versioning ceremony, `Versions/v0/v0.0/`.
- **Docs skeleton.** `mission.md`, `00-overview.md`, `01-architecture.md`, `07-build-plan.md`, `99-open-questions.md`.
- **Toolchain.** `package.json` with Vite, TypeScript, Three.js, Vitest, Prettier; `tsconfig.json`; Makefile wired to npm.

### Files Changed

| File | Change |
|------|--------|
| `README.md` | New — project status and pointers |
| `CLAUDE.md` | New — repo-level context for Claude sessions |
| `Makefile` | New — dev targets and versioning ceremony |
| `Dockerfile` | New — stub |
| `.gitignore` | New |
| `.dockerignore` | New |
| `docs/mission.md` | New — what + who + constraints |
| `docs/00-overview.md` | New — flow diagram + reading order |
| `docs/01-architecture.md` | New — module map + contract artifact |
| `docs/07-build-plan.md` | New — milestones M0+ |
| `docs/99-open-questions.md` | New — deferred decisions |
| `scripts/new-version.sh` | New — versioning ceremony script |
| `infra/terraform/README.md` | New — AWS deployment placeholder |
| `Versions/v0/v0.0/release-notes.md` | New — this file |
| `package.json`, `package-lock.json`, `tsconfig.json`, `.prettierignore` | New — Node/TypeScript toolchain |
| `src/main.ts` | New — empty entry point |
