// Checks that an entered cube is a real, solvable cube, with plain-words problems.
// Centers are fixed (white top, green front), so a cube is checked in that standard layout.

import { CORNER_SLOTS, EDGE_SLOTS, type Slot } from "./pieces";
import { COLOR_NAME } from "./colors";
import { type CubeState, type Face, FACES, STICKERS, solved } from "./state";

export interface Problem {
  message: string;
  stickers: number[]; // stickers to highlight
}

const SOLVED = solved();
const colorsAt = (s: CubeState, slot: Slot) => slot.stickers.map((i) => s[i]);
const keyOf = (colors: Face[]) => [...colors].sort().join("");
const names = (colors: Face[]) => colors.map((c) => COLOR_NAME[c]).join("–");

/** Pieces a real cube has, by their color set. */
const REAL_EDGES = new Set(EDGE_SLOTS.map((s) => keyOf(colorsAt(SOLVED, s))));
const REAL_CORNERS = new Set(CORNER_SLOTS.map((s) => keyOf(colorsAt(SOLVED, s))));

/**
 * A corner's stickers in clockwise order seen from outside the corner, so a mirror-image
 * corner (two stickers swapped, e.g. red and orange mixed up) can be told from a real one.
 */
function clockwise(slot: Slot): number[] {
  const [a, b, c] = slot.stickers;
  const [x, y, z] = [a, b, c].map((i) => STICKERS[i].normal);
  const det =
    x[0] * (y[1] * z[2] - y[2] * z[1]) -
    x[1] * (y[0] * z[2] - y[2] * z[0]) +
    x[2] * (y[0] * z[1] - y[1] * z[0]);
  return det > 0 ? [a, b, c] : [a, c, b];
}

/** Colors read clockwise, started from the smallest letter, so any twist of a corner reads the same. */
const turnKey = (s: CubeState, slot: Slot) => {
  const cols = clockwise(slot).map((i) => s[i]);
  const k = cols.indexOf([...cols].sort()[0]);
  return [...cols.slice(k), ...cols.slice(0, k)].join("");
};
const REAL_CORNER_TURNS = new Set(CORNER_SLOTS.map((s) => turnKey(SOLVED, s)));

/** Problems found by looking at the stickers. Empty when every piece is real and appears once. */
export function findProblems(state: CubeState): Problem[] {
  const problems: Problem[] = [];

  for (const f of FACES) {
    const n = state.filter((c) => c === f).length;
    if (n !== 9) {
      problems.push({
        message: `There are ${n} ${COLOR_NAME[f]} stickers. A cube has 9 of each color.`,
        stickers: n > 9 ? state.flatMap((c, i) => (c === f ? [i] : [])) : [],
      });
    }
  }

  const check = (slots: Slot[], real: Set<string>, kind: string) => {
    const seen = new Map<string, Slot>();
    for (const slot of slots) {
      const colors = colorsAt(state, slot);
      const key = keyOf(colors);
      if (!real.has(key)) {
        problems.push({
          message: `No ${kind} has the colors ${names(colors)}. Check these stickers.`,
          stickers: slot.stickers,
        });
      } else if (seen.has(key)) {
        problems.push({
          message: `Two ${kind}s are ${names(colors)}. Each ${kind} appears once.`,
          stickers: [...seen.get(key)!.stickers, ...slot.stickers],
        });
      } else {
        seen.set(key, slot);
      }
    }
  };
  check(EDGE_SLOTS, REAL_EDGES, "edge");
  check(CORNER_SLOTS, REAL_CORNERS, "corner");

  for (const slot of CORNER_SLOTS) {
    const colors = colorsAt(state, slot);
    if (!REAL_CORNERS.has(keyOf(colors)) || REAL_CORNER_TURNS.has(turnKey(state, slot))) continue;
    problems.push({
      message: `The ${names(colors)} corner has its colors in an order no real corner has. Two of its stickers are swapped — red and orange are easy to mix up.`,
      stickers: slot.stickers,
    });
  }
  return problems;
}

export const UNSOLVABLE =
  "Every piece is real, but this cube can't be solved as entered. Usually one edge is flipped, one corner is twisted, or two pieces are swapped. Re-check stickers on a few pieces.";
