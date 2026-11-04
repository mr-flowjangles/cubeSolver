// Beginner layer-by-layer solver.
// Held with white on the bottom and green in front, the same way the lessons teach.
// Stages (the standard 7-stage beginner method):
//   1 White cross        4 Yellow cross
//   2 White corners      5 Yellow edges
//   3 Middle edges       6 Yellow corners into place
//                        7 Twist yellow corners
// Every stage after the cross only uses the move sequences its lesson teaches,
// so the guided solve matches what the player learned.

import {
  type CubeState,
  type Face,
  type Move,
  COLOR_NAME,
  EDGE_SLOTS,
  applyMoves,
  center,
  faceOfSticker,
  isSolved,
  simplifyMoves,
  slot,
  slotHasRightPiece,
  slotSolved,
} from "../cube";
import { type Step, pieceSearch, stepSearch } from "./search";

export type StageId =
  | "hold"
  | "cross"
  | "corners"
  | "middle"
  | "yellowCross"
  | "yellowEdges"
  | "yellowCornersPlace"
  | "yellowCornersTwist";

export interface SolveStep {
  stage: StageId;
  moves: Move[];
  say: string;
}

/** The taught move sequences. Lessons show these exact strings. */
export const ALGS = {
  cornerUp: "R U R' U'",
  middleRight: "U R U' R' U' F' U F",
  middleLeft: "U' L' U L U F U' F'",
  yellowCross: "F R U R' U' F'",
  yellowEdges: "R U R' U R U2 R' U",
  yellowCornersPlace: "U R U' L' U R' U' L",
  twist: "R' D' R D",
} as const;

const seq = (s: string): Move[] => s.split(" ");
const name = (f: Face) => COLOR_NAME[f];

const TOP: Step[] = [
  { moves: ["U"], group: "U", say: "Turn the top: U" },
  { moves: ["U'"], group: "U", say: "Turn the top: U'" },
  { moves: ["U2"], group: "U", say: "Turn the top: U2" },
];
const SPIN: Step[] = [
  { moves: ["y"], group: "y", say: "Turn the whole cube: y" },
  { moves: ["y'"], group: "y", say: "Turn the whole cube: y'" },
  { moves: ["y2"], group: "y", say: "Turn the whole cube: y2" },
];
const repeat = (s: string, n: number) => Array<string>(n).fill(s).join(" ");

// ---- Checks, always against the center colors ----

const D_EDGES = ["DF", "DR", "DB", "DL"].map(slot);
const D_CORNERS = ["DFR", "DRB", "DBL", "DLF"].map(slot);
const MID_EDGES = ["FR", "FL", "BR", "BL"].map(slot);
const U_EDGES = ["UF", "UR", "UB", "UL"].map(slot);
const U_CORNERS = ["URF", "UFL", "ULB", "UBR"].map(slot);

const count = (s: CubeState, slots: typeof D_EDGES) => slots.filter((x) => slotSolved(s, x)).length;
const all = (s: CubeState, slots: typeof D_EDGES) => count(s, slots) === slots.length;
const bottomDone = (s: CubeState) => all(s, D_EDGES) && all(s, D_CORNERS);
const f2lDone = (s: CubeState) => bottomDone(s) && all(s, MID_EDGES);
const yellowCrossDone = (s: CubeState) =>
  f2lDone(s) && U_EDGES.every((e) => s[e.stickers[0]] === center(s, "U"));
const yellowEdgesDone = (s: CubeState) => f2lDone(s) && all(s, U_EDGES);
const yellowCornersPlaced = (s: CubeState) =>
  yellowEdgesDone(s) && U_CORNERS.every((c) => slotHasRightPiece(s, c));

export const STAGE_DONE: Record<StageId, (s: CubeState) => boolean> = {
  hold: (s) => center(s, "D") === "U" && center(s, "F") === "F",
  cross: (s) => all(s, D_EDGES),
  corners: bottomDone,
  middle: f2lDone,
  yellowCross: yellowCrossDone,
  yellowEdges: yellowEdgesDone,
  yellowCornersPlace: yellowCornersPlaced,
  yellowCornersTwist: isSolved,
};

export const STAGES: StageId[] = [
  "hold",
  "cross",
  "corners",
  "middle",
  "yellowCross",
  "yellowEdges",
  "yellowCornersPlace",
  "yellowCornersTwist",
];

// ---- Stages ----

const ROTATIONS = ["", "x", "x'", "x2", "y", "y'", "y2", "z", "z'", "z2"];

function hold(s: CubeState): SolveStep[] {
  // Already white-down (the player may have spun the cube since): nothing to do.
  if (center(s, "D") === "U") return [];
  for (const a of ROTATIONS)
    for (const b of ["", "y", "y'", "y2"]) {
      const moves = [a, b].filter(Boolean);
      if (STAGE_DONE.hold(applyMoves(s, moves)))
        return moves.length
          ? [
              {
                stage: "hold",
                moves,
                say: "Hold the cube with white on the bottom and green in front.",
              },
            ]
          : [];
    }
  throw new Error("No white or green center");
}

function cross(s: CubeState): SolveStep[] {
  const out: SolveStep[] = [];
  let cur = s;
  while (!STAGE_DONE.cross(cur)) {
    const done = D_EDGES.filter((e) => slotSolved(cur, e));
    let best: { moves: Move[]; edge: (typeof D_EDGES)[number] } | null = null;
    for (const e of D_EDGES.filter((x) => !slotSolved(cur, x))) {
      const from: number[] = [];
      const to: number[] = [];
      for (const t of [...done, e]) {
        const want = t.stickers.map((i) => center(cur, faceOfSticker(i)));
        const at = EDGE_SLOTS.find((x) => {
          const have = x.stickers.map((i) => cur[i]);
          return have.includes(want[0]) && have.includes(want[1]);
        })!;
        from.push(at.stickers.find((i) => cur[i] === want[0])!);
        to.push(t.stickers[0]);
      }
      const moves = pieceSearch(from, to);
      if (moves && (!best || moves.length < best.moves.length)) best = { moves, edge: e };
    }
    if (!best) throw new Error("Cross search failed");
    const other = center(cur, faceOfSticker(best.edge.stickers[1]));
    out.push({
      stage: "cross",
      moves: best.moves,
      say: `Bring the white–${name(other)} edge down next to the ${name(other)} center.`,
    });
    cur = applyMoves(cur, best.moves);
  }
  return out;
}

/** Repeat a stage's search until its goal is met, one piece at a time. */
function stepwise(
  stage: StageId,
  s: CubeState,
  steps: Step[],
  progress: (s: CubeState) => number,
  keep: (s: CubeState) => boolean,
  maxDepth: number,
  say: (count: number) => string,
): SolveStep[] {
  const out: SolveStep[] = [];
  let cur = s;
  while (!STAGE_DONE[stage](cur)) {
    const before = progress(cur);
    const found = stepSearch(cur, steps, (x) => keep(x) && progress(x) > before, maxDepth);
    if (!found) throw new Error(`${stage} search failed`);
    const moves = found.flatMap((st) => st.moves);
    out.push({ stage, moves, say: say(before) });
    cur = applyMoves(cur, moves);
  }
  return out;
}

function corners(s: CubeState) {
  const steps: Step[] = [
    ...TOP,
    ...SPIN,
    ...[1, 3, 5].map((n) => ({
      moves: seq(repeat(ALGS.cornerUp, n)),
      group: "alg",
      say: `Do ${ALGS.cornerUp} ×${n}`,
    })),
  ];
  return stepwise(
    "corners",
    s,
    steps,
    (x) => count(x, D_CORNERS),
    (x) => all(x, D_EDGES),
    6,
    () =>
      "Put a white corner above its spot (front-right), then repeat R U R' U' until it drops in.",
  );
}

function middle(s: CubeState) {
  const steps: Step[] = [
    ...TOP,
    ...SPIN,
    { moves: seq(ALGS.middleRight), say: `Move edge right: ${ALGS.middleRight}` },
    { moves: seq(ALGS.middleLeft), say: `Move edge left: ${ALGS.middleLeft}` },
  ];
  return stepwise(
    "middle",
    s,
    steps,
    (x) => count(x, MID_EDGES),
    bottomDone,
    5,
    () => "Line up a top edge with its center, then move it down right or left.",
  );
}

function yellowCross(s: CubeState) {
  const steps: Step[] = [...TOP, { moves: seq(ALGS.yellowCross), say: ALGS.yellowCross }];
  const yellowEdgesUp = (x: CubeState) =>
    U_EDGES.filter((e) => x[e.stickers[0]] === center(x, "U")).length;
  return stepwise(
    "yellowCross",
    s,
    steps,
    (x) => (yellowEdgesUp(x) === 4 ? 4 : yellowEdgesUp(x) === 2 ? 2 : 0),
    f2lDone,
    3,
    (n) =>
      n === 0
        ? `Yellow dot: do ${ALGS.yellowCross}.`
        : `Hold the yellow L at back-left (or line left-to-right), then do ${ALGS.yellowCross}.`,
  );
}

function yellowEdges(s: CubeState) {
  const steps: Step[] = [...TOP, ...SPIN, { moves: seq(ALGS.yellowEdges), say: ALGS.yellowEdges }];
  return stepwise(
    "yellowEdges",
    s,
    steps,
    (x) => (yellowEdgesDone(x) ? 1 : 0),
    yellowCrossDone,
    6,
    () => `Turn the top to match edges with centers, then swap with ${ALGS.yellowEdges}.`,
  );
}

function yellowCornersPlace(s: CubeState) {
  const steps: Step[] = [
    ...SPIN,
    { moves: seq(ALGS.yellowCornersPlace), say: ALGS.yellowCornersPlace },
  ];
  return stepwise(
    "yellowCornersPlace",
    s,
    steps,
    (x) => (yellowCornersPlaced(x) ? 1 : 0),
    yellowEdgesDone,
    5,
    () =>
      `Hold a corner that is in its right spot at front-right, then do ${ALGS.yellowCornersPlace}.`,
  );
}

/** Twist each top corner with R' D' R D at front-right, turning only the top between corners. */
function yellowCornersTwist(s: CubeState): SolveStep[] {
  if (isSolved(s)) return [];
  const out: SolveStep[] = [];
  let cur = s;
  const urf = slot("URF");
  const yellow = center(cur, "U");
  let offset = 0; // top turns made so far
  for (let k = 0; k < 4; k++) {
    const delta = (k - offset + 4) % 4;
    const u = simplifyMoves(Array<Move>(delta).fill("U"));
    const here = applyMoves(cur, u);
    if (here[urf.stickers[0]] === yellow) continue;
    if (u.length) {
      out.push({
        stage: "yellowCornersTwist",
        moves: u,
        say: `Bring the next twisted corner to front-right: ${u.join(" ")}`,
      });
    }
    cur = here;
    offset = k;
    let n = 0;
    while (cur[urf.stickers[0]] !== yellow) {
      cur = applyMoves(cur, seq(repeat(ALGS.twist, 2)));
      n += 2;
    }
    out.push({
      stage: "yellowCornersTwist",
      moves: seq(repeat(ALGS.twist, n)),
      say: `Do ${ALGS.twist} ${n} times, until yellow is on top. The bottom will look messed up — keep going.`,
    });
  }
  for (const u of ["U", "U'", "U2"]) {
    if (isSolved(cur)) break;
    if (isSolved(applyMoves(cur, [u]))) {
      out.push({ stage: "yellowCornersTwist", moves: [u], say: `Line up the top: ${u}` });
      cur = applyMoves(cur, [u]);
    }
  }
  if (!isSolved(cur)) throw new Error("Twist stage failed");
  return out;
}

const RUN: Record<StageId, (s: CubeState) => SolveStep[]> = {
  hold,
  cross,
  corners,
  middle,
  yellowCross,
  yellowEdges,
  yellowCornersPlace,
  yellowCornersTwist,
};

/** Solve stage by stage. Stops after `until` if given. */
export function solveBeginner(state: CubeState, until?: StageId): SolveStep[] {
  const out: SolveStep[] = [];
  let cur = state;
  for (const st of STAGES) {
    const steps = RUN[st](cur);
    for (const step of steps) cur = applyMoves(cur, step.moves);
    out.push(...steps);
    if (st === until) break;
  }
  return out.filter((x) => x.moves.length > 0);
}

/** The cube after solving up to and including `stage`. */
export function stateAfter(state: CubeState, stage: StageId): CubeState {
  return solveBeginner(state, stage).reduce<CubeState>((s, x) => applyMoves(s, x.moves), state);
}
