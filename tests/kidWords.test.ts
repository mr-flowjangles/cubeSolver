// The kid test: each beginner level's "How it works" words, followed literally as code, must finish
// the stage. No solver, no guesses: if a step isn't in the words, it isn't here.
// See docs/02-levels.md → "Level words checked by a kid test".

import { describe, expect, it } from "vitest";
import {
  type CubeState,
  EDGE_SLOTS,
  applyMoves,
  center,
  isSolved,
  slot,
  slotHasRightPiece,
  slotSolved,
} from "../src/cube";
import { BEGINNER_LEVELS } from "../src/lessons/beginner";
import { practicePosition } from "../src/lessons/position";
import { seeded } from "../src/lessons/walkthrough";
import { ALGS, STAGE_DONE, solveBeginner } from "../src/solver/beginner";

const N = 20;
const lv = (id: string) => BEGINNER_LEVELS.find((l) => l.id === id)!;
const SIDES = ["F", "R", "B", "L"] as const;
const TOP_EDGE: Record<string, string> = { F: "UF", R: "UR", B: "UB", L: "UL" };

let cur: CubeState;
const go = (m: string) => (cur = applyMoves(cur, m));
const yellow = () => center(cur, "U");
const white = () => center(cur, "D");
const turnCubeUntil = (ok: () => boolean) => {
  for (let k = 0; k < 4 && !ok(); k++) go("y");
};

// Level 1. Words: the daisy bullets, then "turn the top until an edge's other color matches the
// center below it. Then turn that side twice."
function cross() {
  const daisy = () =>
    ["UF", "UR", "UB", "UL"].filter((e) => cur[slot(e).stickers[0]] === white()).length;
  // "Before a side goes up, turn the top so the spot above it has no white edge yet."
  const makeRoom = (side: string) => {
    for (let n = 0; n < 4 && cur[slot(TOP_EDGE[side]).stickers[0]] === white(); n++) go("U");
  };
  for (let i = 0; i < 40 && daisy() < 4; i++) {
    const e = EDGE_SLOTS.find(
      (e) =>
        e.stickers.some((k) => cur[k] === white()) &&
        !(e.name[0] === "U" && cur[e.stickers[0]] === white()),
    )!;
    const wFace = "URFDLB"[Math.floor(e.stickers.find((k) => cur[k] === white())! / 9)];
    if (wFace === "D") {
      // "White edge on the bottom: turn that side twice."
      makeRoom(e.name[1]);
      go(`${e.name[1]}2`);
    } else if (e.name[0] === "U" || e.name[0] === "D") {
      // "White facing out to the side, in the top or bottom row: turn that side once."
      if (e.name[0] === "D") makeRoom(wFace);
      go(wFace);
    } else {
      // "White edge in the middle row: turn the whole cube so it's at front-right."
      const cols = e.stickers
        .map((k) => cur[k])
        .sort()
        .join("");
      turnCubeUntil(
        () =>
          slot("FR")
            .stickers.map((k) => cur[k])
            .sort()
            .join("") === cols,
      );
      const fr = slot("FR");
      const wf = "URFDLB"[Math.floor(fr.stickers.find((k) => cur[k] === white())! / 9)];
      // "Its white faces one side; turn the other side it touches, so the edge goes up."
      const side = wf === "F" ? "R" : "F";
      makeRoom(side);
      go(
        [side, `${side}'`].find(
          (m) => applyMoves(cur, m)[slot(TOP_EDGE[side]).stickers[0]] === white(),
        )!,
      );
    }
  }
  for (let k = 0; k < 4; k++) {
    for (let u = 0; u < 4; u++) {
      const f = SIDES.find((f) => {
        const [up, side] = slot(TOP_EDGE[f]).stickers.map((i) => cur[i]);
        return up === white() && side === center(cur, f);
      });
      if (f) {
        // "Turn the whole cube so that side faces you, then turn the front twice."
        const col = center(cur, f);
        turnCubeUntil(() => center(cur, "F") === col);
        go("F2");
        break;
      }
      go("U");
    }
  }
}

// Level 2.
function corners() {
  const colors = (name: string) => slot(name).stickers.map((i) => cur[i]);
  const key = (cs: string[]) => [...cs].sort().join("");
  for (let i = 0; i < 30 && !STAGE_DONE.corners(cur); i++) {
    // "Find a white corner in the top layer."
    const top = ["URF", "UFL", "ULB", "UBR"].find((c) => colors(c).includes(white()));
    if (!top) {
      // "Corner stuck in the bottom the wrong way? Turn the whole cube so it's at front-right,
      // then do the sequence once to lift it out."
      turnCubeUntil(() => !slotSolved(cur, slot("DFR")));
      go(ALGS.cornerUp);
      continue;
    }
    const want = key(colors(top));
    // "Its spot is the bottom corner between the centers of its other two colors."
    const spot = () =>
      ["DFR", "DRB", "DBL", "DLF"].find(
        (d) => key([...d].map((f) => (f === "D" ? white() : center(cur, f as never)))) === want,
      )!;
    // "Turn the top until the corner sits right above its spot."
    const above = () => "U" + spot().slice(1);
    const has = (u: string) =>
      ["URF", "UFL", "ULB", "UBR"].find((c) => key([...c].sort()) === key([...u]))!;
    for (let u = 0; u < 4 && key(colors(has(above()))) !== want; u++) go("U");
    // "Turn the whole cube so that corner is at front-right."
    turnCubeUntil(() => spot() === "DFR");
    // "Repeat the sequence until the corner drops in, white side down."
    for (let r = 0; r < 6 && !slotSolved(cur, slot("DFR")); r++) go(ALGS.cornerUp);
  }
}

// Level 3.
function middle() {
  for (let i = 0; i < 30 && !STAGE_DONE.middle(cur); i++) {
    let done = false;
    // "Find a top edge with no yellow. Turn the top until its side color matches the center below it."
    for (let u = 0; u < 4 && !done; u++) {
      const f = SIDES.find((f) => {
        const [up, side] = slot(TOP_EDGE[f]).stickers.map((k) => cur[k]);
        return up !== yellow() && side !== yellow() && side === center(cur, f);
      });
      if (f) {
        // "Turn the whole cube so that side is in front."
        turnCubeUntil(() => {
          const [up, side] = slot("UF").stickers.map((k) => cur[k]);
          return up !== yellow() && side !== yellow() && side === center(cur, "F");
        });
        // "Its top color matches the right center? Do Edge right. The left center? Do Edge left."
        const up = cur[slot("UF").stickers[0]];
        go(up === center(cur, "R") ? ALGS.middleRight : ALGS.middleLeft);
        done = true;
      } else go("U");
    }
    if (!done) {
      // "No edge on top fits? ... Turn the whole cube so it's at front-right, then do Edge right once."
      turnCubeUntil(() => !slotSolved(cur, slot("FR")));
      go(ALGS.middleRight);
    }
  }
}

// Level 4.
function yellowCross() {
  const up = () => ["UF", "UR", "UB", "UL"].filter((e) => cur[slot(e).stickers[0]] === yellow());
  for (let i = 0; i < 6 && !STAGE_DONE.yellowCross(cur); i++) {
    const u0 = up();
    if (u0.length) {
      const line =
        (u0.includes("UF") && u0.includes("UB")) || (u0.includes("UR") && u0.includes("UL"));
      // "L: hold it at back-left" / "Line: hold it left-to-right"
      for (let k = 0; k < 4; k++) {
        const u = up();
        if (line ? u.includes("UR") && u.includes("UL") : u.includes("UB") && u.includes("UL"))
          break;
        go("U");
      }
    }
    go(ALGS.yellowCross);
  }
}

// Level 5.
function yellowEdges() {
  const matching = () => SIDES.filter((f) => cur[slot(TOP_EDGE[f]).stickers[1]] === center(cur, f));
  for (let i = 0; i < 6 && !STAGE_DONE.yellowEdges(cur); i++) {
    // "Turn the top until two edges match their centers."
    for (let u = 0; u < 4 && matching().length < 2; u++) go("U");
    if (matching().length === 4) break;
    const m = matching();
    const opposite = (m.includes("F") && m.includes("B")) || (m.includes("R") && m.includes("L"));
    // "Matching edges side by side: hold them at back and right."
    if (!opposite) turnCubeUntil(() => matching().includes("B") && matching().includes("R"));
    go(ALGS.yellowEdges);
  }
  for (let u = 0; u < 4 && !STAGE_DONE.yellowEdges(cur); u++) go("U");
}

// Level 6.
function yellowCornersPlace() {
  const placed = () => ["URF", "UFL", "ULB", "UBR"].some((c) => slotHasRightPiece(cur, slot(c)));
  for (let i = 0; i < 8 && !STAGE_DONE.yellowCornersPlace(cur); i++) {
    // "Hold a corner that is in place at front-right." / "None in place? ... from anywhere."
    if (placed()) turnCubeUntil(() => slotHasRightPiece(cur, slot("URF")));
    go(ALGS.yellowCornersPlace);
  }
}

// Level 7.
function twist() {
  const urfYellow = () => cur[slot("URF").stickers[0]] === yellow();
  // "To start, turn the top so a twisted corner is at front-right."
  for (let u = 0; u < 4 && urfYellow(); u++) go("U");
  for (let k = 0; k < 4; k++) {
    // "Turn only the top to bring the next twisted corner to front-right."
    for (let u = 0; u < 4 && urfYellow(); u++) go("U");
    if (urfYellow()) break;
    // "Repeat the sequence until yellow is on top."
    for (let r = 0; r < 6 && !urfYellow(); r++) go(ALGS.twist);
  }
  // "All yellow on top? Turn the top to line it up."
  for (let u = 0; u < 4 && !isSolved(cur); u++) go("U");
}

const LEVELS: [string, () => void][] = [
  ["cross", cross],
  ["corners", corners],
  ["middle", middle],
  ["yellowCross", yellowCross],
  ["yellowEdges", yellowEdges],
  ["yellowCornersPlace", yellowCornersPlace],
  ["yellowCornersTwist", twist],
];

describe("the kid test: following the words finishes each level", () => {
  LEVELS.forEach(([id, follow], n) => {
    it(`level ${n + 1}: ${id}`, () => {
      const rnd = seeded(100 + n);
      for (let i = 0; i < N; i++) {
        cur = practicePosition(lv(id), rnd);
        follow();
        expect(STAGE_DONE[lv(id).stage as keyof typeof STAGE_DONE](cur)).toBe(true);
      }
    }, 120_000);
  });

  it("level 8: the words of levels 1–7 in a row solve a full scramble", () => {
    const rnd = seeded(4242);
    for (let i = 0; i < N; i++) {
      cur = practicePosition(lv("full"), rnd);
      for (const [, follow] of LEVELS) follow();
      expect(isSolved(cur)).toBe(true);
    }
  }, 120_000);

  it("level 8 lists every beginner sequence", () => {
    expect(
      lv("full")
        .algs.map((a) => a.moves)
        .sort(),
    ).toEqual(Object.values(ALGS).sort());
  });
});

// Round 3: Hint, Show me and the demo do what the words say, at the moment each sequence starts.
describe("the kid test: Hint follows the words", () => {
  const before = (id: string, check: (s: CubeState, name: string, say: string) => void) => {
    const rnd = seeded(300);
    for (let i = 0; i < 20; i++) {
      let s = practicePosition(lv(id), rnd);
      for (const st of solveBeginner(s, lv(id).stage as never).filter(
        (x) => x.stage === lv(id).stage,
      )) {
        const k = st.why!.findIndex((w) => / sequence/.test(w));
        if (k >= 0) check(applyMoves(s, st.moves.slice(0, k)), st.why![k], st.say);
        s = applyMoves(s, st.moves);
      }
    }
  };

  it("level 2: Corner starts with a white corner at front-right", () => {
    before("corners", (s) => {
      const fr = [...slot("URF").stickers, ...slot("DFR").stickers].map((i) => s[i]);
      expect(fr).toContain(center(s, "D"));
    });
  });

  it("level 3: a stuck edge pops out with Edge right", () => {
    before("middle", (s, name, say) => {
      if (/stuck/.test(say)) expect(name).toMatch(/^Edge right/);
    });
  });

  it("level 5: Swap edges starts with two edges matching", () => {
    before("yellowEdges", (s) => {
      const m = SIDES.filter((f) => s[slot(TOP_EDGE[f]).stickers[1]] === center(s, f));
      expect(m.length).toBeGreaterThanOrEqual(2);
    });
  });
});
