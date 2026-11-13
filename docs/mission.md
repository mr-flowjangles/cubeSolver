# Cube Solver — Mission Statement

## Mission

- Teach anyone to solve a Rubik's cube, starting from zero.
- Make learning feel like a game: levels, XP, badges.
- Take players from the beginner method all the way to CFOP.
- Solve the player's own scrambled cube, step by step, from a camera scan.

## Who this is for

- **The public**: anyone with a 3x3 cube and a phone or computer.
- Includes total beginners who have never solved a cube.
- Includes beginners who want to move up to speedcubing (CFOP).
- Mostly on phones, cube in one hand, so big buttons and few words.

## What the tool must do

1. Teach the beginner layer-by-layer method, one stage per level.
2. Teach CFOP after the beginner method, as later levels.
3. Show every move on a 3D cube the player can turn and replay.
4. Award XP and badges, and lock later levels until earlier ones are passed.
5. Scan the player's real cube with the camera, one face at a time.
6. Let the player check and fix scanned colors before solving.
7. Guide the player through solving their scanned cube, move by move.
8. Save progress on the device.
9. Install to the home screen and work offline.

## Hard constraints

- **PWA**: installs like an app, runs offline after the first visit.
- **No server**: static files only, hosted on GitHub Pages.
- **No accounts**: no sign-in, no personal data collected.
- **Camera stays on the device**: images are never uploaded.
- **Works on phones and desktops**: iPhone Safari, Android Chrome, desktop browsers.

## Decisions already made

- Vite + TypeScript, no framework.
- Three.js for the 3D cube.
- Hosted on GitHub Pages from `mr-flowjangles/cubeSolver`, public repo.
- A wrong address under `/cubeSolver/` opens the app's start page instead of GitHub's 404 page.[1]
- Progress saved on the device only.
- Camera scan for entering a real cube, with a check-and-fix screen.

## Scope explicitly *out* of v1

- Accounts and syncing progress across devices.
- Puzzles other than the 3x3 cube.

## Working style

- Design before code. Decisions are written in `docs/` first.
- Deferred decisions go in `docs/99-open-questions.md`.
- A question found during coding pauses the work until the docs answer it.
- Three-part version numbers, one PR per version.
- Release notes live under `Versions/`.

---

## What this brief deliberately does NOT prescribe

- How many levels, and what each one teaches.
- XP amounts, badge list, and unlock rules.
- How the solver works out the moves for a scanned cube.
- How the camera reads sticker colors.
- Visual style and sound.

## Footnotes

- [1] Design decision, 2026-11-13.
