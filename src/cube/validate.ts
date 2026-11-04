// Checks that an entered cube is a real, solvable cube, with plain-words problems.
// Centers are fixed (white top, green front), so a cube is checked in that standard layout.

import { CORNER_SLOTS, EDGE_SLOTS, type Slot } from "./pieces";
import { COLOR_NAME } from "./colors";
import { type CubeState, type Face, FACES, solved } from "./state";

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
  return problems;
}

export const UNSOLVABLE =
  "Every piece is real, but this cube can't be solved as entered. Usually one edge is flipped or one corner is twisted. Re-check stickers on a few pieces.";
