# v0.8

## v0.8.14 — Kid test round 3 (2026-11-10)

### Problem

A third kid test found a 10-year-old could solve the cube from the words, but:

- Walk through it: after the player turned the whole cube, the words described the old move (v0.8.13 put the move's words inside the reason, and only the arrow got renamed).
- Hint, Show me and the demo broke the level's rules: Swap edges with 0–1 edges matching (162 of 380), Corner with no white corner at front-right (102 of 1,180), and Edge left to pop out a stuck edge.
- Level 6's "in place" read strictly got stuck on 228 of 240 cubes. Level 7's "until yellow is on top" allowed stopping mid-sequence.
- Level 1's make-room rule contradicted itself for an edge already on top. A half turn's reason showed on both swipes.
- Demos skipped the harder cases; "twisted corner" and front-right were unclear; level 8's recap left out special cases.

### Solution

Hint, Show me and the demo for levels 2, 3, 5 and 6 now follow the level's words step for step. The screen shows the reason and the arrow's own words separately. Design: docs/02-levels.md → "Level words checked by a kid test".

### New

- Tests: Corner starts with a white corner at front-right, a stuck edge pops out with Edge right, Swap edges starts with two edges matching.
- Tests: demos show the harder cases; a half turn's reason says which swipe.
- Tutorial player test, every build: a plain program using only the tutorial's words (no solver, no Hint, no AI) solves 2,000 scrambles. It checks each line it follows word for word.

### Changed

- Level 2, 3, 5 and 6 planning: rules from the words instead of a search.
- Demo cubes: shortest of 200 that shows the harder cases (lift-out, pop-out, dot).
- Words: levels 1, 2, 6, 7 and the level 8 recap. Level 1 adds "Keep going with that same edge until it's on top": without it, one reading looped forever on 1 cube in a few thousand.
- Cross reasons say "this side" instead of naming a side.

### Fixed

- Walk-through words stay right after a whole-cube turn.

### Kid test round 4: what each finding affects

| Finding | Impact | Affects | Test now |
|---|---|---|---|
| Hint gives up after one wrong turn or a tip ("Already done!" on unfinished cubes) | Wrong help | Try it, levels 1–16 (Hint, Show me) | `walkthrough.test.ts`: Hint finishes every level after a wrong turn or tip |
| Walk through it after a whole-cube turn: words name the wrong side; after a tip, asks for a turn no swipe makes | Wrong help | Walk through it, levels 1–16 | Checked in Chrome: tip, arrow to turn back, lesson goes on |
| Level 7 Hint turns the top where the words say turn the whole cube | Wrong help | Level 7 Hint, Show me, demo | `walkthrough.test.ts`: level 7 never starts with a top turn |
| Level 1 Hint keeps finished bottom edges; words said bring all 4 up | Wording | Level 1 | Tutorial player still solves 2,000 |
| Level 2 never said top corners before stuck ones (26/150 looped) | Wording | Level 2 | Tutorial player |
| Level 7 "yellow on top" read as the whole top (stuck every time) | Wording | Level 7, level 8 recap | Tutorial player |
| Level 1 make-room line came after the moves it covers | Wording | Level 1 | Tutorial player |
| Level 3 "right center", "stuck" unclear | Wording | Level 3 | Tutorial player |
| Daisy reason "it goes back next" wrong (6/300); level 4 top-turn reason vague | Wording | Show it / Walk, levels 1 and 4 | — |
| "Turn this side out of the way" isn't taught (2/300 cubes) | Wrong help | Level 1 Hint, Show me, demo | Level 1 Hint now follows the words step for step; `walkthrough.test.ts` daisy tests |
| Level 1 had 12 bullets | Wording | Level 1 | Now 10; tutorial player |

No finding blocked a kid from solving: the tutorial player and the kid both solved every cube.

### Kid test round 5: what each finding affects

| Finding | Impact | Affects | Test now |
|---|---|---|---|
| Hint mid-sequence (levels 2–8) said "First fix the white cross" and replanned 25–170 moves (round 4's Hint change) | Wrong help | Try it, levels 2–7; level 8 | `walkthrough.test.ts`: Hint at every point of every step never says "First fix" and finishes the level |
| Hint mid-twist sent the player back to level 1 | Wrong help | Level 7, level 8 | `walkthrough.test.ts`: every point of the twist plans only twist steps |
| Hint's hold step could ask for a sideways turn (z) no swipe makes | Wrong help | Try it, all levels | `walkthrough.test.ts`: no z after any tip or turn |
| Level 7, last top turn labelled "First fix the yellow edges" | Wording | Level 7 | Covered by the mid-step test |
| Try it labels promised step counts the cubes didn't have | Wording | Try it, all stage levels | — |
| "Repeat until the corner drops in" misread when a wrong corner sits white-down in the spot | Wording | Level 2 | Tutorial player |
| "Front-right" used in level 1 before it's explained | Wording | Level 1 | Tutorial player |
| "Before you turn any side" read into Part 2 | Wording | Level 1 | Tutorial player |
| Level 1 demo: "Turn the other side it touches" without "middle row" | Wording | Level 1 demo | — |
| Level 5 and 6 demos showed only the sequence | Wording | Levels 5, 6 demos | `walkthrough.test.ts`: demos show the opposite and none-in-place cases |
| Level 8 sequences in a closed box | Wording | Level 8 | — |

Nothing stopped a kid in round 5 either.

### Kid test round 6: what each finding affects

| Finding | Impact | Affects | Test now |
|---|---|---|---|
| One stray turn: Hint re-solved 40–60 moves instead of turning it back | Wrong help | Try it, all levels; level 8 | `walkthrough.test.ts`: a wrong turn is turned back |
| Mid-twist whole-cube turn: Hint went back to the cross (~181 moves) | Wrong help | Level 7, level 8 | `walkthrough.test.ts`: turned back, then the same twist steps |
| Partway into a sequence, then a stray turn: "First fix the white cross" | Wrong help | Levels 2–8 | `walkthrough.test.ts`: turn it back, then finish the sequence |
| Daisy lit the wrong target square before a whole-cube turn inside a step | Wrong help | Level 1 Show it / Walk | `walkthrough.test.ts`: a daisy step never turns the cube partway |
| After a tip, Hint said a step was undone | Wording | Try it, levels 2–7 | `walkthrough.test.ts`: "You turned the whole cube" |
| "No white edge to bring up on the front" while one showed on the right | Wording | Level 1 | Tutorial player (new wording quoted) |
| Level 0 never taught tipping, which Hint can ask for | Wording | Level 0 | — |

Nothing stopped a kid in round 6 either.

### Kid test round 7: what each finding affects

| Finding | Impact | Affects | Test now |
|---|---|---|---|
| Hint right after a finished sequence looped: "turn your last move back", "finish the sequence", forever (round 6's change) | Stops a kid | Try it, levels 2–7; level 8 | `walkthrough.test.ts`: pressing Hint again and again finishes from every point, with the full move history; following the plan is never told to turn back |
| Level 2 viewed from below hides white-up top corners (28/400 stuck) | Stops a kid | Level 2 | Words: tip to look at the top, then tip back |
| Level 1 hides white-down bottom edges (6/400 stuck) | Stops a kid | Level 1 | Words: tip to look underneath, then tip back |
| Lift-out steps lit the piece's home, not where it goes | Wrong help | Levels 2, 3 Show it / Walk | `walkthrough.test.ts` (piece tests skip lift-outs; lights the top spot) |
| Hint said "To start, turn the whole cube" after twisting had started | Wrong help | Level 7 | `walkthrough.test.ts`: level 7 never turns the whole cube |
| Corner and Swap edges start alike; Hint mistook one for the other in the full solve | Wrong help | Level 8 | Full-solve press-Hint test |
| Level 8 recap dropped the yellow cross's top turn | Wording | Level 8 | — |
| Hint "back-left" vs lesson "the back and the left" | Wording | Level 4 | — |

Two cases in about 10,000 Hint checks still say "First fix the white cross" after a stray on top of an abandoned sequence. That's true (the cross is broken) and the plan finishes.

### Kid test round 8: what each finding affects

| Finding | Impact | Affects | Test now |
|---|---|---|---|
| Mid-sequence, a look and look-back (which levels 1–2 tell kids to do) made Hint loop on "Turn it back first" | Stops a kid | Try it, levels 2–7; level 8 | `helpPlan.test.ts`: through the app's plan cache, every look-back and undo-by-hand finishes |
| One swipe into "turn the front twice", Hint replanned and turned it back | Wrong help | Level 1 | `helpPlan.test.ts`: the next Hint is the other swipe |
| Hold step asked for green in front, which no level says | Wording | All levels | — |
| Level 3: left center off-camera for "Edge left" | Wording | Level 3 | Words: "If not, it goes left" |
| Level 5: the back is hidden | Wording | Level 5 | Words: the two that don't match go front and left |
| Level 2: "tip the cube" with no direction; corners facing back or left | Wording | Level 2 | Words: tip toward you, or turn the cube to look round |
| Level 1: "One already on the bottom… can stay" read as only one; "turn that side once" with no direction | Wording | Level 1 | Words |
| Level 8 recap didn't say how to look at hidden pieces | Wording | Level 8 | Words |

Nothing in round 8 stopped a kid who follows the words; the loop needed Hint.

### Files Changed

| File | Change |
|------|--------|
| `docs/02-levels.md` | Third-round rules, footnote [3] |
| `site/catalog.json` | Regenerated from the docs |
| `src/solver/beginner.ts` | Rule-based levels 2, 3, 5, 6; reasons without move words |
| `src/lessons/beginner.ts` | Level words, level 8 recap |
| `src/lessons/walkthrough.ts` | Demo seeds; swipe 1 of 2 |
| `src/app/stageLesson.ts` | Reason plus the arrow's own words |
| `tests/kidWords.test.ts`, `tests/walkthrough.test.ts` | New checks |
| `tests/tutorialPlayer.ts`, `tests/tutorialPlayer.test.ts` | New: the no-AI tutorial player and its test |
| `src/lessons/walkthrough.ts` | `helpSteps`: Hint plans earlier stages first |
| `src/app/stageLesson.ts` | Hint uses `helpSteps`; Walk asks to turn the cube back |
| `src/app/helpPlan.ts` | New: Hint follows one plan, swipe by swipe |
| `src/solver/beginner.ts` (cross) | White cross follows level 1's words: front, top and right only |

## v0.8.13 — Kid test round 2 (2026-11-09)

### Problem

A second kid test (a program following each level's words literally, start to finish) solved every cube, but found:

- Levels 4–6 said "hold", levels 2, 3 and 7 said "turn the whole cube". Reading "hold" as turning the top left level 6 stuck on 243 of 300 cubes.
- White cross: "turn that side once" could knock a white edge off the daisy; the middle-row rule didn't say which side to turn.
- White corners: a white corner on the bottom in the wrong spot wasn't covered.
- Levels 2–7 promised lit pieces and a reason for each move, and gave neither.
- The yellow edges demo never played its sequence; the yellow cross words didn't say an L turns into a line.
- Front-right and back-left were never explained; level 0 only turned the whole cube left; level 8's tips started closed.

### Solution

The words always say "turn the whole cube" or "turn the top". Every demo move gives a reason, levels 2–3 light the piece and its home, and each demo cube plays the level's sequences. Design: docs/02-levels.md → "Level words checked by a kid test".

### New

- Per-move reasons in levels 2–7, e.g. "Corner sequence, round 2 of 3, move 3 of 4: the right side goes down."
- Levels 2–3 light the piece being placed and its home.
- Level 0 has an 11th swipe: the whole cube turns back to the right.
- Level 8 opens with a one-line recap of each level.
- Tests: every demo move has a reason, every demo plays its sequences, levels 2–3 light a piece, no "hold" in the words.

### Changed

- Level words for 1, 2, 4, 5 and 6; level 6's goal says what "in its right spot" allows.
- "Cycle corners" is now "Move corners". Sequence names live in one place.
- Demo cubes for levels 2–7: the shortest of 40 that plays every taught sequence.
- Hint text says "turn the whole cube" and names Edge right or Edge left.

### Fixed

- Show it no longer promises lit squares on levels that light none.

### Files Changed

| File | Change |
|------|--------|
| `docs/02-levels.md` | Second-round rules |
| `site/catalog.json` | Regenerated from the docs |
| `src/lessons/beginner.ts` | Level words, 11th swipe, level 8 recap |
| `src/solver/beginner.ts` | Per-move reasons, lit pieces, sequence names, Hint text |
| `src/cube/pieces.ts` | New `homeSlot`: where a piece belongs |
| `src/lessons/walkthrough.ts` | Demo seeds |
| `src/app/stageLesson.ts` | Lights a piece's home; Show it help text |
| `src/app/lesson.ts`, `src/app/controlsLesson.ts` | Level 8 tips open; comment |
| `tests/walkthrough.test.ts` | New checks |

## v0.8.12 — Kid test fixes (2026-11-09)

### Problem

A kid test (each level's words followed literally, as a 10-year-old who knows only the screen) found the steps can't solve a cube:

- Level 2 never said to turn the whole cube so the corner's spot is at front-right; done word for word it never drops in.
- Level 3 had the same gap, and didn't say which center means Edge right or how to pop out a stuck edge.
- Level 1 never said how to lift a white edge into the daisy.
- Level 7 never said to turn the top at the end.
- Sequences from level 3 on were letters only, which the app never teaches. Level 8 listed no sequences.
- Walk-through moves with no reason said "Move 2 of 4 in this step."

### Solution

Every missing step is now in the words, sequences are buttons the arrow walks you through, and a test follows each level's words literally on practice cubes. Design: docs/02-levels.md → Controls and "Level words checked by a kid test".

### New

- Tap a sequence: the arrow walks you through it on the cube (Try it, PLL and full-solve levels). Doesn't count as help.
- A walk-through move with no reason says what it does, e.g. "The right side goes up."
- Kid test: levels 1–7 and a full solve, done only by following the words, on 20 practice cubes each.

### Changed

- Level words for 1, 2, 3, 4 and 7 (see Problem).
- Level 8 lists all 7 beginner sequences.
- Tests time out at 3 minutes instead of 5 s. CFOP's 100-scramble test takes ~27 s alone and ran past 60 s when test files shared the CPU (traced, not a hang).

### Fixed

- Following level 2 or 3's words literally no longer gets stuck.
- The CFOP speed check failed under load: the same cube took 673 ms alone and 4,993 ms while other test files ran. It now measures the test's own CPU time.

### Files Changed

| File | Change |
|------|--------|
| `docs/02-levels.md` | Sequence buttons, move words, kid test |
| `site/catalog.json` | Regenerated from the docs |
| `src/lessons/beginner.ts` | Level words; level 8 sequences |
| `src/lessons/moveWords.ts` | New: one move in plain words |
| `src/lessons/walkthrough.ts` | No more "Move 2 of 4" filler |
| `src/app/algButtons.ts` | New: sequences as buttons |
| `src/app/stageLesson.ts`, `src/app/lesson.ts` | Sequence buttons start the arrow |
| `src/app/styles.css` | Sequence button style |
| `vite.config.ts` | Test timeout |
| `tests/kidWords.test.ts`, `tests/moveWords.test.ts` | New tests |
| `tests/cfop.test.ts` | Speed check uses CPU time |

## v0.8.11 — Arrows only (2026-11-09)

### Problem

The move letters made no sense on screen: "R' is the right side" pointed at one thing while the arrow sat on another, and dimming made the colors look wrong.

### Solution

Arrows only. The arrow on the cube shows every move; letters stay only as a small caption under sequences. Design: docs/02-levels.md → Controls and Level 0.

### New

- Hint puts the arrow on the cube for each move of the step, one at a time (`src/app/hintArrows.ts`).
- Guided solve of your own cube shows the arrow for each move, including whole-cube turns (z added).

### Changed

- Removed from the cube: letter badge, side-name tag, the flashing letter, the dimming in level 0.
- FRONT / TOP / RIGHT tags lost their letters.
- Level 0 rewritten without letters ("Swipe the right side up."); file renamed `controlsLesson.ts`.
- Walk through it shows the reason only, no bold letter; wrong-move message says "follow the arrow".
- Solver hint sentences rewritten in words ("Turn the top to line it up." instead of "Line up the top: U2").
- Sequences on level pages and the guided solve's move list are a small, faded caption.
- Free play scramble says "Scrambled! Can you solve it?" instead of listing letters.

### Fixed

- The lesson's step box showed during Try it: `.guide` display beat the hidden attribute.

### Verification

- 216 tests passed, lint clean, build clean.
- New tests: no move letters in level 0 text or in any hint sentence from both solvers (20 scrambles each); hint arrows follow each swipe and clear on a different move.
- Browser screenshots: level 0 with arrow only, no dimming, printed lines without letters; White corners Hint shows the arrow; step box hidden in Try it; guided solve arrows for z2 and F'.
- Not checked on a real phone: needs a phone in hand.

### Files Changed

| File | Change |
|------|--------|
| `src/app/hintArrows.ts` | New: hint arrows |
| `src/app/controlsLesson.ts` | Level 0 without letters (renamed from lettersLesson.ts) |
| `src/render/cubeView.ts` | Letter badge and side tag removed; z arrow; tags without letters |
| `src/app/cubePanel.ts`, `src/app/stageLesson.ts`, `src/app/lesson.ts`, `src/app/solveMine.ts`, `src/app/practice.ts` | Arrows instead of letters |
| `src/solver/beginner.ts`, `src/solver/cfop.ts`, `src/lessons/beginner.ts`, `src/lessons/cfop.ts` | Text in words |
| `src/app/styles.css` | Caption style; hidden step box; removed letter styles |
| `docs/02-levels.md`, `site/catalog.json` | Arrows-only design |
| `tests/arrows.test.ts` | New tests |

## v0.8.10 — Letters on the cube (2026-11-09)

### Problem

Level 0 said "U means Up, the top" but there was no U on the cube. A letter only flashed after the move, and the small tags named just 3 sides.

### Solution

The letter now sits on the arrow in a big badge, and a tag at the top of the cube area names the side being turned. Design: docs/02-levels.md → Controls.

### New

- Big letter badge on the arrow (U, R', B …).
- Side-name tag at the top of the cube area: LEFT · L, BACK · B, MIDDLE · M, WHOLE CUBE · y, and the rest.

### Changed

- The plain FRONT / TOP / RIGHT tags hide while an arrow shows, so nothing covers the arrow.
- Arrows prefer the right side over the top; back turns now show on the right side's back column (the top's back row was edge-on and hard to see).
- Level 0, B: "swipe the back edge the way the arrow shows".

### Verification

- 212 tests passed, lint clean.
- Browser screenshots (keyboard events): U badge on the top row with TOP · U; L badge on the left column with LEFT · L, nothing overlapping; B badge on the right side's back column with BACK · B.
- First tries put the side name on the cube; it covered the arrow or ran off a narrow screen, so it moved to a fixed tag.
- Not checked on a real phone: needs a phone in hand.

### Files Changed

| File | Change |
|------|--------|
| `src/render/cubeView.ts` | Letter badge; side-name tag; arrow face order |
| `src/app/styles.css` | Side-name tag style |
| `src/lessons/beginner.ts` | B sentence |
| `docs/02-levels.md`, `site/catalog.json` | Design lines |

## v0.8.9 — Learn the letters (2026-11-09)

### Problem

Level 0 just moved pieces around. It didn't say why the letters matter, and the text at the top was distracting.

### Solution

Rebuilt level 0 for a 10-year-old: one line at the top, a sentence per letter, a printed line for every move, and a payoff trick: `R U R' U'` six times brings a solved cube back to solved. Design: docs/02-levels.md → Level 0.

### New

- Top of the level is one line: "Learn the move letters. Every level uses them, and so does your real cube."
- Part 1: 10 letters, each with one plain sentence and the arrow.
- Every move prints a line under the cube, newest on top.
- Part 2, the trick: a fresh solved cube, `R U R' U'` six times, round counter, "Solved again!".
- Passing the level means finishing the trick.

### Changed

- Removed the goal paragraph, task box and "How it works" list from level 0.
- Level 0 has its own screen (`src/app/lettersLesson.ts`); `src/app/lesson.ts` lost the old drill code.

### Verification

- 212 tests passed, lint clean.
- New tests: the trick returns any cube to where it started and mixes it on the way; every letter has a sentence and a printed line; the top is one line.
- Browser, keyboard events: all 10 letters, then 6 rounds of the trick; the cube ended solved, the level passed, 41 lines printed.
- Not checked on a real phone: needs a phone in hand.

### Files Changed

| File | Change |
|------|--------|
| `src/app/lettersLesson.ts` | New: level 0 screen |
| `src/lessons/beginner.ts` | Level 0 text for a 10-year-old; the trick |
| `src/app/lesson.ts` | Level 0 routed to its own screen; drill code removed |
| `src/app/styles.css` | Printed move list |
| `docs/02-levels.md`, `site/catalog.json` | Level 0 design |
| `tests/lessons.test.ts` | Level 0 tests |

## v0.8.8 — Swipe only (2026-11-09)

### Problem

The move buttons under the cube were not good. With swiping built in v0.8.7, they were in the way.

### Solution

Removed the buttons everywhere. The cube is turned only by swiping (plus the keyboard). Lessons point an arrow at the next swipe, and each turn flashes its letter. Design: docs/02-levels.md → Controls.

### New

- Arrow on the cube along the row to swipe next; whole-cube turns show the arrow beside the cube.
- Each turn flashes its letter over the cube.
- Swiping beside the cube turns the whole cube in lessons too.
- Walk through it renames the moves left after a whole-cube turn (after x, U becomes B).
- Pass checks work however the cube is held; the PLL level first turns white to the bottom.
- Half turns are two swipes; two-layer turns are two swipes (r is R then M').
- Keyboard: x and M added.

### Changed

- Removed: move buttons, See back button, the look-around drag.
- Level 0 text: teaches the moves by swiping.
- Beginner levels refuse middle-row swipes with a message; CFOP and free play allow them.
- docs/02-levels.md Controls rewritten, with footnotes for design decisions; docs/07-build-plan.md ticked.

### Verification

- 209 tests passed, lint clean, build clean.
- New tests: every move's swipes equal the move; renamed moves equal the original after whole-cube turns; every level's walk-through still finishes with whole-cube turns mixed in; Hint and Show me finish every level after any whole-cube turn.
- Browser, simulated touch events: level 0 arrow on R, swipe R accepted, arrow moved to U; in Middle edges, y swipe accepted, extra x renamed the next move U to B.
- Not checked on a real phone: needs a phone in hand.

### Files Changed

| File | Change |
|------|--------|
| `src/render/swipe.ts` | Moves as swipes; renaming after whole-cube turns |
| `src/render/cubeView.ts` | Next-move arrow; whole-cube swipes everywhere |
| `src/app/cubePanel.ts` | Buttons removed; letter flash; allowed turns |
| `src/app/stageLesson.ts`, `src/app/lesson.ts` | Arrow instead of glowing button; renaming; any-hold pass checks |
| `src/lessons/walkthrough.ts`, `src/lessons/index.ts`, `src/lessons/beginner.ts` | Guide split into swipes; any-hold check; level 0 text |
| `src/app/practice.ts`, `src/app/styles.css` | Free play turn set; button styles removed, letter style added |
| `docs/02-levels.md`, `docs/07-build-plan.md`, `site/catalog.json` | Controls design |
| `tests/*.test.ts` | New and updated tests |

## v0.8.7 — Touch controls (2026-11-09)

### Problem

Turning the cube meant tapping buttons below it. On a phone, Rob wanted to turn the cube by touching it.

### Solution

Swipe on the cube to turn the row or column under your finger. Swipe beside the cube in free play to turn the whole cube. Design: docs/02-levels.md → Controls → Touch controls (design decision, 2026-11-06).

### New

- Swipe a sticker: its layer turns the way the finger went.
- Free play: swipe beside the cube turns the whole cube (left/right y, up/down x); middle rows can be swiped.
- Lessons: dragging beside the cube is still the look-around that springs back.
- A swipe only makes moves the screen's buttons have; a middle-row swipe in a beginner level says to use a row with a button.

### Changed

- Free play hint and the cube's screen-reader label describe swiping.

### Verification

- 192 tests passed, including 4 new swipe tests.
- Every sticker × every direction checked against the move engine: the sticker moves the way the finger went.
- Lint clean; build clean.
- Browser, simulated touch events: front right column swiped up made R; swipe beside the cube made x and y; middle-row swipe in level "Middle edges" showed the message.
- Not checked on a real phone: needs a phone in hand.

### Files Changed

| File | Change |
|------|--------|
| `src/render/swipe.ts` | New: which move a swipe makes |
| `src/render/cubeView.ts` | Finger tracking, sticker hit test |
| `src/app/cubePanel.ts` | Only allowed moves; free-play option; label |
| `src/app/practice.ts` | Free play uses swipes; hint text |
| `docs/02-levels.md`, `site/catalog.json` | Touch controls marked built, with rules |
| `tests/swipe.test.ts` | New tests |

## v0.8.6 — Cube review fixes (2026-11-06)

### Problem

A Rubik's cube review of the whole app found two CFOP lessons giving wrong advice, a cube check that missed mirror-image corners (e.g. red and orange mixed up), level 7 practice cubes with a scrambled bottom, and some wrong or stale text.

### Solution

Fixed each proven finding, with a test for each. Also wrote the planned touch controls into the design doc.

### Fixed

- Level 11 (OLL 1): "L shape: hold it at front-right" — back-left turned the L into a dot.
- Level 13 (PLL 1): "Headlights: hold them on the left" — at the back, T-perm could not solve the corners.
- Cube check now catches a corner whose colors are in a mirror-image order, and says red and orange are easy to mix up.
- "Can't be solved" message now also names two swapped pieces.
- Level 7 practice: easier cubes have fewer twisted corners instead of being stopped part-way with the bottom scrambled.
- Solve my cube, bottom face: "tip the top away from you" (was "toward you").
- Glossary: a center "never moves when you turn a side" (M moves centers).

### Changed

- docs/02-levels.md: solver timings updated to the review's 500-scramble runs.
- docs/02-levels.md: new "Touch controls (planned)" section — swipe a sticker to turn its layer, swipe the background to turn the whole cube.

### Not changed

- The beginner "hold" step still skips turning to green-in-front when white is already down. Requiring green in front broke 5 tests: later stages turn the cube with y on purpose, so green is often not in front mid-solve.

### Files Changed

| File | Change |
|------|--------|
| `src/lessons/cfop.ts` | L shape and Headlights hold text |
| `src/cube/validate.ts` | Mirror-image corner check; unsolvable message |
| `src/lessons/position.ts` | Level 7 easier practice cubes |
| `src/app/solveMine.ts` | Bottom face tip direction |
| `CLAUDE.md`, `site/catalog.json` | Center glossary entry |
| `docs/02-levels.md` | Level 7 practice, timings, touch controls plan |
| `tests/*.test.ts` | Tests for each fix |

## v0.8.5 — Show updates right away (2026-11-04)

### Problem

- After v0.8.4 went live, Rob still saw the old White cross text.
- The offline copy updated in the background but the open page kept the old version until the next visit.

### Solution

- Reload the page once when a new version takes over.

### New

- None.

### Changed

- `src/main.ts`: reload on service worker change, skipped on first install.

### Fixed

- New versions show without closing and reopening the app.

### Files Changed

| File | Change |
|------|--------|
| `src/main.ts` | Reload when a new version takes over |

## v0.8.4 — Guided white cross (2026-11-04)

### Problem

- White cross said "find a white edge, turn it into place" and dropped the player on a scrambled cube. Not clear, and not a tutorial.

### Solution

- Every stage level now runs in three parts: Show it, Walk through it, Try it.
- White cross is taught with the daisy, every move with a plain-words reason.

### New

- Lesson parts: 1 Show it (app plays the demo cube slowly), 2 Walk through it (glowing button, wrong turns undone), 3 Try it.
- Lit squares: the piece being moved and the spot it goes to.
- Daisy solver for the beginner cross: Part 1 builds the daisy, Part 2 turns each edge down with F2.
- The daisy only turns top, front, right and the whole cube — sides the player can see.
- Practice ramp: cube 1 has one step left, cube 2 about three, cube 3 fully mixed; the level passes on cube 3.
- Tests: every stage level's walk-through finishes its stage; daisy rules; practice ramp.

### Changed

- White cross text rewritten: what an edge piece and a center are, then the two parts.
- Guided solve ("Solve my cube") and Hint use the daisy for the beginner cross.
- Level pass rewards moved to their own module.

### Fixed

- None.

### Files Changed

| File | Change |
|------|--------|
| `src/app/stageLesson.ts` | New: the three-part lesson screen |
| `src/app/reward.ts` | New: record a pass, show XP and badges |
| `src/lessons/walkthrough.ts` | New: demo cube and per-tap guide moves |
| `src/solver/beginner.ts` | Daisy cross with per-move reasons |
| `src/lessons/position.ts` | Practice ramp |
| `src/lessons/beginner.ts`, `index.ts` | Cross text; guide step fields |
| `src/app/lesson.ts`, `cubePanel.ts`, `styles.css` | Hand stage levels to the new screen; slow play; styles |
| `src/render/cubeView.ts`, `src/cube/pieces.ts` | Light up a piece; find a piece by colors |
| `tests/walkthrough.test.ts` | New tests |
| `docs/02-levels.md`, `docs/07-build-plan.md`, `CLAUDE.md` | How the parts are built; M8 ticks; glossary |

## v0.8.3 — Tutorial plan (2026-11-04)

### Problem

- Levels drop the player on a scrambled cube to figure out. That is a test, not a tutorial.

### Solution

- Write down the rule and plan the rebuild before any code changes.

### New

- **`02-levels.md` → Every level is a tutorial.** Show it, walk through it, then try it; rules that follow; daisy for the white cross.
- **Build plan M8 — Guided lessons.** Rebuild every level; must land before launch.
- **v1 done list.** Every level walks the player through.
- **Glossary.** Daisy.

### Changed

- **`CLAUDE.md`.** Tutorial rule added to working norms.
- **Now:** M8.

### Fixed

- None (the rebuild is M8).

### Files Changed

| File | Change |
|------|--------|
| `docs/02-levels.md`, `docs/07-build-plan.md` | Tutorial rule, M8 |
| `CLAUDE.md`, `site/catalog.json` | Norm, glossary |
| `Versions/v0/v0.8/release-notes.md` | This entry |

## v0.8.2 — Clear controls (2026-11-04)

### Problem

- The turn buttons seemed to have no rhyme or reason.
- It wasn't clear what a whole-cube turn does.
- Dragging the view to the back left R on the screen's left, so the buttons no longer matched what you saw.

### Solution

- Buttons grouped by side, each with its letter, side name and arrow.
- Fixed side tags next to the cube.
- The view springs back to the front; a See back button for the back.
- Based on research into how the main tutorials and cube viewers do it.

### New

- **Grouped buttons.** Top, Right, Front, Bottom, Left, Back, Whole cube; each shows letter, side and arrow (e.g. "R — Right ↑").
- **Side tags** next to the cube: FRONT · F, TOP · U (or BOTTOM · D), RIGHT · R. They stay put while the colors turn.
- **See back** button; any turn returns to the front first.
- **View limits.** Drag about 40° each way; springs back to the front on release.

### Changed

- **Learn the controls** explanation: letters are sides, front is whatever faces you, letters are places not colors.
- **CFOP levels** show letters only, plus a Middle and two-layer turns group.
- **Pinch zoom** off; drag smoothing off so the view springs back cleanly.
- **Docs.** Controls section in `02-levels.md`; 2 Glossary terms.

### Fixed

- Buttons stopped matching the screen after dragging the view.

### Files Changed

| File | Change |
|------|--------|
| `src/app/cubePanel.ts` | Grouped, labeled buttons; See back |
| `src/render/cubeView.ts` | Side tags, view limits, spring back, see back |
| `src/app/lesson.ts`, `src/app/styles.css` | Button groups per method, styles |
| `src/lessons/beginner.ts` | New level 0 explanation |
| `docs/02-levels.md`, `CLAUDE.md`, `site/catalog.json` | Controls, glossary |
| `Versions/v0/v0.8/release-notes.md` | This entry |

## v0.8.1 — Learn the controls (2026-11-04)

### Problem

- Level 0 didn't say plainly that it only teaches the buttons.

### Solution

- Renamed it and stated its purpose and task up front.

### New

- **Task line** on level 0: "Tap the glowing button. 10 taps and you're done."

### Changed

- **Level 0** renamed "Meet the cube" → "Learn the controls".
- **Level 0 top line:** "This level teaches the buttons. Each letter turns one side of the cube. You'll need these for every level after this."
- **Docs and badge text** use the new name.

### Fixed

- None.

### Files Changed

| File | Change |
|------|--------|
| `src/lessons/beginner.ts` | New name and top line |
| `src/app/lesson.ts`, `src/app/styles.css` | Task line |
| `src/game/rules.ts` | Badge text |
| `docs/02-levels.md`, `docs/03-game.md`, `docs/05-phone-check.md` | New name |
| `Versions/v0/v0.8/release-notes.md` | This entry |

## v0.8.0 — Launch (2026-11-04)

### Problem

- M7: the README still described an empty template.
- Real-phone checks had no written list.
- Meet the cube asked for turns like "R" without showing what they mean.

### Solution

- README with the play link and a quickstart.
- A phone checklist on Mission Control.
- Meet the cube now explains each turn, lights up that side and makes its button glow.

### New

- **Meet the cube.** Each prompt says what the turn does ("Right side — turns so its front edge goes up"); the side that will turn is lit and the rest dimmed; the button to tap glows.
- **3D cube highlight.** `highlight(move)` lights one layer.
- **Phone checklist** (`docs/05-phone-check.md`). Install, offline, levels, camera scan, timer.
- **Open question.** License for the public repo.

### Changed

- **README.** Play link, quickstart, current layout, license status.
- **Build plan.** README items ticked; phone testing marked blocked on real phones.

### Fixed

- Meet the cube was unclear about what each button does.

### Files Changed

| File | Change |
|------|--------|
| `src/lessons/beginner.ts` | Turn descriptions, clearer level text |
| `src/app/lesson.ts`, `src/app/styles.css` | Prompts, lit side, glowing button |
| `src/render/cubeView.ts` | Layer highlight |
| `README.md` | Rewritten |
| `docs/05-phone-check.md` | New |
| `docs/07-build-plan.md`, `docs/99-open-questions.md`, `site/catalog.json` | M7 progress, license question |
| `Versions/v0/v0.8/release-notes.md` | New — this file |
