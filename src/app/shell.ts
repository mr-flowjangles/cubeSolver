// App frame: header (title, back, ADA support) and a simple hash router.
//   #/            home: level list
//   #/level/<id>  a lesson
//   #/play        free play
//   #/badges      badges
//   #/solve       solve my cube (enter, then #/solve/guide)
//   #/timer       timer for real-cube solves

import type { CubeView } from "../render/cubeView";
import { mountBadges } from "./badges";
import { mountHome } from "./home";
import { mountLesson } from "./lesson";
import { mountPractice } from "./practice";
import { mountSolveMine } from "./solveMine";
import { mountTimer } from "./timer";
import { loadSettings, saveSettings } from "./settings";

export interface Screen {
  view?: CubeView;
  dispose(): void;
}

export function mountShell(root: HTMLElement): void {
  const settings = loadSettings();
  root.innerHTML = `
    <header class="bar">
      <a class="back" href="#/" hidden>‹ Levels</a>
      <h1><a href="#/">Cube Solver</a></h1>
      <label class="toggle" title="Adds a shape to each sticker color">
        <input type="checkbox" id="ada" ${settings.ada ? "checked" : ""} />
        <span>ADA support</span>
      </label>
    </header>
    <div class="screen" id="screen"></div>`;
  const screenEl = root.querySelector<HTMLElement>("#screen")!;
  const back = root.querySelector<HTMLElement>(".back")!;
  const ada = root.querySelector<HTMLInputElement>("#ada")!;
  let current: Screen | null = null;

  ada.addEventListener("change", () => {
    settings.ada = ada.checked;
    saveSettings(settings);
    // Screens with a 3D cube repaint it; others (like the flat cube map) redraw.
    if (current?.view) current.view.setAda(settings.ada);
    else route();
  });

  function route() {
    current?.dispose();
    screenEl.innerHTML = "";
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    back.hidden = parts[0] === "";
    if (parts[0] === "level" && parts[1]) current = mountLesson(screenEl, parts[1]);
    else if (parts[0] === "play") current = mountPractice(screenEl);
    else if (parts[0] === "badges") current = mountBadges(screenEl);
    else if (parts[0] === "solve") current = mountSolveMine(screenEl, parts[1]);
    else if (parts[0] === "timer") current = mountTimer(screenEl);
    else current = mountHome(screenEl);
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
}
