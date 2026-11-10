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
  type Slot,
  type Face,
  type Move,
  COLOR_NAME,
  EDGE_SLOTS,
  applyMoves,
  center,
  isSolved,
  moveTargets,
  simplifyMoves,
  slot,
  slotHasRightPiece,
  slotSolved,
} from "../cube";
import { moveWords } from "../lessons/moveWords";
import { type Step, stepSearch } from "./search";

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
  /** A plain-words reason for each move, for the walk-through. */
  why?: string[];
  /** Which part of the stage this step belongs to, e.g. "Part 1: the daisy". */
  part?: string;
  /** Colors of the piece this step moves, and the slot it ends in (lit up on screen). */
  piece?: Face[];
  to?: string;
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

/** What the lessons call each sequence. */
export const ALG_NAMES: Record<keyof typeof ALGS, string> = {
  cornerUp: "Corner",
  middleRight: "Edge right",
  middleLeft: "Edge left",
  yellowCross: "Yellow cross",
  yellowEdges: "Swap edges",
  yellowCornersPlace: "Move corners",
  twist: "Twist",
};

const lower = (t: string) => t[0].toLowerCase() + t.slice(1);

/** A reason for each move of a taught sequence done `moves.length / alg length` times. */
function algWhy(alg: keyof typeof ALGS, moves: Move[]): string[] {
  const len = seq(ALGS[alg]).length;
  const rounds = moves.length / len;
  return moves.map((m, i) => {
    const round = rounds > 1 ? `, round ${Math.floor(i / len) + 1} of ${rounds}` : "";
    return `${ALG_NAMES[alg]} sequence${round}, move ${(i % len) + 1} of ${len}: ${lower(moveWords(m))}`;
  });
}

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
  const options = ROTATIONS.flatMap((a) =>
    ["", "y", "y'", "y2"].map((b) => [a, b].filter(Boolean)),
  );
  options.sort((x, y) => x.length - y.length);
  const moves = options.find((m) => STAGE_DONE.hold(applyMoves(s, m)));
  if (!moves) throw new Error("No white or green center");
  return [
    { stage: "hold", moves, say: "Hold the cube with white on the bottom and green in front." },
  ];
}

// ---- White cross, the daisy way ----
// Part 1 (daisy): bring the 4 white edges up around the top center, white side up.
// Part 2: turn the top until an edge matches the center below it, then drop it with F2.
// Every move carries a plain-words reason for the walk-through.

const U_EDGE_STICKERS = new Set([1, 3, 5, 7]); // the 4 edge squares of the top face
const DAISY_MOVES: Move[] = "U U' U2 F F' F2 R R' R2 y y' y2 L L' L2 D D' D2 B B' B2".split(" ");
const DAISY_COST: Record<string, number> = { U: 1, F: 1, R: 1, y: 1, L: 3, D: 3, B: 3 };
const DAISY_TARGETS = new Map(DAISY_MOVES.map((m) => [m, moveTargets(m)]));
const SIDE_NAME: Record<string, string> = {
  F: "front",
  R: "right side",
  L: "left side",
  B: "back",
  D: "bottom",
};

/** Where the white sticker of each white edge is, and the edge's other color. */
function whiteEdges(s: CubeState) {
  const white = center(s, "D");
  return EDGE_SLOTS.filter((e) => e.stickers.some((i) => s[i] === white)).map((e) => {
    const w = e.stickers.find((i) => s[i] === white)!;
    const other = s[e.stickers.find((i) => i !== w)!];
    return { at: w, other };
  });
}

/** Fewest turns that add one white edge to the daisy without knocking any off on the way. */
function daisyStep(s: CubeState): SolveStep | null {
  const edges = whiteEdges(s);
  const start = edges.map((e) => e.at);
  const slotOf = (i: number) => EDGE_SLOTS.find((e) => e.stickers.includes(i))!;
  const onBottom = (x: CubeState, i: number) => i >= 27 && i < 36 && slotSolved(x, slotOf(i));
  // Edges already finished on the bottom stay there; the rest go up into the daisy.
  const finished = start.map((i) => onBottom(s, i));
  const kept = start.map((i) => U_EDGE_STICKERS.has(i));
  const have = kept.filter(Boolean).length;
  const todo = finished.filter((f) => !f).length;
  if (have === todo) return null;
  // Cheapest turns first. Sides the player can't see from the front (left, back, bottom)
  // cost more, so the walk-through turns the cube to face the piece instead.
  type Node = { st: CubeState; pos: number[]; moves: Move[] };
  const buckets: Node[][] = [[{ st: s, pos: start, moves: [] }]];
  const seen = new Set<string>();
  let found: Node | null = null;
  for (let c = 0; c < 16 && !found; c++) {
    for (const node of buckets[c] ?? []) {
      const { st, pos, moves } = node;
      const key = pos.join(",") + st[22];
      if (seen.has(key)) continue;
      seen.add(key);
      if (
        pos.filter((i, j) => !finished[j] && U_EDGE_STICKERS.has(i)).length > have &&
        pos.every((i, j) => !finished[j] || onBottom(st, i))
      ) {
        found = node;
        break;
      }
      const last = moves[moves.length - 1]?.[0];
      for (const m of DAISY_MOVES) {
        if (m[0] === last) continue;
        const t = DAISY_TARGETS.get(m)!;
        const np = pos.map((i) => t[i]);
        if (kept.some((k, j) => k && !U_EDGE_STICKERS.has(np[j]))) continue; // knocks one off
        const nc = c + DAISY_COST[m[0]];
        (buckets[nc] ??= []).push({ st: applyMoves(st, [m]), pos: np, moves: [...moves, m] });
      }
    }
  }
  if (!found) throw new Error("Daisy search failed");
  const j = found.pos.findIndex((i, k) => !kept[k] && !finished[k] && U_EDGE_STICKERS.has(i));
  const c = name(edges[j].other);
  const top = name(center(s, "U"));
  const white = center(s, "D");
  // Reason for each move, from what it does to the white edge being brought up.
  const doneCount = (x: CubeState, p: number[]) =>
    p.filter((i, k) => finished[k] && onBottom(x, i)).length;
  const why: string[] = [];
  let at = start[j];
  let cur = s;
  let pos = start;
  for (const m of found.moves) {
    const t = DAISY_TARGETS.get(m)!;
    const nextAt = t[at];
    const next = applyMoves(cur, [m]);
    const nextPos = pos.map((i) => t[i]);
    const broke = doneCount(next, nextPos) < doneCount(cur, pos);
    const fixed = doneCount(next, nextPos) > doneCount(cur, pos);
    if (m[0] === "y") {
      why.push(`Turn the whole cube so the white–${c} edge is easier to reach.`);
    } else if (m[0] === "U") {
      why.push("Turn the top so the next turn won't knock a white edge off the top.");
    } else if (fixed && !U_EDGE_STICKERS.has(nextAt)) {
      why.push("Turn it back, so the finished white edge returns to the bottom.");
    } else if (U_EDGE_STICKERS.has(nextAt)) {
      why.push(
        `Lift the white–${c} edge up to the top, white side up.` +
          (broke ? " A finished bottom edge moves too; it goes back next." : ""),
      );
    } else if (nextAt === at) {
      why.push(`Turn the ${SIDE_NAME[m[0]]} out of the way.`);
    } else {
      const middle = !slotOf(nextAt).name.includes("U") && !slotOf(nextAt).name.includes("D");
      why.push(
        middle
          ? `Move the white–${c} edge to the middle row, so one more turn can lift it white side up.`
          : `Move the white–${c} edge along the bottom, under the free spot.`,
      );
    }
    at = nextAt;
    cur = next;
    pos = nextPos;
  }
  return {
    stage: "cross",
    part: "Part 1: the daisy",
    moves: found.moves,
    why,
    say: `Bring the white–${c} edge up next to the ${top} center, white side up.`,
    piece: [white, edges[j].other],
    to: slotOf(at).name,
  };
}

/** Turn one white edge from the daisy down to the bottom, under its matching center. */
function flipStep(s: CubeState): SolveStep | null {
  const white = center(s, "D");
  const done = (x: CubeState, f: Face) => slotSolved(x, D_EDGES[["F", "R", "B", "L"].indexOf(f)]);
  let best: { rot: Move[]; u: Move[] } | null = null;
  for (const rot of [[], ["y"], ["y'"], ["y2"]] as Move[][]) {
    const r = applyMoves(s, rot);
    if (done(r, "F")) continue;
    for (const u of [[], ["U"], ["U'"], ["U2"]] as Move[][]) {
      const x = applyMoves(r, u);
      if (x[7] === white && x[19] === center(x, "F")) {
        if (!best || rot.length + u.length < best.rot.length + best.u.length) best = { rot, u };
      }
    }
  }
  if (!best) return null;
  const r = applyMoves(s, best.rot);
  const c = name(center(r, "F"));
  const why = [
    ...best.rot.map(() => `Turn the whole cube so the ${c} side faces you.`),
    ...best.u.map(() => `Turn the top until the white–${c} edge sits above the ${c} center.`),
    `Turn the front twice: the white–${c} edge drops to the bottom, white side down.`,
  ];
  return {
    stage: "cross",
    part: "Part 2: turn them down",
    moves: [...best.rot, ...best.u, "F2"],
    why,
    say: `Turn the white–${c} edge down under the ${c} center.`,
    piece: [white, center(r, "F")],
    to: "DF",
  };
}

function cross(s: CubeState): SolveStep[] {
  if (STAGE_DONE.cross(s)) return [];
  const out: SolveStep[] = [];
  let cur = s;
  for (let step = daisyStep(cur); step; step = daisyStep(cur)) {
    out.push(step);
    cur = applyMoves(cur, step.moves);
  }
  for (let step = flipStep(cur); step; step = flipStep(cur)) {
    out.push(step);
    cur = applyMoves(cur, step.moves);
  }
  if (!STAGE_DONE.cross(cur)) throw new Error("Cross failed");
  return out;
}

/** Repeat a stage's search until its goal is met, one piece at a time. */
function stepwise(
  stage: StageId,
  s: CubeState,
  steps: AlgStep[],
  progress: (s: CubeState) => number,
  keep: (s: CubeState) => boolean,
  maxDepth: number,
  say: (count: number, algs: string[]) => string,
  /** Slots that fill one at a time (corners, middle edges): the new one is lit up on screen. */
  pieces?: Slot[],
): SolveStep[] {
  const out: SolveStep[] = [];
  let cur = s;
  while (!STAGE_DONE[stage](cur)) {
    const before = progress(cur);
    const found = stepSearch(cur, steps, (x) => keep(x) && progress(x) > before, maxDepth) as
      AlgStep[] | null;
    if (!found) throw new Error(`${stage} search failed`);
    const moves = found.flatMap((st) => st.moves);
    const why = found.flatMap((st) =>
      st.alg
        ? algWhy(st.alg, st.moves)
        : st.moves.map(
            (m) =>
              `${m[0] === "y" ? "Turn the whole cube to bring it round" : "Turn the top to line it up"}: ${lower(moveWords(m))}`,
          ),
    );
    const names = [...new Set(found.flatMap((st) => (st.alg ? [ALG_NAMES[st.alg]] : [])))];
    const next = applyMoves(cur, moves);
    const filled = pieces?.find((p) => !slotSolved(cur, p) && slotSolved(next, p));
    out.push({
      stage,
      moves,
      say: say(before, names),
      why,
      ...(filled && { piece: filled.stickers.map((i) => next[i]) }),
    });
    cur = next;
  }
  return out;
}

/** A search step; `alg` names the taught sequence it is, if any. */
type AlgStep = Step & { alg?: keyof typeof ALGS };

function corners(s: CubeState) {
  const steps: AlgStep[] = [
    ...TOP,
    ...SPIN,
    ...[1, 3, 5].map((n) => ({
      moves: seq(repeat(ALGS.cornerUp, n)),
      group: "alg",
      say: `Do ${ALGS.cornerUp} ×${n}`,
      alg: "cornerUp" as const,
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
      "Put a white corner above its spot, turn the whole cube so it's at front-right, then repeat the Corner sequence until it drops in.",
    D_CORNERS,
  );
}

function middle(s: CubeState) {
  const steps: AlgStep[] = [
    ...TOP,
    ...SPIN,
    {
      moves: seq(ALGS.middleRight),
      say: `Move edge right: ${ALGS.middleRight}`,
      alg: "middleRight" as const,
    },
    {
      moves: seq(ALGS.middleLeft),
      say: `Move edge left: ${ALGS.middleLeft}`,
      alg: "middleLeft" as const,
    },
  ];
  return stepwise(
    "middle",
    s,
    steps,
    (x) => count(x, MID_EDGES),
    bottomDone,
    5,
    (_, names) =>
      `Line up a top edge with its center and turn the whole cube so it's in front, then do ${names.join(" and ") || "Edge right or Edge left"}.`,
    MID_EDGES,
  );
}

function yellowCross(s: CubeState) {
  const steps: AlgStep[] = [
    ...TOP,
    { moves: seq(ALGS.yellowCross), say: ALGS.yellowCross, alg: "yellowCross" },
  ];
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
        ? "Yellow dot: do the sequence."
        : "Turn the top so the yellow L is at back-left (or the line goes left-to-right), then do the sequence. An L turns into a line: do it again.",
  );
}

function yellowEdges(s: CubeState) {
  const steps: AlgStep[] = [
    ...TOP,
    ...SPIN,
    { moves: seq(ALGS.yellowEdges), say: ALGS.yellowEdges, alg: "yellowEdges" },
  ];
  return stepwise(
    "yellowEdges",
    s,
    steps,
    (x) => (yellowEdgesDone(x) ? 1 : 0),
    yellowCrossDone,
    6,
    () => "Turn the top to match edges with centers, then swap them with the sequence.",
  );
}

function yellowCornersPlace(s: CubeState) {
  const steps: AlgStep[] = [
    ...SPIN,
    {
      moves: seq(ALGS.yellowCornersPlace),
      say: ALGS.yellowCornersPlace,
      alg: "yellowCornersPlace",
    },
  ];
  return stepwise(
    "yellowCornersPlace",
    s,
    steps,
    (x) => (yellowCornersPlaced(x) ? 1 : 0),
    yellowEdgesDone,
    5,
    () =>
      "Turn the whole cube so a corner that is in its right spot is at front-right, then do the sequence.",
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
        say: "Turn the top to bring the next twisted corner to front-right.",
        why: u.map((m) => `Turn only the top: ${lower(moveWords(m))}`),
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
      why: algWhy("twist", seq(repeat(ALGS.twist, n))),
      say: `Do the twist sequence ${n} times, until yellow is on top. The bottom will look messed up — keep going.`,
    });
  }
  for (const u of ["U", "U'", "U2"]) {
    if (isSolved(cur)) break;
    if (isSolved(applyMoves(cur, [u]))) {
      out.push({
        stage: "yellowCornersTwist",
        moves: [u],
        say: "Turn the top to line it up.",
        why: [`Turn the top to line it up: ${lower(moveWords(u))}`],
      });
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
