# 00 — Overview

## What this tool does

- A free web game that teaches you to solve a Rubik's cube.
- Levels walk you from your first solve to speedcubing (CFOP).
- Earn XP and badges as you pass levels.
- Scan your own scrambled cube with your phone camera.
- The game then guides you through solving it, move by move.

## Who it's for

- Anyone with a 3x3 cube, mostly on a phone.
- Total beginners through people learning to speedcube.

## v1 scope

**In scope:**

- Beginner layer-by-layer method, one level per stage.
- CFOP levels after the beginner method.
- 3D cube that shows every move, with replay.
- XP, badges, and locked levels.
- Camera scan, with a screen to check and fix colors.
- Guided solve of the scanned cube.
- Progress saved on the device.
- Installs to the home screen, works offline.

**Explicitly out of scope for v1:**

- Accounts and syncing across devices.
- Puzzles other than the 3x3.

## High-level flow

```
Learn path:   pick level ──▶ watch moves on 3D cube ──▶ practice ──▶ pass ──▶ XP + badge ──▶ next level unlocks

Solve path:   camera scan ──▶ check & fix colors ──▶ work out the moves ──▶ guide player move by move
```

## Reading order

**Design (the what and why):**

1. `mission.md` — why this exists.
2. **This doc** — the what.
3. `01-architecture.md` — the parts of the app and how they connect.

**Build (the how and when):**

7. `07-build-plan.md` — milestones, ordered tasks, checkboxes.

**Tracking:**

99. `99-open-questions.md` — what's not decided yet.

## North-star direction (post-v1)

- Not decided. See `99-open-questions.md`.
