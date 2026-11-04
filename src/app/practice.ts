// Practice screen: a 3D cube you can turn, scramble, undo and reset.

import {
  type Face,
  type Move,
  applyMove,
  invertMove,
  isSolved,
  parseMoves,
  scramble,
  solved,
} from "../cube";
import { CubeView } from "../render/cubeView";
import { loadSettings, saveSettings } from "./settings";

const PAD: Move[] = ["U", "U'", "D", "D'", "R", "R'", "L", "L'", "F", "F'", "B", "B'"];

export function mountPractice(root: HTMLElement): void {
  const settings = loadSettings();
  root.innerHTML = `
    <header class="bar">
      <h1>Cube Solver</h1>
      <label class="toggle" title="Adds a shape to each sticker color">
        <input type="checkbox" id="ada" ${settings.ada ? "checked" : ""} />
        <span>ADA support</span>
      </label>
    </header>
    <main class="practice">
      <div class="stage" id="stage" aria-label="3D cube. Drag to look around."></div>
      <p class="status" id="status" role="status">Drag the cube to look around. Tap a move to turn.</p>
      <div class="pad" id="pad">
        ${PAD.map((m) => `<button class="move" data-move="${m}">${m}</button>`).join("")}
      </div>
      <div class="actions">
        <button id="scramble" class="primary">Scramble</button>
        <button id="undo">Undo</button>
        <button id="reset">Reset</button>
      </div>
    </main>`;

  let state: Face[] = solved();
  let history: Move[] = [];
  let scrambled = false;
  const view = new CubeView(root.querySelector("#stage")!, state, { ada: settings.ada });
  const status = root.querySelector<HTMLElement>("#status")!;
  const undoBtn = root.querySelector<HTMLButtonElement>("#undo")!;

  const say = (text: string) => (status.textContent = text);
  const refresh = () => (undoBtn.disabled = history.length === 0);

  function turn(m: Move, record = true) {
    state = applyMove(state, m);
    if (record) history.push(m);
    void view.animate(m, state);
    refresh();
    if (scrambled && isSolved(state)) {
      scrambled = false;
      say("Solved! 🎉");
    } else if (record) {
      say(`Moves: ${history.length}`);
    }
  }

  root.querySelector("#pad")!.addEventListener("click", (e) => {
    const m = (e.target as HTMLElement).closest<HTMLElement>("[data-move]")?.dataset.move;
    if (m) turn(m);
  });

  root.querySelector("#scramble")!.addEventListener("click", () => {
    const s = scramble();
    state = s.reduce<Face[]>((st, m) => applyMove(st, m), solved());
    view.setState(state);
    history = [];
    scrambled = true;
    refresh();
    say(`Scramble: ${s.join(" ")}`);
  });

  undoBtn.addEventListener("click", () => {
    const m = history.pop();
    if (m) turn(invertMove(m), false);
    say(history.length ? `Moves: ${history.length}` : "Back to the start.");
  });

  root.querySelector("#reset")!.addEventListener("click", () => {
    state = solved();
    history = [];
    scrambled = false;
    view.setState(state);
    refresh();
    say("Reset to solved.");
  });

  root.querySelector<HTMLInputElement>("#ada")!.addEventListener("change", (e) => {
    settings.ada = (e.target as HTMLInputElement).checked;
    saveSettings(settings);
    view.setAda(settings.ada);
  });

  // Keyboard: letter turns clockwise, Shift+letter counter-clockwise.
  window.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const f = e.key.toUpperCase();
    if ("URFDLB".includes(f) && f.length === 1) turn(e.shiftKey ? f + "'" : f);
  });

  // Test hook: ?moves=R%20U&ada=1&instant=1 plays moves on load, forces ADA shapes on,
  // and (instant) skips animation. Lets headless checks drive the cube without a mouse.
  const params = new URLSearchParams(location.search);
  if (params.get("ada") === "1") {
    view.setAda(true);
    root.querySelector<HTMLInputElement>("#ada")!.checked = true;
  }
  const preset = params.get("moves");
  if (preset) {
    try {
      const moves = parseMoves(preset);
      if (params.get("instant") === "1") {
        state = moves.reduce<Face[]>((st, m) => applyMove(st, m), state);
        history = moves;
        view.setState(state);
        say(`Moves: ${history.length}`);
      } else {
        moves.forEach((m) => turn(m));
      }
    } catch {
      say("Unknown moves in the link.");
    }
  }

  refresh();
}
