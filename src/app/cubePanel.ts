// A 3D cube you turn by swiping, with a status line. Shared by free play and lessons.

import { type CubeState, type Face, type Move, applyMove, invertMove } from "../cube";
import { CubeView } from "../render/cubeView";
import { loadSettings } from "./settings";

// Turns are made by swiping (docs/02-levels.md → Controls). Which turns a screen allows:
//   beginner  the six sides and whole-cube turns (no middle rows: they move the centers)
//   cfop      also the middle rows, used by M, r and f
//   free      everything
export type TurnSet = "beginner" | "cfop" | "free";

const SIDES = ["U", "R", "F", "D", "L", "B"];
const MIDDLES = ["M", "E", "S"];
const WHOLE = ["x", "y", "z"];
const both = (bases: string[]) => bases.flatMap((b) => [b, b + "'"]);

/** The single swipes a screen allows (quarter turns only; U2 is two swipes). */
export function allowedSwipes(set: TurnSet): Move[] {
  return both([...SIDES, ...WHOLE, ...(set === "beginner" ? [] : MIDDLES)]);
}

export interface CubePanel {
  readonly state: Face[];
  readonly history: Move[];
  /** Player or app turn, animated. */
  turn(m: Move, record?: boolean): void;
  /** Play several moves, animated, one after another. `ms` is the time per move. */
  play(moves: readonly Move[], ms?: number): Promise<void>;
  undo(): void;
  setState(s: CubeState): void;
  say(text: string): void;
  view: CubeView;
  dispose(): void;
}

export function mountCubePanel(
  root: HTMLElement,
  start: CubeState,
  opts: {
    turns?: TurnSet;
    onMove?: (m: Move, p: CubePanel) => void;
  } = {},
): CubePanel {
  const set = opts.turns ?? "beginner";
  root.innerHTML = `
    <div class="stage" aria-label="3D cube. Swipe a row to turn it. Swipe beside the cube to turn the whole cube."></div>
    <p class="status" role="status"></p>`;
  const status = root.querySelector<HTMLElement>(".status")!;
  // A swipe makes only the turns this screen allows, so a lesson never gets one it doesn't teach.
  const allowed = new Set(allowedSwipes(set));
  const view = new CubeView(root.querySelector(".stage")!, start, {
    ada: loadSettings().ada,
    onSwipe: (m) => {
      if (allowed.has(m)) panel.turn(m);
      else panel.say("Middle rows don't turn in beginner levels. Swipe an outer row.");
    },
  });

  let state = [...start] as Face[];
  const history: Move[] = [];

  const panel: CubePanel = {
    get state() {
      return state;
    },
    get history() {
      return history;
    },
    view,
    turn(m, record = true) {
      state = applyMove(state, m);
      if (record) history.push(m);
      void view.animate(m, state);
      opts.onMove?.(m, panel);
    },
    async play(moves, ms) {
      let last: Promise<void> = Promise.resolve();
      for (const m of moves) {
        state = applyMove(state, m);
        history.push(m);
        last = view.animate(m, state, ms);
      }
      await last;
    },
    undo() {
      const m = history.pop();
      if (!m) return;
      state = applyMove(state, invertMove(m));
      void view.animate(invertMove(m), state);
    },
    setState(s) {
      state = [...s] as Face[];
      history.length = 0;
      view.setState(state);
    },
    say(text) {
      status.textContent = text;
    },
    dispose() {
      window.removeEventListener("keydown", onKey);
      view.dispose();
    },
  };

  // Keyboard: letter turns clockwise, Shift+letter counter-clockwise.
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key : "";
    const f = k.toUpperCase();
    const m = "URFDLBM".includes(f) && f ? f : "XY".includes(f) && f ? f.toLowerCase() : "";
    if (!m) return;
    const move = e.shiftKey ? m + "'" : m;
    if (allowed.has(move)) panel.turn(move);
  };
  window.addEventListener("keydown", onKey);

  return panel;
}
