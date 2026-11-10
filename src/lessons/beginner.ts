// Beginner levels. Content is data; the lesson screen reads it.
// Level list decided by Claude under Rob's standing go-ahead (2026-11-04); see docs/02-levels.md.

import { ALG_NAMES as N, ALGS } from "../solver/beginner";

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
      "<strong>Edge piece:</strong> a piece with 2 colors; four have white. <strong>Center:</strong> the middle square of a side; it never moves.",
      "<strong>Part 1, the daisy:</strong> bring the white edges to the top, around yellow, white facing up. One already on the bottom, under its matching center, can stay.",
      "In Part 1, before you turn any side, turn the top so the spot above that side has no white edge facing up yet.",
      "White edge on the bottom: turn that side twice. It comes up to the top.",
      "White edge in the middle row: turn the whole cube so it's at front-right, the front's right edge. Its white faces one side; turn the other side it touches, so the edge goes up, white facing up. Wrong way? Turn it back, then the other way.",
      "White facing out to the side, in the top or bottom row: turn that side once. It moves to the middle row.",
      "Keep going with that same edge until it's on top, white facing up. Then find the next one.",
      "Can't see a white edge? Turn the whole cube to look at the other sides.",
      "<strong>Part 2:</strong> turn the top until an edge's other color matches the center below it. Turn the whole cube so that side faces you, then turn the front twice. The edge drops to the bottom in the right spot.",
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
      "<strong>Front-right:</strong> the column nearest you on the right. Its top corner sits right above its bottom corner.",
      "Find a white corner in the top layer, the layer next to yellow.",
      "Its spot is the bottom corner between the centers of its other two colors.",
      "Turn the top until the corner sits right above its spot.",
      "Turn the whole cube so that corner is at front-right.",
      "Repeat the sequence until the corner you're placing drops into its spot, white side down.",
      "No white corner left in the top layer, but one on the bottom is in the wrong spot or turned the wrong way? Turn the whole cube so it's at front-right, then do the sequence once to lift it out.",
    ],
    algs: [{ name: N.cornerUp, moves: ALGS.cornerUp }],
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
      "Turn the top until its side color matches the center below it.",
      "Turn the whole cube so that side is in front.",
      "Its top color matches the center on the right side? Do Edge right. The center on the left side? Do Edge left.",
      "No edge on top fits? One is stuck in the middle: in the wrong middle spot, or in its spot but flipped. Turn the whole cube so it's at front-right, then do Edge right once. It pops up to the top.",
    ],
    algs: [
      { name: N.middleRight, moves: ALGS.middleRight },
      { name: N.middleLeft, moves: ALGS.middleLeft },
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
      "Look at the yellow edges on top, not the corners: a dot, an L, or a line.",
      "Dot: do the sequence once to get an L.",
      "L: turn the top so the L's two edges are at the back and the left. Do the sequence. It turns into a line.",
      "Line: turn the top so it goes left-to-right. Do the sequence. Now it's a cross.",
    ],
    algs: [{ name: N.yellowCross, moves: ALGS.yellowCross }],
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
      "Matching edges side by side: turn the whole cube so they're at the back and the right. Then do the sequence.",
      "Matching edges opposite: do the sequence once, then try again.",
    ],
    algs: [{ name: N.yellowEdges, moves: ALGS.yellowEdges }],
  },
  {
    id: "yellowCornersPlace",
    number: 6,
    title: "Yellow corners into place",
    goal: "Put every top corner in its right spot. It can still be turned the wrong way; the next level fixes that.",
    kind: "stage",
    method: "beginner",
    stage: "yellowCornersPlace",
    teach: [
      "A corner is in its right spot when it has the same three colors as the three centers around it. The colors don't have to face the right way yet.",
      "Turn the whole cube so a corner in its right spot is at front-right.",
      "Do the sequence. Repeat until all four are in their right spots.",
      "None in its right spot? Do the sequence once from anywhere.",
    ],
    algs: [{ name: N.yellowCornersPlace, moves: ALGS.yellowCornersPlace }],
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
      "A twisted corner has its yellow facing a side, not up.",
      "To start, turn the whole cube so a twisted corner is at front-right.",
      "Do the whole sequence, all 4 moves, again and again. Check only after all 4 moves: stop when that corner's yellow is on top. The bottom gets messy — that's normal.",
      "Turn only the top to bring the next twisted corner to front-right.",
      "Once you've started, never turn the whole cube again.",
      "All four corners have yellow on top? Turn the top to line it up. Solved!",
    ],
    algs: [{ name: N.twist, moves: ALGS.twist }],
  },
  {
    id: "full",
    number: 8,
    title: "Full solve",
    goal: "Solve a fully scrambled cube.",
    kind: "full",
    method: "beginner",
    teach: [
      "Everything you've learned, start to finish. Each level's sequence is below.",
      "1 · White cross: make the daisy around yellow, then turn each white edge down.",
      "2 · White corners: corner above its spot, whole cube so it's front-right, Corner until it drops in. Stuck in the bottom? Corner once at front-right lifts it out.",
      "3 · Middle edges: match a top edge to its center, turn it to the front, then Edge right or Edge left. None fits? Edge right at the stuck spot pops it out.",
      "4 · Yellow cross: dot, L or line on top, then Yellow cross until it's a plus.",
      "5 · Yellow edges: two edges matching, at the back and the right, then Swap edges. Opposite each other? Swap edges once, then look again.",
      "6 · Yellow corners: a corner in its right spot at front-right, then Move corners. None? Move corners once from anywhere.",
      "7 · Twist: Twist, all 4 moves at a time, until that corner's yellow is up; turn only the top to the next corner; then line up the top.",
      "Use Hint if you're stuck — it tells you the next step.",
    ],
    algs: [
      { name: N.cornerUp, moves: ALGS.cornerUp },
      { name: N.middleRight, moves: ALGS.middleRight },
      { name: N.middleLeft, moves: ALGS.middleLeft },
      { name: N.yellowCross, moves: ALGS.yellowCross },
      { name: N.yellowEdges, moves: ALGS.yellowEdges },
      { name: N.yellowCornersPlace, moves: ALGS.yellowCornersPlace },
      { name: N.twist, moves: ALGS.twist },
    ],
  },
];

/**
 * Level 0, part 1: eleven swipes, in order. Written for a 10-year-old; no letters, the arrow shows
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
  {
    move: "y'",
    say: "Turn the whole cube back: swipe next to the cube, to the right.",
    did: "The whole cube turned back.",
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
