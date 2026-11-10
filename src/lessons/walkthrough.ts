// The "Show it" and "Walk through it" parts of a level: one fixed demo cube, and the
// moves that finish the level's stage on it, each with a plain-words reason.

import {
  type CubeState,
  type Face,
  type Move,
  applyMoves,
  invertMove,
  invertMoves,
  parseMoves,
} from "../cube";
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
 * `recent` is the player's move history (one entry per swipe).
 */
export function helpSteps(level: Level, pos: CubeState, recent: readonly Move[] = []): GuideStep[] {
  return chooseHelp(level, pos, recent, (s) => planFrom(level, s));
}

/**
 * One entry per swipe (a half turn is two). A swipe and its undo at the very end are dropped:
 * a look and look-back, or a wrong turn put right by hand, leaves the cube as it was.
 * (Only at the end: earlier, a line-up turn and a sequence's first move can look the same.)
 */
const swipes = (moves: readonly Move[]) => {
  const out = moves.flatMap((m) => swipesFor(m));
  while (out.length >= 2 && out[out.length - 1] === invertMove(out[out.length - 2]))
    out.length -= 2;
  return out;
};

/**
 * Which help to give: carry on from here, or turn back the last swipe, the last two, or a sequence
 * done at the wrong moment. Each one first finishes a sequence the player started, if any, then
 * follows `plan`.
 * Carrying on wins unless it would redo a stage the player had finished (a stray turn broke it);
 * then a turn-back that doesn't, if there is one. Following the plan never redoes a stage, so a
 * player on the plan is never told to turn back.
 */
export function chooseHelp(
  level: Level,
  pos: CubeState,
  recent: readonly Move[],
  plan: (s: CubeState) => GuideStep[],
): GuideStep[] {
  const hist = swipes(recent);
  let reached = 0; // the most stages the player had got past, here or just before a stray move
  /** An option: what to do first (turn back, finish a sequence), then the plan from there. */
  type Option = { first: GuideStep[]; then: GuideStep[] };
  const carryOn = (s: CubeState, h: readonly Move[], first: GuideStep[] = []): Option => {
    const f = finishSequence(level, s, h);
    const from = f ? applyMoves(s, f.moves) : s;
    reached = Math.max(reached, reachedStage(level, from));
    return { first: f ? [...first, f] : first, then: plan(from) };
  };
  const here = carryOn(pos, hist);
  const backs: Option[] = [];
  // Turn back the last move, the last two, or a sequence (whole or part-done) started at the
  // wrong moment, with one stray turn after it or not. Shorter turn-backs are tried first.
  const started = [
    ...new Set(
      level.algs.flatMap((a) => [
        ...startsDone(hist, a.moves),
        ...startsDone(hist.slice(0, -1), a.moves, 2).map((k) => k + 1),
      ]),
    ),
  ].sort((a, b) => a - b);
  for (const k of [1, 2, ...started]) {
    if (hist.length < k) break;
    const moves = invertMoves(hist.slice(-k));
    const after = applyMoves(pos, moves);
    const wholeCube = moves.every((m) => "xyz".includes(m[0]));
    const back: GuideStep = {
      stage: level.stage ?? "full",
      moves,
      say: wholeCube
        ? "You turned the whole cube. Turn it back first."
        : k === 1
          ? "Turn your last move back first."
          : k === 2
            ? "Turn your last two moves back first."
            : "That sequence doesn't help here. Follow the arrows to undo it first.",
      why: moves.map(() => "Turn back what you just did."),
    };
    backs.push(carryOn(after, hist.slice(0, -k), [back]));
  }
  const stages = METHODS[level.method].stages.filter((x) => x !== "hold");
  /** The plan redoes a stage the player had got past (or turns white back down). Top turns only line up. */
  const redoes = (o: Option) =>
    o.then.some(
      (st) =>
        st.stage === "hold" ||
        (stages.includes(st.stage) &&
          stages.indexOf(st.stage) < reached &&
          !st.moves.every((m) => m[0] === "U")),
    );
  const pick = redoes(here) ? (backs.find((b) => !redoes(b)) ?? here) : here;
  return [...pick.first, ...pick.then];
}

/**
 * How many of a sequence's swipes the player's last swipes are, for each length from `min` that
 * fits: the whole sequence, or its start. (Turning back one or two swipes is already an option.)
 */
function startsDone(hist: readonly Move[], moves: string, min = 3): number[] {
  const all = swipes(parseMoves(moves));
  const out: number[] = [];
  for (let p = min; p <= all.length && p <= hist.length; p++)
    if (hist.slice(-p).join(" ") === all.slice(0, p).join(" ")) out.push(p);
  return out;
}

/**
 * How many stages the player has got past at this cube. Partway through the twist the bottom
 * looks broken, but if the twist steps finish from here, everything before the twist is done.
 */
function reachedStage(level: Level, s: CubeState): number {
  if (level.method === "beginner" && finishTwist(s)) {
    return METHODS.beginner.stages.filter((x) => x !== "hold").indexOf("yellowCornersTwist");
  }
  return progress(level, s);
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
 * If the player's last swipes (`recent`) are the start of one of this level's sequences, the rest
 * of it, when finishing it puts back more of the earlier stages (or lets the twist steps finish).
 * The longest such start wins: that's the sequence really under way. Else null.
 */
export function finishSequence(
  level: Level,
  pos: CubeState,
  recent: readonly Move[],
): GuideStep | null {
  const hist = swipes(recent);
  const base = reachedStage(level, pos);
  let best: { p: number; step: GuideStep } | null = null;
  for (const a of level.algs) {
    const all = swipes(parseMoves(a.moves));
    for (let p = all.length - 1; p >= 1; p--) {
      if (best && p <= best.p) break;
      // "You started" must be true: the last p swipes made are this sequence's first p swipes.
      if (hist.length < p || hist.slice(-p).join(" ") !== all.slice(0, p).join(" ")) continue;
      // Top turns alone don't count: every step lines up with them, and some sequences end with one.
      if (all.slice(0, p).every((m) => m[0] === "U")) continue;
      const rest = all.slice(p);
      // Finishing it must put back what the player had before starting it, and more than now.
      // (Corner and Swap edges both start R U R': only the one really under way passes.)
      const done = reachedStage(level, applyMoves(pos, rest));
      const before = reachedStage(level, applyMoves(pos, invertMoves(all.slice(0, p))));
      if (done <= base || done < before) continue;
      best = {
        p,
        step: {
          stage: level.stage ?? "full",
          moves: rest,
          say: `Finish the ${a.name} sequence you started: ${rest.length} more ${rest.length === 1 ? "move" : "moves"}.`,
          why: rest.map((_, i) => `${a.name} sequence, move ${p + i + 1} of ${all.length}.`),
        },
      };
    }
  }
  return best?.step ?? null;
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
        : // Only top turns: nothing is broken, the top just needs lining up.
          s.moves.every((x) => x[0] === "U")
          ? { ...s, say: "Turn the top to line it up." }
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
 * Seed offsets for beginner demos: the shortest of 400 cubes whose demo plays every sequence the
 * level teaches and shows its harder cases (docs/02-levels.md → kid test). Checked in
 * tests/walkthrough.test.ts.
 */
export const DEMO_SEED: Record<string, number> = {
  corners: 377, // a corner lifted out, and Corner repeated
  middle: 180, // a stuck edge popped out, Edge right and Edge left
  yellowCross: 10, // dot, L, line, cross
  yellowEdges: 20, // top turn, whole-cube turn, and the "opposite" case
  yellowCornersPlace: 0, // the "none in place" case, and a whole-cube turn
  yellowCornersTwist: 5,
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
