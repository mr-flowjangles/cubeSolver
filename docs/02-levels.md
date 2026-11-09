# 02 — Levels

**Status:** decided by Claude under Rob's standing go-ahead, 2026-11-04. Rob to review.

## Every level is a tutorial (Rob, 2026-11-04)

**This is a tutorial, not a test.** Shipped levels drop the player on a scrambled cube and say "figure it out". That is wrong and is being rebuilt (M8).

Every level runs in three parts:

1. **Show it.** The app does the step slowly on the cube. Plain words say what is happening and why.
2. **Walk through it.** The player does it while the app names each move, lights up the piece being moved and its target spot, and makes the right button glow. A wrong turn is undone with a correction.
3. **Then try it.** Only now a practice cube, with Hint and Show me. The first cubes are easy (one piece left), then harder.

Rules that follow from it:

- Never ask the player to do something the level hasn't shown.
- Every move on screen gets a plain-words reason ("this lifts the white edge out of the way").
- Pieces are named by their colors ("the white–orange edge") and lit up, not described by position alone.
- White cross uses the **daisy**: put the 4 white edges around the yellow center on top (visible), then match each with its center and turn it down with F2.

How the three parts are built (v0.8.4):

- **Show it** and **Walk through it** use the same demo cube every time.
- The moves come from the solver, so they are the moves Hint and Show me use.
- A half turn the buttons don't have (U2) is two taps.
- The daisy never turns the left, back or bottom: the player can't see them. It turns the whole cube instead.
- The daisy never knocks a white edge off the top on the way.
- White edges already finished on the bottom stay there.
- **Try it** has 3 practice cubes: one step left, about three steps left, then fully mixed. The level passes on the third.
- Levels after White cross already run in three parts. Their per-move reasons are still generic ("Move 2 of 4") until rebuilt.

## Beginner method (M2)

- The standard 7-stage layer-by-layer method, white on the bottom.
- White on the bottom from the start, the same as CFOP, so moving up later needs no re-learning.
- One level per stage, plus a notation level first and a full solve last.

| # | Level | Passed when | Sequence taught |
|---|---|---|---|
| 0 | Learn the controls | 10 turns made as asked | — |
| 1 | White cross | 4 white edges on the bottom, matching centers | none — the daisy, then F2 for each edge |
| 2 | White corners | white layer done | `R U R' U'` (repeat) |
| 3 | Middle edges | first two layers done | `U R U' R' U' F' U F` / `U' L' U L U F U' F'` |
| 4 | Yellow cross | yellow plus on top | `F R U R' U' F'` |
| 5 | Yellow edges | top edges match centers | `R U R' U R U2 R' U` |
| 6 | Yellow corners into place | top corners in the right spots | `U R U' L' U R' U' L` |
| 7 | Twist yellow corners | cube solved | `R' D' R D` (repeat) |
| 8 | Full solve | cube solved from a full scramble | all of the above |

## CFOP (M6)

- Unlocks after Full solve.
- Teaches the "4-look last layer" first: the standard first step into CFOP.
- Then Full PLL (all 21 cases) and a full CFOP solve.

| # | Level | Passed when | Sequences taught |
|---|---|---|---|
| 9 | Cross in one go | white cross done; Hint shows the shortest | none |
| 10 | F2L pairs | first two layers done | 6 short inserts |
| 11 | OLL 1: yellow cross | yellow plus on top | Line, L shape |
| 12 | OLL 2: yellow face | whole top yellow | Sune, Antisune, H, Pi, Headlights, T, Bowtie |
| 13 | PLL 1: corners | top corners in place | T-perm, Y-perm |
| 14 | PLL 2: edges | cube solved | Ua, Ub, H, Z |
| 15 | Full PLL | a random PLL case solved | all 21 PLLs |
| 16 | CFOP solve | cube solved from a full scramble | all of the above |

- CFOP levels get extra buttons: M, M2, r, f, x.
- Full OLL (57 cases) is not in v1 — see open questions.
- Solve my cube guides with CFOP once F2L pairs is passed.

## Timer

- For real-cube solves: scramble shown, tap (or Space) to start and stop.
- Shows best time and average of 5 (last 5, drop best and worst).
- Under 60 s and under 30 s earn badges; no XP, since times can't be checked.

## Controls

- Buttons are grouped by side: Top, Right, Front, Bottom, Left, Back, Whole cube.
- Each button shows the standard letter (what every cube guide uses), the side's name, and an arrow for which way the front edge moves.
- CFOP levels show letters only, plus Middle and two-layer turns (M, r, f) and x.
- FRONT · F, TOP · U and RIGHT · R tags float next to the cube and never turn: letters mean places, not colors.
- Dragging the view is limited to about 40° and springs back to the front on release.
- **See back** swings round to show the back; any turn swings back to the front first.
- Based on a research pass of ruwix, J Perm, the official Rubik's guide and the cubing.js viewer.

### Touch controls (decided by Rob, 2026-11-06; built in v0.8.7)

- **Swipe on a sticker:** the row or column under your finger turns the way you swiped.
- **Swipe on the background:** turns the whole cube.
- **In free play** a background swipe is a real whole-cube turn: swipe left twice and the back becomes the front.
- **In lessons** the cube springs back when you let go, because lesson steps need green in front.
- **Buttons stay.** Lessons still show the move letters; See back stays as a one-tap look at the back.
- In lessons, dragging beside the cube is still the 40° look-around that springs back.
- A swipe only makes moves the screen's buttons have, so a lesson never gets a turn it doesn't teach. Swiping a middle row in a beginner level says to use a row with a button.
- Free play also allows middle rows (M, E, S) and up/down whole-cube turns (x).
- A swipe that starts while the cube is turning is ignored, because the stickers aren't in place yet.

## How a level works

- Practice cube: a random scramble with every earlier stage already done.
- Level 7 (twist yellow corners): easier practice cubes have fewer twisted corners, never a cube stopped part-way, because part-way the bottom is scrambled.
- **Hint** shows the next step in words and moves.
- **Show me** plays the next step on the cube.
- **New cube** gives a fresh practice cube.
- Levels 1–2 show the cube from below, so the white side is visible.

## How the guide works out the moves

- Cross: finds the fewest turns for each edge, one edge at a time.
- Every later stage: tries short combinations of top turns, whole-cube turns and that stage's taught sequence.
- So Hint and Show me only ever use what the level teaches.
- Beginner: tested on 500 random scrambles; slowest about a quarter second.
- CFOP: tested on 500 random scrambles; slowest about half a second. Times depend on the device.
- Every CFOP sequence is checked by the cube model: last-layer ones keep the bottom two layers, and the 21 PLLs are all different cases.
