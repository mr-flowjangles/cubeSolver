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
- Tested on 200 random scrambles; slowest full solve under a quarter second.
