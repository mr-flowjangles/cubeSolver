# 02 — Levels

**Status:** decided by Claude under Rob's standing go-ahead, 2026-11-04. Rob to review.

## Beginner method (M2)

- The standard 7-stage layer-by-layer method, white on the bottom.
- White on the bottom from the start, the same as CFOP, so moving up later needs no re-learning.
- One level per stage, plus a notation level first and a full solve last.

| # | Level | Passed when | Sequence taught |
|---|---|---|---|
| 0 | Meet the cube | 10 turns made as asked | — |
| 1 | White cross | 4 white edges on the bottom, matching centers | none (intuitive) |
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

## How a level works

- Practice cube: a random scramble with every earlier stage already done.
- **Hint** shows the next step in words and moves.
- **Show me** plays the next step on the cube.
- **New cube** gives a fresh practice cube.
- Levels 1–2 show the cube from below, so the white side is visible.

## How the guide works out the moves

- Cross: finds the fewest turns for each edge, one edge at a time.
- Every later stage: tries short combinations of top turns, whole-cube turns and that stage's taught sequence.
- So Hint and Show me only ever use what the level teaches.
- Beginner: tested on 200 random scrambles; slowest under a quarter second.
- CFOP: tested on 100 random scrambles; slowest about a third of a second.
- Every CFOP sequence is checked by the cube model: last-layer ones keep the bottom two layers, and the 21 PLLs are all different cases.
