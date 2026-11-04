import { describe, expect, it } from "vitest";
import { type Face, applyMoves, scramble, solved } from "../src/cube";
import { type RGB, classify } from "../src/scan/classify";
import { sampleFace } from "../src/scan/sample";

function seeded(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

// Typical sticker colors as a phone camera sees them in good light.
const TRUE: Record<Face, RGB> = {
  U: [235, 235, 230],
  R: [190, 20, 35],
  F: [20, 150, 70],
  D: [240, 210, 20],
  L: [245, 105, 20],
  B: [20, 70, 170],
};

/** Simulate a room light: a color tint, overall brightness, a shadow gradient and noise. */
function photograph(
  state: Face[],
  light: { tint: RGB; bright: number; noise: number },
  random: () => number,
): RGB[] {
  return state.map((f, i) => {
    const shade = 1 - 0.25 * ((i % 9) / 8) * random(); // some stickers a bit in shadow
    return TRUE[f].map((v, k) => {
      const n = (random() - 0.5) * 2 * light.noise;
      return Math.max(0, Math.min(255, v * (light.tint[k] / 255) * light.bright * shade + n));
    }) as RGB;
  });
}

const LIGHTS = {
  daylight: { tint: [255, 255, 255] as RGB, bright: 1, noise: 8 },
  "warm bulb": { tint: [255, 215, 160] as RGB, bright: 0.85, noise: 10 },
  "cool LED": { tint: [215, 235, 255] as RGB, bright: 0.9, noise: 10 },
  "dim room": { tint: [255, 230, 200] as RGB, bright: 0.55, noise: 12 },
};

describe("color reading", () => {
  it.each(Object.entries(LIGHTS))("reads 50 real cubes correctly under %s", (_name, light) => {
    const random = seeded(11);
    let wrong = 0;
    for (let n = 0; n < 50; n++) {
      const state = applyMoves(solved(), scramble(25, random));
      const got = classify(photograph(state, light, random));
      wrong += got.filter((f, i) => f !== state[i]).length;
    }
    // At most 1 wrong sticker in 50 cubes; the check-and-fix screen catches the rest.
    expect(wrong).toBeLessThanOrEqual(1);
  });

  it("always gives exactly 9 of each color", () => {
    const random = seeded(3);
    const state = applyMoves(solved(), scramble(25, random));
    const got = classify(photograph(state, LIGHTS["dim room"], random));
    for (const f of "URFDLB") expect(got.filter((x) => x === f)).toHaveLength(9);
  });
});

describe("sampling a face from an image", () => {
  it("reads the 9 cells of a drawn face, ignoring black edges", () => {
    const W = 320,
      H = 240;
    const data = new Uint8ClampedArray(W * H * 4);
    const colors: RGB[] = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 0],
      [0, 255, 255],
      [255, 0, 255],
      [255, 255, 255],
      [128, 64, 0],
      [10, 200, 90],
    ];
    const size = H;
    const x0 = (W - size) / 2 + size * 0.15;
    const y0 = size * 0.15;
    const cell = (size * 0.7) / 3;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const c = Math.floor((x - x0) / cell);
        const r = Math.floor((y - y0) / cell);
        const lx = (x - x0) % cell;
        const ly = (y - y0) % cell;
        const inside =
          c >= 0 && c < 3 && r >= 0 && r < 3 && lx > 4 && ly > 4 && lx < cell - 4 && ly < cell - 4;
        const col = inside ? colors[r * 3 + c] : [0, 0, 0];
        data.set([...col, 255], (y * W + x) * 4);
      }
    expect(sampleFace({ width: W, height: H, data })).toEqual(colors);
  });
});
