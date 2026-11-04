// Sticker colors and the ADA support shapes (one shape per color).
// Standard color scheme: white top, green front, red right.

import type { Face } from "../cube";

export const STICKER_COLOR: Record<Face, string> = {
  U: "#ffffff",
  R: "#d0121b",
  F: "#0a9b48",
  D: "#ffd500",
  L: "#ff6a00",
  B: "#0046ad",
};

export const COLOR_NAME: Record<Face, string> = {
  U: "white",
  R: "red",
  F: "green",
  D: "yellow",
  L: "orange",
  B: "blue",
};
