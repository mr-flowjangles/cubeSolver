import { describe, expect, it } from "vitest";
import {
  type CubeState,
  isSolved,
  type Move,
  CORNER_SLOTS,
  applyMoves,
  center,
  findPiece,
  homeSlot,
  scramble,
  slot,
  slotSolved,
  invertMoves,
  parseMoves,
  solved,
  fromString,
} from "../src/cube";
import { BEGINNER_LEVELS, type Level } from "../src/lessons/beginner";
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
  chooseHelp,
} from "../src/lessons/walkthrough";
import { allowedSwipes } from "../src/app/cubePanel";
import { reorient, swipesFor } from "../src/render/swipe";
import { STAGE_DONE, STAGE_PIECES, solveBeginner } from "../src/solver/beginner";

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
  it("turns the top, never the whole cube, at any point", () => {
    const level = STAGE_LEVELS.find((l) => l.id === "yellowCornersTwist")!;
    const rnd = seeded(77);
    for (let i = 0; i < 40; i++) {
      for (const st of stageSteps(level, practicePosition(level, rnd)))
        for (const m of st.moves) expect(m[0]).not.toBe("y");
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

describe("Hint after one wrong turn (kid test, round 6)", () => {
  it.each(STAGE_LEVELS.filter((l) => l.method === "beginner"))(
    "$title: a wrong turn that breaks an earlier step is turned back, not re-solved",
    (level) => {
      const rnd = seeded(level.number * 17 + 3);
      for (let i = 0; i < 12; i++) {
        const start = practicePosition(level, rnd);
        const wrong = ["F", "R'", "L", "B'", "D"][i % 5];
        const help = helpSteps(level, applyMoves(start, wrong), [wrong]);
        const end = applyMoves(
          applyMoves(start, wrong),
          help.flatMap((h) => h.moves),
        );
        expect(METHODS.beginner.done[level.stage!](end)).toBe(true);
        expect(help[0]?.say ?? "").not.toMatch(/^First fix/);
      }
    },
  );

  it("level 7: a whole-cube turn partway through the twist is turned back", () => {
    const level = STAGE_LEVELS.find((l) => l.id === "yellowCornersTwist")!;
    const rnd = seeded(31);
    for (let i = 0; i < 20; i++) {
      let s = practicePosition(level, rnd);
      const steps = stageSteps(level, s);
      const at = steps.findIndex((x) => x.moves.length >= 4 && x.moves[0][0] !== "y");
      if (at < 0) continue;
      const step = steps[at];
      // The steps before it first (e.g. turn the top), so the round twists the right corner.
      s = applyMoves(
        s,
        steps.slice(0, at).flatMap((x) => x.moves),
      );
      s = applyMoves(s, step.moves.slice(0, 4)); // one Twist round: the bottom is messy
      const recent = [...step.moves.slice(0, 4), "y"];
      const help = helpSteps(level, applyMoves(s, "y"), recent);
      expect(help[0].moves).toEqual(["y'"]);
      // Then the same twist steps as if the cube had never been turned: no trip back to level 1.
      const twistOnly = helpSteps(level, s, recent.slice(0, -1)).flatMap((h) => h.moves);
      expect(help.flatMap((h) => h.moves)).toEqual(["y'", ...twistOnly]);
    }
  });
});

describe("kid test, round 6", () => {
  it("a daisy step never turns the whole cube partway (so the lit squares stay right)", () => {
    const rnd = seeded(66);
    for (let i = 0; i < 60; i++) {
      const c = applyMoves(solved(), scramble(25, rnd));
      for (const st of solveBeginner(c, "cross").filter((x) => x.part?.startsWith("Part 1")))
        if (st.moves.some((m) => m[0] === "y")) expect(st.moves.length).toBe(1);
    }
  });

  it.each(STAGE_LEVELS.filter((l) => l.method === "beginner" && l.algs.length))(
    "$title: partway into a sequence, then a stray turn: turn it back, then finish",
    (level) => {
      const rnd = seeded(level.number * 19 + 2);
      for (let i = 0; i < 10; i++) {
        let s = practicePosition(level, rnd);
        for (const st of stageSteps(level, s)) {
          const k = st.why!.findIndex((w) => / sequence, move 3 /.test(w)); // two moves into a sequence
          if (k >= 0) {
            const stray = i % 2 ? "F" : "y";
            const recent = [...st.moves.slice(0, k), stray];
            const pos = applyMoves(s, recent);
            const help = helpSteps(level, pos, recent);
            expect(help[0].say).toMatch(/back first/);
            expect(help[1].say).toMatch(/^Finish/);
            const end = applyMoves(
              pos,
              help.flatMap((h) => h.moves),
            );
            expect(METHODS.beginner.done[level.stage!](end)).toBe(true);
            break;
          }
          s = applyMoves(s, st.moves);
        }
      }
    },
  );

  it("after a tip, Hint says the whole cube was turned, not that a step was undone", () => {
    const level = STAGE_LEVELS.find((l) => l.id === "middle")!;
    const s = applyMoves(practicePosition(level, seeded(4)), "x");
    expect(helpSteps(level, s, ["x"])[0].say).toBe(
      "You turned the whole cube. Turn it back first.",
    );
  });
});

describe("pressing Hint again and again always finishes (kid test, round 7)", () => {
  /** Follow Hint's first step, press again, until done. Returns the number of presses. */
  const pressUntilDone = (level: (typeof STAGE_LEVELS)[number], start: CubeState, hist: Move[]) => {
    const done = METHODS[level.method].done[level.stage!];
    let s = start;
    const h = [...hist];
    for (let presses = 0; presses < 40; presses++) {
      if (done(s)) return presses;
      const first = helpSteps(level, s, h)[0];
      if (!first) return -1; // "Already done!" on an unfinished cube
      s = applyMoves(s, first.moves);
      h.push(...first.moves);
    }
    return -2; // looped
  };

  it.each(STAGE_LEVELS.filter((l) => l.method === "beginner"))(
    "$title: from every point of a solve, with the full move history",
    (level) => {
      const rnd = seeded(level.number * 23 + 9);
      for (let i = 0; i < 6; i++) {
        let s = practicePosition(level, rnd);
        const hist: Move[] = [];
        for (const st of stageSteps(level, s))
          for (const m of st.moves) {
            expect(pressUntilDone(level, s, hist)).toBeGreaterThanOrEqual(0);
            // A look and look-back, or a wrong turn put right by hand, mid-sequence (round 8).
            for (const pair of [
              ["x", "x'"],
              ["y", "y'"],
              ["F", "F'"],
            ])
              expect(pressUntilDone(level, s, [...hist, ...pair])).toBeGreaterThanOrEqual(0);
            // Following the plan exactly is never a stray move.
            expect(helpSteps(level, s, hist)[0]?.say ?? "").not.toMatch(/back first/);
            s = applyMoves(s, [m]);
            hist.push(m);
          }
      }
    },
  );
});

describe("full solve: pressing Hint again and again always finishes (kid test, round 7)", () => {
  it("from points along a full solve, with the full move history", () => {
    const full = BEGINNER_LEVELS.find((l) => l.id === "full")!;
    // The same choice as lesson.ts: finish a started sequence, else turn a stray move back, else plan.
    const next = (s: CubeState, h: Move[]) => chooseHelp(full, s, h, (x) => solveBeginner(x))[0];
    const rnd = seeded(707);
    for (let i = 0; i < 3; i++) {
      let s = applyMoves(solved(), scramble(25, rnd));
      const hist: Move[] = [];
      const all = solveBeginner(s).flatMap((x) => x.moves);
      all.forEach((m, j) => {
        if (j % 4 === 0) {
          expect(next(s, hist)?.say ?? "").not.toMatch(/back first/);
          let t = s;
          const h = [...hist];
          let presses = 0;
          for (; presses < 60 && !isSolved(t); presses++) {
            const st = next(t, h);
            t = applyMoves(t, st.moves);
            h.push(...st.moves);
          }
          expect(isSolved(t)).toBe(true);
        }
        s = applyMoves(s, [m]);
        hist.push(m);
      });
    }
  });
});

describe("Hint after a sequence at the wrong moment (kid test, round 9)", () => {
  it.each(STAGE_LEVELS.filter((l) => l.method === "beginner" && l.algs.length > 0))(
    "$title: a sequence started or done at the wrong moment is undone, not the cross redone",
    (level) => {
      const rnd = seeded(level.number * 23 + 9);
      for (let i = 0; i < 8; i++) {
        // Partway through: some of the plan's steps done, as a player following Hint would.
        const pos = practicePosition(level, rnd);
        const plan = helpSteps(level, pos);
        const before = plan.slice(0, i % plan.length).flatMap((h) => h.moves);
        const start = applyMoves(pos, before);
        const hist = before.flatMap((m) => swipesFor(m));
        for (const a of level.algs) {
          const all = parseMoves(a.moves).flatMap((m) => swipesFor(m));
          // Every start of the sequence from two swipes on, and the whole of it.
          for (let p = 2; p <= all.length; p++) {
            const did = all.slice(0, p);
            const s = applyMoves(start, did);
            if (METHODS.beginner.done[level.stage!](s)) continue;
            // The sequence alone, and with one stray turn after it.
            for (const stray of [[], ["F'"]] as Move[][]) {
              const t = applyMoves(s, stray);
              if (METHODS.beginner.done[level.stage!](t)) continue;
              const help = helpSteps(level, t, [...hist, ...did, ...stray]);
              expect(help.some((h) => /^First fix/.test(h.say))).toBe(false);
              const end = applyMoves(
                t,
                help.flatMap((h) => h.moves),
              );
              expect(METHODS.beginner.done[level.stage!](end)).toBe(true);
            }
          }
        }
      }
    },
  );
});

describe("Hint after one sequence too many, or a turn before one (kid test, round 10)", () => {
  const lv = (id: string) => BEGINNER_LEVELS.find((l) => l.id === id)!;
  /** Follow Hint's first step n times from `start`, do `extra`, then ask Hint. */
  const after = (level: Level, start: string, n: number, extra: string) => {
    let s = fromString(start);
    const h: Move[] = [];
    for (let i = 0; i < n; i++) {
      const st = helpSteps(level, s, h)[0];
      s = applyMoves(s, st.moves);
      h.push(...st.moves);
    }
    const moves = parseMoves(extra);
    const at = applyMoves(s, moves);
    const help = helpSteps(level, at, [...h, ...moves]);
    const end = applyMoves(
      at,
      help.flatMap((x) => x.moves),
    );
    const swipes = help.flatMap((x) => x.moves.flatMap((m) => swipesFor(m))).length;
    return { help, end, swipes };
  };

  // After a step that put a piece in place, one move of the sequence again: the start of one
  // sequence too many, which would undo that piece.
  it.each([
    ["corners", "R"],
    ["yellowCornersTwist", "R'"],
  ] as const)("%s: one sequence move too many is turned back, not finished", (id, extra) => {
    const level = lv(id);
    const rnd = seeded(1010);
    let checked = 0;
    for (let i = 0; i < 10; i++) {
      let s = practicePosition(level, rnd);
      const h: Move[] = [];
      const placed = STAGE_PIECES[level.stage as keyof typeof STAGE_PIECES]!;
      for (const st of stageSteps(level, s)) {
        const had = placed(s);
        s = applyMoves(s, st.moves);
        h.push(...st.moves);
        if (METHODS.beginner.done[level.stage!](s)) break;
        if (placed(s) <= had) continue; // only steps that put a piece in place
        const next = helpSteps(level, s, h)[0];
        if (next.moves[0] === extra) continue; // the next step really starts with it
        const help = helpSteps(level, applyMoves(s, [extra]), [...h, extra]);
        expect(help[0].moves).toEqual(invertMoves([extra]));
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(5);
  });

  it("level 7: a whole-cube turn, then a Twist, is undone, not a trip back to the cross", () => {
    const level = lv("yellowCornersTwist");
    const r = after(
      level,
      "DDDDDDFDBLBBBBBBBBDLDLLLLLLUUUUUUUUUFFLFFFFFFRRRRRRRRR",
      2,
      "y R' D' R D",
    );
    expect(r.help.some((x) => /^First fix/.test(x.say))).toBe(false);
    expect(r.help[0].moves).toEqual(parseMoves("D' R' D R y'"));
    expect(isSolved(r.end)).toBe(true);
    expect(r.swipes).toBeLessThan(40);
  });

  it("level 8: a Corner at the wrong moment is never called Swap edges", () => {
    const level = lv("full");
    const r = after(
      level,
      "DFLLDRDBFRDBBBBBBBRDDLLLLLLUUUUUUUUULDBFFFFFFDDFRRRRRR",
      0,
      "R U R' U'",
    );
    expect(r.help.some((x) => /Swap edges sequence you started/.test(x.say))).toBe(false);
    expect(isSolved(r.end)).toBe(true);
  });

  it("level 4: starting the second Yellow cross (F after F') is finished, not undone", () => {
    const level = lv("yellowCross");
    const start = "DDBRDDRFDRBDRRRRRRDDBBBBBBBUUUUUUUUULDFLLLLLLLLFFFFFFF";
    const moves = parseMoves("U' F R U R' U' F' F");
    const s = applyMoves(fromString(start), moves);
    expect(helpSteps(level, s, moves)[0].moves).toEqual(parseMoves("R U R' U' F'"));
    // And with a look and look-back after the F.
    expect(helpSteps(level, s, [...moves, "x", "x'"])[0].moves).toEqual(parseMoves("R U R' U' F'"));
  });
});

describe("a slip of one move is undone, not fixed the long way (kid test, round 13)", () => {
  it.each([
    // Level 2: the kid followed Hint, then turned the top the wrong way.
    [
      "corners",
      "FBFRDFFRBLLDDFDFFULFDLRLDRRRUUUUUBUBDBUFBBUBBRDLRLDLLR",
      "U U y R U R' U' R U'",
      "U",
    ],
    // Level 8: a stray back turn during the cross.
    [
      "full",
      "BRRUDFRULBDFLRLRUFBBUDBULBUDRFFUFFBLRRDFLLULBDDUBFRDDL",
      "R U U F' y F F y y F F U U y F F y y F F U y y R B'",
      "B",
    ],
  ])("%s: Hint says turn the last move back", (id, start, hist, undo) => {
    const level = BEGINNER_LEVELS.find((l) => l.id === id)!;
    const moves = parseMoves(hist);
    const s = applyMoves(fromString(start), moves);
    const first =
      level.kind === "stage"
        ? helpSteps(level, s, moves)[0]
        : chooseHelp(level, s, moves, (x) => solveBeginner(x))[0];
    expect(first.say).toBe("Turn your last move back first.");
    expect(first.moves).toEqual([undo]);
  });
});
