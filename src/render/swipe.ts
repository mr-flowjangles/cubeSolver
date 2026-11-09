// Touch: which move a swipe makes. Kept apart from the 3D drawing so it can be tested.
// Design: docs/02-levels.md → Controls → Touch controls.

import { type Move, STICKERS, type Vec3, moveTurn } from "../cube";

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
