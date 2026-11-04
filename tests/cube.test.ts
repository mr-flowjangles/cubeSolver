import { describe, expect, it } from "vitest";
import {
  applyMove,
  applyMoves,
  fromString,
  invertMoves,
  isSolved,
  parseMoves,
  scramble,
  solved,
  toString,
} from "../src/cube";

const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
const ALL_BASES = "U R F D L B Uw Rw Fw Dw Lw Bw u r f d l b M E S x y z".split(" ");

// Seeded random so scramble tests repeat exactly.
function seeded(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

describe("cube state", () => {
  it("starts solved in the standard layout", () => {
    expect(toString(solved())).toBe(SOLVED);
    expect(isSolved(solved())).toBe(true);
  });

  it("round-trips through text", () => {
    expect(toString(fromString(SOLVED))).toBe(SOLVED);
    expect(() => fromString("UUU")).toThrow();
  });
});

describe("moves", () => {
  // Known results from the standard layout, checked against published solver test data.
  it("R from solved", () => {
    expect(toString(applyMove(solved(), "R"))).toBe(
      "UUFUUFUUF" + "RRRRRRRRR" + "FFDFFDFFD" + "DDBDDBDDB" + "LLLLLLLLL" + "UBBUBBUBB",
    );
  });

  it("U from solved", () => {
    expect(toString(applyMove(solved(), "U"))).toBe(
      "UUUUUUUUU" + "BBBRRRRRR" + "RRRFFFFFF" + "DDDDDDDDD" + "FFFLLLLLL" + "LLLBBBBBB",
    );
  });

  it("F from solved", () => {
    expect(toString(applyMove(solved(), "F"))).toBe(
      "UUUUUULLL" + "URRURRURR" + "FFFFFFFFF" + "RRRDDDDDD" + "LLDLLDLLD" + "BBBBBBBBB",
    );
  });

  it.each(ALL_BASES)("%s four times is no change", (m) => {
    expect(isSolved(applyMoves(solved(), [m, m, m, m]))).toBe(true);
    expect(isSolved(applyMoves(solved(), [m]))).toBe(m === "x" || m === "y" || m === "z");
  });

  it.each(ALL_BASES)("%s then %s' is no change, and %s2 is two turns", (m) => {
    expect(toString(applyMoves(solved(), [m, m + "'"]))).toBe(SOLVED);
    expect(applyMoves(solved(), [m + "2"])).toEqual(applyMoves(solved(), [m, m]));
  });

  it("(R U R' U') six times is no change", () => {
    expect(isSolved(applyMoves(solved(), "R U R' U' ".repeat(6)))).toBe(true);
    expect(isSolved(applyMoves(solved(), "R U R' U' ".repeat(5)))).toBe(false);
  });

  it("wide, slice and whole-cube turns match their face-turn equivalents", () => {
    const s = applyMoves(solved(), "R U F' D2 L B'");
    expect(applyMoves(s, "r")).toEqual(applyMoves(s, "R M'"));
    expect(applyMoves(s, "Rw")).toEqual(applyMoves(s, "r"));
    expect(applyMoves(s, "x")).toEqual(applyMoves(s, "R M' L'"));
    expect(applyMoves(s, "y")).toEqual(applyMoves(s, "U E' D'"));
    expect(applyMoves(s, "z")).toEqual(applyMoves(s, "F S B'"));
  });

  it("T-perm (a PLL) applied twice is no change", () => {
    const tperm = "R U R' U' R' F R2 U' R' U' R U R' F'";
    expect(isSolved(applyMoves(solved(), tperm))).toBe(false);
    expect(isSolved(applyMoves(solved(), `${tperm} ${tperm}`))).toBe(true);
  });

  it("rejects unknown moves", () => {
    expect(() => parseMoves("R Q")).toThrow();
    expect(() => applyMove(solved(), "R3")).toThrow();
  });

  it("a scramble followed by its inverse is solved", () => {
    const random = seeded(42);
    for (let i = 0; i < 50; i++) {
      const s = scramble(25, random);
      expect(isSolved(applyMoves(applyMoves(solved(), s), invertMoves(s)))).toBe(true);
    }
  });
});

describe("scramble", () => {
  it("is 25 face turns, never the same face twice in a row", () => {
    const s = scramble(25, seeded(7));
    expect(s).toHaveLength(25);
    for (let i = 1; i < s.length; i++) expect(s[i][0]).not.toBe(s[i - 1][0]);
  });

  it("actually mixes the cube", () => {
    expect(isSolved(applyMoves(solved(), scramble(25, seeded(3))))).toBe(false);
  });

  it("every sticker color still appears 9 times", () => {
    const s = applyMoves(solved(), scramble(25, seeded(9)));
    for (const f of "URFDLB") expect(s.filter((x) => x === f)).toHaveLength(9);
  });
});
