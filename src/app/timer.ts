// Timer for real-cube solves: scramble, tap to start, tap to stop, best and average of 5.

import { scramble } from "../cube";
import { recordTimedSolve } from "../game/rules";
import { loadProgress, saveProgress, today } from "../game/storage";
import { formatTime, loadTimes, saveTimes, stats } from "../game/times";
import type { Screen } from "./shell";

export function mountTimer(root: HTMLElement): Screen {
  root.innerHTML = `
    <main class="timer">
      <h2>Timer</h2>
      <p class="scramble-line"><span class="label">Scramble</span> <code id="scr"></code></p>
      <button id="newscr" class="small">New scramble</button>
      <button class="clock" id="clock" aria-live="off">0.00</button>
      <p class="clock-help">Scramble your cube, then tap the clock (or press Space) to start. Tap again to stop.</p>
      <p class="badge-line" role="status"></p>
      <div class="stats">
        <div><span>Best</span><strong id="best">—</strong></div>
        <div><span>Average of 5</span><strong id="ao5">—</strong></div>
        <div><span>Solves</span><strong id="count">0</strong></div>
      </div>
      <ol class="times" reversed></ol>
    </main>`;

  const scrEl = root.querySelector<HTMLElement>("#scr")!;
  const clock = root.querySelector<HTMLButtonElement>("#clock")!;
  const badgeLine = root.querySelector<HTMLElement>(".badge-line")!;
  let current = scramble(20).join(" ");
  let startedAt = 0;
  let tick = 0;

  const showStats = () => {
    const list = loadTimes();
    const s = stats(list);
    root.querySelector("#best")!.textContent = formatTime(s.best);
    root.querySelector("#ao5")!.textContent = formatTime(s.ao5);
    root.querySelector("#count")!.textContent = String(s.count);
    root.querySelector(".times")!.innerHTML = list
      .slice(-12)
      .reverse()
      .map(
        (t, k) =>
          `<li><span>${formatTime(t.seconds)}</span><button class="del" data-k="${list.length - 1 - k}" aria-label="Delete this time">✕</button></li>`,
      )
      .join("");
  };
  const newScramble = () => {
    current = scramble(20).join(" ");
    scrEl.textContent = current;
  };

  const toggle = () => {
    if (!startedAt) {
      startedAt = performance.now();
      badgeLine.textContent = "";
      clock.classList.add("running");
      const run = () => {
        clock.textContent = formatTime((performance.now() - startedAt) / 1000);
        tick = requestAnimationFrame(run);
      };
      run();
      return;
    }
    cancelAnimationFrame(tick);
    const seconds = Math.round((performance.now() - startedAt) / 10) / 100;
    startedAt = 0;
    clock.classList.remove("running");
    clock.textContent = formatTime(seconds);
    saveTimes([...loadTimes(), { seconds, scramble: current, date: today() }]);
    const r = recordTimedSolve(loadProgress(), seconds, today());
    saveProgress(r.progress);
    badgeLine.innerHTML = r.newBadges
      .map((b) => `${b.icon} Badge: <strong>${b.name}</strong>`)
      .join(" · ");
    newScramble();
    showStats();
  };

  clock.addEventListener("click", toggle);
  root.querySelector("#newscr")!.addEventListener("click", newScramble);
  root.querySelector(".times")!.addEventListener("click", (e) => {
    const k = (e.target as HTMLElement).closest<HTMLElement>(".del")?.dataset.k;
    if (k === undefined) return;
    const list = loadTimes();
    list.splice(Number(k), 1);
    saveTimes(list);
    showStats();
  });
  const onKey = (e: KeyboardEvent) => {
    if (e.code === "Space" && document.activeElement !== clock) {
      e.preventDefault();
      toggle();
    }
  };
  window.addEventListener("keydown", onKey);

  scrEl.textContent = current;
  showStats();
  return {
    dispose() {
      cancelAnimationFrame(tick);
      window.removeEventListener("keydown", onKey);
    },
  };
}
