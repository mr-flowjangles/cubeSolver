// Practice positions for a level.

import { type CubeState, applyMoves, scramble, solved } from "../cube";
import { STAGES, STAGE_DONE, stateAfter } from "../solver/beginner";
import type { Level } from "./beginner";

/** A practice cube where every stage before this level is done and this one isn't. */
export function practicePosition(level: Level, random: () => number = Math.random): CubeState {
  if (level.kind === "notation") return solved();
  for (;;) {
    const mixed = applyMoves(solved(), scramble(25, random));
    if (level.kind === "full") return stateAfter(mixed, "hold");
    const before = STAGES[STAGES.indexOf(level.stage!) - 1];
    const pos = stateAfter(mixed, before);
    if (!STAGE_DONE[level.stage!](pos)) return pos;
  }
}
