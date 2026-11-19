// App frame: header (title, back, ADA support, Read aloud) and a simple hash router.
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
import { onReplay } from "./line";
import { voice } from "./speech";

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
      <label class="toggle" title="Reads lesson lines out loud">
        <input type="checkbox" id="speak" ${settings.readAloud ? "checked" : ""} />
        <span>Read aloud</span>
      </label>
    </header>
    <div class="screen" id="screen"></div>`;
  const screenEl = root.querySelector<HTMLElement>("#screen")!;
  const back = root.querySelector<HTMLElement>(".back")!;
  const ada = root.querySelector<HTMLInputElement>("#ada")!;
  let current: Screen | null = null;

  // Speech (docs/02-levels.md → The app speaks):
  // 1. Phones allow sound only from a tap, so the first tap anywhere starts the voice. On an
  //    iPhone only a click (or a key) counts: lines started from a touch's start or end are
  //    dropped without a word (iPhone Simulator, v0.8.18). A tap on 🔊 starts the voice itself.
  const unlock = (e: Event) => {
    if (!(e.target as Element | null)?.closest?.(".replay")) voice.unlock();
  };
  for (const ev of ["click", "keydown"]) document.addEventListener(ev, unlock, { capture: true });
  // 2. Every 🔊 says its line again.
  onReplay(screenEl);
  // 3. The Read aloud switch.
  const speak = root.querySelector<HTMLInputElement>("#speak")!;
  speak.addEventListener("change", () => {
    settings.readAloud = speak.checked;
    saveSettings(settings);
    if (!speak.checked) voice.stop();
  });

  ada.addEventListener("change", () => {
    settings.ada = ada.checked;
    saveSettings(settings);
    // Screens with a 3D cube repaint it; others (like the flat cube map) redraw.
    if (current?.view) current.view.setAda(settings.ada);
    else route();
  });

  function route() {
    current?.dispose();
    voice.stop(); // a new screen: stop reading the old one
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
