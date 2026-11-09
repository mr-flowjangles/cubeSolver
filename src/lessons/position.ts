// Practice positions for a level.

import {
  CORNER_SLOTS,
  type CubeState,
  applyMoves,
  center,
  invertMoves,
  parseMoves,
  scramble,
  solved,
} from "../cube";
import { PLL_ALGS } from "../solver/cfop";
import type { Level } from "./beginner";
import { METHODS, stateAfter } from "./index";

/**
 * A practice cube where every stage before this level is done and this one isn't.
 * `stepsLeft` makes it easier: only that many steps of this stage are left to do.
 */
export function practicePosition(
  level: Level,
  random: () => number = Math.random,
  stepsLeft?: number,
): CubeState {
  if (level.kind === "notation") return solved();
  const method = METHODS[level.method];
  if (level.kind === "pll") {
    // White down (z2), then a random PLL case seen from a random side.
    const alg = PLL_ALGS[Math.floor(random() * PLL_ALGS.length)];
    const auf = ["", "U", "U2", "U'"][Math.floor(random() * 4)];
    return applyMoves(solved(), ["z2", ...invertMoves(parseMoves(alg.moves)), auf].filter(Boolean));
  }
  for (;;) {
    const mixed = applyMoves(solved(), scramble(25, random));
    if (level.kind === "full") return stateAfter(method, mixed, "hold");
    const before = method.stages[method.stages.indexOf(level.stage!) - 1];
    let pos = stateAfter(method, mixed, before);
    if (method.done[level.stage!](pos)) continue;
    if (stepsLeft !== undefined && level.stage === "yellowCornersTwist") {
      // Stopping part-way through this stage leaves the bottom scrambled, so an easier
      // cube is one with fewer twisted corners instead (at least 2 are always twisted).
      const twisted = CORNER_SLOTS.filter(
        (s) => s.name[0] === "U" && pos[s.stickers[0]] !== center(pos, "U"),
      ).length;
      if (twisted > Math.max(2, stepsLeft)) continue;
      return pos;
    }
    if (stepsLeft !== undefined) {
      const steps = method
        .solve(pos, level.stage)
        .filter((s) => s.stage === level.stage && s.moves.length > 0);
      for (const st of steps.slice(0, Math.max(0, steps.length - stepsLeft)))
        pos = applyMoves(pos, st.moves);
    }
    return pos;
  }
}

/** Practice cubes get harder: one step left, then about half, then the whole stage. */
export const PRACTICE_RAMP = [1, 3, undefined] as const;
