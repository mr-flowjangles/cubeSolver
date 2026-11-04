// Pieces of the cube: 8 corners, 12 edges, 6 centers.
// A "slot" is a place a piece can sit, named by the faces it touches (e.g. "DF", "URF").
// Whether a piece is right is always judged against the center colors,
// so the cube can be held any way up.

import { type CubeState, type Face, FACES, STICKERS } from "./state";

export interface Slot {
  name: string;
  stickers: number[]; // sticker indices, in the order of the letters in `name`
}

const FACE_OF_STICKER = (i: number): Face => FACES[Math.floor(i / 9)];

function buildSlots(): Map<string, Slot> {
  const byPos = new Map<string, number[]>();
  for (const s of STICKERS) {
    const k = s.position.join(",");
    byPos.set(k, [...(byPos.get(k) ?? []), s.index]);
  }
  const out = new Map<string, Slot>();
  for (const stickers of byPos.values()) {
    if (stickers.length < 2) continue;
    // Name: U/D first, then F/B, then R/L — the usual way pieces are named.
    const order = "UDFBRL";
    stickers.sort((a, b) => order.indexOf(FACE_OF_STICKER(a)) - order.indexOf(FACE_OF_STICKER(b)));
    const name = stickers.map(FACE_OF_STICKER).join("");
    out.set(name, { name, stickers });
  }
  return out;
}

const SLOTS = buildSlots();

/** A slot by any spelling of its faces: "URF", "RUF" and "FUR" are the same slot. */
export function slot(name: string): Slot {
  const want = [...name].sort().join("");
  for (const s of SLOTS.values()) if ([...s.name].sort().join("") === want) return s;
  throw new Error(`No slot ${name}`);
}

export const EDGE_SLOTS = [...SLOTS.values()].filter((s) => s.stickers.length === 2);
export const CORNER_SLOTS = [...SLOTS.values()].filter((s) => s.stickers.length === 3);

/** Color of the center of a face (centers move with whole-cube turns). */
export function center(state: CubeState, f: Face): Face {
  return state[FACES.indexOf(f) * 9 + 4];
}

/** The right piece is in this slot, turned the right way. */
export function slotSolved(state: CubeState, s: Slot): boolean {
  return s.stickers.every((i) => state[i] === center(state, FACE_OF_STICKER(i)));
}

/** The right piece is in this slot, turned any way. */
export function slotHasRightPiece(state: CubeState, s: Slot): boolean {
  const want = s.stickers
    .map((i) => center(state, FACE_OF_STICKER(i)))
    .sort()
    .join("");
  const have = s.stickers
    .map((i) => state[i])
    .sort()
    .join("");
  return want === have;
}

export function faceOfSticker(i: number): Face {
  return FACE_OF_STICKER(i);
}

/** The slot holding the piece with these colors (any order). */
export function findPiece(state: CubeState, colors: readonly Face[]): Slot {
  const want = [...colors].sort().join("");
  const all = [...EDGE_SLOTS, ...CORNER_SLOTS];
  const found = all.find(
    (s) =>
      s.stickers
        .map((i) => state[i])
        .sort()
        .join("") === want,
  );
  if (!found) throw new Error(`No piece ${colors.join("")}`);
  return found;
}
