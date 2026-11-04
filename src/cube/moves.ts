// Turning the cube, in standard notation.
// Face turns: U R F D L B. Slices: M (follows L), E (follows D), S (follows F).
// Wide turns: Uw/u, Rw/r, ... (face plus middle layer). Whole-cube: x (follows R), y (follows U), z (follows F).
// Suffix ' = counter-clockwise, 2 = half turn.

import { type CubeState, type Face, type Vec3, STICKERS, stickerAt } from "./state";

export type Move = string;

interface Turn {
  axis: Vec3; // turning clockwise as seen looking at this direction
  inLayer: (along: number) => boolean; // position measured along the axis: 1, 0 or -1
}

const outer = (d: number) => d === 1;
const middle = (d: number) => d === 0;
const wide = (d: number) => d >= 0;
const all = () => true;

const AXIS: Record<string, Vec3> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

const BASE: Record<string, Turn> = {};
for (const f of "URFDLB") {
  BASE[f] = { axis: AXIS[f], inLayer: outer };
  BASE[f + "w"] = { axis: AXIS[f], inLayer: wide };
  BASE[f.toLowerCase()] = { axis: AXIS[f], inLayer: wide };
}
BASE.M = { axis: AXIS.L, inLayer: middle };
BASE.E = { axis: AXIS.D, inLayer: middle };
BASE.S = { axis: AXIS.F, inLayer: middle };
BASE.x = { axis: AXIS.R, inLayer: all };
BASE.y = { axis: AXIS.U, inLayer: all };
BASE.z = { axis: AXIS.F, inLayer: all };

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Quarter turn clockwise about axis a (looking at the cube from the a side). */
function rotate(a: Vec3, v: Vec3): Vec3 {
  // Rodrigues' formula at -90°: v' = -(a × v) + a (a · v)
  const d = dot(a, v);
  return [
    -(a[1] * v[2] - a[2] * v[1]) + a[0] * d,
    -(a[2] * v[0] - a[0] * v[2]) + a[1] * d,
    -(a[0] * v[1] - a[1] * v[0]) + a[2] * d,
  ];
}

/** For a quarter turn: target[i] = where the sticker at slot i ends up. */
function quarterTurnTargets(turn: Turn): number[] {
  return STICKERS.map((s) =>
    turn.inLayer(dot(turn.axis, s.position))
      ? stickerAt(rotate(turn.axis, s.position), rotate(turn.axis, s.normal))
      : s.index,
  );
}

const QUARTER = new Map(Object.entries(BASE).map(([k, t]) => [k, quarterTurnTargets(t)]));

export interface ParsedMove {
  base: string;
  turns: 1 | 2 | 3; // clockwise quarter turns
}

const MOVE_RE = /^([URFDLB]w?|[urfdlb]|[MES]|[xyz])(2'|2|'|)$/;

export function parseMove(m: Move): ParsedMove {
  const match = MOVE_RE.exec(m);
  if (!match) throw new Error(`Unknown move: ${m}`);
  const suffix = match[2];
  return { base: match[1], turns: suffix === "'" ? 3 : suffix.startsWith("2") ? 2 : 1 };
}

export function parseMoves(text: string): Move[] {
  const moves = text.trim().split(/\s+/).filter(Boolean);
  moves.forEach(parseMove);
  return moves;
}

/** Axis and layer test of a move, for drawing it. */
export function moveTurn(m: Move): Turn & ParsedMove {
  const p = parseMove(m);
  return { ...BASE[p.base], ...p };
}

export function applyMove(state: CubeState, m: Move): Face[] {
  const { base, turns } = parseMove(m);
  const target = QUARTER.get(base)!;
  let cur = [...state];
  for (let t = 0; t < turns; t++) {
    const next = [...cur];
    for (let i = 0; i < 54; i++) next[target[i]] = cur[i];
    cur = next;
  }
  return cur;
}

export function applyMoves(state: CubeState, moves: readonly Move[] | string): Face[] {
  const list = typeof moves === "string" ? parseMoves(moves) : moves;
  return list.reduce<Face[]>((s, m) => applyMove(s, m), [...state]);
}

export function invertMove(m: Move): Move {
  const { base, turns } = parseMove(m);
  return base + (turns === 1 ? "'" : turns === 2 ? "2" : "");
}

export function invertMoves(moves: readonly Move[]): Move[] {
  return [...moves].reverse().map(invertMove);
}
