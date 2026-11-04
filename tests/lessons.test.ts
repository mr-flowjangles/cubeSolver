import { describe, expect, it } from "vitest";
import { applyMoves, isSolved, parseMoves, solved } from "../src/cube";
import { BEGINNER_LEVELS, NOTATION_DRILL } from "../src/lessons/beginner";
import { practicePosition } from "../src/lessons/position";
import { STAGES, STAGE_DONE, solveBeginner } from "../src/solver/beginner";

function seeded(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

describe("levels", () => {
  it("are numbered 0..8 with unique ids", () => {
    expect(BEGINNER_LEVELS.map((l) => l.number)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(BEGINNER_LEVELS.map((l) => l.id)).size).toBe(BEGINNER_LEVELS.length);
  });

  it("every taught sequence is valid notation", () => {
    for (const l of BEGINNER_LEVELS)
      for (const a of l.algs) expect(() => parseMoves(a.moves)).not.toThrow();
    expect(() => parseMoves(NOTATION_DRILL.join(" "))).not.toThrow();
  });

  it.each(BEGINNER_LEVELS.filter((l) => l.kind === "stage"))(
    "$title: practice cube has earlier stages done, this one not, and Show me finishes it",
    (level) => {
      const random = seeded(level.number * 97 + 1);
      for (let n = 0; n < 15; n++) {
        const pos = practicePosition(level, random);
        const i = STAGES.indexOf(level.stage!);
        for (let k = 1; k < i; k++) expect(STAGE_DONE[STAGES[k]](pos)).toBe(true);
        expect(STAGE_DONE[level.stage!](pos)).toBe(false);
        const after = applyMoves(
          pos,
          solveBeginner(pos, level.stage).flatMap((s) => s.moves),
        );
        expect(STAGE_DONE[level.stage!](after)).toBe(true);
      }
    },
  );

  it("full solve starts white-down and Show me solves it", () => {
    const full = BEGINNER_LEVELS.find((l) => l.kind === "full")!;
    const pos = practicePosition(full, seeded(5));
    expect(pos[31]).toBe("U"); // white center on the bottom
    expect(
      isSolved(
        applyMoves(
          pos,
          solveBeginner(pos).flatMap((s) => s.moves),
        ),
      ),
    ).toBe(true);
  });

  it("notation level starts solved", () => {
    expect(isSolved(practicePosition(BEGINNER_LEVELS[0]))).toBe(true);
    expect(isSolved(solved())).toBe(true);
  });
});

describe("notation drill", () => {
  it("only asks for turns that have a button", async () => {
    const { DEFAULT_PAD } = await import("../src/app/cubePanel");
    for (const m of NOTATION_DRILL) expect(DEFAULT_PAD).toContain(m);
  });
});
