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
    title: "Learn the controls",
    goal: "Learn to turn the cube. Swipe where the arrow shows.",
    kind: "notation",
    method: "beginner",
    teach: [],
    algs: [],
  },
  {
    id: "cross",
    number: 1,
    title: "White cross",
    goal: "Put the 4 white edge pieces on the bottom, making a white plus. Each one sits under the side of its other color.",
    kind: "stage",
    method: "beginner",
    stage: "cross",
    teach: [
      "<strong>Hold it:</strong> white center on the bottom, yellow center on top.",
      "<strong>Edge piece:</strong> a piece with 2 colors. Four of them have white.",
      "<strong>Center:</strong> the middle square of a side. It never moves.",
      "<strong>Part 1, the daisy:</strong> bring the 4 white edges to the top, around yellow, white facing up.",
      "<strong>Part 2:</strong> turn the top until an edge's other color matches the center below it.",
      "Then turn that side twice. The edge drops to the bottom in the right spot.",
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
      "Turn only the top to bring the next twisted corner to front-right.",
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

/**
 * Level 0, part 1: ten swipes, in order. Written for a 10-year-old; no letters, the arrow shows
 * each move. `say` is what to do next; `did` is the line printed after the move is made.
 * `move` is the standard letter, used only by the app.
 */
export const NOTATION_STEPS: { move: string; say: string; did: string }[] = [
  { move: "R", say: "Swipe the right side up.", did: "The right side went up." },
  { move: "U", say: "Swipe the top to the left.", did: "The top went left." },
  { move: "R'", say: "Swipe the right side down.", did: "The right side went down." },
  { move: "U'", say: "Swipe the top to the right.", did: "The top went right." },
  { move: "F", say: "Turn the front the way a clock goes.", did: "The front turned like a clock." },
  {
    move: "F'",
    say: "Turn the front backwards, the other way round the clock.",
    did: "The front turned backwards.",
  },
  { move: "L", say: "Swipe the left side down.", did: "The left side went down." },
  { move: "D'", say: "Swipe the bottom to the left.", did: "The bottom went left." },
  {
    move: "y",
    say: "Turn the whole cube: swipe next to the cube, to the left.",
    did: "The whole cube turned. Now you see a new side.",
  },
  {
    move: "B",
    say: "Turn the back. You can't see it, so swipe where the arrow shows.",
    did: "The back turned.",
  },
];
export const NOTATION_DRILL = NOTATION_STEPS.map((s) => s.move);

/** Level 0, part 2: the trick. This sequence done 6 times brings any cube back to where it started. */
export const MAGIC = ["R", "U", "R'", "U'"];
export const MAGIC_ROUNDS = 6;

/** What each move of the trick did, printed after it's made. */
export const MAGIC_DID: Record<string, string> = {
  R: "The right side went up.",
  U: "The top went left.",
  "R'": "The right side went down.",
  "U'": "The top went right.",
};
