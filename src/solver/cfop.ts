// CFOP solver, held white-down: Cross, F2L (first two layers, in pairs), then the
// "4-look last layer" most people learn first:
//   OLL in two looks: edges (yellow cross), then corners (yellow face)
//   PLL in two looks: corners, then edges
// Full PLL (21 sequences) is also listed for the PLL level.
// Like the beginner solver, every step after the cross only uses taught sequences.

import { type CubeState, type Move, applyMoves, center, isSolved, slot, slotSolved } from "../cube";
import { STAGE_DONE as BEGINNER_DONE, solveBeginner } from "./beginner";
import { type Step, pieceSearch, stepSearch } from "./search";

export type CfopStage = "hold" | "cross" | "f2l" | "eo" | "oll" | "cp" | "ep";

export interface CfopStep {
  stage: CfopStage;
  moves: Move[];
  say: string;
}

const seq = (s: string): Move[] => s.split(" ");

export const F2L_TRIGGERS: { name: string; moves: string }[] = [
  { name: "Right insert", moves: "R U R'" },
  { name: "Right insert (other way)", moves: "R U' R'" },
  { name: "Right, double", moves: "R U2 R'" },
  { name: "Front insert", moves: "F' U' F" },
  { name: "Front insert (other way)", moves: "F' U F" },
  { name: "Front, double", moves: "F' U2 F" },
];

export const EO_ALGS = [
  { name: "Line", moves: "F R U R' U' F'" },
  { name: "L shape", moves: "f R U R' U' f'" },
];

export const OCLL_ALGS = [
  { name: "Sune", moves: "R U R' U R U2 R'" },
  { name: "Antisune", moves: "R U2 R' U' R U' R'" },
  { name: "H", moves: "R U R' U R U' R' U R U2 R'" },
  { name: "Pi", moves: "R U2 R2 U' R2 U' R2 U2 R" },
  { name: "Headlights", moves: "R2 D' R U2 R' D R U2 R" },
  { name: "T", moves: "r U R' U' r' F R F'" },
  { name: "Bowtie", moves: "F' r U R' U' r' F R" },
];

export const CP_ALGS = [
  { name: "T-perm (headlights)", moves: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { name: "Y-perm (diagonal)", moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
];

export const EP_ALGS = [
  { name: "Ua", moves: "M2 U M U2 M' U M2" },
  { name: "Ub", moves: "M2 U' M U2 M' U' M2" },
  { name: "H", moves: "M2 U M2 U2 M2 U M2" },
  { name: "Z", moves: "M2 U M2 U M' U2 M2 U2 M' U2" },
];

export const PLL_ALGS = [
  { name: "Aa", moves: "x R' U R' D2 R U' R' D2 R2 x'" },
  { name: "Ab", moves: "x R2 D2 R U R' D2 R U' R x'" },
  { name: "E", moves: "x' R U' R' D R U R' D' R U R' D R U' R' D' x" },
  { name: "F", moves: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
  { name: "Ga", moves: "R2 U R' U R' U' R U' R2 U' D R' U R D'" },
  { name: "Gb", moves: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
  { name: "Gc", moves: "R2 U' R U' R U R' U R2 U D' R U' R' D" },
  { name: "Gd", moves: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
  { name: "H", moves: "M2 U M2 U2 M2 U M2" },
  { name: "Ja", moves: "R' U L' U2 R U' R' U2 R L U'" },
  { name: "Jb", moves: "R U R' F' R U R' U' R' F R2 U' R' U'" },
  { name: "Na", moves: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
  { name: "Nb", moves: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
  { name: "Ra", moves: "R U' R' U' R U R D R' U' R D' R' U2 R' U'" },
  { name: "Rb", moves: "R2 F R U R U' R' F' R U2 R' U2 R" },
  { name: "T", moves: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { name: "Ua", moves: "M2 U M U2 M' U M2" },
  { name: "Ub", moves: "M2 U' M U2 M' U' M2" },
  { name: "V", moves: "R' U R' U' y R' F' R2 U' R' U R' F R F" },
  { name: "Y", moves: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
  { name: "Z", moves: "M2 U M2 U M' U2 M2 U2 M' U2" },
];

// ---- Checks ----

const D_EDGES = ["DF", "DR", "DB", "DL"].map(slot);
const PAIRS = [
  ["DFR", "FR"],
  ["DRB", "BR"],
  ["DBL", "BL"],
  ["DLF", "FL"],
].map(([c, e]) => [slot(c), slot(e)] as const);
const U_EDGES = ["UF", "UR", "UB", "UL"].map(slot);
const U_CORNERS = ["URF", "UFL", "ULB", "UBR"].map(slot);
const U_ALL = [...U_EDGES, ...U_CORNERS];

const crossDone = (s: CubeState) => D_EDGES.every((e) => slotSolved(s, e));
const pairsDone = (s: CubeState) =>
  PAIRS.filter(([c, e]) => slotSolved(s, c) && slotSolved(s, e)).length;
const f2lDone = (s: CubeState) => crossDone(s) && pairsDone(s) === 4;
const topYellow = (s: CubeState, slots: typeof U_EDGES) =>
  slots.every((x) => s[x.stickers[0]] === center(s, "U"));
const eoDone = (s: CubeState) => f2lDone(s) && topYellow(s, U_EDGES);
const ollDone = (s: CubeState) => f2lDone(s) && topYellow(s, U_ALL);
/** Some turn of the top puts all four top corners in place. */
const cpDone = (s: CubeState) =>
  ollDone(s) &&
  ["", "U", "U2", "U'"].some((u) => {
    const t = u ? applyMoves(s, [u]) : s;
    return U_CORNERS.every((c) => slotSolved(t, c));
  });

export const CFOP_DONE: Record<CfopStage, (s: CubeState) => boolean> = {
  hold: BEGINNER_DONE.hold,
  cross: crossDone,
  f2l: f2lDone,
  eo: eoDone,
  oll: ollDone,
  cp: cpDone,
  ep: isSolved,
};

export const CFOP_STAGES: CfopStage[] = ["hold", "cross", "f2l", "eo", "oll", "cp", "ep"];

// ---- Stages ----

const TOP: Step[] = [
  { moves: ["U"], group: "U", say: "U" },
  { moves: ["U'"], group: "U", say: "U'" },
  { moves: ["U2"], group: "U", say: "U2" },
];
const SPIN: Step[] = [
  { moves: ["y"], group: "y", say: "y" },
  { moves: ["y'"], group: "y", say: "y'" },
  { moves: ["y2"], group: "y", say: "y2" },
];
const algSteps = (algs: { name: string; moves: string }[]): Step[] =>
  algs.map((a) => ({ moves: seq(a.moves), group: "alg", say: a.name }));

function hold(s: CubeState): CfopStep[] {
  return solveBeginner(s, "hold").map((x) => ({ ...x, stage: "hold" as const }));
}

/** The whole cross at once, in the fewest turns (as speedcubers plan it). */
function cross(s: CubeState): CfopStep[] {
  if (crossDone(s)) return [];
  const from: number[] = [];
  const to: number[] = [];
  // Track each cross edge by its white sticker.
  for (const e of D_EDGES) {
    const white = center(s, "D");
    const side = center(s, faceAt(e.stickers[1]));
    const at = findEdge(s, white, side);
    from.push(at);
    to.push(e.stickers[0]);
  }
  const moves = pieceSearch(from, to, 9);
  if (!moves) {
    // Fall back to one edge at a time.
    return solveBeginner(s, "cross")
      .filter((x) => x.stage === "cross")
      .map((x) => ({ ...x, stage: "cross" as const }));
  }
  return [{ stage: "cross", moves, say: "Plan the whole white cross, then make it." }];
}

const FACE_LETTERS = "URFDLB";
const faceAt = (i: number) => FACE_LETTERS[Math.floor(i / 9)] as "U" | "R" | "F" | "D" | "L" | "B";

function findEdge(s: CubeState, a: string, b: string): number {
  for (const e of ["UF", "UR", "UB", "UL", "DF", "DR", "DB", "DL", "FR", "FL", "BR", "BL"].map(
    slot,
  )) {
    const [i, j] = e.stickers;
    if (s[i] === a && s[j] === b) return i;
    if (s[j] === a && s[i] === b) return j;
  }
  throw new Error("Edge not found");
}

function f2l(s: CubeState): CfopStep[] {
  const out: CfopStep[] = [];
  let cur = s;
  const steps: Step[] = [...TOP, ...algSteps(F2L_TRIGGERS)];
  while (!f2lDone(cur)) {
    const before = pairsDone(cur);
    const goal = (x: CubeState) => crossDone(x) && pairsDone(x) > before;
    // Turn the cube to each slot that still needs a pair, and look for a short answer there.
    let found: Step[] | null = null;
    for (const y of ["", "y", "y'", "y2"]) {
      const start = y ? applyMoves(cur, [y]) : cur;
      const r = stepSearch(start, steps, goal, 5);
      if (r && (!found || r.length + (y ? 1 : 0) < found.length)) {
        found = y ? [{ moves: [y], say: y }, ...r] : r;
      }
      if (found && found.length <= 2) break;
    }
    if (!found) {
      // Fall back to the beginner way: corner, then edge.
      const fb = solveBeginner(cur, "middle").filter(
        (x) => x.stage === "corners" || x.stage === "middle",
      );
      const first = fb[0];
      if (!first) throw new Error("F2L failed");
      out.push({ stage: "f2l", moves: first.moves, say: "Tricky pair — split it: " + first.say });
      cur = applyMoves(cur, first.moves);
      continue;
    }
    const moves = found.flatMap((x) => x.moves);
    out.push({
      stage: "f2l",
      moves,
      say: `Pair ${before + 1}: join a white corner with its edge, then insert them together.`,
    });
    cur = applyMoves(cur, moves);
  }
  return out;
}

function lastLayer(
  stage: CfopStage,
  s: CubeState,
  algs: { name: string; moves: string }[],
  say: (names: string[]) => string,
  maxDepth = 4,
): CfopStep[] {
  if (CFOP_DONE[stage](s)) return [];
  const steps = [...TOP, ...algSteps(algs)];
  const found = stepSearch(s, steps, CFOP_DONE[stage], maxDepth);
  if (!found) throw new Error(`${stage} search failed`);
  const names = found.filter((x) => x.group === "alg").map((x) => x.say);
  return [{ stage, moves: found.flatMap((x) => x.moves), say: say(names) }];
}

const AUF = (s: CubeState): CfopStep[] => {
  for (const u of ["U", "U'", "U2"])
    if (isSolved(applyMoves(s, [u])))
      return [{ stage: "ep", moves: [u], say: "Turn the top to line it up." }];
  return [];
};

export function solveCfop(state: CubeState, until?: CfopStage): CfopStep[] {
  const out: CfopStep[] = [];
  let cur = state;
  const run = (steps: CfopStep[]) => {
    for (const st of steps) cur = applyMoves(cur, st.moves);
    out.push(...steps);
  };
  const stages: [CfopStage, () => CfopStep[]][] = [
    ["hold", () => hold(cur)],
    ["cross", () => cross(cur)],
    ["f2l", () => f2l(cur)],
    ["eo", () => lastLayer("eo", cur, EO_ALGS, (n) => `Yellow cross: ${n.join(", then ")}.`, 5)],
    ["oll", () => lastLayer("oll", cur, OCLL_ALGS, (n) => `Yellow face: ${n.join(", then ")}.`)],
    ["cp", () => lastLayer("cp", cur, CP_ALGS, (n) => `Corners: ${n.join(", then ")}.`)],
    [
      "ep",
      () => {
        if (isSolved(cur)) return [];
        return lastLayer("ep", cur, EP_ALGS, (n) => `Edges: ${n.join(", then ")}.`, 4);
      },
    ],
  ];
  for (const [id, fn] of stages) {
    run(fn());
    if (id === "ep" && !isSolved(cur)) run(AUF(cur));
    if (id === until) break;
  }
  return out.filter((x) => x.moves.length);
}

/** Finish a last layer that only needs a PLL, using the full PLL list. */
export function solvePll(state: CubeState): CfopStep[] {
  if (isSolved(state)) return [];
  const steps = [...TOP, ...algSteps(PLL_ALGS)];
  const found = stepSearch(state, steps, isSolved, 3);
  if (!found) throw new Error("PLL search failed");
  const names = found.filter((x) => x.group === "alg").map((x) => x.say);
  return [
    {
      stage: "ep",
      moves: found.flatMap((x) => x.moves),
      say: names.length ? `${names.join(" + ")} perm.` : "Line up the top.",
    },
  ];
}

export function cfopStateAfter(state: CubeState, stage: CfopStage): CubeState {
  return solveCfop(state, stage).reduce<CubeState>((s, x) => applyMoves(s, x.moves), state);
}
