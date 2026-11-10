import { describe, expect, it } from "vitest";
import { applyMoves, isSolved } from "../src/cube";
import { swipesFor } from "../src/render/swipe";
import { solveBeginner } from "../src/solver/beginner";
import { HelpPlan } from "../src/app/helpPlan";
import { BEGINNER_LEVELS } from "../src/lessons/beginner";
import { practicePosition } from "../src/lessons/position";
import { METHODS } from "../src/lessons/index";
import { chooseHelp, helpSteps, seeded } from "../src/lessons/walkthrough";

describe("HelpPlan (kid test, round 8)", () => {
  it("one swipe into a half turn, the next Hint is the other swipe, not a new plan", () => {
    const level = BEGINNER_LEVELS.find((l) => l.id === "cross")!;
    const rnd = seeded(8);
    let checked = 0;
    for (let i = 0; i < 20; i++) {
      const s0 = practicePosition(level, rnd);
      const help = new HelpPlan((s, h) => helpSteps(level, s, h));
      const first = help.next(s0, []);
      const k = first?.moves.findIndex((m) => m.endsWith("2")) ?? -1;
      if (!first || k < 0) continue;
      // Do the step up to and including the first half of that half turn.
      const done = [...first.moves.slice(0, k), first.moves[k][0]];
      const next = help.next(applyMoves(s0, done), done);
      expect(next?.moves).toEqual([first.moves[k][0], ...first.moves.slice(k + 1)]);
      expect(next?.say).toBe(first.say);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("Hint through the app's plan cache never loops (kid test, round 8)", () => {
  const STAGE = BEGINNER_LEVELS.filter((l) => l.kind === "stage" && l.algs.length);
  it.each(STAGE)(
    "$title: mid-sequence, look and look back (or turn and undo), then Hint",
    (level) => {
      const rnd = seeded(level.number * 29 + 1);
      for (let i = 0; i < 8; i++) {
        const s0 = practicePosition(level, rnd);
        const steps = helpSteps(level, s0, []);
        const st = steps.find((x) => x.why?.some((w) => / sequence, move 3 /.test(w)));
        if (!st) continue;
        const k = st.why!.findIndex((w) => / sequence, move 3 /.test(w));
        const before = steps.slice(0, steps.indexOf(st)).flatMap((x) => x.moves);
        for (const pair of [
          ["x", "x'"],
          ["y", "y'"],
          ["R", "R'"],
          ["F'", "F"],
        ]) {
          const hist = [...before, ...st.moves.slice(0, k), ...pair];
          let s = applyMoves(s0, hist);
          const help = new HelpPlan((c, h) => helpSteps(level, c, h));
          let presses = 0;
          for (; presses < 40 && !METHODS.beginner.done[level.stage!](s); presses++) {
            const next = help.next(s, hist)!;
            s = applyMoves(s, next.moves);
            hist.push(...next.moves);
          }
          expect(METHODS.beginner.done[level.stage!](s)).toBe(true);
        }
      }
    },
  );
});

describe("press Hint, make one swipe, press Hint again (kid test, round 9)", () => {
  const LEVELS = BEGINNER_LEVELS.filter((l) => l.kind === "stage");
  it.each(LEVELS)("$title: one swipe at a time always finishes", (level) => {
    const rnd = seeded(level.number * 31 + 4);
    const done = METHODS.beginner.done[level.stage!];
    for (let i = 0; i < 25; i++) {
      let s = practicePosition(level, rnd);
      const hist: string[] = [];
      const help = new HelpPlan((c, h) => helpSteps(level, c, h));
      let presses = 0;
      for (; presses < 400 && !done(s); presses++) {
        const m = swipesFor(help.next(s, hist)!.moves[0])[0];
        s = applyMoves(s, [m]);
        hist.push(m);
      }
      expect(done(s)).toBe(true);
    }
  });

  it("level 8: one swipe at a time always solves", () => {
    const full = BEGINNER_LEVELS.find((l) => l.id === "full")!;
    const rnd = seeded(909);
    for (let i = 0; i < 6; i++) {
      let s = practicePosition(full, rnd);
      const hist: string[] = [];
      const help = new HelpPlan((c, h) => chooseHelp(full, c, h, (x) => solveBeginner(x)));
      let presses = 0;
      for (; presses < 1500 && !isSolved(s); presses++) {
        const m = swipesFor(help.next(s, hist)!.moves[0])[0];
        s = applyMoves(s, [m]);
        hist.push(m);
      }
      expect(isSolved(s)).toBe(true);
    }
  });
});
