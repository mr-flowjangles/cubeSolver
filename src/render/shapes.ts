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

/** The same shape as a small inline SVG, for buttons and the flat cube map. */
export function shapeSvg(shape: Shape, color: string): string {
  const pts = (list: [number, number][]) => list.map(([x, y]) => `${x},${y}`).join(" ");
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 4.2 : 10;
    return [12 + Math.cos(a) * r, 12 + Math.sin(a) * r] as [number, number];
  });
  const body: Record<Shape, string> = {
    circle: `<circle cx="12" cy="12" r="8.5"/>`,
    triangle: `<polygon points="${pts([
      [12, 2],
      [21.5, 19.5],
      [2.5, 19.5],
    ])}"/>`,
    square: `<rect x="4.5" y="4.5" width="15" height="15"/>`,
    diamond: `<polygon points="${pts([
      [12, 2],
      [20, 12],
      [12, 22],
      [4, 12],
    ])}"/>`,
    cross: `<path d="M5 3 L12 10 L19 3 L21 5 L14 12 L21 19 L19 21 L12 14 L5 21 L3 19 L10 12 L3 5 Z"/>`,
    star: `<polygon points="${pts(star)}"/>`,
  };
  return `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="${color}" aria-hidden="true">${body[shape]}</svg>`;
}
