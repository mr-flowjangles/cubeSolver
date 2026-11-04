// Beginner levels. Content is data; the lesson screen reads it.
// Level list decided by Claude under Rob's standing go-ahead (2026-11-04); see docs/02-levels.md.

import { ALGS } from "../solver/beginner";

export interface Level {
  id: string;
  number: number;
  title: string;
  goal: string; // one line: what "passed" means
  teach: string[]; // short bullets
  algs: { name: string; moves: string }[];
  /** Which solving method the level's Hint, Show me and practice cube use. */
  method: "beginner" | "cfop";
  /** Stage the player must finish to pass. Missing for notation, PLL and full-solve levels. */
  stage?: string;
  kind: "notation" | "stage" | "full" | "pll";
}

export const BEGINNER_LEVELS: Level[] = [
  {
    id: "meet",
    number: 0,
    title: "Meet the cube",
    goal: "Make each turn the app asks for.",
    kind: "notation",
    method: "beginner",
    teach: [
      "Centers never move. They tell you each face's color.",
      "Each face has a letter: U up, D down, R right, L left, F front, B back.",
      "A letter alone turns that face clockwise, as if you are looking at it.",
      "A ' (prime) turns it counter-clockwise. A 2 turns it twice.",
      "y turns the whole cube, like U.",
    ],
    algs: [],
  },
  {
    id: "cross",
    number: 1,
    title: "White cross",
    goal: "Make a white plus on the bottom, edges matching the side centers.",
    kind: "stage",
    method: "beginner",
    stage: "cross",
    teach: [
      "Hold white on the bottom, green in front.",
      "Find a white edge. Its other color must sit next to the same-color center.",
      "Turn it into place without breaking edges already done.",
      "No sequence to learn here — use Hint if stuck.",
    ],
    algs: [],
  },
  {
    id: "corners",
    number: 2,
    title: "White corners",
    goal: "Finish the white layer.",
    kind: "stage",
    method: "beginner",
    stage: "corners",
    teach: [
      "Find a white corner in the top layer.",
      "Turn the top until it sits above its spot, at front-right.",
      "Repeat the sequence until the corner drops in, white side down.",
      "Corner stuck in the bottom? Do the sequence once to lift it out.",
    ],
    algs: [{ name: "Corner", moves: ALGS.cornerUp }],
  },
  {
    id: "middle",
    number: 3,
    title: "Middle edges",
    goal: "Finish the first two layers.",
    kind: "stage",
    method: "beginner",
    stage: "middle",
    teach: [
      "Find a top edge with no yellow.",
      "Turn the top so its front color matches the front center.",
      "Its top color says where it goes: right or left.",
      "Edge stuck in the middle the wrong way? Insert any edge there to pop it out.",
    ],
    algs: [
      { name: "Edge right", moves: ALGS.middleRight },
      { name: "Edge left", moves: ALGS.middleLeft },
    ],
  },
  {
    id: "yellowCross",
    number: 4,
    title: "Yellow cross",
    goal: "Make a yellow plus on top.",
    kind: "stage",
    method: "beginner",
    stage: "yellowCross",
    teach: [
      "Look at the yellow on top: a dot, an L, or a line.",
      "Dot: do the sequence once to get an L.",
      "L: hold it at back-left, then do the sequence.",
      "Line: hold it left-to-right, then do the sequence.",
    ],
    algs: [{ name: "Yellow cross", moves: ALGS.yellowCross }],
  },
  {
    id: "yellowEdges",
    number: 5,
    title: "Yellow edges",
    goal: "Match every top edge with its side center.",
    kind: "stage",
    method: "beginner",
    stage: "yellowEdges",
    teach: [
      "Turn the top until two edges match their centers.",
      "Matching edges side by side: hold them at back and right.",
      "Matching edges opposite: do the sequence once, then try again.",
    ],
    algs: [{ name: "Swap edges", moves: ALGS.yellowEdges }],
  },
  {
    id: "yellowCornersPlace",
    number: 6,
    title: "Yellow corners into place",
    goal: "Put every top corner in its right spot. Twisted is fine.",
    kind: "stage",
    method: "beginner",
    stage: "yellowCornersPlace",
    teach: [
      "A corner is in place when its three colors match the three centers around it.",
      "Hold a corner that is in place at front-right.",
      "Do the sequence. Repeat until all four are in place.",
      "None in place? Do the sequence once from anywhere.",
    ],
    algs: [{ name: "Cycle corners", moves: ALGS.yellowCornersPlace }],
  },
  {
    id: "yellowCornersTwist",
    number: 7,
    title: "Twist yellow corners",
    goal: "Solve the cube!",
    kind: "stage",
    method: "beginner",
    stage: "yellowCornersTwist",
    teach: [
      "Hold a twisted corner at front-right.",
      "Repeat the sequence until yellow is on top. The bottom gets messy — that's normal.",
      "Turn only the top (U) to bring the next twisted corner to front-right.",
      "Never turn the whole cube during this step.",
    ],
    algs: [{ name: "Twist", moves: ALGS.twist }],
  },
  {
    id: "full",
    number: 8,
    title: "Full solve",
    goal: "Solve a fully scrambled cube.",
    kind: "full",
    method: "beginner",
    teach: [
      "Everything you've learned, start to finish.",
      "Use Hint if you're stuck — it tells you the next step.",
    ],
    algs: [],
  },
];

/** Turns the notation level asks for, in order. */
export const NOTATION_DRILL = ["R", "U", "R'", "U'", "F", "F'", "L", "D'", "y", "B"];
