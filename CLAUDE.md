# Cube Solver

Game-style Rubik's cube tutorial PWA — beginner to CFOP, with camera scan to solve your own cube.

## Ownership
Account: Personal — mr-flowjangles
Commit identity: Rob Rose <robmrose@me.com>

## Current state

**Building.** M1–M2 shipped, live at https://mr-flowjangles.github.io/cubeSolver/. Test hooks: `?moves=R%20U&instant=1#/play`, `?ada=1`, `?autoshow=1#/level/<id>`.

## How to read this repo

1. Start with `docs/00-overview.md` for the elevator pitch and scope.
2. `docs/01-architecture.md` is the spine — module map and the contract artifact between modules.
3. Subsystem deep-dives (`02-` through `06-`) cover individual concerns. Add them as the architecture firms up.
4. `docs/07-build-plan.md` is the **implementation checklist** — milestones in order, boxes to tick as we go.
5. `docs/99-open-questions.md` tracks decisions explicitly deferred from v1.

## Working norms for this project

- **Standing go-ahead (Rob, 2026-11-04):** build M1–M7 without asking. For each milestone: commit, push, open the PR, merge to `main`, report after. Claude also decides the level list, XP/badge rules, and camera color reading, recorded in `docs/` for Rob to review.

- **Design before code.** Decisions are aligned in conversation, recorded in `docs/`, then implemented. Don't write code that contradicts a doc — update the doc first.
- **The build plan is authoritative.** `docs/07-build-plan.md` is the order of work and the source of truth for "are we done." Tick boxes as tasks land. Do not start a new milestone before the previous one's "Done when" is true.
- **Surfacing unanticipated decisions.** If implementation reveals a question the design didn't answer, *stop coding*, update the relevant doc (or `99-open-questions.md`), then resume. No silent decisions in code.
- **The contract artifact is the spine.** Identify in `01-architecture.md` the one canonical intermediate representation that every module produces or consumes. When in doubt, route through it.

## Mission Control

- **Mission Control is the source of truth Rob reads.** He reads this page, not the `docs/*.md` files. A fact that is only in a doc is not documented as far as he is concerned.
- **`make site` opens it** at http://localhost:4025. It is one page, `site/index.html`, reading `site/catalog.json`.
- **Some of `site/catalog.json` is made from the docs** by `make catalog`:
  - Build progress and the Definition of Done, plus the phase and banner — from `docs/07-build-plan.md` (its checkboxes and its `**Now:**` line).
  - Open decisions — from `docs/99-open-questions.md`.
  - Glossary — from the "Domain vocabulary" section below.
  - Design — every `docs/*.md`, shown as a web page.
- **The rest is written by hand** in `site/catalog.json`: `project` (name and repo), `services` (the Status tab), `sections` (the Home tab).
- **After changing a doc, run `make catalog`** and commit the new `site/catalog.json` with it.
- **Never hand-edit the made-from-docs parts.** The next `make catalog` overwrites them. Change the doc instead.
- `make standalone` writes a one-file copy to `build/` that opens without a server.

## Domain vocabulary

<!-- One line per term: a dash, the term in bold, an em dash, then the plain-words meaning. `make catalog` puts these on Mission Control's Glossary tab. -->

- **ADA support** — a setting, off by default, that adds a shape to each sticker color for colorblind players.
- **Beginner method** — the standard first way to solve a cube, one layer at a time, about 7 stages.
- **CFOP** — the most common speedcubing method, named for its four steps: Cross, F2L, OLL, PLL.
- **Cross** — first CFOP step: four edge pieces placed to make a plus sign on one face.
- **Cube state** — the color of all 54 stickers; the one piece of data every part of the app passes around.
- **F2L** — "first two layers": second CFOP step, solving the bottom two layers in pairs.
- **Move notation** — standard letters for turns: R, L, U, D, F, B; an apostrophe means counter-clockwise, a 2 means a half turn; y turns the whole cube.
- **Free play** — the screen where you turn and scramble the cube with no lesson.
- **Hint** — lesson button that says the next step in words and moves.
- **Level** — one lesson; passing it is the goal. Beginner levels are numbered 0–8.
- **OLL** — "orient last layer": third CFOP step, making the top face one color. 57 cases.
- **PLL** — "permute last layer": final CFOP step, moving top pieces into place. 21 cases.
- **PWA** — progressive web app: a website that installs to the home screen and works offline.
- **Practice cube** — the cube a level starts you on: a random scramble with every earlier stage already done.
- **Scramble** — a random list of moves used to mix up a cube.
- **Show me** — lesson button that plays the next step on the cube.
- **Stage** — one step of a solving method, e.g. White cross. Each beginner level teaches one stage.
- **XP** — experience points earned by passing levels.

## Subagents — when to delegate

This project ships with a `.claude/` directory containing custom subagents. Subagents are separate Claude instances spawned via the `Agent` tool; each runs in its own context window with a narrowed tool allowlist and returns a single summary to the parent. The reason to use them is **context hygiene** — keep the main conversation focused while messy, verbose, or read-only work happens elsewhere.

### Built-in agents worth knowing

- **`Explore`** — read-only codebase / docs search. Use it for cross-file investigations ("where is X defined", "which files reference Y") before making changes.
- **`Plan`** — design an implementation strategy before touching code. Use it before starting a milestone task in `docs/07-build-plan.md`.
- **`general-purpose`** — open-ended research and multi-step tasks when no other agent fits.

### Project-specific agents (ship in `.claude/agents/`)

- **`docs-consistency`** — cross-checks the design docs for internal contradictions. Run after editing `docs/01-architecture.md`, `docs/07-build-plan.md`, or any subsystem doc. *Especially* before opening a PR that touches design.
- **`release-notes-factcheck`** — verifies the topmost block of the current minor's `release-notes.md` against the branch diff. Run after drafting notes and before opening a PR.
- **`mission-control-factcheck`** — checks Mission Control's hand-written Home and Status content against the code. Run before a PR that touches `site/catalog.json`'s `sections` or `services`.

### When to delegate vs. just do it

- **Delegate** when the task is read-only verification, broad search, planning, or generates verbose intermediate output the main conversation won't reference later.
- **Don't delegate** for single targeted edits you already know how to make, work that needs iterative back-and-forth, or anything whose result needs to fold into ongoing conversation. Subagents start cold — re-establishing context costs more than the cleanup buys.

### Writing good subagent prompts

A subagent does not see this conversation. Brief it like a smart colleague who just walked in: include file paths, what to check, what shape of answer you want. **Never delegate understanding** — don't write "based on your findings, fix the bug." The parent owns synthesis; the subagent owns the legwork.

### Adding new agents

Drop a file at `.claude/agents/<name>.md` with the standard frontmatter (`name`, `description`, `tools`, `model`) and a self-contained system prompt. The pattern fits when the task is read-only or narrowly scoped, produces verbose intermediate output, and is reusable.

## Local dev infrastructure

This project runs alongside the [app-catalog](file://~/_EHA/AI_EHA/app-catalog) dashboard on Rob's machine. Two integrations matter:

- **Port allocation.** Host ports are assigned by app-catalog's banded port registry (web → 4000s, api → 4100s, db → 5500s, etc.). When this project needs a host port, invoke the **`bellese-new-port`** Claude skill — it figures out slug / name / category / internal port from context and calls `portctl allocate`. The skill is idempotent, so re-running it just reports the existing assignment.
- **Dashboard tile (optional).** To show this project on the app-catalog dashboard, hand-add an entry to `~/.app-catalog/catalog.yaml` (copy an existing entry like `career-ops` as a template). The port allocation is independent — you can allocate without appearing on the dashboard, and vice versa.

## Versioning

Every PR is a version. Three-part semver, one stacked release-notes file per **minor** under `Versions/`.

```
Versions/
└── v{major}/
    └── v{major}.{minor}/
        └── release-notes.md     # newest patch at top, oldest at bottom
```

Each minor file is structured as:

```
# v{major}.{minor}

## v{major}.{minor}.{patch} — Title (YYYY-MM-DD)   ← newest at top
### Problem
### Solution
### New / Changed / Fixed / Files Changed

## v{major}.{minor}.{patch-1} — …
…
```

**Start a new version:**

```
./scripts/new-version.sh "Short Description"        # patch bump (default)
./scripts/new-version.sh --minor "Short Description"
./scripts/new-version.sh --major "Short Description"
./scripts/new-version.sh --dry-run "Short Description"
```

The script:
1. Refuses to run on a dirty working tree.
2. Finds the latest version by scanning H2 headings (`## v{maj}.{min}.{pat} …`) across `Versions/v*/v*/release-notes.md`, bumps it.
3. Creates a branch named `V{major}dot{minor}dot{patch}/{Description_With_Underscores}`.
4. **Patch bump** → prepends a new H2 stub at the top of the existing minor's file (just under the H1). **Minor / major bump** → creates a new `Versions/v{major}/v{major}.{minor}/release-notes.md` with the H1 + first H2 stub.
5. You fill in the notes as you implement, commit alongside the code, open a PR.

The Makefile has shortcuts:

```
make version                          # patch bump (interactive prompt)
make version DESC="Short Description" # patch bump (one-shot)
make version-minor DESC="..."         # minor bump
make version-major DESC="..."         # major bump
make version-M1                       # minor bump, title auto-resolved from docs/07-build-plan.md
```

**Bump conventions for this project:**

- **Patch** — most PRs (a single milestone task, a bug fix, a small refinement).
- **Minor** — completion of a milestone (M0, M1, etc. in `docs/07-build-plan.md`).
- **Major** — `v1.0.0` is the v1 Definition of Done. Don't bump major casually.

**v0** is the pre-release line — design and foundations. We move to **v1.0.0** when the v1 Definition of Done at the top of `docs/07-build-plan.md` is fully checked.

### PR rules

- **PR title must be `v{version} — {short description}`**, matching this patch's H2 heading in the minor's `release-notes.md` (minus the date suffix). Example: `v0.0.1 — Versioning Bootstrap`. The version number makes the PR list scannable as a release log.
- **Rob initiates PRs.** Claude creates the branch (via `new-version.sh`) and fills in the release notes during implementation, but does **not** push the branch or run `gh pr create` until Rob explicitly says so ("open the PR" / "create the PR"). Local commits are fine.

## Tech choices (locked)

<!-- Fill these in after stack decisions are made. Keep this section short and definitive. -->

- Language: TypeScript
- Framework: none — Vite build, Three.js for 3D
- Tests: Vitest
- Deployment: static PWA on GitHub Pages
