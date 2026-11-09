import { describe, expect, it } from "vitest";
import {
  STICKERS,
  type Vec3,
  applyMoves,
  moveTargets,
  moveTurn,
  solved,
  toString,
} from "../src/cube";
import {
  backgroundMove,
  pickDirection,
  reorient,
  stickerMap,
  swipeDirections,
  swipeMove,
  swipesFor,
} from "../src/render/swipe";

const sub = (a: Vec3, b: Vec3) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]] as const;
const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const idx = (face: number, r: number, c: number) => face * 9 + r * 3 + c; // faces U R F D L B

describe("swipe on a sticker", () => {
  it("every sticker, every direction: the sticker moves the way the finger went", () => {
    for (const s of STICKERS) {
      for (const u of swipeDirections(s.index)) {
        const m = swipeMove(s.index, u);
        const t = moveTurn(m);
        // Only the sticker's own layer turns.
        expect(t.inLayer(dot(t.axis, s.position))).toBe(true);
        expect(["R", "L", "U", "D", "F", "B", "M", "E", "S"]).toContain(t.base);
        expect(t.turns === 1 || t.turns === 3).toBe(true);
        // Where the real move engine sends this sticker is along u.
        const to = STICKERS[moveTargets(m)[s.index]];
        const moved = sub(to.position, s.position);
        const along = dot(moved, u) + dot(sub(to.normal, s.normal), u);
        expect(along, `${s.index} ${u} → ${m}`).toBeGreaterThan(0);
      }
    }
  });

  it("matches the moves a cuber would name", () => {
    // Front face (F = face 2): right column up is R, left column down is L.
    expect(swipeMove(idx(2, 1, 2), [0, 1, 0])).toBe("R");
    expect(swipeMove(idx(2, 1, 0), [0, -1, 0])).toBe("L");
    // Front top row to the left is U, to the right U'.
    expect(swipeMove(idx(2, 0, 1), [-1, 0, 0])).toBe("U");
    expect(swipeMove(idx(2, 0, 1), [1, 0, 0])).toBe("U'");
    // Front bottom row to the right is D.
    expect(swipeMove(idx(2, 2, 1), [1, 0, 0])).toBe("D");
    // Right face (face 1), column next to the front, swiped up is F'.
    expect(swipeMove(idx(1, 1, 0), [0, 1, 0])).toBe("F'");
    // Front middle column down follows L: M.
    expect(swipeMove(idx(2, 1, 1), [0, -1, 0])).toBe("M");
  });
});

describe("picking the direction on screen", () => {
  it("chooses the option closest to the finger", () => {
    const options = [
      { u: [1, 0, 0] as Vec3, screen: [40, 10] as const },
      { u: [-1, 0, 0] as Vec3, screen: [-40, -10] as const },
      { u: [0, 1, 0] as Vec3, screen: [0, -40] as const },
      { u: [0, -1, 0] as Vec3, screen: [0, 40] as const },
    ];
    expect(pickDirection([30, 0], options)).toEqual([1, 0, 0]);
    expect(pickDirection([2, -30], options)).toEqual([0, 1, 0]);
  });
});

describe("swipe beside the cube (free play)", () => {
  it("left/right turn the whole cube with y, up/down with x", () => {
    expect(backgroundMove(-50, 5)).toBe("y");
    expect(backgroundMove(50, 5)).toBe("y'");
    expect(backgroundMove(3, -50)).toBe("x");
    expect(backgroundMove(3, 50)).toBe("x'");
  });
});

describe("moves as swipes", () => {
  const all = [
    "R",
    "L",
    "U",
    "D",
    "F",
    "B",
    "M",
    "E",
    "S",
    "r",
    "l",
    "u",
    "d",
    "f",
    "b",
    "Rw",
    "x",
    "y",
    "z",
  ];
  const variants = all.flatMap((b) => [b, b + "'", b + "2"]);

  it("every move's swipes do the same as the move, one layer per swipe", () => {
    for (const m of variants) {
      const swipes = swipesFor(m);
      expect(toString(applyMoves(solved(), swipes)), m).toBe(toString(applyMoves(solved(), [m])));
      for (const s of swipes) expect(moveTurn(s).turns === 2, `${m} → ${s}`).toBe(false);
    }
    expect(swipesFor("r")).toEqual(["R", "M'"]);
    expect(swipesFor("U2")).toEqual(["U", "U"]);
  });

  it("after a whole-cube turn, the renamed move does the same thing", () => {
    expect(reorient("R", ["y"])).toBe("F");
    expect(reorient("U", ["y"])).toBe("U");
    const start = applyMoves(solved(), "R U F' L2 D B");
    for (const turned of [["y"], ["y", "y"], ["x"], ["x'", "y"]])
      for (const m of variants) {
        const a = applyMoves(applyMoves(start, [m]), turned);
        const b = applyMoves(applyMoves(start, turned), [reorient(m, turned)]);
        expect(toString(b), `${m} after ${turned}`).toBe(toString(a));
      }
  });

  it("stickerMap follows whole-cube turns", () => {
    const map = stickerMap(["y"]);
    const s = applyMoves(solved(), "R U");
    const t = applyMoves(s, ["y"]);
    for (let i = 0; i < 54; i++) expect(t[map(i)]).toBe(s[i]);
  });
});
