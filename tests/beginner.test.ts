import { describe, expect, it } from "vitest";
import { applyMoves, isSolved, scramble, solved } from "../src/cube";
import { STAGES, STAGE_DONE, solveBeginner } from "../src/solver/beginner";

function seeded(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

describe("beginner solver", () => {
  it("solves an already solved cube with nothing but holding it white-down", () => {
    const steps = solveBeginner(solved());
    expect(steps.every((s) => s.stage === "hold" || s.moves.length === 0)).toBe(true);
    expect(
      isSolved(
        applyMoves(
          solved(),
          steps.flatMap((s) => s.moves),
        ),
      ),
    ).toBe(true);
  });

  it("solves 200 random scrambles, finishing each stage in order", () => {
    const random = seeded(2026);
    let longest = 0;
    let maxMs = 0;
    for (let n = 0; n < 200; n++) {
      const start = applyMoves(solved(), scramble(25, random));
      const t0 = performance.now();
      const steps = solveBeginner(start);
      maxMs = Math.max(maxMs, performance.now() - t0);
      let cur = start;
      let stageIdx = 0;
      for (const step of steps) {
        const i = STAGES.indexOf(step.stage);
        expect(i).toBeGreaterThanOrEqual(stageIdx);
        // Every earlier stage is still done when a new stage starts.
        // (Skips "hold": spinning the cube later is allowed.)
        if (i > stageIdx) for (let k = 1; k < i; k++) expect(STAGE_DONE[STAGES[k]](cur)).toBe(true);
        stageIdx = i;
        cur = applyMoves(cur, step.moves);
      }
      expect(isSolved(cur)).toBe(true);
      longest = Math.max(longest, steps.flatMap((s) => s.moves).length);
    }
    console.log(`longest solve: ${longest} moves, slowest: ${maxMs.toFixed(0)} ms`);
    expect(longest).toBeLessThan(250);
  }, 120_000);

  it("starts from any way the cube is held", () => {
    for (const r of ["x", "z'", "y2", "x z", "z2 y"]) {
      const start = applyMoves(solved(), `${r} R U F' L2 D B`);
      const steps = solveBeginner(start);
      expect(
        isSolved(
          applyMoves(
            start,
            steps.flatMap((s) => s.moves),
          ),
        ),
      ).toBe(true);
    }
  });
});
