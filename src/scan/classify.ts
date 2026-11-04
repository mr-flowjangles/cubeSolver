// Turns 54 sampled sticker colors into a cube state.
//
// How: the six center stickers are known (white top, green front, ...), so their
// sampled colors show what each cube color looks like under the player's own light.
// Every other sticker gets the color it is closest to, in a color space that matches
// how people see differences (CIE Lab). A cube has exactly 9 of each color, so the
// closest matches are handed out first and no color is given out more than 9 times.

import { type Face, FACES, findProblems } from "../cube";

export type RGB = [number, number, number];

function toLinear(c: number) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function rgbToLab([r, g, b]: RGB): [number, number, number] {
  const R = toLinear(r),
    G = toLinear(g),
    B = toLinear(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x),
    fy = f(y),
    fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * Distance between two colors. Lightness counts for less than hue,
 * because shadows change lightness far more than they change hue.
 */
export function colorDistance(a: RGB, b: RGB): number {
  const [l1, a1, b1] = rgbToLab(a);
  const [l2, a2, b2] = rgbToLab(b);
  return Math.hypot((l1 - l2) * 0.5, a1 - a2, b1 - b2);
}

/** Give each sticker its closest color, closest pairs first, at most 9 of each color. */
function assign(samples: readonly RGB[], ref: Map<Face, RGB>): Face[] {
  const out: (Face | null)[] = samples.map((_, i) =>
    i % 9 === 4 ? FACES[Math.floor(i / 9)] : null,
  );
  const left = new Map<Face, number>(FACES.map((f) => [f, 8]));
  const pairs: { i: number; f: Face; d: number }[] = [];
  samples.forEach((c, i) => {
    if (i % 9 === 4) return;
    for (const f of FACES) pairs.push({ i, f, d: colorDistance(c, ref.get(f)!) });
  });
  pairs.sort((x, y) => x.d - y.d);
  for (const { i, f } of pairs) {
    if (out[i] || left.get(f)! === 0) continue;
    out[i] = f;
    left.set(f, left.get(f)! - 1);
  }
  return out as Face[];
}

/** samples[i] is the color seen at sticker i (state order: U R F D L B, 9 each). */
export function classify(samples: readonly RGB[]): Face[] {
  if (samples.length !== 54) throw new Error("Need 54 samples");
  // Start from the centers, then refine: each color becomes the average of the
  // stickers it was given, which smooths out one oddly lit center.
  let ref = new Map<Face, RGB>(FACES.map((f, k) => [f, samples[k * 9 + 4]]));
  let out = assign(samples, ref);
  for (let round = 0; round < 4; round++) {
    ref = new Map(
      FACES.map((f) => {
        const mine = samples.filter((_, i) => out[i] === f);
        const avg = [0, 1, 2].map((k) => mine.reduce((t, c) => t + c[k], 0) / mine.length);
        return [f, avg as RGB];
      }),
    );
    const next = assign(samples, ref);
    if (next.every((f, i) => f === out[i])) break;
    out = next;
  }
  return repair(samples, ref, out);
}

/**
 * If the reading has impossible pieces, try swapping the colors of the stickers it was
 * least sure about (usually red and orange) until every piece is a real one.
 */
function repair(samples: readonly RGB[], ref: Map<Face, RGB>, state: Face[]): Face[] {
  const problems = (s: Face[]) => findProblems(s).length;
  if (!problems(state)) return state;
  const margin = (i: number) => {
    const d = FACES.map((f) => colorDistance(samples[i], ref.get(f)!)).sort((a, b) => a - b);
    return d[1] - d[0];
  };
  const unsure = state
    .map((_, i) => i)
    .filter((i) => i % 9 !== 4)
    .sort((a, b) => margin(a) - margin(b))
    .slice(0, 10);
  let best = state;
  let bestCount = problems(state);
  for (let round = 0; round < 3 && bestCount > 0; round++) {
    let improved = false;
    for (let a = 0; a < unsure.length; a++)
      for (let b = a + 1; b < unsure.length; b++) {
        const i = unsure[a],
          j = unsure[b];
        if (best[i] === best[j]) continue;
        const trial = [...best];
        [trial[i], trial[j]] = [trial[j], trial[i]];
        const n = problems(trial);
        if (n < bestCount) {
          best = trial;
          bestCount = n;
          improved = true;
        }
      }
    if (!improved) break;
  }
  return best;
}
