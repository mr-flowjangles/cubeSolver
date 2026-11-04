// A 3D cube with a status line and move buttons. Shared by free play and lessons.

import { type CubeState, type Face, type Move, applyMove, invertMove } from "../cube";
import { CubeView } from "../render/cubeView";
import { loadSettings } from "./settings";

// Two rows: clockwise-ish faces on top, their opposites below, whole-cube spin at the end.
export const DEFAULT_PAD: Move[] = [
  ...["U", "U'", "R", "R'", "F", "F'", "y"],
  ...["D", "D'", "L", "L'", "B", "B'", "y'"],
];

export interface CubePanel {
  readonly state: Face[];
  readonly history: Move[];
  /** Player or app turn, animated. */
  turn(m: Move, record?: boolean): void;
  /** Play several moves, animated, one after another. */
  play(moves: readonly Move[]): Promise<void>;
  undo(): void;
  setState(s: CubeState): void;
  say(text: string): void;
  view: CubeView;
  dispose(): void;
}

export function mountCubePanel(
  root: HTMLElement,
  start: CubeState,
  opts: { pad?: Move[]; onMove?: (m: Move, p: CubePanel) => void } = {},
): CubePanel {
  const pad = opts.pad ?? DEFAULT_PAD;
  root.innerHTML = `
    <div class="stage" aria-label="3D cube. Drag to look around."></div>
    <p class="status" role="status"></p>
    <div class="pad">${pad.map((m) => `<button class="move" data-move="${m}">${m}</button>`).join("")}</div>`;
  const status = root.querySelector<HTMLElement>(".status")!;
  const view = new CubeView(root.querySelector(".stage")!, start, { ada: loadSettings().ada });

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
    async play(moves) {
      let last: Promise<void> = Promise.resolve();
      for (const m of moves) {
        state = applyMove(state, m);
        history.push(m);
        last = view.animate(m, state);
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

  root.querySelector(".pad")!.addEventListener("click", (e) => {
    const m = (e.target as HTMLElement).closest<HTMLElement>("[data-move]")?.dataset.move;
    if (m) panel.turn(m);
  });

  // Keyboard: letter turns clockwise, Shift+letter counter-clockwise.
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key : "";
    const f = k.toUpperCase();
    if ("URFDLB".includes(f) && f) panel.turn(e.shiftKey ? f + "'" : f);
    else if (f === "Y") panel.turn(e.shiftKey ? "y'" : "y");
  };
  window.addEventListener("keydown", onKey);

  return panel;
}
