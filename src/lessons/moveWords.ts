// One move in plain words, for a player who can't read the letters.
// Directions are as seen with the cube held in front of you, matching the arrows (docs/02-levels.md → Controls).

import type { Move } from "../cube";

const WORDS: Record<string, [string, string]> = {
  // [clockwise, the other way]
  R: ["The right side goes up.", "The right side goes down."],
  L: ["The left side goes down.", "The left side goes up."],
  U: ["The top goes left.", "The top goes right."],
  D: ["The bottom goes right.", "The bottom goes left."],
  F: ["The front turns like a clock.", "The front turns backwards, against the clock."],
  B: [
    "The back turns. Swipe where the arrow shows.",
    "The back turns the other way. Swipe where the arrow shows.",
  ],
  M: ["The middle goes down.", "The middle goes up."],
  E: ["The middle row goes right.", "The middle row goes left."],
  S: ["The middle slice turns like a clock.", "The middle slice turns against the clock."],
  x: ["The whole cube tips up.", "The whole cube tips down."],
  y: ["The whole cube turns left.", "The whole cube turns right."],
  z: ["The whole cube turns like a clock.", "The whole cube turns against the clock."],
};

/** "R" → "The right side goes up." Half turns say "twice". Unknown moves fall back to the arrow. */
export function moveWords(m: Move): string {
  const w = WORDS[m[0]];
  if (!w) return "Swipe where the arrow shows.";
  if (m.endsWith("2")) return `${w[0].slice(0, -1)}, twice.`;
  return m.endsWith("'") ? w[1] : w[0];
}
