// App frame: header (title, back, ADA support) and a simple hash router.
//   #/            home: level list
//   #/level/<id>  a lesson
//   #/play        free play

import type { CubeView } from "../render/cubeView";
import { mountHome } from "./home";
import { mountLesson } from "./lesson";
import { mountPractice } from "./practice";
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
    current?.view?.setAda(settings.ada);
  });

  function route() {
    current?.dispose();
    screenEl.innerHTML = "";
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    back.hidden = parts[0] === "";
    if (parts[0] === "level" && parts[1]) current = mountLesson(screenEl, parts[1]);
    else if (parts[0] === "play") current = mountPractice(screenEl);
    else current = mountHome(screenEl);
    // Test hook: ?ada=1 forces ADA shapes on without saving.
    if (new URLSearchParams(location.search).get("ada") === "1") {
      ada.checked = true;
      current.view?.setAda(true);
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
}
