# 01 — Architecture

**Status: agreed 2026-11-04.**

## The spine

- Everything passes around one thing: the **cube state**.
- Cube state = the color of all 54 stickers.
- The camera produces a cube state.
- The solver reads a cube state and returns a list of moves.
- The 3D cube draws a cube state and animates moves on it.
- Lessons start from a set cube state and check the player's result.

```
camera scan ──▶ cube state ──▶ solver ──▶ moves ──▶ 3D cube (shows each move)
lesson      ──▶ cube state ──────────────────────▶ 3D cube ──▶ pass/fail ──▶ XP
```

## Why this shape

- Each part can be built and tested alone.
- The camera can be swapped for tap-to-fix input without touching the solver.
- Solver logic is tested with plain data, no 3D or camera needed.
- No server: everything runs in the browser.

## Modules

### Cube model

- Holds a cube state and applies moves (R, U, F, L, D, B and their variants).
- Standard cube notation, the same one every tutorial uses.
- No drawing, no camera. Pure data, heavily tested.

### 3D cube

- Draws a cube state with Three.js.
- Animates moves, lets the player spin the view, replays steps.

### Solver

- Beginner solver: works out moves stage by stage, same stages the lessons teach.
- CFOP: uses the standard published move-sequence lists (F2L, OLL, PLL).
- Output: moves grouped by stage, so the guide can explain each one.

### Lessons

- One level per stage: what it teaches, start position, pass check.
- Lesson content is data, not code.

### Game

- XP, badges, unlock rules.
- Saves progress on the device.

### Camera scan

- Reads one face at a time from the camera.
- Turns sticker colors into a cube state.
- Ends on the check-and-fix screen.

### App shell

- Screens and navigation.
- PWA setup: offline, installable.

## The contract: cube state

```ts
// 54 stickers, 9 per face, faces in the order U, R, F, D, L, B.
// Each sticker is the face it belongs to when solved.
type Face = "U" | "R" | "F" | "D" | "L" | "B";
type CubeState = Face[]; // length 54
type Move = string; // standard notation: "R", "U'", "F2", ...
```

- Same layout most cube solvers use, so published test cases work as-is.

## File layout

```
cubeSolver/
├── docs/
├── site/               # Mission Control
├── src/
│   ├── cube/           # cube model
│   ├── render/         # 3D cube
│   ├── solver/
│   ├── lessons/
│   ├── game/
│   ├── scan/           # camera scan
│   └── app/            # screens, PWA setup
└── tests/
```

## Who talks to whom

| Part        | Owns                          | Talks to                  |
| ----------- | ----------------------------- | ------------------------- |
| Cube model  | cube state, moves             | everyone                  |
| 3D cube     | drawing, animation            | cube model                |
| Solver      | working out moves             | cube model                |
| Lessons     | level content, pass checks    | cube model, solver        |
| Game        | XP, badges, unlocks, saves    | lessons                   |
| Camera scan | reading colors                | cube model                |
| App shell   | screens, offline, install     | all of the above          |

## Non-goals

- No server, no database, no accounts.
- No puzzles other than the 3x3.
