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
  guideMoves,
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
        expect(st.piece).toHaveLength(2);
        expect(st.to).toBeTruthy();
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
