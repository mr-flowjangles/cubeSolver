// Solve my cube: enter a real cube by tapping colors, check it, then follow a guided solve.
//   #/solve         enter the cube (flat map)
//   #/solve/guide   step-by-step guide for the entered cube
// The entered cube is kept for this browser tab, so a refresh doesn't lose it.

import {
  COLOR_NAME,
  type CubeState,
  type Face,
  FACES,
  STICKER_COLOR,
  UNSOLVABLE,
  applyMove,
  findProblems,
  fromString,
  invertMove,
  solved,
  toString,
} from "../cube";
import { type GuideStep, METHODS } from "../lessons/index";
import { loadProgress } from "../game/storage";
import { CubeView } from "../render/cubeView";
import { ADA_SHAPE, shapeSvg } from "../render/shapes";
import { solveBeginner } from "../solver/beginner";
import { mountScan } from "./scan";
import { loadSettings } from "./settings";
import type { Screen } from "./shell";

const KEY = "cubesolver.entered";
const BLANK = "?";
type Cell = Face | typeof BLANK;

function loadEntered(): Cell[] {
  const fromLink = new URLSearchParams(location.search).get("cube"); // test hook
  try {
    const raw = fromLink ?? sessionStorage.getItem(KEY);
    if (raw && raw.length === 54) return raw.split("") as Cell[];
  } catch {
    // ignore
  }
  return toString(solved())
    .split("")
    .map((c, i) => (i % 9 === 4 ? (c as Face) : BLANK));
}

export function saveEntered(cells: Cell[]) {
  try {
    sessionStorage.setItem(KEY, cells.join(""));
  } catch {
    // ignore
  }
}

export const FACE_HINT: Record<Face, string> = {
  U: "Top — white center, green side toward you",
  F: "Front — green center, white on top",
  R: "Right — red center, white on top",
  B: "Back — blue center, white on top",
  L: "Left — orange center, white on top",
  D: "Bottom — yellow center; tip the top away from you so green is at the top",
};

function stickerHtml(cell: Cell, i: number, ada: boolean) {
  const center = i % 9 === 4;
  const fill = cell === BLANK ? "" : `style="background:${STICKER_COLOR[cell]}"`;
  const mark =
    ada && cell !== BLANK
      ? shapeSvg(ADA_SHAPE[cell], cell === "U" || cell === "D" ? "#222" : "#fff")
      : "";
  const label = cell === BLANK ? "empty" : COLOR_NAME[cell];
  return `<button class="sticker ${cell === BLANK ? "blank" : ""}" data-i="${i}" ${fill} ${center ? "disabled" : ""} aria-label="${label}${center ? " center" : ""}">${mark}</button>`;
}

export function mountSolveMine(root: HTMLElement, mode: string | undefined): Screen {
  if (mode === "guide") return mountGuide(root);
  if (mode === "scan") return mountScan(root);
  return mountEnter(root, mode === "check");
}

function mountEnter(root: HTMLElement, fromScan = false): Screen {
  const ada = loadSettings().ada;
  let cells = loadEntered();
  let brush: Face = "U";

  const net = (["U", "L", "F", "R", "B", "D"] as Face[])
    .map((f) => {
      const k = FACES.indexOf(f);
      return `<div class="face face-${f}" title="${FACE_HINT[f]}">${Array.from({ length: 9 }, (_, j) => stickerHtml(cells[k * 9 + j], k * 9 + j, ada)).join("")}</div>`;
    })
    .join("");

  root.innerHTML = `
    <main class="solve-mine">
      <h2>Solve my cube</h2>
      ${
        fromScan
          ? `<p class="check-note">Scanned! <strong>Compare each face with your cube</strong> and tap to fix any wrong color. Red and orange are the usual mix-up.</p>`
          : `<a class="button primary scan-link" href="#/solve/scan">📷 Scan with camera</a>
      <p class="or">or tap the colors in:</p>`
      }
      <ol class="how">
        <li>Hold your cube with <strong>white on top</strong> and <strong>green in front</strong>.</li>
        <li>Pick a color, then tap stickers to match your cube.</li>
        <li>Tap <strong>Check &amp; solve</strong>.</li>
      </ol>
      <div class="net">${net}</div>
      <div class="palette" role="radiogroup" aria-label="Color to paint">
        ${FACES.map(
          (
            f,
          ) => `<button class="swatch" role="radio" data-color="${f}" style="background:${STICKER_COLOR[f]}" aria-label="${COLOR_NAME[f]}">
            ${ada ? shapeSvg(ADA_SHAPE[f], f === "U" || f === "D" ? "#222" : "#fff") : ""}<span class="count"></span></button>`,
        ).join("")}
      </div>
      <ul class="problems" role="alert"></ul>
      <div class="actions two">
        <button id="clear">Clear</button>
        <button id="go" class="primary">Check &amp; solve</button>
      </div>
      <p class="faces-help">${(["U", "F", "R", "B", "L", "D"] as Face[]).map((f) => `<span>${FACE_HINT[f]}</span>`).join("")}</p>
    </main>`;

  const problemsEl = root.querySelector<HTMLElement>(".problems")!;
  const refreshPalette = () => {
    root.querySelectorAll<HTMLElement>(".swatch").forEach((b) => {
      const f = b.dataset.color as Face;
      b.setAttribute("aria-checked", String(f === brush));
      b.classList.toggle("on", f === brush);
      b.querySelector(".count")!.textContent = `${cells.filter((c) => c === f).length}/9`;
    });
  };
  const paint = (i: number) => {
    cells[i] = brush;
    const el = root.querySelector<HTMLElement>(`.sticker[data-i="${i}"]`)!;
    el.outerHTML = stickerHtml(brush, i, ada);
    saveEntered(cells);
    refreshPalette();
  };

  root.querySelector(".palette")!.addEventListener("click", (e) => {
    const f = (e.target as HTMLElement).closest<HTMLElement>("[data-color]")?.dataset.color;
    if (f) {
      brush = f as Face;
      refreshPalette();
    }
  });
  root.querySelector(".net")!.addEventListener("click", (e) => {
    const i = (e.target as HTMLElement).closest<HTMLElement>("[data-i]")?.dataset.i;
    if (i !== undefined) paint(Number(i));
  });
  root.querySelector("#clear")!.addEventListener("click", () => {
    cells = cells.map((c, i) => (i % 9 === 4 ? c : BLANK));
    saveEntered(cells);
    root.querySelectorAll<HTMLElement>(".sticker").forEach((el) => {
      const i = Number(el.dataset.i);
      el.outerHTML = stickerHtml(cells[i], i, ada);
    });
    problemsEl.innerHTML = "";
    refreshPalette();
  });
  root.querySelector("#go")!.addEventListener("click", () => {
    root.querySelectorAll(".sticker.bad").forEach((el) => el.classList.remove("bad"));
    const blanks = cells.filter((c) => c === BLANK).length;
    if (blanks) {
      problemsEl.innerHTML = `<li>${blanks} sticker${blanks > 1 ? "s are" : " is"} still empty.</li>`;
      return;
    }
    const state = cells as Face[];
    const problems = findProblems(state);
    if (!problems.length) {
      try {
        solveBeginner(state);
      } catch {
        problems.push({ message: UNSOLVABLE, stickers: [] });
      }
    }
    if (problems.length) {
      problemsEl.innerHTML = problems.map((p) => `<li>${p.message}</li>`).join("");
      for (const p of problems)
        for (const i of p.stickers)
          root.querySelector(`.sticker[data-i="${i}"]`)?.classList.add("bad");
      return;
    }
    location.hash = "#/solve/guide";
  });

  refreshPalette();
  return { dispose() {} };
}

/** Guide with the method the player has learned: CFOP once they've passed F2L pairs. */
function guideMethod() {
  return (loadProgress().levels["cfopF2l"]?.passes ?? 0) > 0 ? METHODS.cfop : METHODS.beginner;
}

function mountGuide(root: HTMLElement): Screen {
  const method = guideMethod();
  let start: CubeState;
  let steps: GuideStep[];
  try {
    start = fromString(loadEntered().join(""));
    steps = method.solve(start);
  } catch {
    location.hash = "#/solve";
    return { dispose() {} };
  }
  // Every move, with the step it belongs to.
  const moves = steps.flatMap((s, si) => s.moves.map((m, mi) => ({ m, si, mi })));
  let at = 0; // moves done
  let state = start;

  root.innerHTML = `
    <main class="guide">
      <div class="guide-head">
        <p class="stage-name"></p>
        <p class="step-say"></p>
        <p class="step-moves"></p>
      </div>
      <div class="stage"></div>
      <div class="bar-track"><div class="bar-fill"></div></div>
      <div class="actions three">
        <button id="back">◀ Back</button>
        <button id="next" class="primary">Next move ▶</button>
        <button id="step">Whole step</button>
      </div>
      <p class="hint-line">${method.name}. Do each move on your cube as it's shown. <a href="#/solve">Edit colors</a></p>
    </main>`;

  const view = new CubeView(root.querySelector(".stage")!, state, { ada: loadSettings().ada });
  const nameEl = root.querySelector<HTMLElement>(".stage-name")!;
  const sayEl = root.querySelector<HTMLElement>(".step-say")!;
  const movesEl = root.querySelector<HTMLElement>(".step-moves")!;
  const fill = root.querySelector<HTMLElement>(".bar-fill")!;
  const backBtn = root.querySelector<HTMLButtonElement>("#back")!;
  const nextBtn = root.querySelector<HTMLButtonElement>("#next")!;
  const stepBtn = root.querySelector<HTMLButtonElement>("#step")!;

  const render = () => {
    fill.style.width = `${(at / Math.max(1, moves.length)) * 100}%`;
    backBtn.disabled = at === 0;
    nextBtn.disabled = stepBtn.disabled = at >= moves.length;
    if (at >= moves.length) {
      nameEl.textContent = "Solved! 🎉";
      sayEl.textContent = `${moves.length} moves. Nice work.`;
      movesEl.innerHTML = "";
      return;
    }
    const { si, mi } = moves[at];
    const step = steps[si];
    nameEl.textContent = `${method.stageTitle[step.stage]} · move ${at + 1} of ${moves.length}`;
    sayEl.textContent = step.say;
    movesEl.innerHTML = step.moves
      .map((m, k) => `<span class="${k < mi ? "done" : k === mi ? "now" : ""}">${m}</span>`)
      .join(" ");
  };

  const forward = () => {
    if (at >= moves.length) return;
    state = applyMove(state, moves[at].m);
    void view.animate(moves[at].m, state);
    at++;
    render();
  };
  nextBtn.addEventListener("click", forward);
  backBtn.addEventListener("click", () => {
    if (at === 0) return;
    at--;
    const m = invertMove(moves[at].m);
    state = applyMove(state, m);
    void view.animate(m, state);
    render();
  });
  stepBtn.addEventListener("click", () => {
    const si = moves[at]?.si;
    while (at < moves.length && moves[at].si === si) forward();
  });

  // Test hook: ?finish=1 jumps to the end instantly (headless checks).
  if (new URLSearchParams(location.search).get("finish") === "1") {
    for (const x of moves) state = applyMove(state, x.m);
    at = moves.length;
    view.setState(state);
  }

  render();
  return { view, dispose: () => view.dispose() };
}
