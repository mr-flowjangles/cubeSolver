import { describe, expect, it } from "vitest";
import { applyMoves, findProblems, fromString, solved, toString } from "../src/cube";
import { solveBeginner } from "../src/solver/beginner";

const swap = (s: string, i: number, j: number) => {
  const a = s.split("");
  [a[i], a[j]] = [a[j], a[i]];
  return a.join("");
};

describe("validate", () => {
  it("a scrambled real cube has no problems", () => {
    expect(findProblems(applyMoves(solved(), "R U F' L2 D B' R2"))).toEqual([]);
  });

  it("wrong color counts", () => {
    const s = toString(solved());
    const bad = fromString("R" + s.slice(1)); // a white sticker painted red
    expect(findProblems(bad).some((p) => p.message.includes("8 white"))).toBe(true);
    expect(findProblems(bad).some((p) => p.message.includes("10 red"))).toBe(true);
  });

  it("a piece that can't exist", () => {
    const s = toString(solved());
    // Put a yellow sticker (index 28) on the UF edge's front (index 19): a white–yellow edge.
    const bad = fromString(swap(s, 19, 28));
    expect(findProblems(bad).some((p) => p.message.startsWith("No edge"))).toBe(true);
  });

  it("flipped edge: pieces are real but the solver can't finish", () => {
    const s = toString(solved());
    // UF edge stickers are U index 7 and F index 19; swap them to flip it.
    const flipped = fromString(swap(s, 7, 19));
    expect(findProblems(flipped)).toEqual([]);
    expect(() => solveBeginner(flipped)).toThrow();
  });

  it("twisted corner: pieces are real but the solver can't finish", () => {
    const s = toString(solved());
    // URF corner: U 8, R 9, F 20. Rotate its three stickers.
    const a = s.split("");
    [a[8], a[9], a[20]] = [a[20], a[8], a[9]];
    const twisted = fromString(a.join(""));
    expect(findProblems(twisted)).toEqual([]);
    expect(() => solveBeginner(twisted)).toThrow();
  });

  it("two pieces swapped: the solver can't finish", () => {
    // Swap two U edges entirely (UF <-> UR): odd permutation.
    const s = toString(solved()).split("");
    [s[7], s[5]] = [s[5], s[7]];
    [s[19], s[10]] = [s[10], s[19]];
    const swapped = fromString(s.join(""));
    expect(findProblems(swapped)).toEqual([]);
    expect(() => solveBeginner(swapped)).toThrow();
  });
});
