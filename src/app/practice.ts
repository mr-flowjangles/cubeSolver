// Free play: a 3D cube you can turn, scramble, undo and reset.

import { type Face, applyMove, isSolved, parseMoves, scramble, solved } from "../cube";
import { mountCubePanel } from "./cubePanel";
import type { Screen } from "./shell";

export function mountPractice(root: HTMLElement): Screen {
  root.innerHTML = `
    <main class="practice">
      <div class="panel"></div>
      <div class="actions">
        <button id="scramble" class="primary">Scramble</button>
        <button id="undo">Undo</button>
        <button id="reset">Reset</button>
      </div>
    </main>`;

  let scrambled = false;
  const undoBtn = root.querySelector<HTMLButtonElement>("#undo")!;
  const refresh = () => (undoBtn.disabled = panel.history.length === 0);
  const panel = mountCubePanel(root.querySelector(".panel")!, solved(), {
    onMove: (_m, p) => {
      refresh();
      if (scrambled && isSolved(p.state)) {
        scrambled = false;
        p.say("Solved! 🎉");
      } else {
        p.say(`Moves: ${p.history.length}`);
      }
    },
  });
  panel.say("Drag the cube to look around. Tap a move to turn.");

  root.querySelector("#scramble")!.addEventListener("click", () => {
    const s = scramble();
    panel.setState(s.reduce<Face[]>((st, m) => applyMove(st, m), solved()));
    scrambled = true;
    refresh();
    panel.say(`Scramble: ${s.join(" ")}`);
  });
  undoBtn.addEventListener("click", () => {
    panel.undo();
    refresh();
    panel.say(panel.history.length ? `Moves: ${panel.history.length}` : "Back to the start.");
  });
  root.querySelector("#reset")!.addEventListener("click", () => {
    panel.setState(solved());
    scrambled = false;
    refresh();
    panel.say("Reset to solved.");
  });

  // Test hook: ?moves=R%20U&instant=1#/play sets the cube up from the link.
  const params = new URLSearchParams(location.search);
  const preset = params.get("moves");
  if (preset) {
    try {
      const moves = parseMoves(preset);
      if (params.get("instant") === "1") {
        panel.setState(moves.reduce<Face[]>((st, m) => applyMove(st, m), solved()));
      } else {
        moves.forEach((m) => panel.turn(m));
      }
      panel.say(`Moves: ${moves.length}`);
    } catch {
      panel.say("Unknown moves in the link.");
    }
  }

  refresh();
  return panel;
}
