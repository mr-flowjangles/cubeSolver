# Cube Solver

Game-style Rubik's cube tutorial PWA — beginner to CFOP, with camera scan to solve your own cube.

## Play

**https://mr-flowjangles.github.io/cubeSolver/**

- Works on phones and computers. Add it to your home screen to install it.
- Works offline after the first visit.
- No account, no tracking. Progress is saved in your browser.

## Quickstart (development)

```
make setup     # install dependencies
make dev       # run the app at http://localhost:4026
make test      # run the tests
make lint      # type-check and check formatting
make build     # build the app into dist/
make site      # Mission Control at http://localhost:4025
```

- Every push to `main` runs lint, tests and build, then publishes to GitHub Pages.
- `make serve-image` runs the built app in Docker at http://localhost:4027.

## Status

**v0.7 — M1 to M6 shipped.** M7 (launch checks) in progress. See `docs/07-build-plan.md`.

## Where to start

1. **`CLAUDE.md`** — repo-level context and working norms.
2. **`docs/00-overview.md`** — what we're building and why, plus the reading order for the rest of `docs/`.
3. **`docs/07-build-plan.md`** — milestones, ordered tasks, checkboxes. The action doc.

## Repo layout

```
.
├── CLAUDE.md                 # repo context for Claude sessions
├── README.md                 # this file
├── Makefile                  # `make help` for available targets
├── Dockerfile                # local test image (nginx serving the built app)
├── index.html, vite.config.ts# app entry and build/PWA setup
├── public/                   # icons
├── .claude/agents/           # custom subagents shipped with this project
├── docs/                     # design + build plan
├── scripts/                  # ceremony scripts (versioning, vendor fetch, etc.)
├── site/                     # Mission Control
├── src/
│   ├── cube/                 # cube model: stickers, moves, checks
│   ├── render/               # 3D cube
│   ├── solver/               # beginner and CFOP solvers
│   ├── lessons/              # level content
│   ├── game/                 # XP, badges, saving
│   ├── scan/                 # camera color reading
│   └── app/                  # screens
├── tests/                    # test suite
└── Versions/                 # one folder per version, with release-notes.md
```

## Working norms

- Design before code. If implementation surfaces a question the docs didn't answer, stop and update the relevant doc (or `docs/99-open-questions.md`) before resuming.
- The build plan is authoritative. Tick milestones as they land; don't start the next milestone until the previous one's "Done when" is true.
- See `CLAUDE.md` for the full set of norms, the versioning ceremony, and the locked tech choices.

## License

Not chosen yet — see `docs/99-open-questions.md`.
