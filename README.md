# Cube Solver

Game-style Rubik's cube tutorial PWA — beginner to CFOP, with camera scan to solve your own cube.

## Status

**Design phase.** The architecture, decisions, and rationale are recorded in `docs/`. No application code yet. Implementation starts at milestone **M0** in `docs/07-build-plan.md`.

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
├── Dockerfile                # ship target
├── .claude/agents/           # custom subagents shipped with this project
├── docs/                     # design + build plan
├── scripts/                  # ceremony scripts (versioning, vendor fetch, etc.)
├── infra/terraform/          # AWS deployment (defined when deployment is real)
├── src/                      # application code
├── tests/                    # test suite
└── Versions/                 # one folder per version, with release-notes.md
```

## Working norms

- Design before code. If implementation surfaces a question the docs didn't answer, stop and update the relevant doc (or `docs/99-open-questions.md`) before resuming.
- The build plan is authoritative. Tick milestones as they land; don't start the next milestone until the previous one's "Done when" is true.
- See `CLAUDE.md` for the full set of norms, the versioning ceremony, and the locked tech choices.

## License

Internal EHA project; license to be decided before any external distribution.
