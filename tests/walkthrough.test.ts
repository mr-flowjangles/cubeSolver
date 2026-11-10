import { describe, expect, it } from "vitest";
import {
  CORNER_SLOTS,
  applyMoves,
  center,
  findPiece,
  homeSlot,
  scramble,
  slot,
  slotSolved,
  invertMoves,
  solved,
} from "../src/cube";
import { BEGINNER_LEVELS } from "../src/lessons/beginner";
import { ALL_LEVELS, METHODS } from "../src/lessons/index";
import { PRACTICE_RAMP, practicePosition } from "../src/lessons/position";
import {
  afterGuide,
  demoPosition,
  finishSequence,
  guideMoves,
  helpSteps,
  seeded,
  stageSteps,
} from "../src/lessons/walkthrough";
import { allowedSwipes } from "../src/app/cubePanel";
import { reorient } from "../src/render/swipe";
import { STAGE_DONE, solveBeginner } from "../src/solver/beginner";

const STAGE_LEVELS = ALL_LEVELS.filter((l) => l.kind === "stage");

describe("walk-through", () => {
  it.each(STAGE_LEVELS)(
    "$title: following every move finishes the stage",
    (level) => {
      const allowed = allowedSwipes(level.method === "cfop" ? "cfop" : "beginner");
      const pos = demoPosition(level);
      const moves = guideMoves(stageSteps(level, pos));
      expect(moves.length).toBeGreaterThan(0);
      for (const g of moves) expect(allowed).toContain(g.move); // every move is one allowed swipe
      expect(METHODS[level.method].done[level.stage!](afterGuide(pos, moves))).toBe(true);
    },
    60_000,
  );

  it.each(STAGE_LEVELS)(
    "$title: turning the whole cube mid-way, the renamed moves still finish the stage",
    (level) => {
      const pos = demoPosition(level);
      const moves = guideMoves(stageSteps(level, pos));
      const turns = ["y", "x", "y'", "x'", "y"];
      let s = pos;
      const turned: string[] = [];
      moves.forEach((g, i) => {
        if (i % 3 === 1) {
          const t = turns[turned.length % turns.length];
          turned.push(t);
          s = applyMoves(s, [t]);
        }
        s = applyMoves(s, [reorient(g.move, turned)]);
      });
      // The stage checks expect white on the bottom, so turn the cube back first.
      s = applyMoves(s, invertMoves(turned));
      expect(METHODS[level.method].done[level.stage!](s)).toBe(true);
    },
    60_000,
  );

  it("splits a half turn into two swipes, and r into R then M'", () => {
    const g = guideMoves([{ stage: "cross", moves: ["U2", "F", "r"], say: "x" }]);
    expect(g.map((m) => m.move)).toEqual(["U", "U", "F", "R", "M'"]);
  });
});

describe("white cross, the daisy way", () => {
  const random = seeded(42);
  const cubes = Array.from({ length: 60 }, () => applyMoves(solved(), scramble(25, random)));

  it("gives a reason for every move, and names the piece and where it goes", () => {
    for (const c of cubes)
      for (const st of solveBeginner(c, "cross").filter((s) => s.stage === "cross")) {
        expect(st.why).toHaveLength(st.moves.length);
        // A step that only turns the whole cube to look around has no piece to light.
        if (!st.moves.every((m) => m[0] === "y")) expect(st.piece).toHaveLength(2);
      }
  });

  it("builds the daisy first (white edges on top, white up), then turns them down", () => {
    for (const c of cubes) {
      let s = solveBeginner(c, "hold").reduce((x, st) => applyMoves(x, st.moves), c);
      const steps = solveBeginner(s, "cross").filter((x) => x.stage === "cross");
      const daisy = steps.filter((x) => x.part?.startsWith("Part 1"));
      for (const st of daisy) s = applyMoves(s, st.moves);
      const white = s[31]; // bottom center
      // Every white edge is on top white side up, or already finished on the bottom.
      const up = [1, 3, 5, 7].filter((i) => s[i] === white).length;
      const finished = ["DF", "DR", "DB", "DL"].filter((n) => slotSolved(s, slot(n))).length;
      expect(up + finished).toBe(4);
      for (const st of steps.slice(daisy.length)) {
        expect(st.part).toMatch(/^Part 2/);
        expect(st.moves[st.moves.length - 1]).toBe("F2");
      }
    }
  });

  it("never knocks a white edge off the daisy on the way", () => {
    for (const c of cubes) {
      let s = solveBeginner(c, "hold").reduce((x, st) => applyMoves(x, st.moves), c);
      const white = s[31];
      for (const st of solveBeginner(s, "cross").filter((x) => x.part?.startsWith("Part 1"))) {
        const up = () => [1, 3, 5, 7].filter((i) => s[i] === white).length;
        let before = up();
        for (const m of st.moves) {
          s = applyMoves(s, [m]);
          expect(up()).toBeGreaterThanOrEqual(m[0] === "U" || m[0] === "y" ? before : before);
          before = Math.max(before, up());
        }
      }
    }
  });

  it("never turns a side the player can't see (left, back, bottom)", () => {
    for (const c of cubes)
      for (const st of solveBeginner(c, "cross").filter((s) => s.stage === "cross"))
        for (const m of st.moves) expect("LBD").not.toContain(m[0]);
  });

  it("names a piece that is really there", () => {
    const pos = demoPosition(ALL_LEVELS.find((l) => l.id === "cross")!);
    for (const st of solveBeginner(pos, "cross"))
      if (st.piece) expect(() => findPiece(pos, st.piece!)).not.toThrow();
  });
});

describe("practice cubes get harder", () => {
  it.each(STAGE_LEVELS)(
    "$title: first cube has one step left, the last the whole stage",
    (level) => {
      const m = METHODS[level.method];
      const random = seeded(level.number + 5);
      for (const left of PRACTICE_RAMP) {
        const pos = practicePosition(level, random, left);
        expect(m.done[level.stage!](pos)).toBe(false);
        if (left === undefined) continue;
        if (level.stage === "yellowCornersTwist") {
          // Easier here means fewer twisted corners, never a cube stopped part-way.
          const twisted = CORNER_SLOTS.filter(
            (s) => s.name[0] === "U" && pos[s.stickers[0]] !== center(pos, "U"),
          ).length;
          expect(twisted).toBeLessThanOrEqual(Math.max(2, left));
        } else expect(stageSteps(level, pos).length).toBeLessThanOrEqual(2 * left); // about that many
      }
    },
    60_000,
  );

  it("cross: done check matches", () => {
    expect(STAGE_DONE.cross(solved())).toBe(true);
  });
});

describe("beginner demos teach (kid test, round 2)", () => {
  const BEGINNER_STAGES = STAGE_LEVELS.filter((l) => l.method === "beginner");

  it.each(BEGINNER_STAGES)("$title: every demo move gives a reason", (level) => {
    for (const g of guideMoves(stageSteps(level, demoPosition(level)))) expect(g.why).toBeTruthy();
  });

  it.each(BEGINNER_STAGES.filter((l) => l.algs.length))(
    "$title: the demo plays every sequence the level teaches",
    (level) => {
      const played = stageSteps(level, demoPosition(level))
        .flatMap((s) => s.moves)
        .join(" ");
      for (const a of level.algs) expect(played).toContain(a.moves);
    },
  );

  it.each(BEGINNER_STAGES.filter((l) => ["corners", "middle"].includes(l.stage!)))(
    "$title: each step lights the piece it places",
    (level) => {
      let s = demoPosition(level);
      for (const st of stageSteps(level, s)) {
        expect(st.piece).toBeTruthy();
        s = applyMoves(s, st.moves);
        // A stuck piece being lifted out is lit too, but doesn't end at home yet.
        if (!/stuck/.test(st.say)) expect(slotSolved(s, homeSlot(s, st.piece!))).toBe(true);
      }
    },
  );

  it.each([
    ["corners", [/stuck in the bottom/, /Corner \d+ times/]],
    ["middle", [/stuck in the middle/, /Edge right\.$/, /Edge left\.$/]],
    ["yellowCross", [/^Yellow dot/]],
    ["yellowEdges", [/opposite/, /back and the right/]],
    ["yellowCornersPlace", [/^No corner/, /^Turn the whole cube/]],
  ] as const)("%s: the demo shows the harder cases", (id, cases) => {
    const level = BEGINNER_STAGES.find((l) => l.id === id)!;
    const says = stageSteps(level, demoPosition(level)).map((s) => s.say);
    for (const c of cases) expect(says.some((t) => c.test(t))).toBe(true);
  });

  it("a half turn's reason says which swipe it is", () => {
    const g = guideMoves([{ stage: "cross", moves: ["F2"], say: "", why: ["Drop it."] }]);
    expect(g.map((x) => x.why)).toEqual(["Drop it. (Swipe 1 of 2.)", "Drop it. (Swipe 2 of 2.)"]);
  });

  it("no level's words say 'hold' except holding the cube white-down", () => {
    for (const l of BEGINNER_LEVELS)
      for (const t of [l.goal, ...l.teach].filter((t) => /\bhold\b/i.test(t)))
        expect(t).toMatch(/white center on the bottom/);
  });
});

describe("Hint recovers after a mistake (kid test, round 4)", () => {
  const WRONG = ["R", "U'", "F", "L'", "D", "B2", "x", "x'", "y"];
  it.each(STAGE_LEVELS)(
    "$title: one wrong turn or a tip, then Hint finishes the level",
    (level) => {
      const done = METHODS[level.method].done[level.stage!];
      const rnd = seeded(level.number * 7 + 1);
      for (let i = 0; i < 12; i++) {
        const wrong = WRONG[i % WRONG.length];
        const start = applyMoves(practicePosition(level, rnd), wrong);
        const steps = helpSteps(level, start);
        if (!done(start)) expect(steps.length).toBeGreaterThan(0); // never "Already done!" on an unfinished cube
        const end = applyMoves(
          start,
          steps.flatMap((s) => s.moves),
        );
        expect(done(end)).toBe(true);
      }
    },
  );

  it("an earlier stage comes first, and says so", () => {
    const level = STAGE_LEVELS.find((l) => l.id === "middle")!;
    const start = applyMoves(practicePosition(level, seeded(5)), "R"); // breaks the white layer
    const first = helpSteps(level, start)[0];
    expect(first.stage).not.toBe("middle");
    expect(first.say).toMatch(/^First fix|^Hold/);
  });
});

describe("level 7 starts the way the words say", () => {
  it("turns the whole cube, never the top, to reach the first twisted corner", () => {
    const level = STAGE_LEVELS.find((l) => l.id === "yellowCornersTwist")!;
    const rnd = seeded(77);
    for (let i = 0; i < 40; i++) {
      const first = stageSteps(level, practicePosition(level, rnd))[0];
      if (first) expect(first.moves[0][0]).not.toBe("U");
    }
  });
});

describe("Hint mid-sequence and after a tip (kid test, round 5)", () => {
  const BEGINNER_STAGES = STAGE_LEVELS.filter((l) => l.method === "beginner" && l.algs.length);

  it.each(BEGINNER_STAGES)(
    "$title: Hint partway through a step never sends you back a level",
    (level) => {
      const rnd = seeded(level.number * 13 + 5);
      let checked = 0;
      for (let i = 0; i < 15; i++) {
        let s = practicePosition(level, rnd);
        for (const st of stageSteps(level, s)) {
          // Stop at the start of each step and every point inside it, and ask for Hint there.
          for (let k = 0; k < st.moves.length; k++) {
            const mid = applyMoves(s, st.moves.slice(0, k));
            const help = helpSteps(level, mid, st.moves.slice(0, k));
            expect(help[0]?.say ?? "").not.toMatch(/^First fix/);
            const end = applyMoves(
              mid,
              help.flatMap((h) => h.moves),
            );
            expect(METHODS.beginner.done[level.stage!](end)).toBe(true);
            checked++;
          }
          s = applyMoves(s, st.moves);
        }
      }
      expect(checked).toBeGreaterThan(0);
    },
  );

  it("Hint's hold step never asks for a sideways whole-cube turn (no swipe makes z)", () => {
    const level = STAGE_LEVELS.find((l) => l.id === "corners")!;
    const base = practicePosition(level, seeded(9));
    for (const a of ["", "x", "x'", "x2"])
      for (const b of ["", "y", "y'", "y2", "z", "z'"]) {
        const held = applyMoves(base, [a, b].filter(Boolean));
        for (const st of helpSteps(level, held))
          for (const m of st.moves) expect(m[0]).not.toBe("z");
      }
  });
});

describe("full solve: Hint mid-twist stays on the twist (kid test, round 5)", () => {
  it("every point of the twist stage plans only twist steps", () => {
    const rnd = seeded(808);
    for (let i = 0; i < 20; i++) {
      let s = applyMoves(solved(), scramble(25, rnd));
      const plan = solveBeginner(s);
      for (const st of plan) {
        if (st.stage === "yellowCornersTwist")
          for (let k = 0; k < st.moves.length; k++) {
            const mid = applyMoves(s, st.moves.slice(0, k));
            const fin = finishSequence(
              BEGINNER_LEVELS.find((l) => l.id === "full")!,
              mid,
              st.moves.slice(0, k),
            );
            const next = fin ? fin : solveBeginner(mid)[0];
            if (next) expect(["full", "yellowCornersTwist"]).toContain(next.stage);
          }
        s = applyMoves(s, st.moves);
      }
    }
  });
});
