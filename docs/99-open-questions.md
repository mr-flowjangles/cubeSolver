# 99 — Open questions

Decisions not made yet, with what would force them.

<!--
Format for each entry:

## {Question phrased as a question}

**Status:** open / resolved / deferred to v2
**Resolution trigger:** what would force this to become urgent.
**Notes:** discussion, ruled-out alternatives, current leaning.
-->

## Is the architecture and milestone order OK?

**Status:** resolved 2026-11-04
**Resolution trigger:** before M1 starts.
**Notes:** milestone order M1–M7 and the app parts in `01-architecture.md` both agreed 2026-11-04.

## Should colorblind players get symbols on stickers?

**Status:** resolved 2026-11-04
**Resolution trigger:** before the 3D cube (M1) and check-and-fix screen (M4).
**Notes:** cube colors red/orange and green/blue are hard for colorblind players.
**Decision:** stickers always keep their colors. An "ADA support" setting, off by default, adds a shape on each color (one shape per color).

## How many levels, and what does each teach?

**Status:** resolved 2026-11-04
**Resolution trigger:** before M2.
**Decision:** 9 beginner levels (0–8), listed in `02-levels.md`. Decided by Claude under the standing go-ahead; Rob to review.

## What are the XP amounts, badges, and unlock rules?

**Status:** resolved 2026-11-04
**Resolution trigger:** before M3.
**Decision:** in `03-game.md`. Decided by Claude under the standing go-ahead; Rob to review.

## How does the camera read colors?

**Status:** resolved 2026-11-04
**Resolution trigger:** before M5.
**Decision:** in `04-camera-scan.md`. Decided by Claude under the standing go-ahead; Rob to review.
**Notes:** red vs. orange is the hard case under indoor light.

## Should the solve path give the shortest solution, or the beginner-method one?

**Status:** resolved 2026-11-04
**Resolution trigger:** before M4.
**Notes:** beginner-method moves match what the player learned; shortest is ~20 moves but hard to follow.
**Decision:** guide with the method the player has learned (beginner or CFOP), step by step, each step explained. No shortest-solution option.

## Keep or remove the Docker stub?

**Status:** resolved 2026-11-04
**Resolution trigger:** M0 close-out.
**Notes:** the app is static files on GitHub Pages; Docker isn't needed to run it.
**Decision:** keep it for local testing. The image builds the app and serves it with nginx on port 4027 (`make serve-image`).

## Track usage on the public site?

**Status:** resolved 2026-11-04
**Resolution trigger:** before M7.
**Notes:** no tracking keeps the "no personal data" promise simple.
**Decision:** no tracking of any kind.
