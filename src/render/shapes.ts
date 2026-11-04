// Draws the ADA support shapes with canvas paths, not font characters,
// so they look the same on every phone (iOS turns some symbols into color emoji).

import type { Face } from "../cube";

export type Shape = "circle" | "triangle" | "square" | "diamond" | "cross" | "star";

/** One shape per color. Agreed 2026-11-04. */
export const ADA_SHAPE: Record<Face, Shape> = {
  R: "circle",
  L: "triangle",
  F: "square",
  B: "diamond",
  U: "cross",
  D: "star",
};

/** Draw a shape centered at (cx, cy) fitting in a box of size r*2. */
export function drawShape(
  g: CanvasRenderingContext2D,
  shape: Shape,
  cx: number,
  cy: number,
  r: number,
) {
  g.beginPath();
  switch (shape) {
    case "circle":
      g.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
      break;
    case "triangle":
      g.moveTo(cx, cy - r);
      g.lineTo(cx + r * 0.95, cy + r * 0.75);
      g.lineTo(cx - r * 0.95, cy + r * 0.75);
      break;
    case "square":
      g.rect(cx - r * 0.75, cy - r * 0.75, r * 1.5, r * 1.5);
      break;
    case "diamond":
      g.moveTo(cx, cy - r);
      g.lineTo(cx + r * 0.8, cy);
      g.lineTo(cx, cy + r);
      g.lineTo(cx - r * 0.8, cy);
      break;
    case "cross": {
      const w = r * 0.32;
      for (const a of [Math.PI / 4, -Math.PI / 4]) {
        const dx = Math.cos(a),
          dy = Math.sin(a),
          px = -dy * w,
          py = dx * w;
        g.moveTo(cx - dx * r + px, cy - dy * r + py);
        g.lineTo(cx + dx * r + px, cy + dy * r + py);
        g.lineTo(cx + dx * r - px, cy + dy * r - py);
        g.lineTo(cx - dx * r - px, cy - dy * r - py);
        g.closePath();
      }
      break;
    }
    case "star":
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * 0.42 : r;
        g[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      break;
  }
  g.closePath();
  g.fill("nonzero");
}
