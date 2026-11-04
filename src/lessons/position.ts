// Practice positions for a level.

import { type CubeState, applyMoves, invertMoves, parseMoves, scramble, solved } from "../cube";
import { PLL_ALGS } from "../solver/cfop";
import type { Level } from "./beginner";
import { METHODS, stateAfter } from "./index";

/** A practice cube where every stage before this level is done and this one isn't. */
export function practicePosition(level: Level, random: () => number = Math.random): CubeState {
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
    const pos = stateAfter(method, mixed, before);
    if (!method.done[level.stage!](pos)) return pos;
  }
}
