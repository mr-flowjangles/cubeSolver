# 07 — Build plan

The implementation order is the order in this doc. Milestones are sequential, tasks within a milestone are ordered. **We check the boxes as we go.** When a milestone is fully checked, the next one starts.

If something forces us off this plan (a discovered constraint, a customer arriving early, etc.), we update this doc *first*, then change course. Don't drift silently.

The convention is `## M<N> — {Title}` so `make version-M<N>` can auto-resolve the milestone title from this file.

The **Now:** line below names the milestone(s) being worked on, comma-separated when there is more than one. Mission Control's phase pill and banner read it (`make catalog`).

**Now:** M0

## v1 — Definition of Done

v1 ships when **all** of the following are true:

- [ ] Docker image builds reproducibly (`make image`).
- [ ] *(add the project-specific outcomes that mean v1 is real.)*
- [ ] All milestones below are checked.
- [ ] `README.md` has a quickstart that a new operator can follow.

---

## M0 — Foundations

Goal: project skeleton and dev environment ready, no feature code yet.

- [ ] Initialize git repo, add `.gitignore` and `README.md`, make initial commit of design docs.
- [ ] Replace `cubesolver`, `Cube Solver`, `Game-style Rubik's cube tutorial PWA — beginner to CFOP, with camera scan to solve your own cube.`, `2026-11-04` placeholders across the repo.
- [ ] Add language manifest (`pyproject.toml` / `package.json` / etc.) with deps pinned and dev extras.
- [ ] Wire up `make setup` / `make test` / `make lint` / `make format` to your toolchain (replace the stubs in `Makefile`).
- [ ] Verify `make ci` passes on an empty test suite.
- [ ] Replace the `Dockerfile` stub with a real multi-stage build; verify `make image` builds and `make smoke` runs.
- [ ] Verify versioning ceremony: `./scripts/new-version.sh --dry-run "Smoke Test"` prints the plan without side effects.
- [ ] Fill in `docs/mission.md` and `docs/00-overview.md`.
- [ ] Sketch `docs/01-architecture.md` — at minimum, identify the contract artifact.
- [ ] Fill in `Versions/v0/v0.0.0/release-notes.md` for the bootstrap commit.

**Done when:** project builds, tests run (none yet), Docker image builds + smoke-tests, versioning ceremony runs cleanly, mission/overview/architecture have v1 content.

---

## M1 — {{first real milestone}}

Goal: ...

- [ ] ...

**Done when:** ...

---

<!--
Add subsequent milestones as the design firms up. Each milestone:
- Has a one-sentence goal.
- Has an ordered, checkable task list.
- Ends with a "Done when:" criterion that is binary.
- Use the `## M<N> — {Title}` heading format so `make version-M<N>` resolves.
- Mark a task blocked with `*(blocked: reason)*` in its text; Mission Control shows it apart from merely unticked.
-->
