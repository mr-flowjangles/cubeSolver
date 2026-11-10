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
  findPiece,
  center,
  isSolved,
  moveTargets,
  simplifyMoves,
  slot,
  slotHasRightPiece,
  slotSolved,
} from "../cube";
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

/** A reason for each move of a taught sequence done `moves.length / alg length` times. */
function algWhy(alg: keyof typeof ALGS, moves: Move[]): string[] {
  const len = seq(ALGS[alg]).length;
  const rounds = moves.length / len;
  return moves.map((m, i) => {
    const round = rounds > 1 ? `, round ${Math.floor(i / len) + 1} of ${rounds}` : "";
    return `${ALG_NAMES[alg]} sequence${round}, move ${(i % len) + 1} of ${len}.`;
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
  // Only white down: no level says which side faces you, and every stage works from any front.
  hold: (s) => center(s, "D") === "U",
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

// Only x and y: no swipe turns the cube sideways (z). y, then x, then y reaches every hold.
const Y_TURNS = ["", "y", "y'", "y2"];
const X_TURNS = ["", "x", "x'", "x2"];

function hold(s: CubeState): SolveStep[] {
  // Already white-down (the player may have spun the cube since): nothing to do.
  if (center(s, "D") === "U") return [];
  const options = Y_TURNS.flatMap((a) =>
    X_TURNS.flatMap((b) => Y_TURNS.map((c) => [a, b, c].filter(Boolean))),
  );
  const swipes = (m: string[]) => m.reduce((n, t) => n + (t.endsWith("2") ? 2 : 1), 0);
  options.sort((x, y) => swipes(x) - swipes(y));
  const moves = options.find((m) => STAGE_DONE.hold(applyMoves(s, m)));
  if (!moves) throw new Error("No white center");
  return [{ stage: "hold", moves, say: "Hold the cube with white on the bottom." }];
}

// ---- White cross, the daisy way ----
// Follows level 1's words step for step (docs/02-levels.md → kid test, round 5):
// Part 1 (daisy): bring the white edges up around the top center, white side up; one already
// finished on the bottom can stay. Part 2: turn the top until an edge matches the center below
// it, then turn that side twice. Every move carries a plain-words reason for the walk-through.

const ALL_EDGES = ["UF", "UR", "UB", "UL", "FR", "RB", "BL", "LF", "DF", "DR", "DB", "DL"];
const FRONT_EDGES = ["UF", "FR", "DF", "LF"]; // the white edges a player can see from the front
const keyOf = (cs: readonly Face[]) => [...cs].sort().join("");

function cross(s: CubeState): SolveStep[] {
  if (STAGE_DONE.cross(s)) return [];
  const out: SolveStep[] = [];
  let cur = s;
  const white = center(s, "D");
  const yellow = name(center(s, "U"));
  const colorsAt = (n: string) => slot(n).stickers.map((i) => cur[i]);
  /** The color on the `f` side of the piece in slot `n`. */
  const sticker = (n: string, f: Face) => {
    const sl = slot(n);
    return cur[sl.stickers[sl.name.indexOf(f)]];
  };
  const findEdge = (cs: Face[]) => ALL_EDGES.find((n) => keyOf(colorsAt(n)) === keyOf(cs))!;
  const upTop = (n: string) => sticker(n, "U") === white;
  const finished = (n: string) => n[0] === "D" && slotSolved(cur, slot(n));
  const needsWork = (n: string) =>
    colorsAt(n).includes(white) && !(n[0] === "U" && upTop(n)) && !finished(n);
  const daisyDone = () => !ALL_EDGES.some(needsWork);

  // Part 1, one white edge per step.
  for (let guard = 0, looks = 0; !daisyDone(); guard++) {
    if (guard > 24) throw new Error("Daisy failed");
    const e = FRONT_EDGES.find(needsWork);
    if (!e) {
      // "No white edge on the front? Turn the whole cube to look at the other sides. White can face down, out of sight: tip the cube up (swipe up beside it) to look underneath, then tip it back."
      if (looks++ > 3) throw new Error("Daisy: no white edge to work on");
      out.push({
        stage: "cross",
        part: "Part 1: the daisy",
        moves: ["y"],
        say: "No white edge on the front. Turn the whole cube to look at the other sides.",
        why: ["Turn the whole cube to look at the other sides."],
      });
      cur = applyMoves(cur, ["y"]);
      continue;
    }
    looks = 0;
    const cols = colorsAt(e);
    const other = cols.find((c) => c !== white)!;
    let moves: Move[] = [];
    let why: string[] = [];
    const go = (m: Move, w: string) => {
      moves.push(m);
      why.push(w);
      cur = applyMoves(cur, [m]);
    };
    const say = `Bring the white–${name(other)} edge up next to the ${yellow} center, white side up.`;
    /** End the step here. `to` "" lights only the piece: its top spot isn't known in this hold. */
    const flush = (to: string) => {
      if (moves.length)
        out.push({
          stage: "cross",
          part: "Part 1: the daisy",
          moves,
          why,
          say,
          piece: [white, other],
          to,
        });
      moves = [];
      why = [];
    };
    // "Before you turn any side, turn the top so the spot above that side has no white edge facing up yet."
    const clear = (side: Face) => {
      if (!upTop("U" + side)) return;
      // Fewest swipes that free the spot: one turn either way, else a half turn.
      const k = [1, 3, 2].find((n) => {
        const sl = slot("U" + side);
        return applyMoves(cur, turns("U", n))[sl.stickers[sl.name.indexOf("U")]] !== white;
      });
      if (!k) throw new Error("Daisy: no free spot on top");
      for (const m of turns("U", k))
        go(m, "Turn the top so the spot above this side has no white edge facing up.");
    };
    // "Keep going with that same edge until it's on top, white facing up."
    for (let at = e, k = 0; needsWork(at); at = findEdge(cols), k++) {
      if (k > 6) throw new Error("Daisy: edge never came up");
      const [a, b] = [...at] as Face[];
      const wf = sticker(at, a) === white ? a : b;
      const of = wf === a ? b : a;
      if (wf === "D") {
        // "White edge on the bottom: turn that side twice. It comes up to the top."
        clear(of);
        go(`${of}2`, "White edge on the bottom: turn that side twice. It comes up to the top.");
      } else if (at.includes("U") || at.includes("D")) {
        // "White facing out to the side, in the top or bottom row: turn that side once."
        clear(wf);
        go(wf, "White faces out to the side: turn that side once. It moves to the middle row.");
      } else if (at === "LF") {
        // "White edge in the middle row: turn the whole cube so it's at front-right."
        // Its own step, so what's lit before and after the turn names the right squares.
        flush("");
        go("y'", "White edge in the middle row: turn the whole cube so it's at front-right.");
        flush("");
      } else {
        // "Its white faces one side; turn the other side it touches, so the edge goes up, white facing up."
        clear(of);
        const up = [of, `${of}'`].find((m) => {
          const t = applyMoves(cur, [m]);
          const sl = slot("U" + of);
          return (
            keyOf(sl.stickers.map((i) => t[i])) === keyOf(cols) &&
            t[sl.stickers[sl.name.indexOf("U")]] === white
          );
        })!;
        go(
          up,
          "White edge in the middle row: turn the other side it touches, so the edge goes up, white facing up.",
        );
      }
    }
    flush(findEdge(cols));
  }

  // Part 2: "turn the top until an edge's other color matches the center below it. Turn the whole
  // cube so that side faces you, then turn the front twice."
  for (let i = 0; i < 4 && !STAGE_DONE.cross(cur); i++) {
    let k = 0;
    let f: Face | undefined;
    for (; k < 4 && !f; k++) {
      const t = applyMoves(cur, turns("U", k));
      f = (["F", "R", "B", "L"] as const).find((x) => {
        const sl = slot("U" + x);
        return (
          t[sl.stickers[sl.name.indexOf("U")]] === white &&
          t[sl.stickers[sl.name.indexOf(x)]] === center(t, x)
        );
      });
    }
    if (!f) throw new Error("Cross part 2: no edge matches");
    const u = turns("U", k - 1);
    const y = turns("y", Y_TO_FRONT[f]);
    const c = name(center(cur, f));
    const step: SolveStep = {
      stage: "cross",
      part: "Part 2: turn them down",
      moves: [...u, ...y, "F2"],
      why: [
        ...u.map(() => "Turn the top until an edge's other color matches the center below it."),
        ...y.map(() => `Turn the whole cube so the ${c} side faces you.`),
        `Turn the front twice: the white–${c} edge drops to the bottom, white side down.`,
      ],
      say: `Turn the top until the white–${c} edge sits over the ${c} center, turn the whole cube so that side faces you, then turn the front twice.`,
      piece: [white, center(cur, f)],
      // No slot name: the screen lights the edge's home by its colors, which stays right as the cube turns.
    };
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
        : st.moves.map((m) =>
            m[0] === "y"
              ? "Turn the whole cube."
              : "Turn the top so the yellow L is at the back and the left, or the line goes left-to-right.",
          ),
    );
    const names = [...new Set(found.flatMap((st) => (st.alg ? [ALG_NAMES[st.alg]] : [])))];
    out.push({ stage, moves, say: say(before, names), why });
    cur = applyMoves(cur, moves);
  }
  return out;
}

/** A search step; `alg` names the taught sequence it is, if any. */
type AlgStep = Step & { alg?: keyof typeof ALGS };

// Levels 2, 3, 5 and 6 follow the level's own words, step for step, so Hint, Show me and the
// demo never do something the words don't say (docs/02-levels.md → kid test, round 3).

/** k quarter turns of `face`, written the short way (3 → face'). */
const turns = (face: string, k: number) => simplifyMoves(Array<Move>(k % 4).fill(face));
const WHY_TOP = (what: string) => `Turn the top so ${what}.`;
const WHY_CUBE = (what: string) => `Turn the whole cube so ${what}.`;

/** One planned step: top turns, whole-cube turns, then a taught sequence. */
function planned(
  stage: StageId,
  u: Move[],
  y: Move[],
  alg: keyof typeof ALGS | null,
  rounds: number,
  say: string,
  whyU: string,
  whyY: string,
  piece?: Face[],
): SolveStep {
  const algMoves = alg ? seq(repeat(ALGS[alg], rounds)) : [];
  return {
    stage,
    moves: [...u, ...y, ...algMoves],
    say,
    why: [...u.map(() => whyU), ...y.map(() => whyY), ...(alg ? algWhy(alg, algMoves) : [])],
    ...(piece && { piece }),
  };
}

/**
 * Lifting a stuck piece out, from a cube already turned so it's at `at`: the sequence step lights
 * the piece and the top spot it goes to (not its home, which comes later).
 */
function liftOut(
  stage: StageId,
  from: CubeState,
  alg: keyof typeof ALGS,
  at: string,
  say: string,
): SolveStep {
  const piece = slot(at).stickers.map((x) => from[x]);
  const to = findPiece(applyMoves(from, ALGS[alg]), piece).name;
  return { ...planned(stage, [], [], alg, 1, say, "", "", piece), to };
}

/**
 * The whole-cube turn before a lift-out, as its own step, so the lit squares are right before
 * and after it. Lights only the piece.
 */
function turnToStuck(
  stage: StageId,
  from: CubeState,
  y: Move[],
  at: string,
  say: string,
  why: string,
): SolveStep {
  const s = applyMoves(from, y);
  return {
    stage,
    moves: y,
    say,
    why: y.map(() => why),
    piece: slot(at).stickers.map((x) => s[x]),
    to: "",
  };
}

/** How many y turns bring side `f` to the front. */
const Y_TO_FRONT: Record<string, number> = { F: 0, R: 1, B: 2, L: 3 };
const TOP_EDGE: Record<string, Slot> = {
  F: slot("UF"),
  R: slot("UR"),
  B: slot("UB"),
  L: slot("UL"),
};

function corners(s: CubeState): SolveStep[] {
  const out: SolveStep[] = [];
  let cur = s;
  const white = center(s, "D");
  const key = (cs: Face[]) => [...cs].sort().join("");
  for (let i = 0; i < 12 && !STAGE_DONE.corners(cur); i++) {
    // "Find a white corner in the top layer."
    const top = U_CORNERS.find((c) => c.stickers.some((k) => cur[k] === white));
    let step: SolveStep;
    if (top) {
      const colors = top.stickers.map((k) => cur[k]);
      const others = colors.filter((c) => c !== white).map(name);
      // "Its spot is the bottom corner between the centers of its other two colors."
      const spot = D_CORNERS.find(
        (d) => key([...d.name].map((f) => center(cur, f as Face))) === key(colors),
      )!;
      const above = U_CORNERS.find(
        (c) => key([...c.name] as Face[]) === key(["U", ...spot.name.slice(1)] as Face[]),
      )!;
      // "Turn the top until the corner sits right above its spot."
      let k = 0;
      while (key(above.stickers.map((x) => applyMoves(cur, turns("U", k))[x])) !== key(colors)) k++;
      // "Turn the whole cube so that corner is at front-right."
      const yk = D_CORNERS.indexOf(spot); // DFR, DRB, DBL, DLF: 0–3 turns of y bring it to the front-right
      const held = applyMoves(cur, [...turns("U", k), ...turns("y", yk)]);
      // "Repeat the sequence until the corner drops in, white side down."
      let n = 0;
      for (let t = held; !slotSolved(t, slot("DFR")); t = applyMoves(t, ALGS.cornerUp)) n++;
      step = planned(
        "corners",
        turns("U", k),
        turns("y", yk),
        "cornerUp",
        n,
        `Put the white–${others.join("–")} corner above its spot, turn the whole cube so it's at front-right, then do Corner ${n === 1 ? "once. It drops in." : `${n} times, until it drops in.`}`,
        WHY_TOP("the corner sits right above its spot"),
        WHY_CUBE("the corner is at front-right"),
        colors,
      );
    } else {
      // "A white corner on the bottom in the wrong spot, or turned the wrong way? ... lift it out."
      let yk = 0;
      while (slotSolved(applyMoves(cur, turns("y", yk)), slot("DFR"))) yk++;
      const say =
        "A white corner is stuck in the bottom. Turn the whole cube so it's at front-right, then do Corner once to lift it out.";
      if (yk) {
        const t = turnToStuck(
          "corners",
          cur,
          turns("y", yk),
          "DFR",
          say,
          WHY_CUBE("the stuck corner is at front-right"),
        );
        out.push(t);
        cur = applyMoves(cur, t.moves);
      }
      step = liftOut("corners", cur, "cornerUp", "DFR", say);
    }
    out.push(step);
    cur = applyMoves(cur, step.moves);
  }
  if (!STAGE_DONE.corners(cur)) throw new Error("Corners failed");
  return out;
}

function middle(s: CubeState): SolveStep[] {
  const out: SolveStep[] = [];
  let cur = s;
  const yellow = center(s, "U");
  for (let i = 0; i < 12 && !STAGE_DONE.middle(cur); i++) {
    let step: SolveStep | null = null;
    // "Find a top edge with no yellow. Turn the top until its side color matches the center below it."
    for (let k = 0; k < 4 && !step; k++) {
      const t = applyMoves(cur, turns("U", k));
      const f = (["F", "R", "B", "L"] as const).find((f) => {
        const [up, side] = TOP_EDGE[f].stickers.map((x) => t[x]);
        return up !== yellow && side !== yellow && side === center(t, f);
      });
      if (!f) continue;
      // "Turn the whole cube so that side is in front."
      const held = applyMoves(t, turns("y", Y_TO_FRONT[f]));
      const [up, side] = TOP_EDGE.F.stickers.map((x) => held[x]);
      // "Its top color matches the right center? Do Edge right. The left center? Do Edge left."
      const alg = up === center(held, "R") ? "middleRight" : "middleLeft";
      step = planned(
        "middle",
        turns("U", k),
        turns("y", Y_TO_FRONT[f]),
        alg,
        1,
        `Turn the top until the ${name(side)}–${name(up)} edge sits over the ${name(side)} center, turn the whole cube so it's in front, then do ${ALG_NAMES[alg]}.`,
        WHY_TOP("the edge's side color matches the center below it"),
        WHY_CUBE("that side faces you"),
        [side, up],
      );
    }
    if (!step) {
      // "No edge on top fits? One is stuck in the middle. ... front-right, then do Edge right once."
      let yk = 0;
      while (slotSolved(applyMoves(cur, turns("y", yk)), slot("FR"))) yk++;
      const say =
        "No top edge fits, so one is stuck in the middle. Turn the whole cube so it's at front-right, then do Edge right once to pop it out.";
      if (yk) {
        const t = turnToStuck(
          "middle",
          cur,
          turns("y", yk),
          "FR",
          say,
          WHY_CUBE("the stuck edge is at front-right"),
        );
        out.push(t);
        cur = applyMoves(cur, t.moves);
      }
      step = liftOut("middle", cur, "middleRight", "FR", say);
    }
    out.push(step);
    cur = applyMoves(cur, step.moves);
  }
  if (!STAGE_DONE.middle(cur)) throw new Error("Middle failed");
  return out;
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
        : "Turn the top so the yellow L is at the back and the left (or the line goes left-to-right), then do the sequence. An L turns into a line: do it again.",
  );
}

function yellowEdges(s: CubeState): SolveStep[] {
  const out: SolveStep[] = [];
  let cur = s;
  const matching = (t: CubeState) =>
    (["F", "R", "B", "L"] as const).filter((f) => t[TOP_EDGE[f].stickers[1]] === center(t, f));
  for (let i = 0; i < 8 && !STAGE_DONE.yellowEdges(cur); i++) {
    // "Turn the top until two edges match their centers."
    let k = 0;
    while (k < 4 && matching(applyMoves(cur, turns("U", k))).length < 2) k++;
    if (k === 4) throw new Error("Yellow edges: never two matching");
    const t = applyMoves(cur, turns("U", k));
    const m = matching(t);
    let step: SolveStep;
    if (m.length === 4) {
      step = planned(
        "yellowEdges",
        turns("U", k),
        [],
        null,
        0,
        "Turn the top to line it up.",
        WHY_TOP("every edge matches its center"),
        "",
      );
    } else if ((m.includes("F") && m.includes("B")) || (m.includes("R") && m.includes("L"))) {
      // "Matching edges opposite: do the sequence once, then try again."
      step = planned(
        "yellowEdges",
        turns("U", k),
        [],
        "yellowEdges",
        1,
        "Turn the top until two edges match. They're opposite each other, so do Swap edges once, then look again.",
        WHY_TOP("two edges match their centers"),
        "",
      );
    } else {
      // "Matching edges side by side: turn the whole cube so they're at the back and the right."
      let yk = 0;
      while (!["B", "R"].every((f) => matching(applyMoves(t, turns("y", yk))).includes(f as "B")))
        yk++;
      step = planned(
        "yellowEdges",
        turns("U", k),
        turns("y", yk),
        "yellowEdges",
        1,
        "Turn the top until two edges match, turn the whole cube so they're at the back and the right, then do Swap edges.",
        WHY_TOP("two edges match their centers"),
        WHY_CUBE("the matching edges are at the back and the right"),
      );
    }
    out.push(step);
    cur = applyMoves(cur, step.moves);
  }
  if (!STAGE_DONE.yellowEdges(cur)) throw new Error("Yellow edges failed");
  return out;
}

function yellowCornersPlace(s: CubeState): SolveStep[] {
  const out: SolveStep[] = [];
  let cur = s;
  const inPlace = (t: CubeState) => slotHasRightPiece(t, slot("URF"));
  for (let i = 0; i < 8 && !STAGE_DONE.yellowCornersPlace(cur); i++) {
    const any = U_CORNERS.some((c) => slotHasRightPiece(cur, c));
    // "Turn the whole cube so a corner that is in place is at front-right." / "None in place? ... from anywhere."
    let yk = 0;
    if (any) while (!inPlace(applyMoves(cur, turns("y", yk)))) yk++;
    const step = planned(
      "yellowCornersPlace",
      [],
      turns("y", yk),
      "yellowCornersPlace",
      1,
      any
        ? "Turn the whole cube so a corner that's in its right spot is at front-right, then do Move corners."
        : "No corner is in its right spot yet. Do Move corners once from anywhere, then look again.",
      "",
      WHY_CUBE("a corner in its right spot is at front-right"),
    );
    out.push(step);
    cur = applyMoves(cur, step.moves);
  }
  if (!STAGE_DONE.yellowCornersPlace(cur)) throw new Error("Yellow corners failed");
  return out;
}

/** Twist each top corner with R' D' R D at front-right, turning only the top between corners. */
function yellowCornersTwist(s: CubeState): SolveStep[] {
  if (isSolved(s)) return [];
  const out: SolveStep[] = [];
  let cur = s;
  const urf = slot("URF");
  const yellow = center(cur, "U");
  // "To start, turn the top so a twisted corner is at front-right." The loop below does that:
  // this step never turns the whole cube.
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
        why: u.map(() => "Turn only the top, to bring the next twisted corner to front-right."),
      });
    }
    cur = here;
    offset = k;
    // "Do the whole sequence, all 4 moves, again and again. Check only after all 4 moves."
    let n = 0;
    while (cur[urf.stickers[0]] !== yellow) {
      if (n === 6) throw new Error("Twist: corner never turned yellow up"); // 6 rounds = back to start
      cur = applyMoves(cur, seq(ALGS.twist));
      n++;
    }
    out.push({
      stage: "yellowCornersTwist",
      moves: seq(repeat(ALGS.twist, n)),
      why: algWhy("twist", seq(repeat(ALGS.twist, n))),
      say: `Do the Twist sequence ${n === 1 ? "once" : `${n} times`}, until that corner's yellow is on top. The bottom will look messed up — keep going.`,
    });
  }
  for (const u of ["U", "U'", "U2"]) {
    if (isSolved(cur)) break;
    if (isSolved(applyMoves(cur, [u]))) {
      out.push({
        stage: "yellowCornersTwist",
        moves: [u],
        say: "Turn the top to line it up.",
        why: ["Turn the top to line it up."],
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
/**
 * The twist steps alone, if they finish the cube from here: true partway through the twist
 * stage, when the bottom is meant to look messy. Otherwise null.
 */
export function finishTwist(state: CubeState): SolveStep[] | null {
  try {
    const steps = yellowCornersTwist(state);
    return isSolved(
      applyMoves(
        state,
        steps.flatMap((x) => x.moves),
      ),
    )
      ? steps
      : null;
  } catch {
    return null;
  }
}

export function solveBeginner(state: CubeState, until?: StageId): SolveStep[] {
  // Partway through the twist stage the bottom looks broken; don't send the player back to level 1.
  if (until === undefined || until === "yellowCornersTwist") {
    const twist = finishTwist(state);
    if (twist) return twist.filter((x) => x.moves.length > 0);
  }
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
