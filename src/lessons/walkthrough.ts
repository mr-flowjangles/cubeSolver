// The "Show it" and "Walk through it" parts of a level: one fixed demo cube, and the
// moves that finish the level's stage on it, each with a plain-words reason.

import { type CubeState, type Face, type Move, applyMoves, parseMoves } from "../cube";
import { swipesFor } from "../render/swipe";
import type { Level } from "./beginner";
import { type GuideStep, METHODS } from "./index";
import { practicePosition } from "./position";
import { finishTwist } from "../solver/beginner";

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
export function helpSteps(level: Level, pos: CubeState, recent: readonly Move[] = []): GuideStep[] {
  // Partway through a taught sequence the earlier stages look broken. Finishing it is the help.
  const finish = finishSequence(level, pos, recent);
  if (finish) return [finish, ...planFrom(level, applyMoves(pos, finish.moves))];
  return planFrom(level, pos);
}

/** How many of the method's stages are done, in order, from the start. */
function progress(level: Level, s: CubeState): number {
  const m = METHODS[level.method];
  let n = 0;
  // Not "hold": which side faces you doesn't matter here, and whole-cube turns change it.
  for (const st of m.stages.filter((x) => x !== "hold")) {
    if (!m.done[st](s)) break;
    n++;
  }
  return n;
}

/**
 * If the player's last moves (`recent`) are the start of one of this level's sequences, the rest
 * of it, when finishing it puts back more of the earlier stages. The shortest such rest; else null.
 */
export function finishSequence(
  level: Level,
  pos: CubeState,
  recent: readonly Move[],
): GuideStep | null {
  const base = progress(level, pos);
  // Mid-twist, a whole round can leave the bottom messy; it counts if the twist steps then finish.
  const twisting = level.method === "beginner" && !finishTwist(pos);
  const better = (s: CubeState) => progress(level, s) > base || (twisting && !!finishTwist(s));
  let best: GuideStep | null = null;
  for (const a of level.algs) {
    const all = parseMoves(a.moves);
    for (let p = all.length - 1; p >= 1; p--) {
      // "You started" must be true: the last p moves made are this sequence's first p moves.
      if (recent.length < p || recent.slice(-p).join(" ") !== all.slice(0, p).join(" ")) continue;
      const rest = all.slice(p);
      if (best && rest.length >= best.moves.length) continue;
      if (!better(applyMoves(pos, rest))) continue;
      best = {
        stage: level.stage ?? "full",
        moves: rest,
        say: `Finish the ${a.name} sequence you started: ${rest.length} more ${rest.length === 1 ? "move" : "moves"}.`,
        why: rest.map((_, i) => `${a.name} sequence, move ${p + i + 1} of ${all.length}.`),
      };
    }
  }
  return best;
}

function planFrom(level: Level, pos: CubeState): GuideStep[] {
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
  corners: 78, // a corner lifted out, and Corner repeated
  middle: 118, // a stuck edge popped out, Edge right and Edge left
  yellowCross: 2, // dot, L, line, cross
  yellowEdges: 23, // top turn, whole-cube turn, and the "opposite" case
  yellowCornersPlace: 0, // the "none in place" case, and a whole-cube turn
  yellowCornersTwist: 1,
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
