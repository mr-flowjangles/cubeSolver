import { describe, expect, it } from "vitest";
import { applyMoves, invertMoves, isSolved, parseMoves, slot, solved } from "../src/cube";
import { BEGINNER_LEVELS, NOTATION_DRILL } from "../src/lessons/beginner";
import { ALL_LEVELS, METHODS } from "../src/lessons/index";
import { PRACTICE_RAMP, practicePosition } from "../src/lessons/position";
import { STAGE_DONE, STAGES } from "../src/solver/beginner";
import { CP_ALGS, EO_ALGS, solvePll } from "../src/solver/cfop";

function seeded(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

describe("levels", () => {
  it("are numbered 0..16 in order with unique ids", () => {
    expect(ALL_LEVELS.map((l) => l.number)).toEqual([...Array(17).keys()]);
    expect(new Set(ALL_LEVELS.map((l) => l.id)).size).toBe(ALL_LEVELS.length);
  });

  it("every taught sequence is valid notation", () => {
    for (const l of ALL_LEVELS)
      for (const a of l.algs) expect(() => parseMoves(a.moves)).not.toThrow();
    expect(() => parseMoves(NOTATION_DRILL.join(" "))).not.toThrow();
  });

  it.each(ALL_LEVELS.filter((l) => l.kind === "stage"))(
    "$title: practice cube has earlier stages done, this one not, and Show me finishes it",
    (level) => {
      const m = METHODS[level.method];
      const random = seeded(level.number * 97 + 1);
      for (let n = 0; n < 10; n++) {
        const pos = practicePosition(level, random);
        const i = m.stages.indexOf(level.stage!);
        for (let k = 1; k < i; k++) expect(m.done[m.stages[k]](pos)).toBe(true);
        expect(m.done[level.stage!](pos)).toBe(false);
        const after = applyMoves(
          pos,
          m.solve(pos, level.stage).flatMap((s) => s.moves),
        );
        expect(m.done[level.stage!](after)).toBe(true);
      }
    },
    60_000, // each case runs the solver 20 times; CI machines are slower
  );

  it.each(ALL_LEVELS.filter((l) => l.kind === "full"))(
    "$title starts white-down and Show me solves it",
    (level) => {
      const pos = practicePosition(level, seeded(5));
      expect(pos[31]).toBe("U"); // white center on the bottom
      const steps = METHODS[level.method].solve(pos);
      expect(
        isSolved(
          applyMoves(
            pos,
            steps.flatMap((s) => s.moves),
          ),
        ),
      ).toBe(true);
    },
  );

  it("Full PLL practice cubes are PLL cases, white down, and Show me solves them", () => {
    const level = ALL_LEVELS.find((l) => l.kind === "pll")!;
    const random = seeded(8);
    for (let n = 0; n < 20; n++) {
      const pos = practicePosition(level, random);
      expect(pos[31]).toBe("U");
      expect(METHODS.cfop.done.oll(pos)).toBe(true);
      expect(
        isSolved(
          applyMoves(
            pos,
            solvePll(pos).flatMap((s) => s.moves),
          ),
        ),
      ).toBe(true);
    }
  });

  it("notation level starts solved", () => {
    expect(isSolved(practicePosition(BEGINNER_LEVELS[0]))).toBe(true);
    expect(isSolved(solved())).toBe(true);
  });
});

describe("move buttons", () => {
  it("every CFOP sequence can be made with the CFOP buttons", async () => {
    const { CFOP_PAD } = await import("../src/app/cubePanel");
    for (const l of ALL_LEVELS.filter((x) => x.method === "cfop"))
      for (const a of l.algs)
        for (const m of parseMoves(a.moves)) {
          // A half turn can be made as two quarter turns.
          const ok = CFOP_PAD.includes(m) || (m.endsWith("2") && CFOP_PAD.includes(m[0]));
          expect(ok, `${l.title}: ${a.name} needs ${m}`).toBe(true);
        }
  });
});

describe("notation drill", () => {
  it("only asks for turns that have a button", async () => {
    const { DEFAULT_PAD } = await import("../src/app/cubePanel");
    for (const m of NOTATION_DRILL) expect(DEFAULT_PAD).toContain(m);
  });
});

describe("cube review fixes (v0.8.6)", () => {
  const top = (s: readonly string[], name: string) => s[slot(name).stickers[0]] === s[4];

  it("L shape alg solves an L held at front-right, as level 11 says", () => {
    const l = ALL_LEVELS.find((x) => x.id === "cfopEo")!;
    expect(l.teach.some((t) => t.includes("front-right"))).toBe(true);
    const alg = parseMoves(EO_ALGS.find((a) => a.name === "L shape")!.moves);
    const before = applyMoves(solved(), invertMoves(alg));
    const up = ["UF", "UR", "UB", "UL"].filter((n) => top(before, n));
    expect(up.sort()).toEqual(["UF", "UR"]);
  });

  it("T-perm solves headlights held on the left, as level 13 says", () => {
    const l = ALL_LEVELS.find((x) => x.id === "cfopCp")!;
    expect(l.teach.some((t) => t.includes("on the left"))).toBe(true);
    const alg = parseMoves(CP_ALGS.find((a) => a.name.startsWith("T-perm"))!.moves);
    const before = applyMoves(solved(), invertMoves(alg));
    expect(before[36]).toBe(before[38]); // left side's top corners match: headlights
    expect(before[9]).not.toBe(before[11]); // right side's don't
  });

  it("level 7 practice cubes always have every earlier stage done", () => {
    const lv = ALL_LEVELS.find((x) => x.id === "yellowCornersTwist")!;
    const r = seeded(4);
    for (const left of PRACTICE_RAMP)
      for (let k = 0; k < 15; k++) {
        const p = practicePosition(lv, r, left);
        for (const st of STAGES.slice(1, STAGES.indexOf("yellowCornersTwist")))
          expect(STAGE_DONE[st](p), `${st} with ${left} left`).toBe(true);
        expect(STAGE_DONE.yellowCornersTwist(p)).toBe(false);
      }
  });
});
