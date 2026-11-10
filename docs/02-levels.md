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
- Levels after White cross already run in three parts. A move with no reason of its own says what it does in words, e.g. "The right side goes up."[1]

## Beginner method (M2)

- The standard 7-stage layer-by-layer method, white on the bottom.
- White on the bottom from the start, the same as CFOP, so moving up later needs no re-learning.
- One level per stage, plus a notation level first and a full solve last.

| # | Level | Passed when | Sequence taught |
|---|---|---|---|
| 0 | Learn the controls | 13 swipes, then the trick: the same 4 moves six times | `R U R' U'` (6 times brings the cube back) |
| 1 | White cross | 4 white edges on the bottom, matching centers | none — the daisy, then F2 for each edge |
| 2 | White corners | white layer done | `R U R' U'` (repeat) |
| 3 | Middle edges | first two layers done | `U R U' R' U' F' U F` / `U' L' U L U F U' F'` |
| 4 | Yellow cross | yellow plus on top | `F R U R' U' F'` |
| 5 | Yellow edges | top edges match centers | `R U R' U R U2 R' U` |
| 6 | Yellow corners into place | top corners in the right spots | `U R U' L' U R' U' L` |
| 7 | Twist yellow corners | cube solved | `R' D' R D` (repeat) |
| 8 | Full solve | cube solved from a full scramble | all of the above |

### Level 0: learn to turn the cube[1]

- Written for a 10-year-old. No letters: the arrow shows every move.
- One line at the top: "Learn to turn the cube. Swipe where the arrow shows." No goal paragraph, no list.
- **Part 1:** 13 swipes, one plain sentence each, e.g. "Swipe the right side up." The whole cube turns left and back, then tips up and back, since Hint can ask for either.[1][3]
- **Every move prints a line** in a list under the cube, e.g. "The right side went up."
- **Part 2, the trick:** a fresh solved cube. Follow the arrows for the same 4 moves, 6 times (24 swipes). The cube gets mixed up, then comes back solved.
- The trick is `R U R' U'` six times, which always returns the cube to where it started (checked by the app's own cube model in the tests). The letters show only as a small caption.
- Passing the level means finishing the trick.

### Level words checked by a kid test[1]

- Each level's words were written as code and run on 200 practice cubes, as a 10-year-old who knows only what the screen says. A test repeats it on 20 cubes per level.
- Every step the words left out is now said: how to lift an edge into the daisy, turning the whole cube so the spot is at front-right, which center means Edge right, how to pop out a stuck edge, and the last top turn.
- Full solve lists every sequence, so it can be done without Hint.
- **Second round.**[1] The words never say "hold". They say "turn the whole cube" or "turn the top", because the two give different results.
- Front-right and the L's back-left are said in plain words where they're first used.
- Full solve opens with a one-line recap of every level.
- Every move in Show it and Walk through it gives a reason, e.g. "Corner sequence, round 2 of 3, move 3 of 4: the right side goes down."
- Levels 2 and 3 light the piece being placed and its home. Levels 4–7 move many pieces at once, so nothing lights, and Show it doesn't promise it.
- Each beginner demo cube is the shortest of 200 that plays every sequence the level teaches and shows the level's harder cases: a corner lifted out and Corner repeated (level 2), a stuck edge popped out (level 3), the dot case (level 4).
- **Third round.**[3] Hint, Show me and the demo for levels 1, 2, 3, 5 and 6 follow the level's words step for step, so they never do what the words don't say.
- Pieces the camera can't show: level 1 says to tip the cube to look underneath, level 2 to look at the top, then tip it back.[3]
- Level 7 starts by turning the top, never the whole cube, so Hint never turns the whole cube in the twist stage.[3]
- A lift-out lights the piece and the top spot it goes to, not its home.[3]
- Level 1's words keep the daisy to the front, top and right: a middle-row edge is first turned to front-right, and part 2 turns the cube so the edge's side faces you, then turns the front twice.
- A move's reason and its words are shown separately. The words come from the arrow's move, so they stay right after the player turns the whole cube.
- A half turn's reason says which of its two swipes it is.
- "In its right spot" says the colors don't have to face the right way yet; level 7 says to check only after a whole sequence.
- **On every build,** a plain program that knows only the tutorial's words (no solver, no Hint, no AI) solves 2,000 scrambles.[3] Each rule it follows quotes a "How it works" line, and the test fails if that line's wording changes. It stops instead of guessing when the words run out.
- **Each kid-test finding is sorted by what it affects:** blocks a kid from solving, gives wrong help, or wording only. Each one fixed gets a test, so later runs can only find new things.[3]
- Level 1 says to keep going with the same white edge until it's on top. Re-picking a different edge after each turn looped forever on a cube with all four white edges on one side.[3]

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

- **No buttons.** You turn the cube by swiping on it.[1]
- **Swipe a sticker:** the row or column under your finger turns the way you swiped.[2]
- **Swipe beside the cube:** turns the whole cube. Left or right is y, up or down is x. Swipe left twice and the back becomes the front.[1]
- **Arrows only, no letters.**[1] The arrow on the cube shows every move: in lessons, in Hint, and in the guided solve of your own cube. Whole-cube turns show the arrow beside the cube.
- **Letters stay only as a small caption** under each sequence on a level page and in the guided solve, for anyone who wants them for a real cube.[1]
- **Tap a sequence and the arrow walks you through it** on the cube, one move at a time, so a player never has to read the letters.[1] It works in Try it and on the PLL and full-solve levels, and doesn't count as help.
- **Hint** says the step in words and puts the arrow on the cube for each move of it.[1]
- **No dimming.** The cube keeps its real colors while an arrow shows; lessons still light the piece being moved and where it goes.[1]
- The FRONT / TOP / RIGHT tags hide while an arrow shows, so nothing covers it.
- Arrows go on the front first, then the right side, then the top or bottom. Back turns show on the right side's back column.
- **Turning the whole cube in a lesson is fine.**[1] Hint and Show me plan from the cube as it is.
- **Walk through it asks you to turn the cube back.**[3] After a whole-cube turn, an arrow beside the cube shows how to turn it back, then the lesson goes on. Renaming the moves instead left the words naming the wrong side, and after a tip asked for a turn no swipe makes.
- **Half turns** (U2) are two swipes.
- **Two-layer turns** are two swipes: r is R then M', f is F then S.
- **Beginner levels have no middle rows**, since turning one moves the centers. Swiping one says so. CFOP levels and free play allow middle rows.
- **Keyboard:** a letter turns clockwise, Shift+letter the other way: U R F D L B, y, x, and M in CFOP.
- FRONT, TOP and RIGHT tags float next to the cube and never turn: they name places, not colors.
- A swipe that starts while the cube is turning is ignored, because the stickers aren't in place yet.
- Caption letters follow standard notation, from a research pass of ruwix, J Perm, the official Rubik's guide and the cubing.js viewer.

## How a level works

- Practice cube: a random scramble with every earlier stage already done.
- Level 7 (twist yellow corners): easier practice cubes have fewer twisted corners, never a cube stopped part-way, because part-way the bottom is scrambled.
- **Hint** shows the next step in words and moves.
- **Hint fixes earlier steps first.**[3] After a wrong turn or a tip, it plans from the cube as it is: "First fix the white cross", then this level's step. It never says "Already done!" on an unfinished cube.
- **Hint partway through a sequence says to finish it.**[3] If the player's last moves are the start of one of the level's sequences, Hint shows the rest of it, not "First fix the white cross". Partway through the twist stage it stays on the twist: the bottom is meant to look messy.
- Hint's "hold the cube" step uses only turns a swipe can make: up, down, left, right.[3]
- Try it's three cubes are labelled easiest, a bit harder, fully mixed. They no longer promise a number of steps.[3]
- **How Hint chooses.**[3] It looks at three options: carry on from here, turn back the last move, or turn back the last two. Each first finishes a sequence the player started, if any. It carries on unless that would redo a stage the player had finished; then it turns back. So a player following the plan is never told to turn back.
- "A sequence you started" means the player's last swipes are its start (a half turn counts as two swipes), it isn't only top turns, and finishing it gets back at least what the player had before starting it. Corner and Swap edges both start the same way; only the one really under way counts.
- After a stray turn Hint says "Turn your last move back first". After a tip or turn of the whole cube it says "You turned the whole cube. Turn it back first."
- A look and look-back (or a turn put right by hand) at the very end of the moves counts as nothing: the cube is as it was.[3]
- Pressed again partway through its own step (one swipe into "turn the front twice"), Hint gives the rest of that step instead of a new plan.[3]
- The "hold" step asks only for white on the bottom; no level says which side faces you.[3]
- A daisy step that turns the whole cube partway is split there, so the lit squares are right before and after the turn.[3]
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

## Footnotes

- [1] Design decision, 2026-11-09.
- [2] Design decision, 2026-11-06.
- [3] Design decision, 2026-11-10.
