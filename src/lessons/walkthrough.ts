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

/** The steps that finish this level's stage from `pos`. */
export function stageSteps(level: Level, pos: CubeState): GuideStep[] {
  return METHODS[level.method]
    .solve(pos, level.stage)
    .filter((s) => s.stage === level.stage && s.moves.length > 0);
}

/**
 * Seed offsets for beginner demos: the shortest of 40 cubes whose demo plays every sequence the
 * level teaches (docs/02-levels.md → "Every level is a tutorial"). Checked in tests/walkthrough.test.ts.
 */
export const DEMO_SEED: Record<string, number> = {
  corners: 29,
  middle: 10,
  yellowCross: 33,
  yellowEdges: 5,
  yellowCornersPlace: 5,
  yellowCornersTwist: 8,
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
      for (const t of swipesFor(m))
        out.push({
          move: t,
          why,
          say: st.say,
          part: st.part,
          piece: st.piece,
          to: st.to,
          step: k,
          steps: steps.length,
        });
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
