import { describe, expect, it } from "vitest";
import { applyMoves, isSolved } from "../src/cube";
import { ALL_LEVELS, METHODS, stageDoneAnyHold } from "../src/lessons/index";
import { practicePosition } from "../src/lessons/position";
import { seeded } from "../src/lessons/walkthrough";

describe("turning the whole cube in a lesson", () => {
  it("Hint and Show me still finish every level after any whole-cube turn", async () => {
    const { pllSteps } = await import("../src/app/lesson");
    const random = seeded(11);
    for (const l of ALL_LEVELS) {
      if (l.kind === "notation") continue;
      for (const turned of [["y"], ["x"], ["x", "x"], ["y'", "x'"]]) {
        const p = applyMoves(practicePosition(l, random), turned);
        const steps =
          l.kind === "pll"
            ? pllSteps(p)
            : METHODS[l.method].solve(p, l.kind === "full" ? undefined : l.stage);
        const end = applyMoves(
          p,
          steps.flatMap((s) => s.moves),
        );
        const ok = l.kind === "stage" ? METHODS[l.method].done[l.stage!](end) : isSolved(end);
        expect(ok, `${l.id} after ${turned.join(" ")}`).toBe(true);
        if (l.kind === "stage") expect(stageDoneAnyHold(l, end)).toBe(true);
      }
    }
  }, 120_000);
});
