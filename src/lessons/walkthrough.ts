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
import { BEGINNER_LEVELS, type Level } from "./beginner";
import { type GuideStep, METHODS } from "./index";
import { practicePosition } from "./position";
import { STAGE_PIECES, finishTwist } from "../solver/beginner";

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
 * Which help to give: carry on from here, or turn back some of the player's last swipes (up to a
 * sequence's length plus a stray turn either side). Each option first finishes a sequence the
 * player started, if any, then follows `plan`.
 * 1. Options that would redo a stage the player had finished (a stray turn broke it) are out.
 * 2. A turn-back never stops inside a whole sequence the player just did: it undoes all of it.
 * 3. Carrying on wins unless it redoes a stage: then the shortest turn-back that doesn't, so
 *    only the stray moves are undone. Following the plan never redoes a stage, so a player on
 *    the plan is never told to turn back.
 * 4. A sequence started at the wrong moment, which finishing would lose ground from (one Corner
 *    too many undoes the corner just placed), is undone instead of finished.
 */
/** How many swipes a longer turn-back, or fixing from here, must save to beat the shortest turn-back. */
const SAVES = 10;

/** How many swipes an option takes in all. */
const cost = (o: { first: GuideStep[]; then: GuideStep[] }) =>
  [...o.first, ...o.then].reduce((n, st) => n + st.moves.flatMap((m) => swipesFor(m)).length, 0);

/** The most swipes Hint ever asks to turn back: a long step (Twist four times is 16) and a stray. */
const FAR = 24;

export function chooseHelp(
  level: Level,
  pos: CubeState,
  recent: readonly Move[],
  plan: (s: CubeState) => GuideStep[],
): GuideStep[] {
  const hist = swipes(recent);
  const raw = recent.flatMap((m) => swipesFor(m)); // without look-backs taken out
  let reached = 0; // the most stages the player had got past, here or just before a stray move
  /** An option: what to do first (turn back, finish a sequence), then the plan from there. */
  type Option = { first: GuideStep[]; then: GuideStep[]; k: number };
  const carryOn = (s: CubeState, h: readonly Move[], k = 0, first: GuideStep[] = []): Option => {
    const f = finishSequence(level, s, h);
    const from = f ? applyMoves(s, f.moves) : s;
    reached = Math.max(reached, reachedStage(level, from));
    return { first: f ? [...first, f] : first, then: plan(from), k };
  };
  const here = carryOn(pos, raw);
  // 1. Whole sequences the player's swipes end with: a turn-back can't stop inside one.
  const wholeAtEnd = level.algs
    .map((a) => swipes(parseMoves(a.moves)))
    .filter(
      (all) => hist.length >= all.length && hist.slice(-all.length).join(" ") === all.join(" "),
    )
    .map((all) => all.length);
  const longest = Math.max(0, ...level.algs.map((a) => swipes(parseMoves(a.moves)).length));
  /** Turn back the last k swipes of `h`, then carry on. */
  const turnBack = (k: number, h: readonly Move[]): Option => {
    // A turn and its undo inside it do nothing: leave them out of the arrows.
    const moves = dropPairs(invertMoves(h.slice(-k)));
    const back: GuideStep = {
      stage: level.stage ?? "full",
      moves,
      // The count is the arrows shown: a turn and its undo inside are left out (round 12).
      say: moves.every((m) => "xyz".includes(m[0]))
        ? "You turned the whole cube. Turn it back first."
        : isSequence(level, h.slice(-k))
          ? "That sequence doesn't help here. Follow the arrows to undo it first."
          : moves.length === 1
            ? "Turn your last move back first."
            : moves.length === 2
              ? "Turn your last two moves back first."
              : `Turn back your last ${moves.length} moves first.`,
      why: moves.map(() => "Turn back what you just did."),
    };
    return carryOn(applyMoves(pos, moves), h.slice(0, -k), k, [back]);
  };
  const backs: Option[] = [];
  // 2. Turn back the last k swipes, for every k up to a sequence plus a stray turn either side.
  for (let k = 1; k <= Math.min(hist.length, longest + 2); k++)
    if (!wholeAtEnd.some((n) => k < n) && dropPairs(hist.slice(-k)).length > 0)
      backs.push(turnBack(k, hist));
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
  // 3. A sequence started at the wrong moment (finishing it loses ground): undo that start.
  //    Only when carrying on doesn't finish a sequence the player really started.
  const w = here.first.length ? null : wrongStart(level, pos, raw);
  const undo = w ? turnBack(w.p, w.h) : undefined;
  // 4. Further back, up to FAR swipes: the nearest point with the most stages done (a stray turn,
  //    then more of the step from memory; kid test, round 11). Counts toward `reached`.
  const now = reachedStage(level, pos);
  let far: { k: number; r: number } | null = null;
  for (let k = longest + 3; k <= Math.min(hist.length, FAR); k++) {
    if (wholeAtEnd.some((n) => k < n) || dropPairs(hist.slice(-k)).length === 0) continue;
    const r = reachedStage(level, applyMoves(pos, invertMoves(hist.slice(-k))));
    if (r > now && (!far || r > far.r)) far = { k, r };
  }
  if (far) reached = Math.max(reached, far.r);
  // 5. Carrying on wins unless it redoes a stage the player had got past (following the plan
  //    never does, so a player on the plan is never told to turn back). Then the shortest
  //    turn-back that redoes nothing, unless a longer one, or fixing from here, saves more than
  //    SAVES swipes (kid test, round 12: the shortest could land far from the most-done point,
  //    and sometimes fixing from here was much shorter). A small saving isn't worth a kid
  //    going back a stage instead of turning one move back.
  let pick = here;
  // The moves that were the mistake are known (one sequence too many): undo just those.
  if (undo && !redoes(undo)) pick = undo;
  else if (redoes(here)) {
    const options = [...backs, ...(far ? [turnBack(far.k, hist)] : [])].filter((b) => !redoes(b));
    pick = options[0] ?? here;
    for (const o of [...options.slice(1), here]) if (cost(o) + SAVES < cost(pick)) pick = o;
  }
  return [...pick.first, ...pick.then];
}

/**
 * How many stages the player has got past at this cube. Partway through the twist the bottom
 * looks broken, but if the twist steps finish from here, everything before the twist is done.
 */
function reachedStage(level: Level, s: CubeState): number {
  const stages = METHODS[level.method].stages.filter((x) => x !== "hold");
  // Stages past this level's own don't count: a later stage done by chance isn't the player's.
  const cap = level.stage ? stages.indexOf(level.stage) + 1 : stages.length;
  if (level.method === "beginner" && finishTwist(s)) {
    return Math.min(cap, stages.indexOf("yellowCornersTwist"));
  }
  return Math.min(cap, progress(level, s));
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
  for (const h of readings(recent)) {
    const step = startedIn(level, pos, h).step;
    if (step) return step;
  }
  return null;
}

/** Moves with every turn-and-undo pair ("R' R") taken out, until none is left. */
function dropPairs(moves: readonly Move[]): Move[] {
  const out: Move[] = [];
  for (const m of moves)
    if (out.length && out[out.length - 1] === invertMove(m)) out.pop();
    else out.push(m);
  return out;
}

/**
 * The player's swipes as made, then with a swipe-and-undo at the end taken out, one pair at a
 * time. As made comes first: "F' F" is a sequence ended and the next one begun. Then a look and
 * look-back (or a hand undo) after it doesn't hide that "F".
 */
function readings(recent: readonly Move[]): Move[][] {
  const out = [recent.flatMap((m) => swipesFor(m))];
  for (;;) {
    const h = [...out[out.length - 1]];
    if (h.length < 2 || h[h.length - 1] !== invertMove(h[h.length - 2])) return out;
    out.push(h.slice(0, -2));
  }
}

/**
 * How many swipes of a sequence the player started at the wrong moment, and the reading of their
 * swipes it was found in: finishing it would lose a piece or a stage they had before starting it
 * (e.g. one Corner too many). Null if none.
 */
export function wrongStart(
  level: Level,
  pos: CubeState,
  recent: readonly Move[],
): { p: number; h: Move[] } | null {
  for (const h of readings(recent)) {
    const r = startedIn(level, pos, h);
    if (r.step) return null;
    if (r.wrong) return { p: r.wrong, h };
  }
  return null;
}

/** These swipes are (most of) one of the level's sequences: three or more of its swipes in a
 *  row, with at most one stray swipe before or after. */
function isSequence(level: Level, part: readonly Move[]): boolean {
  return level.algs.some((a) => {
    const all = swipes(parseMoves(a.moves)).join(" ");
    return [part, part.slice(1), part.slice(0, -1), part.slice(1, -1)].some(
      (x) => x.length >= 3 && ` ${all} `.includes(` ${x.join(" ")} `),
    );
  });
}

/** Pieces of the stage after the first `n` done stages that are in place (beginner only). */
function stagePieces(level: Level, n: number, s: CubeState): number {
  if (level.method !== "beginner") return 0;
  const st = METHODS.beginner.stages.filter((x) => x !== "hold")[n] as keyof typeof STAGE_PIECES;
  return st ? (STAGE_PIECES[st]?.(s) ?? 0) : 0;
}

/**
 * finishSequence on one reading of the player's swipes. Also the longest start that finishing
 * would lose ground from (`wrong`), when no sequence can be finished.
 */
function startedIn(
  level: Level,
  pos: CubeState,
  hist: readonly Move[],
): { step: GuideStep | null; wrong: number } {
  const base = reachedStage(level, pos);
  let best: { p: number; step: GuideStep } | null = null;
  let wrong = 0;
  /** Finishing (or having done) the sequence leaves less than the player had before it. */
  const losesGround = (end: CubeState, start: CubeState) => {
    const done = reachedStage(level, end);
    const before = reachedStage(level, start);
    return (
      done < before ||
      (done === before && stagePieces(level, done, end) < stagePieces(level, done, start))
    );
  };
  /** It is the sequence of the stage the player was on: on level 8, an R' in the white cross is
   *  a cross move, not the start of a Twist to undo. */
  const ofStage = (name: string, start: CubeState) => {
    const on = METHODS[level.method].stages.filter((x) => x !== "hold")[reachedStage(level, start)];
    return BEGINNER_LEVELS.some((l) => l.stage === on && l.algs.some((x) => x.name === name));
  };
  for (const a of level.algs) {
    const all = swipes(parseMoves(a.moves));
    // The whole sequence just done, one time too many: nothing to finish, but it can be undone.
    if (hist.length >= all.length && hist.slice(-all.length).join(" ") === all.join(" ")) {
      const start = applyMoves(pos, invertMoves(all));
      if (losesGround(pos, start) && ofStage(a.name, start)) wrong = Math.max(wrong, all.length);
    }
    for (let p = all.length - 1; p >= 1; p--) {
      if (best && p <= best.p) break;
      // "You started" must be true: the last p swipes made are this sequence's first p swipes.
      if (hist.length < p || hist.slice(-p).join(" ") !== all.slice(0, p).join(" ")) continue;
      // Top turns alone don't count: every step lines up with them, and some sequences end with one.
      if (all.slice(0, p).every((m) => m[0] === "U")) continue;
      const rest = all.slice(p);
      // Finishing it must put back what the player had before starting it, and more than now.
      // (Corner and Swap edges both start R U R': only the one really under way passes.)
      // Within the same stage, it must not lose a piece of it either.
      const end = applyMoves(pos, rest);
      const start = applyMoves(pos, invertMoves(all.slice(0, p)));
      if (losesGround(end, start)) {
        if (ofStage(a.name, start)) wrong = Math.max(wrong, p);
        continue;
      }
      if (reachedStage(level, end) <= base) continue;
      // On level 8, which teaches every sequence, only the one for the stage the player is on.
      if (!level.stage && !ofStage(a.name, start)) continue;
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
  return { step: best?.step ?? null, wrong: best ? 0 : wrong };
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
