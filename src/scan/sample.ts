// Reads the 9 sticker colors of one face from a square camera image.
// The face fills a centered square (the framing guide); each sticker is read from
// the middle of its cell, away from the black edges, using the median so glare
// and specks don't skew it.

import type { RGB } from "./classify";

export interface ImageLike {
  width: number;
  height: number;
  data: ArrayLike<number>; // RGBA, row by row
}

/** Where the 3×3 guide sits, as a fraction of the square image. */
export const GUIDE = { inset: 0.15 } as const;

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export function sampleFace(img: ImageLike): RGB[] {
  const size = Math.min(img.width, img.height);
  const x0 = (img.width - size) / 2 + size * GUIDE.inset;
  const y0 = (img.height - size) / 2 + size * GUIDE.inset;
  const cell = (size * (1 - 2 * GUIDE.inset)) / 3;
  const half = cell * 0.2; // read the middle 40% of each cell
  const out: RGB[] = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const cx = x0 + cell * (c + 0.5);
      const cy = y0 + cell * (r + 0.5);
      const rs: number[] = [],
        gs: number[] = [],
        bs: number[] = [];
      const step = Math.max(1, Math.floor(half / 6));
      for (let y = Math.round(cy - half); y <= cy + half; y += step)
        for (let x = Math.round(cx - half); x <= cx + half; x += step) {
          const k = (Math.round(y) * img.width + Math.round(x)) * 4;
          rs.push(img.data[k]);
          gs.push(img.data[k + 1]);
          bs.push(img.data[k + 2]);
        }
      out.push([median(rs), median(gs), median(bs)]);
    }
  return out;
}
