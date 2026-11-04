# 07 — Build plan

The implementation order is the order in this doc. Milestones are sequential, tasks within a milestone are ordered. **We check the boxes as we go.** When a milestone is fully checked, the next one starts.

If something forces us off this plan (a discovered constraint, a customer arriving early, etc.), we update this doc *first*, then change course. Don't drift silently.

The convention is `## M<N> — {Title}` so `make version-M<N>` can auto-resolve the milestone title from this file.

The **Now:** line below names the milestone(s) being worked on, comma-separated when there is more than one. Mission Control's phase pill and banner read it (`make catalog`).

**Status: milestone order M1–M7 agreed 2026-11-04.**

**Now:** M8

## v1 — Definition of Done

v1 ships when **all** of the following are true:

- [ ] Live on GitHub Pages, installable on iPhone and Android.
- [ ] Works offline after the first visit.
- [x] A beginner can go from level 1 to a full solve using only the app.
- [x] CFOP levels are playable.
- [ ] Camera scan of a real cube leads to a guided solve.
- [ ] Every level walks the player through: show it, walk through it, then try it.
- [ ] All milestones below are checked.
- [x] `README.md` has a quickstart.

---

## M0 — Foundations

Goal: project skeleton and dev environment ready, no feature code yet.

- [x] Initialize git repo, add `.gitignore` and `README.md`, make initial commit of design docs.
- [x] Replace placeholders across the repo.
- [x] Add `package.json` (Vite, TypeScript, Three.js, Vitest, Prettier).
- [x] Wire up `make setup` / `make test` / `make lint` / `make format`.
- [x] Verify `make ci` passes on an empty test suite.
- [x] Docker image for local testing: `make image`, `make smoke` passes.
- [x] Verify versioning ceremony: `./scripts/new-version.sh --dry-run "Smoke Test"`.
- [x] Fill in `docs/mission.md` and `docs/00-overview.md`.
- [x] Sketch `docs/01-architecture.md`.
- [x] Fill in `Versions/v0/v0.0/release-notes.md` for the bootstrap commit.

**Done when:** project builds, tests run, versioning ceremony runs cleanly, mission/overview/architecture have v1 content.

---

## M1 — Cube and live site

Goal: a 3D cube you can turn, live on GitHub Pages as an installable PWA.

- [x] Cube model: cube state, all moves, scramble. Fully tested.
- [x] 3D cube: draw, animate moves, spin the view.
- [x] PWA setup: offline, home-screen install.
- [x] GitHub Pages deploy on every push to `main`.

**Done when:** the live site shows a cube you can turn and scramble, on a phone, offline.

---

## M2 — Beginner levels

Goal: the beginner method, taught one stage per level.

- [x] Beginner solver, stage by stage, tested on many random scrambles.
- [x] Level content for each beginner stage.
- [x] Lesson screen: explain, show moves, practice, pass check.

**Done when:** a player can learn a full beginner solve in the app.

---

## M3 — Game layer

Goal: XP, badges, locked levels, saved progress.

- [x] XP and badge rules.
- [x] Unlocks: later levels locked until earlier ones are passed.
- [x] Progress saved on the device.

**Done when:** progress, XP, and badges survive closing and reopening the app.

---

## M4 — Solve my cube

Goal: enter a real cube and get guided through solving it.

- [x] Tap-to-fix cube map (also used after camera scan).
- [x] Check that an entered cube is possible to solve.
- [x] Guided solve: one move at a time, grouped by stage.

**Done when:** a cube entered by hand is solved by following the guide.

---

## M5 — Camera scan

Goal: scan a real cube instead of entering it by hand.

- [x] Camera capture, one face at a time, with a framing guide.
- [x] Read sticker colors.
- [x] Hand off to the check-and-fix screen.

**Done when:** a real cube scanned on iPhone and Android leads to a correct guided solve.

---

## M6 — CFOP levels

Goal: teach CFOP after the beginner method.

- [x] Cross, F2L, OLL, PLL levels.
- [x] CFOP move-sequence lists, each checked by the cube model.
- [x] Solve timer and personal bests.

**Done when:** a player who finished the beginner levels can learn and practice full CFOP.

---

## M7 — Launch

Goal: polished and public.

- [ ] Test on real iPhone and Android devices. *(blocked: needs Rob with real phones — see `05-phone-check.md`)*
- [x] README quickstart.
- [ ] v1 Definition of Done all checked.

**Done when:** v1 Definition of Done is fully checked.

---

## M8 — Guided lessons

Goal: every level teaches step by step (see `02-levels.md` → Every level is a tutorial). Must land before M7's launch.

- [x] Lesson engine: Show it → Walk through it → Then try it, as data per level.
- [x] Walk-through: name each move, light the piece and its target, glow the button, undo wrong turns with a correction.
- [ ] Plain-words reason for every move shown.
- [x] White cross rebuilt with the daisy (two parts: daisy, then cross).
- [ ] Every beginner level rebuilt in the three parts.
- [ ] Every CFOP level rebuilt in the three parts.
- [x] Practice cubes start easy (one piece left), then get harder.
- [x] Tests: each level's walk-through ends with the stage done.

**Done when:** a first-time player can finish every level without guessing, and a headless walk-through passes every level.
