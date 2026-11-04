// Two small search tools the solver builds on.
//
// 1. stepSearch: tries short combinations of "steps" (a top turn, a whole-cube turn,
//    or a taught move sequence) until a goal is met. Because it only uses the
//    sequences a lesson teaches, its answers look like what a person would do.
//
// 2. pieceSearch: finds the fewest face turns to put a few pieces home,
//    following only those pieces (not the whole cube), so it stays fast.

import { type CubeState, type Move, applyMoves, moveTargets } from "../cube";

export interface Step {
  moves: Move[];
  /** Steps in the same group are never used twice in a row (U then U2 is just U'). */
  group?: string;
  /** What to tell the player. */
  say: string;
}

export function stepSearch(
  state: CubeState,
  steps: readonly Step[],
  goal: (s: CubeState) => boolean,
  maxDepth: number,
): Step[] | null {
  if (goal(state)) return [];
  const path: Step[] = [];
  const dfs = (s: CubeState, depth: number, lastGroup?: string): boolean => {
    if (depth === 0) return goal(s);
    for (const st of steps) {
      if (st.group && st.group === lastGroup) continue;
      path.push(st);
      if (dfs(applyMoves(s, st.moves), depth - 1, st.group)) return true;
      path.pop();
    }
    return false;
  };
  for (let d = 1; d <= maxDepth; d++) if (dfs(state, d)) return path;
  return null;
}

const FACE_MOVES: Move[] = "U U' U2 D D' D2 R R' R2 L L' L2 F F' F2 B B' B2".split(" ");
const TARGETS = new Map(FACE_MOVES.map((m) => [m, moveTargets(m)]));

/**
 * Fewest face turns that bring every tracked sticker from `from[k]` to `to[k]`.
 * One sticker per piece is enough to know where the piece is and which way it is turned.
 */
export function pieceSearch(from: number[], to: number[], maxDepth = 10): Move[] | null {
  const key = (p: number[]) => p.join(",");
  const goal = key(to);
  if (key(from) === goal) return [];
  let frontier: { pos: number[]; moves: Move[] }[] = [{ pos: from, moves: [] }];
  const seen = new Set([key(from)]);
  for (let d = 0; d < maxDepth; d++) {
    const next: typeof frontier = [];
    for (const { pos, moves } of frontier) {
      const last = moves[moves.length - 1]?.[0];
      for (const m of FACE_MOVES) {
        if (m[0] === last) continue;
        const t = TARGETS.get(m)!;
        const np = pos.map((i) => t[i]);
        const k = key(np);
        if (seen.has(k)) continue;
        if (k === goal) return [...moves, m];
        seen.add(k);
        next.push({ pos: np, moves: [...moves, m] });
      }
    }
    frontier = next;
  }
  return null;
}
