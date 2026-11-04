# v0.0

## v0.0.0 — Initial Design (2026-11-04)

<!--
TODO: Replace 2026-11-04 with the bootstrap commit date (YYYY-MM-DD).
This file is the bootstrap version's release notes — fill it in before the first commit.
Subsequent versions are scaffolded by `./scripts/new-version.sh`, which prepends a new H2 block above this one.
-->

### Problem

<!-- One paragraph: what problem does this project solve? Mirror or condense the mission statement. -->

### Solution

<!-- What does this initial commit lock in? Typically: design docs, scaffold, ceremony — no application code yet. -->

### New

- **Project scaffold.** README, CLAUDE.md, Makefile, Dockerfile stub, `.gitignore` / `.dockerignore`, `infra/terraform/` placeholder, `scripts/new-version.sh` versioning ceremony, `Versions/v0/v0.0/`.
- **Docs skeleton.** `mission.md`, `00-overview.md`, `01-architecture.md`, `07-build-plan.md`, `99-open-questions.md`.
- *(add the architectural decisions and locked-in choices from this commit.)*

### Files Changed

| File | Change |
|------|--------|
| `README.md` | New — project status and pointers |
| `CLAUDE.md` | New — repo-level context for Claude sessions |
| `Makefile` | New — dev targets and versioning ceremony |
| `Dockerfile` | New — runtime image stub |
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
