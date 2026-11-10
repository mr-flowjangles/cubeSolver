// The "Show it" and "Walk through it" parts of a level: one fixed demo cube, and the
// moves that finish the level's stage on it, each with a plain-words reason.

import { type CubeState, type Face, type Move, applyMoves } from "../cube";
import { swipesFor } from "../render/swipe";
import type { Level } from "./beginner";
import { type GuideStep, METHODS } from "./index";
import { practicePosition } from "./position";

export interface GuideMove {
  move: Move;
  /** Why this move, in plain words. Missing: the screen says what the move does (moveWords). */
  why?: string;
  /** What the whole step is doing, e.g. "Bring the white–red edge up…". */
  say: string;
  part?: string;
  piece?: Face[];
  to?: string;
  /** Which step (0-based) of how many. */
  step: number;
  steps: number;
}

export function seeded(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

/** "White cross" → "white cross"; "F2L" stays. */
const lowerWord = (t: string) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);

/**
 * Hint and Show me: every step from the cube as it is to this level's stage done. A wrong turn
 * or a tip can undo an earlier stage; those steps come first, labelled "First fix …".
 */
export function helpSteps(level: Level, pos: CubeState): GuideStep[] {
  const m = METHODS[level.method];
  return m
    .solve(pos, level.stage)
    .filter((s) => s.moves.length > 0)
    .map((s) =>
      // The hold step already says "Hold the cube with white on the bottom…".
      s.stage === level.stage || s.stage === "hold"
        ? s
        : { ...s, say: `First fix the ${lowerWord(m.stageTitle[s.stage])}: ${s.say}` },
    );
}

/** The steps that finish this level's stage from `pos`. */
export function stageSteps(level: Level, pos: CubeState): GuideStep[] {
  return METHODS[level.method]
    .solve(pos, level.stage)
    .filter((s) => s.stage === level.stage && s.moves.length > 0);
}

/**
 * Seed offsets for beginner demos: the shortest of 200 cubes whose demo plays every sequence the
 * level teaches and shows its harder cases (docs/02-levels.md → kid test). Checked in
 * tests/walkthrough.test.ts.
 */
export const DEMO_SEED: Record<string, number> = {
  corners: 181, // a corner lifted out, and Corner repeated
  middle: 31, // a stuck edge popped out, Edge right and Edge left
  yellowCross: 12, // dot, L, line, cross
  yellowEdges: 28,
  yellowCornersPlace: 3,
  yellowCornersTwist: 0,
};

/** The same demo cube every time, so "Show it" and "Walk through it" match. */
export function demoPosition(level: Level): CubeState {
  return practicePosition(level, seeded(level.number * 31 + 7 + (DEMO_SEED[level.id] ?? 0)));
}

/** One entry per swipe. A half turn (U2) is two swipes; a two-layer turn (r) is R then M'. */
export function guideMoves(steps: GuideStep[]): GuideMove[] {
  const out: GuideMove[] = [];
  steps.forEach((st, k) => {
    st.moves.forEach((m, j) => {
      const why = st.why?.[j];
      const swipes = swipesFor(m);
      swipes.forEach((t, n) =>
        out.push({
          move: t,
          // A half turn is two swipes; say which one, so "drops to the bottom" isn't read after the first.
          why: why && swipes.length > 1 ? `${why} (Swipe ${n + 1} of ${swipes.length}.)` : why,
          say: st.say,
          part: st.part,
          piece: st.piece,
          to: st.to,
          step: k,
          steps: steps.length,
        }),
      );
    });
  });
  return out;
}

/** The cube after every guide move: the stage should be done. */
export function afterGuide(pos: CubeState, moves: GuideMove[]): CubeState {
  return applyMoves(
    pos,
    moves.map((g) => g.move),
  );
}
