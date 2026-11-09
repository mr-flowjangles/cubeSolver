// Touch: which move a swipe makes. Kept apart from the 3D drawing so it can be tested.
// Design: docs/02-levels.md → Controls → Touch controls.

import { type Move, STICKERS, type Vec3, applyMoves, moveTargets, moveTurn } from "../cube";

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** The four directions a sticker can be swiped along: the cube's axes lying in its face. */
export function swipeDirections(sticker: number): Vec3[] {
  const n = STICKERS[sticker].normal;
  const axes: Vec3[] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  return axes.filter((u) => dot(u, n) === 0);
}

/** One-layer turns: the six sides and the three middle layers. */
const LAYER_TURNS = ["R", "L", "U", "D", "F", "B", "M", "E", "S"];

/**
 * The move that carries this sticker along direction `u` (one of swipeDirections).
 * Only the layer holding the sticker turns.
 */
export function swipeMove(sticker: number, u: Vec3): Move {
  const s = STICKERS[sticker];
  // Turning counter-clockwise about a = n × u moves a sticker on face n along u.
  const a = cross(s.normal, u);
  const along = dot(s.position, a);
  for (const base of LAYER_TURNS) {
    const t = moveTurn(base);
    const d = dot(t.axis, a);
    if (d === 0 || !t.inLayer(along * d)) continue;
    // `base` turns clockwise about its own axis; that is counter-clockwise about a when d < 0.
    return d < 0 ? base : base + "'";
  }
  throw new Error(`No layer for sticker ${sticker}`);
}

/** Pick the direction whose on-screen arrow best matches the finger's movement. */
export function pickDirection(
  finger: readonly [number, number],
  options: readonly { u: Vec3; screen: readonly [number, number] }[],
): Vec3 {
  const len = (v: readonly [number, number]) => Math.hypot(v[0], v[1]) || 1;
  let best = options[0];
  let bestScore = -Infinity;
  for (const o of options) {
    const score = (o.screen[0] * finger[0] + o.screen[1] * finger[1]) / len(o.screen) / len(finger);
    if (score > bestScore) [best, bestScore] = [o, score];
  }
  return best.u;
}

/** A swipe beside the cube in free play turns the whole cube: left/right is y, up/down is x. */
export function backgroundMove(dx: number, dy: number): Move {
  // Screen y grows downward. Swiping left carries the front to the left, like y (which follows U).
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "y" : "y'";
  // Swiping up carries the front to the top, like x (which follows R).
  return dy < 0 ? "x" : "x'";
}

const WIDE_SPLIT: Record<string, Move[]> = {
  // A two-layer turn is the side plus the middle layer turning the same way.
  r: ["R", "M'"],
  l: ["L", "M"],
  u: ["U", "E'"],
  d: ["D", "E"],
  f: ["F", "S"],
  b: ["B", "S'"],
};

/** Whole-cube turns, made by swiping beside the cube. */
export const WHOLE_CUBE = ["x", "x'", "y", "y'", "z", "z'"];

/**
 * The swipes that make a move: one swipe is a quarter turn of one layer or of the whole cube.
 * U2 is two swipes; r (two layers) is R then M'.
 */
export function swipesFor(m: Move): Move[] {
  const t = moveTurn(m);
  const base = t.base.endsWith("w") ? t.base[0].toLowerCase() : t.base;
  const quarter = (b: string, k: 1 | 2 | 3): Move[] =>
    k === 1 ? [b] : k === 3 ? [b + "'"] : [b, b];
  const parts = WIDE_SPLIT[base];
  if (!parts) return quarter(base, t.turns);
  // Turn each layer the same number of quarter turns; a primed part flips direction.
  return parts.flatMap((p) => {
    const flip = p.endsWith("'");
    const k = flip ? ((4 - t.turns) as 1 | 2 | 3) : t.turns;
    return quarter(p.replace("'", ""), k);
  });
}

/** Sticker permutation of a list of moves, as "where each sticker ends up". */
function permutation(moves: readonly Move[]): number[] {
  const ids = STICKERS.map((s) => s.index) as unknown as Parameters<typeof applyMoves>[0];
  return applyMoves(ids, moves as Move[]) as unknown as number[];
}

const ALL_SINGLE = [
  ...LAYER_TURNS,
  ...Object.keys(WIDE_SPLIT),
  ...WHOLE_CUBE.filter((m) => !m.endsWith("'")),
].flatMap((b) => [b, b + "'", b + "2"]);

/**
 * After the player turns the whole cube (`turned`, e.g. ["y"]), the move that does what `m`
 * did before. Example: after y, what was R is now done with F.
 */
export function reorient(m: Move, turned: readonly Move[]): Move {
  if (!turned.length) return m;
  const want = permutation([m, ...turned]).join(",");
  const found = ALL_SINGLE.find((c) => permutation([...turned, c]).join(",") === want);
  if (!found) throw new Error(`Can't rename ${m} after ${turned.join(" ")}`);
  return found;
}

/** Where each sticker ends up after these whole-cube turns: index → new index. */
export function stickerMap(turned: readonly Move[]): (i: number) => number {
  const targets = turned.reduce<number[]>(
    (t, m) => t.map((i) => moveTargets(m)[i]),
    STICKERS.map((s) => s.index),
  );
  return (i) => targets[i];
}
