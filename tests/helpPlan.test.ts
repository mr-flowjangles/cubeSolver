import { describe, expect, it } from "vitest";
import { applyMoves, fromString, invertMove, isSolved, parseMoves } from "../src/cube";
import { swipesFor } from "../src/render/swipe";
import { solveBeginner } from "../src/solver/beginner";
import { HelpPlan } from "../src/app/helpPlan";
import { BEGINNER_LEVELS } from "../src/lessons/beginner";
import { practicePosition } from "../src/lessons/position";
import { METHODS } from "../src/lessons/index";
import { chooseHelp, helpSteps, seeded, stageSteps } from "../src/lessons/walkthrough";

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
      // Partway in, the words say how many are left, not the whole step's count (round 12).
      expect(next?.say).toBe(
        `Keep going with this step: ${next!.moves.length} more ${next!.moves.length === 1 ? "move" : "moves"}.`,
      );
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

describe("Hint pressed every few swipes (kid test, round 11)", () => {
  /** Press Hint, make `n` of its swipes, press again, until done. Presses used, or -1. */
  const press = (
    help: HelpPlan,
    start: ReturnType<typeof practicePosition>,
    n: number,
    done: (s: ReturnType<typeof practicePosition>) => boolean,
    hist: string[] = [],
  ) => {
    let s = start;
    for (let presses = 0; presses < 800; presses++) {
      if (done(s)) return presses;
      const sw = help
        .next(s, hist)!
        .moves.flatMap((m) => swipesFor(m))
        .slice(0, n);
      s = applyMoves(s, sw);
      hist.push(...sw);
    }
    return -1;
  };

  // A plan that turns and turns back ("F' F" between two Yellow crosses, "U U'" before Edge left)
  // comes back to an earlier cube: Hint must not go back there.
  it.each(["middle", "yellowCross", "full"])(
    "%s: two or three swipes per press always finishes",
    (id) => {
      const level = BEGINNER_LEVELS.find((l) => l.id === id)!;
      const done = level.stage ? METHODS.beginner.done[level.stage] : isSolved;
      const rnd = seeded(1111);
      for (let i = 0; i < (level.stage ? 30 : 8); i++) {
        const s0 = practicePosition(level, rnd);
        for (const n of [2, 3]) {
          const help = new HelpPlan((c, h) =>
            level.stage ? helpSteps(level, c, h) : chooseHelp(level, c, h, (x) => solveBeginner(x)),
          );
          expect(press(help, s0, n, done)).toBeGreaterThanOrEqual(0);
        }
      }
    },
  );

  it("level 4: after a turn and its undo, Hint never loops and its turn-back has no such pair", () => {
    const level = BEGINNER_LEVELS.find((l) => l.id === "yellowCross")!;
    const rnd = seeded(1112);
    for (let i = 0; i < 20; i++) {
      const moves = parseMoves("F' F R U R' U' F'");
      const s = applyMoves(practicePosition(level, rnd), moves);
      // Turn-back arrows never hold a turn and its undo. (A plan step may: two Yellow crosses
      // in a row end and start with F' F, as the words say.)
      for (const st of helpSteps(level, s, moves).filter((x) => /back first|undo it/.test(x.say)))
        for (let j = 1; j < st.moves.length; j++)
          expect(st.moves[j - 1]).not.toBe(invertMove(st.moves[j]));
      const help = new HelpPlan((c, h) => helpSteps(level, c, h));
      expect(
        press(help, s, 2, METHODS.beginner.done.yellowCross, [...moves]),
      ).toBeGreaterThanOrEqual(0);
    }
  });

  // One stray turn inside a long step, then the rest of the step from memory: Hint turns back to
  // before the stray, not "First fix the white cross" (up to 220 extra swipes before).
  it("level 7: a stray turn inside a Twist step, then the rest of it, is turned back", () => {
    const level = BEGINNER_LEVELS.find((l) => l.id === "yellowCornersTwist")!;
    const rnd = seeded(1113);
    let checked = 0;
    for (let i = 0; i < 20; i++) {
      let s = practicePosition(level, rnd);
      const steps = stageSteps(level, s);
      const at = steps.findIndex((x) => x.moves.length >= 8);
      if (at < 0) continue;
      const hist = steps.slice(0, at).flatMap((x) => x.moves);
      s = applyMoves(s, hist);
      const sw = steps[at].moves;
      const kid = [...sw.slice(0, 4), "F", ...sw.slice(4)]; // a stray F after the first round
      // The best there is: undo the stray and what followed, then the plan from before the stray.
      const before = applyMoves(s, sw.slice(0, 4));
      const best =
        kid.length -
        4 +
        helpSteps(level, before, [...hist, ...sw.slice(0, 4)]).flatMap((x) => x.moves).length;
      s = applyMoves(s, kid);
      hist.push(...kid);
      const help = helpSteps(level, s, hist);
      expect(help.some((x) => /^First fix/.test(x.say))).toBe(false);
      const end = applyMoves(
        s,
        help.flatMap((x) => x.moves),
      );
      expect(isSolved(end)).toBe(true);
      expect(help.flatMap((x) => x.moves).length).toBeLessThanOrEqual(best + 4);
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });
});

describe("Hint's counts and long mistakes (kid test, round 12)", () => {
  const lv = (id: string) => BEGINNER_LEVELS.find((l) => l.id === id)!;
  const total = (steps: { moves: string[] }[]) => steps.flatMap((x) => x.moves).length;

  // Each start is a real start for its level (earlier stages done); the best totals are round 12's.
  it.each([
    [
      "yellowCornersTwist",
      "DDBDDDDDBLBRBBBBBBLLDLLLLLLUUUUUUUUUFFFFFFFFFDRRRRRRRR",
      "R' U D' R D R' D' R D R' D' R D R' D' R D",
      43,
    ],
    [
      "yellowCross",
      "FFDRDDBDRBLFFFFFFFLBDRRRRRRUUUUUUUUURDDBBBBBBLDDLLLLLL",
      "U F' U F R U R' U' F' F R U R' U' F'",
      25,
    ],
    ["corners", "FLLDDRRFLDBURFLDFDFLBDRDDRBFURUUUUUFLFURBBRBRBBUDLFLLB", "L U' R U R' U' R", 36],
  ] as const)(
    "%s: a stray inside a step costs no more than the best way back",
    (id, start, mv, best) => {
      const level = lv(id);
      const moves = parseMoves(mv);
      const s = applyMoves(fromString(start), moves);
      const help = helpSteps(level, s, moves);
      expect(total(help)).toBeLessThanOrEqual(best);
      expect(
        METHODS.beginner.done[level.stage!](
          applyMoves(
            s,
            help.flatMap((x) => x.moves),
          ),
        ),
      ).toBe(true);
    },
  );

  it("'Turn back your last N moves' counts the arrows shown", () => {
    const SIDE = ["R", "R'", "U", "U'", "F", "F'", "L", "L'", "D", "D'", "B", "B'"];
    const words: Record<string, number> = { move: 1, two: 2 };
    let checked = 0;
    for (const level of BEGINNER_LEVELS.filter((l) => l.kind === "stage" && l.algs.length)) {
      const rnd = seeded(level.number * 41 + 12);
      for (let i = 0; i < 20; i++) {
        const strays = [SIDE[Math.floor(rnd() * 12)], SIDE[Math.floor(rnd() * 12)], "U", "U"];
        const s = applyMoves(practicePosition(level, rnd), strays);
        for (const st of helpSteps(level, s, strays)) {
          const m = /^Turn (?:back )?your last (?:(\d+|two) moves|(move))/.exec(st.say);
          if (!m) continue;
          const n = m[2] ? 1 : (words[m[1]] ?? Number(m[1]));
          expect(st.moves.length).toBe(n);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(10);
  });

  it("partway into a step, Hint says how many moves are left, as the arrows show", () => {
    const level = lv("corners");
    const rnd = seeded(1212);
    let checked = 0;
    for (let i = 0; i < 10; i++) {
      const s0 = practicePosition(level, rnd);
      const help = new HelpPlan((c, h) => helpSteps(level, c, h));
      const first = help.next(s0, [])!;
      const sw = first.moves.flatMap((m) => swipesFor(m));
      if (sw.length < 6) continue;
      const done = sw.slice(0, 5);
      const next = help.next(applyMoves(s0, done), done)!;
      expect(next.moves).toEqual(sw.slice(5));
      expect(next.say).toBe(`Keep going with this step: ${sw.length - 5} more moves.`);
      checked++;
    }
    expect(checked).toBeGreaterThan(3);
  });
});
