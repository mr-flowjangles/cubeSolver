// No-LLM tutorial player (the kid test as plain code). Run by tests/tutorialPlayer.test.ts on every build.
// Solves cubes using ONLY the words in BEGINNER_LEVELS (src/lessons/beginner.ts) and the cube model.
// Every decision quotes the teach bullet it follows. The bullets are checked word for word at startup.
// If the words don't say what to do, the player STOPS ("words don't cover this"). No search, no guessing.
// STAGE_DONE is used only to grade each level after the player says it's finished.

import { readFileSync } from "node:fs";
import { BEGINNER_LEVELS } from "../src/lessons/beginner";
import {
  type CubeState,
  type Face,
  applyMoves,
  center,
  slot,
  slotSolved,
  slotHasRightPiece,
  scramble,
  solved,
  isSolved,
  COLOR_NAME,
} from "../src/cube";
import { STAGE_DONE } from "../src/solver/beginner";

const LESSON_TEXT = readFileSync(
  new URL("../src/lessons/beginner.ts", import.meta.url),
  "utf8",
).split("\n");

// ---------- Bullets: quoted word for word, checked at startup ----------

interface Bullet {
  level: number;
  text: string;
  line: number; // line in beginner.ts, found at startup
}
const ALL_BULLETS: Bullet[] = [];
function bullet(level: number, text: string): Bullet {
  const b = { level, text, line: -1 };
  ALL_BULLETS.push(b);
  return b;
}
export function checkBullets() {
  for (const b of ALL_BULLETS) {
    const lv = BEGINNER_LEVELS.find((l) => l.number === b.level);
    if (!lv) throw new Error(`Level ${b.level} missing`);
    if (!lv.teach.includes(b.text) && lv.goal !== b.text)
      throw new Error(`Bullet changed or missing in level ${b.level}: "${b.text}"`);
    const want = JSON.stringify(b.text);
    const i = LESSON_TEXT.findIndex((l) => l.includes(want));
    b.line = i + 1;
  }
}
const ref = (b: Bullet) => `src/lessons/beginner.ts:${b.line}`;

/** Sequence moves, read from the level's algs at runtime. */
function alg(level: number, name?: string): string {
  const lv = BEGINNER_LEVELS.find((l) => l.number === level)!;
  const a = name
    ? lv.algs.find((x) => x.name === name)
    : lv.algs.length === 1
      ? lv.algs[0]
      : undefined;
  if (!a) throw new Error(`Level ${level}: no sequence ${name ?? "(the sequence)"}`);
  return a.moves;
}

// ---------- Colors (from the cube model's color names) ----------
const colorLetter = (name: string) =>
  (Object.keys(COLOR_NAME) as Face[]).find((f) => COLOR_NAME[f] === name)!;
const WHITE = colorLetter("white");
const YELLOW = colorLetter("yellow");

// ---------- The cube a player holds ----------

export class Stop extends Error {
  constructor(
    public kind: "stopped" | "failed",
    public bullet: Bullet,
    public why: string,
    public state: string,
  ) {
    super(why);
  }
}

export class Cube {
  moves = 0;
  faceTurns = 0;
  constructor(public s: CubeState) {}
  turn(m: string) {
    this.s = applyMoves(this.s, m);
    this.moves++;
    if (!/^[xyz]/.test(m)) this.faceTurns++;
  }
  seq(text: string) {
    for (const m of text.trim().split(/\s+/)) this.turn(m);
  }
  center(f: Face) {
    return center(this.s, f);
  }
  /** Color on the face `f` side of the piece in slot `name`. */
  sticker(name: string, f: Face): Face {
    const sl = slot(name);
    return this.s[sl.stickers[sl.name.indexOf(f)]];
  }
  colors(name: string): Face[] {
    return slot(name).stickers.map((i) => this.s[i]);
  }
  /** Slot (spelled as given in `among`) that holds the piece with these colors. */
  find(colors: Face[], among: string[]): string {
    const want = [...colors].sort().join("");
    const hit = among.find((n) => this.colors(n).sort().join("") === want);
    if (!hit) throw new Error("piece not found");
    return hit;
  }
  stop(b: Bullet, why: string): never {
    throw new Stop("stopped", b, why, this.s.join(""));
  }
  fail(b: Bullet, why: string): never {
    throw new Stop("failed", b, why, this.s.join(""));
  }
}

const SIDES: Face[] = ["F", "R", "B", "L"];
const ALL_EDGES = ["UF", "UR", "UB", "UL", "FR", "RB", "BL", "LF", "DF", "DR", "DB", "DL"];
const TOP_CORNERS = ["URF", "UFL", "ULB", "UBR"];
const BOTTOM_CORNERS = ["DFR", "DLF", "DBL", "DRB"];
const TOP_EDGES = ["UF", "UR", "UB", "UL"];
const MID_EDGES = ["FR", "RB", "BL", "LF"];
const faces = (name: string) => [...name] as Face[];
const CAP = 60; // loop guard: a loop running this long means the words were followed but never finished

// =====================================================================
// Level 1 — White cross
// =====================================================================
const L1 = {
  hold: bullet(1, "<strong>Hold it:</strong> white center on the bottom, yellow center on top."),
  daisy: bullet(
    1,
    "<strong>Part 1, the daisy:</strong> bring the white edges to the top, around yellow, white facing up. One already on the bottom, under its matching center, can stay.",
  ),
  bottom: bullet(1, "White edge on the bottom: turn that side twice. It comes up to the top."),
  middle: bullet(
    1,
    "White edge in the middle row: its white faces one side. Turn the other side it touches, so the edge goes up, white facing up. Wrong way? Turn it back, then the other way.",
  ),
  out: bullet(
    1,
    "White facing out to the side, in the top or bottom row: turn that side once. It moves to the middle row.",
  ),
  clear: bullet(
    1,
    "Before you turn any side, turn the top so the spot above that side has no white edge facing up yet.",
  ),
  keep: bullet(
    1,
    "Keep going with that same edge until it's on top, white facing up. Then find the next one.",
  ),
  look: bullet(1, "Can't see a white edge? Turn the whole cube to look at the other sides."),
  part2: bullet(
    1,
    "<strong>Part 2:</strong> turn the top until an edge's other color matches the center below it.",
  ),
  drop: bullet(1, "Then turn that side twice. The edge drops to the bottom in the right spot."),
};

function level1(c: Cube) {
  // "<strong>Hold it:</strong> white center on the bottom, yellow center on top."
  // (The run starts the cube held this way; here we only check it.)
  if (c.center("D") !== WHITE || c.center("U") !== YELLOW)
    c.stop(L1.hold, "cube not held white down");

  const whiteUpOnTop = (e: string) => c.sticker(e, "U") === WHITE;
  // "<strong>Part 1, the daisy:</strong> bring the white edges to the top, around yellow, white facing up. One already on the bottom, under its matching center, can stay."
  const daisyDone = () => TOP_EDGES.every(whiteUpOnTop);

  // "Before you turn any side, turn the top so the spot above that side has no white edge facing up yet."
  const clearAbove = (side: Face) => {
    let n = 0;
    while (whiteUpOnTop("U" + side)) {
      if (n++ >= 4)
        c.stop(L1.clear, `every top spot has white facing up; cannot clear above ${side}`);
      c.turn("U");
    }
  };
  const turnSide = (side: Face, times: 1 | 2) => {
    clearAbove(side);
    for (let i = 0; i < times; i++) c.turn(side);
  };

  // The player sees the front. Edges they can work on: the 4 edges touching the front face.
  const FRONT_EDGES = ["UF", "FR", "DF", "LF"];
  let looks = 0;
  let guard = 0;
  // "Keep going with that same edge until it's on top, white facing up. Then find the next one."
  let following: Face[] | null = null;
  const needsWork = (n: string) =>
    c.colors(n).includes(WHITE) && !(n.includes("U") && whiteUpOnTop(n));
  while (!daisyDone()) {
    if (guard++ > CAP) c.fail(L1.daisy, "daisy loop did not finish");
    let e: string | undefined;
    if (following) {
      const at = c.find(following, ALL_EDGES);
      e = needsWork(at) ? at : undefined;
      if (!e) following = null;
    }
    if (!e) e = FRONT_EDGES.find(needsWork);
    if (e) following = c.colors(e);
    if (!e) {
      // "Can't see a white edge? Turn the whole cube to look at the other sides."
      if (looks++ >= 4)
        c.stop(L1.look, "turned all the way round, no white edge to work on, daisy not done");
      c.turn("y");
      continue;
    }
    looks = 0;
    const [a, b] = faces(e);
    const whiteFace = c.sticker(e, a) === WHITE ? a : b;
    const otherFace = whiteFace === a ? b : a;
    const colors = c.colors(e);
    if (e.includes("D") && whiteFace === "D") {
      // "White edge on the bottom: turn that side twice. It comes up to the top."
      turnSide(otherFace, 2);
    } else if (e.includes("U") || e.includes("D")) {
      // "White facing out to the side, in the top or bottom row: turn that side once. It moves to the middle row."
      turnSide(whiteFace, 1); // plainest: "once" = one clockwise quarter turn
    } else {
      // "White edge in the middle row: its white faces one side. Turn the other side it touches,
      //  so the edge goes up, white facing up. Wrong way? Turn it back, then the other way."
      const side = otherFace;
      clearAbove(side);
      c.turn(side); // first try: clockwise
      const wentUp = () => c.find(colors, ALL_EDGES) === "U" + side && whiteUpOnTop("U" + side);
      if (!wentUp()) {
        c.turn(side + "'"); // turn it back
        clearAbove(side); // the rule says before you turn any side
        c.turn(side + "'"); // then the other way
        if (!wentUp())
          c.fail(L1.middle, `edge did not go up white facing up after turning ${side} both ways`);
      }
    }
  }

  // "<strong>Part 2:</strong> turn the top until an edge's other color matches the center below it."
  guard = 0;
  while (TOP_EDGES.some((e) => whiteUpOnTop(e))) {
    if (guard++ > CAP) c.fail(L1.part2, "part 2 loop did not finish");
    const match = () =>
      TOP_EDGES.find(
        (e) => whiteUpOnTop(e) && c.sticker(e, e[1] as Face) === c.center(e[1] as Face),
      );
    let n = 0;
    while (!match()) {
      if (n++ >= 4) c.stop(L1.part2, "no top turn makes a daisy edge match the center below it");
      c.turn("U");
    }
    // "Then turn that side twice. The edge drops to the bottom in the right spot."
    const side = match()![1] as Face;
    c.turn(side);
    c.turn(side);
  }
}

// =====================================================================
// Level 2 — White corners
// =====================================================================
const L2 = {
  frontRight: bullet(
    2,
    "<strong>Front-right:</strong> the column nearest you on the right. Its top corner sits right above its bottom corner.",
  ),
  find: bullet(2, "Find a white corner in the top layer, the layer next to yellow."),
  spot: bullet(2, "Its spot is the bottom corner between the centers of its other two colors."),
  above: bullet(2, "Turn the top until the corner sits right above its spot."),
  whole: bullet(2, "Turn the whole cube so that corner is at front-right."),
  repeat: bullet(2, "Repeat the sequence until the corner drops in, white side down."),
  lift: bullet(
    2,
    "No white corner left in the top layer, but one on the bottom is in the wrong spot or turned the wrong way? Turn the whole cube so it's at front-right, then do the sequence once to lift it out.",
  ),
};

function level2(c: Cube) {
  const SEQ = alg(2);
  let guard = 0;
  for (;;) {
    if (guard++ > CAP) c.fail(L2.find, "corner loop did not finish");
    // "Find a white corner in the top layer, the layer next to yellow."
    const top = TOP_CORNERS.find((n) => c.colors(n).includes(WHITE));
    if (top) {
      const colors = c.colors(top);
      const others = colors
        .filter((x) => x !== WHITE)
        .sort()
        .join("");
      // "Its spot is the bottom corner between the centers of its other two colors."
      // "Turn the top until the corner sits right above its spot."
      const aboveSpot = () => {
        const at = c.find(colors, TOP_CORNERS);
        const sides = faces(at).filter((f) => f !== "U");
        return (
          sides
            .map((f) => c.center(f))
            .sort()
            .join("") === others
        );
      };
      let n = 0;
      while (!aboveSpot()) {
        if (n++ >= 4) c.stop(L2.above, "no top turn puts the corner above a spot with its colors");
        c.turn("U");
      }
      // "Turn the whole cube so that corner is at front-right."
      // "<strong>Front-right:</strong> ... Its top corner sits right above its bottom corner."
      n = 0;
      while (c.find(colors, TOP_CORNERS) !== "URF") {
        if (n++ >= 4) c.fail(L2.whole, "could not bring corner to front-right");
        c.turn("y");
      }
      // "Repeat the sequence until the corner drops in, white side down."
      n = 0;
      const droppedIn = () =>
        c.colors("DFR").sort().join("") === [...colors].sort().join("") &&
        c.sticker("DFR", "D") === WHITE;
      while (!droppedIn()) {
        if (n++ >= 12)
          c.fail(L2.repeat, "corner never dropped in white side down after 12 sequences");
        c.seq(SEQ);
      }
      continue;
    }
    // "A white corner on the bottom in the wrong spot, or turned the wrong way? Turn the whole cube so
    //  it's at front-right, then do the sequence once to lift it out."
    const wrong = BOTTOM_CORNERS.find(
      (n) => c.colors(n).includes(WHITE) && !slotSolved(c.s, slot(n)),
    );
    if (!wrong) return; // goal: "Finish the white layer." — nothing left to do
    const colors = c.colors(wrong);
    let n = 0;
    while (c.find(colors, BOTTOM_CORNERS) !== "DFR") {
      if (n++ >= 4) c.fail(L2.lift, "could not bring bottom corner to front-right");
      c.turn("y");
    }
    c.seq(SEQ);
  }
}

// =====================================================================
// Level 3 — Middle edges
// =====================================================================
const L3 = {
  find: bullet(3, "Find a top edge with no yellow."),
  match: bullet(3, "Turn the top until its side color matches the center below it."),
  whole: bullet(3, "Turn the whole cube so that side is in front."),
  which: bullet(
    3,
    "Its top color matches the center on the right side? Do Edge right. The center on the left side? Do Edge left.",
  ),
  stuck: bullet(
    3,
    "No edge on top fits? One is stuck in the middle: in the wrong middle spot, or in its spot but flipped. Turn the whole cube so it's at front-right, then do Edge right once. It pops up to the top.",
  ),
};

function level3(c: Cube) {
  const RIGHT = alg(3, "Edge right");
  const LEFT = alg(3, "Edge left");
  let guard = 0;
  for (;;) {
    if (guard++ > CAP) c.fail(L3.find, "middle-edge loop did not finish");
    // "Find a top edge with no yellow."
    const e = TOP_EDGES.find((n) => !c.colors(n).includes(YELLOW));
    if (e) {
      const colors = c.colors(e);
      const sideColor = c.sticker(e, e[1] as Face);
      const topColor = c.sticker(e, "U");
      // "Turn the top until its side color matches the center below it."
      const at = () => c.find(colors, TOP_EDGES);
      let n = 0;
      while (c.center(at()[1] as Face) !== sideColor) {
        if (n++ >= 4) c.fail(L3.match, "side color never matched");
        c.turn("U");
      }
      // "Turn the whole cube so that side is in front."
      n = 0;
      while (at() !== "UF") {
        if (n++ >= 4) c.fail(L3.whole, "could not bring edge to front");
        c.turn("y");
      }
      // "Its top color matches the center on the right side? Do Edge right. The center on the left side? Do Edge left."
      if (topColor === c.center("R")) c.seq(RIGHT);
      else if (topColor === c.center("L")) c.seq(LEFT);
      else c.stop(L3.which, "top color matches neither the right nor the left center");
      continue;
    }
    // "No edge on top fits? One is stuck in the middle. Turn the whole cube so it's at front-right,
    //  then do Edge right once. It pops up to the top."
    const stuck = MID_EDGES.find((n) => !slotSolved(c.s, slot(n)));
    if (!stuck) return; // goal: "Finish the first two layers."
    const colors = c.colors(stuck);
    let n = 0;
    while (c.find(colors, MID_EDGES) !== "FR") {
      if (n++ >= 4) c.fail(L3.stuck, "could not bring stuck edge to front-right");
      c.turn("y");
    }
    c.seq(RIGHT);
  }
}

// =====================================================================
// Level 4 — Yellow cross
// =====================================================================
const L4 = {
  look: bullet(4, "Look at the yellow edges on top, not the corners: a dot, an L, or a line."),
  dot: bullet(4, "Dot: do the sequence once to get an L."),
  L: bullet(
    4,
    "L: turn the top so the L's two edges are at the back and the left. Do the sequence. It turns into a line.",
  ),
  line: bullet(
    4,
    "Line: turn the top so it goes left-to-right. Do the sequence. Now it's a cross.",
  ),
  goal: bullet(4, "Make a yellow plus on top."),
};

function level4(c: Cube) {
  const SEQ = alg(4);
  const up = (e: string) => c.sticker(e, "U") === YELLOW;
  let guard = 0;
  for (;;) {
    if (guard++ > CAP) c.fail(L4.look, "yellow cross loop did not finish");
    // "Look at the yellow edges on top, not the corners: a dot, an L, or a line."
    const ys = TOP_EDGES.filter(up);
    if (ys.length === 4) return; // goal: "Make a yellow plus on top."
    if (ys.length === 0) {
      // "Dot: do the sequence once to get an L."
      c.seq(SEQ);
      continue;
    }
    if (ys.length !== 2)
      c.stop(L4.look, `${ys.length} yellow edges on top: not a dot, an L, or a line`);
    const opposite = (up("UF") && up("UB")) || (up("UL") && up("UR"));
    let n = 0;
    if (!opposite) {
      // "L: turn the top so the L's two edges are at the back and the left. Do the sequence. It turns into a line."
      while (!(up("UB") && up("UL"))) {
        if (n++ >= 4) c.fail(L4.L, "could not put the L at back and left");
        c.turn("U");
      }
      c.seq(SEQ);
    } else {
      // "Line: turn the top so it goes left-to-right. Do the sequence. Now it's a cross."
      while (!(up("UL") && up("UR"))) {
        if (n++ >= 4) c.fail(L4.line, "could not turn line left-to-right");
        c.turn("U");
      }
      c.seq(SEQ);
    }
  }
}

// =====================================================================
// Level 5 — Yellow edges
// =====================================================================
const L5 = {
  turn: bullet(5, "Turn the top until two edges match their centers."),
  side: bullet(
    5,
    "Matching edges side by side: turn the whole cube so they're at the back and the right. Then do the sequence.",
  ),
  opp: bullet(5, "Matching edges opposite: do the sequence once, then try again."),
};

function level5(c: Cube) {
  const SEQ = alg(5);
  const matches = (e: string) => c.sticker(e, e[1] as Face) === c.center(e[1] as Face);
  let guard = 0;
  for (;;) {
    if (guard++ > CAP) c.fail(L5.turn, "yellow edges loop did not finish");
    // "Turn the top until two edges match their centers."
    let n = 0;
    while (TOP_EDGES.filter(matches).length < 2) {
      if (n++ >= 4) c.stop(L5.turn, "no top turn makes two edges match their centers");
      c.turn("U");
    }
    const m = TOP_EDGES.filter(matches);
    if (m.length === 4) return; // goal: "Match every top edge with its side center."
    if (m.length !== 2) c.stop(L5.turn, `${m.length} edges match: words cover two (or all)`);
    const opposite = (matches("UF") && matches("UB")) || (matches("UL") && matches("UR"));
    if (opposite) {
      // "Matching edges opposite: do the sequence once, then try again."
      c.seq(SEQ);
      continue;
    }
    // "Matching edges side by side: turn the whole cube so they're at the back and the right. Then do the sequence."
    n = 0;
    while (!(matches("UB") && matches("UR"))) {
      if (n++ >= 4) c.fail(L5.side, "could not put matching edges at back and right");
      c.turn("y");
    }
    c.seq(SEQ);
  }
}

// =====================================================================
// Level 6 — Yellow corners into place
// =====================================================================
const L6 = {
  def: bullet(
    6,
    "A corner is in its right spot when it has the same three colors as the three centers around it. The colors don't have to face the right way yet.",
  ),
  whole: bullet(6, "Turn the whole cube so a corner in its right spot is at front-right."),
  repeat: bullet(6, "Do the sequence. Repeat until all four are in their right spots."),
  none: bullet(6, "None in its right spot? Do the sequence once from anywhere."),
};

function level6(c: Cube) {
  const SEQ = alg(6);
  // "A corner is in its right spot when it has the same three colors as the three centers around it."
  const inSpot = (n: string) => slotHasRightPiece(c.s, slot(n));
  const allIn = () => TOP_CORNERS.every(inSpot);
  let guard = 0;
  while (!allIn()) {
    if (guard++ > CAP) c.fail(L6.repeat, "corner placing loop did not finish");
    if (!TOP_CORNERS.some(inSpot)) {
      // "None in its right spot? Do the sequence once from anywhere."
      c.seq(SEQ);
      continue;
    }
    // "Turn the whole cube so a corner in its right spot is at front-right."
    let n = 0;
    while (!inSpot("URF")) {
      if (n++ >= 4) c.fail(L6.whole, "could not bring a placed corner to front-right");
      c.turn("y");
    }
    // "Do the sequence. Repeat until all four are in their right spots."
    n = 0;
    while (!allIn()) {
      if (n++ >= 6) c.fail(L6.repeat, "6 sequences at the same hold did not place all four");
      c.seq(SEQ);
    }
  }
}

// =====================================================================
// Level 7 — Twist yellow corners
// =====================================================================
const L7 = {
  def: bullet(7, "A twisted corner has its yellow facing a side, not up."),
  start: bullet(7, "To start, turn the whole cube so a twisted corner is at front-right."),
  again: bullet(
    7,
    "Do the whole sequence, all 4 moves, again and again. Check only after all 4 moves: stop when that corner's yellow is on top. The bottom gets messy — that's normal.",
  ),
  next: bullet(7, "Turn only the top to bring the next twisted corner to front-right."),
  never: bullet(7, "Once you've started, never turn the whole cube again."),
  lineUp: bullet(7, "All four corners have yellow on top? Turn the top to line it up. Solved!"),
};

function level7(c: Cube) {
  const SEQ = alg(7);
  // "A twisted corner has its yellow facing a side, not up."
  const twisted = (n: string) => c.sticker(n, "U") !== YELLOW;
  if (TOP_CORNERS.some(twisted)) {
    // "To start, turn the whole cube so a twisted corner is at front-right."
    let n = 0;
    while (!twisted("URF")) {
      if (n++ >= 4) c.fail(L7.start, "could not bring a twisted corner to front-right");
      c.turn("y");
    }
    // "Once you've started, never turn the whole cube again." — no y below this line.
    let guard = 0;
    while (TOP_CORNERS.some(twisted)) {
      if (guard++ > CAP) c.fail(L7.next, "twist loop did not finish");
      // "Turn only the top to bring the next twisted corner to front-right."
      n = 0;
      while (!twisted("URF")) {
        if (n++ >= 4) c.fail(L7.next, "could not bring next twisted corner to front-right");
        c.turn("U");
      }
      // "Do the whole sequence, all 4 moves, again and again. Check only after all 4 moves: stop when yellow is on top."
      n = 0;
      do {
        if (n++ >= 6) c.fail(L7.again, "yellow never came on top after 6 sequences");
        c.seq(SEQ);
      } while (twisted("URF"));
    }
  }
  // "All four corners have yellow on top? Turn the top to line it up. Solved!"
  let n = 0;
  while (!isSolved(c.s)) {
    if (n++ >= 4) c.fail(L7.lineUp, "no turn of the top lines the cube up");
    c.turn("U");
  }
}

// =====================================================================
// Play
// =====================================================================

const LEVELS: { n: number; stage: keyof typeof STAGE_DONE; run: (c: Cube) => void }[] = [
  { n: 1, stage: "cross", run: level1 },
  { n: 2, stage: "corners", run: level2 },
  { n: 3, stage: "middle", run: level3 },
  { n: 4, stage: "yellowCross", run: level4 },
  { n: 5, stage: "yellowEdges", run: level5 },
  { n: 6, stage: "yellowCornersPlace", run: level6 },
  { n: 7, stage: "yellowCornersTwist", run: level7 },
];

export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Played {
  solved: boolean;
  moves: number;
  /** Where the words ran out or didn't finish a level, with the bullet's file:line. */
  problem?: { level: number; kind: string; bullet: string; why: string; state: string };
}

/** Play levels 1–7 on a cube held white down, using only the tutorial's words. */
export function playTutorial(start: CubeState): Played {
  const c = new Cube(start);
  for (const L of LEVELS) {
    try {
      L.run(c);
    } catch (e) {
      if (!(e instanceof Stop)) throw e;
      return {
        solved: false,
        moves: c.moves,
        problem: { level: L.n, kind: e.kind, bullet: ref(e.bullet), why: e.why, state: e.state },
      };
    }
    if (!STAGE_DONE[L.stage](c.s))
      return {
        solved: false,
        moves: c.moves,
        problem: {
          level: L.n,
          kind: "failed",
          bullet: "(level ended by its own rules)",
          why: `level ${L.n} rules finished but the stage isn't done`,
          state: c.s.join(""),
        },
      };
  }
  return { solved: isSolved(c.s), moves: c.moves };
}

export { scramble, solved, applyMoves };
