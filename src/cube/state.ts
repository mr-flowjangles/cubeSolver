// Cube state: the color of all 54 stickers.
// 9 stickers per face, faces in the order U, R, F, D, L, B (the layout most solvers use).
// Each sticker holds the face it belongs to when solved, so a solved cube is
// "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB".

export type Face = "U" | "R" | "F" | "D" | "L" | "B";
export type CubeState = readonly Face[];

export const FACES: readonly Face[] = ["U", "R", "F", "D", "L", "B"];

export type Vec3 = readonly [number, number, number];

/** Outward direction of each face. x = right, y = up, z = toward the viewer (front). */
export const FACE_NORMAL: Record<Face, Vec3> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

/**
 * Where sticker (row, col) of a face sits, as the position of its piece.
 * Rows and columns follow the standard flat cube map:
 * U seen from above with B at the top, D seen from below with F at the top,
 * side faces seen from outside with U at the top.
 */
function stickerPosition(face: Face, r: number, c: number): Vec3 {
  switch (face) {
    case "U":
      return [c - 1, 1, r - 1];
    case "R":
      return [1, 1 - r, 1 - c];
    case "F":
      return [c - 1, 1 - r, 1];
    case "D":
      return [c - 1, -1, 1 - r];
    case "L":
      return [-1, 1 - r, c - 1];
    case "B":
      return [1 - c, 1 - r, -1];
  }
}

export interface Sticker {
  index: number;
  face: Face;
  position: Vec3;
  normal: Vec3;
}

/** All 54 stickers, in state order. */
export const STICKERS: readonly Sticker[] = FACES.flatMap((face, f) =>
  Array.from({ length: 9 }, (_, i) => ({
    index: f * 9 + i,
    face,
    position: stickerPosition(face, Math.floor(i / 3), i % 3),
    normal: FACE_NORMAL[face],
  })),
);

const key = (p: Vec3, n: Vec3) => `${p.join(",")}|${n.join(",")}`;
const STICKER_BY_PLACE = new Map(STICKERS.map((s) => [key(s.position, s.normal), s.index]));

/** Index of the sticker at this piece position facing this direction. */
export function stickerAt(position: Vec3, normal: Vec3): number {
  const i = STICKER_BY_PLACE.get(key(position, normal));
  if (i === undefined) throw new Error(`No sticker at ${key(position, normal)}`);
  return i;
}

export function solved(): Face[] {
  return FACES.flatMap((f) => Array<Face>(9).fill(f));
}

export function isSolved(state: CubeState): boolean {
  for (let f = 0; f < 6; f++) {
    const c = state[f * 9 + 4];
    for (let i = 0; i < 9; i++) if (state[f * 9 + i] !== c) return false;
  }
  return true;
}

export function toString(state: CubeState): string {
  return state.join("");
}

export function fromString(text: string): Face[] {
  if (!/^[URFDLB]{54}$/.test(text)) throw new Error("Cube state must be 54 letters from URFDLB");
  return text.split("") as Face[];
}
