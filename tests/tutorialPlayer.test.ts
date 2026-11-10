// The kid test as plain code, on every build: a program that knows only the tutorial's words
// solves scrambled cubes. No solver, no Hint, no guessing — see tests/tutorialPlayer.ts.
// docs/02-levels.md → "Level words checked by a kid test".

import { describe, expect, it } from "vitest";
import {
  applyMoves,
  checkBullets,
  mulberry32,
  playTutorial,
  scramble,
  solved,
} from "./tutorialPlayer";

describe("tutorial player: only the tutorial's words", () => {
  it("every word it follows is still in the tutorial, word for word", () => {
    expect(() => checkBullets()).not.toThrow();
  });

  it("solves 2,000 scrambles with no stops", () => {
    checkBullets();
    const rand = mulberry32(20261110);
    const problems: unknown[] = [];
    for (let k = 0; k < 2000; k++) {
      const start = applyMoves(applyMoves(solved(), scramble(25, rand)), "x2"); // held white down
      const r = playTutorial(start);
      if (!r.solved) problems.push({ k, ...r.problem });
    }
    expect(problems).toEqual([]);
  });

  // Cubes where re-picking a different white edge after every turn looped forever (all four white
  // edges on one side, facing out). "Keep going with that same edge" fixes it.
  it.each([
    "UDDDDFUBLULLFRRUDFRUFUBUBURDLBBUFDBDLRFRLRFLRBLBBFFRDL",
    "ULRDDDRLFDLFBRBRDDBULUBUUUULFFFUBRLLFRDFLRBRBDFLRFDBBU",
  ])("solves the white-plus cube %s", (state) => {
    const r = playTutorial([...state] as never);
    expect(r.problem).toBeUndefined();
    expect(r.solved).toBe(true);
  });
});
