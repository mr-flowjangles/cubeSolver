// Random scrambles: face turns only, no face turned twice in a row,
// and no "R L R" patterns (same axis three times running).

import type { Move } from "./moves";

const FACES = ["U", "D", "R", "L", "F", "B"];
const AXIS_OF: Record<string, number> = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
const SUFFIX = ["", "'", "2"];

export function scramble(length = 25, random: () => number = Math.random): Move[] {
  const out: Move[] = [];
  const faces: string[] = [];
  while (out.length < length) {
    const f = FACES[Math.floor(random() * 6)];
    const prev = faces[faces.length - 1];
    const prev2 = faces[faces.length - 2];
    if (f === prev) continue;
    if (prev && prev2 && AXIS_OF[f] === AXIS_OF[prev] && AXIS_OF[f] === AXIS_OF[prev2]) continue;
    faces.push(f);
    out.push(f + SUFFIX[Math.floor(random() * 3)]);
  }
  return out;
}
