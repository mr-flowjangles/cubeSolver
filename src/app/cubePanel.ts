// A 3D cube with a status line and move buttons. Shared by free play and lessons.

import { type CubeState, type Face, type Move, applyMove, invertMove } from "../cube";
import { CubeView } from "../render/cubeView";
import { loadSettings } from "./settings";

// Buttons are grouped by side. Each shows the standard letter (what every cube guide uses),
// the side's name, and an arrow for which way the front edge moves (as seen from the front).
export interface PadGroup {
  title: string;
  moves: Move[];
  wide?: boolean; // takes a whole row
}

export const MOVE_LABEL: Record<string, string> = {
  U: "Top ←",
  "U'": "Top →",
  U2: "Top ×2",
  D: "Bottom →",
  "D'": "Bottom ←",
  R: "Right ↑",
  "R'": "Right ↓",
  L: "Left ↓",
  "L'": "Left ↑",
  F: "Front ↻",
  "F'": "Front ↺",
  B: "Back ↺",
  "B'": "Back ↻",
  y: "Turn ←",
  "y'": "Turn →",
  x: "Tilt ↑",
  "x'": "Tilt ↓",
  M: "Middle ↓",
  "M'": "Middle ↑",
  M2: "Middle ×2",
  r: "Right 2 ↑",
  "r'": "Right 2 ↓",
  f: "Front 2 ↻",
  "f'": "Front 2 ↺",
};

const SIDES: PadGroup[] = [
  { title: "Top", moves: ["U", "U'"] },
  { title: "Right", moves: ["R", "R'"] },
  { title: "Front", moves: ["F", "F'"] },
  { title: "Bottom", moves: ["D", "D'"] },
  { title: "Left", moves: ["L", "L'"] },
  { title: "Back", moves: ["B", "B'"] },
];

export const DEFAULT_GROUPS: PadGroup[] = [
  ...SIDES,
  { title: "Whole cube", moves: ["y", "y'"], wide: true },
];

/** CFOP sequences also use middle-layer (M), two-layer (r, f) and whole-cube (x) turns. */
export const CFOP_GROUPS: PadGroup[] = [
  ...SIDES,
  {
    title: "Middle and two-layer turns",
    moves: ["M", "M'", "M2", "r", "r'", "f", "f'"],
    wide: true,
  },
  { title: "Whole cube", moves: ["y", "y'", "x", "x'"], wide: true },
];

export const DEFAULT_PAD: Move[] = DEFAULT_GROUPS.flatMap((g) => g.moves);
export const CFOP_PAD: Move[] = CFOP_GROUPS.flatMap((g) => g.moves);

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
    groups?: PadGroup[];
    /** Show side words under the letters (off for CFOP, to match outside tutorials). */
    words?: boolean;
    onMove?: (m: Move, p: CubePanel) => void;
  } = {},
): CubePanel {
  const groups = opts.groups ?? DEFAULT_GROUPS;
  const words = opts.words ?? true;
  const button = (m: Move) =>
    `<button class="move" data-move="${m}" aria-label="${m}: ${MOVE_LABEL[m] ?? m}"><b>${m}</b>${
      words ? `<small>${MOVE_LABEL[m] ?? ""}</small>` : ""
    }</button>`;
  root.innerHTML = `
    <div class="stage" aria-label="3D cube. Drag to look around; it springs back to the front."></div>
    <p class="status" role="status"></p>
    <div class="pad ${words ? "" : "letters"}">
      ${groups
        .map(
          (g) => `<div class="group ${g.wide ? "wide" : ""}">
            <span class="group-title">${g.title}</span>
            <div class="group-buttons">${g.moves.map(button).join("")}${
              g.title === "Whole cube"
                ? `<button class="peek" aria-pressed="false">👁 See back</button>`
                : ""
            }</div>
          </div>`,
        )
        .join("")}
    </div>`;
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
      if (view.isPeeking) unpeek();
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

  const peekBtn = root.querySelector<HTMLButtonElement>(".peek")!;
  const unpeek = () => {
    if (view.isPeeking) view.togglePeek();
    peekBtn.textContent = "👁 See back";
    peekBtn.setAttribute("aria-pressed", "false");
  };
  peekBtn.addEventListener("click", () => {
    const on = view.togglePeek();
    peekBtn.textContent = on ? "👁 See front" : "👁 See back";
    peekBtn.setAttribute("aria-pressed", String(on));
  });

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
