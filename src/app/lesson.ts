// One level. Stage levels are tutorials (stageLesson.ts), level 0 is controlsLesson.ts; this file runs
// the PLL level and the full solve.

import { type CubeState, applyMoves, isSolved, toString } from "../cube";
import { isUnlocked } from "../game/rules";
import { loadProgress } from "../game/storage";
import type { Level } from "../lessons/beginner";
import { ALL_LEVELS, type GuideStep, LEVEL_IDS, METHODS, stageDoneAnyHold } from "../lessons/index";
import { practicePosition } from "../lessons/position";
import { solveBeginner } from "../solver/beginner";
import { solvePll } from "../solver/cfop";
import { algButtonsHtml, onAlgTap } from "./algButtons";
import { type CubePanel, mountCubePanel } from "./cubePanel";
import { HintArrows } from "./hintArrows";
import { showPass } from "./reward";
import type { Screen } from "./shell";
import { mountControlsLesson } from "./controlsLesson";
import { mountStageLesson } from "./stageLesson";
import { chooseHelp } from "../lessons/walkthrough";

const algList = (level: Level) => algButtonsHtml(level.algs);

function passed(level: Level, p: CubePanel): boolean {
  if (level.kind === "full" || level.kind === "pll") return isSolved(p.state);
  return stageDoneAnyHold(level, p.state);
}

/** PLL from any hold: first turn white to the bottom (the player may have turned the cube). */
export function pllSteps(s: CubeState): GuideStep[] {
  const hold = solveBeginner(s, "hold").filter((x) => x.stage === "hold" && x.moves.length);
  return [
    ...hold,
    ...solvePll(
      applyMoves(
        s,
        hold.flatMap((x) => x.moves),
      ),
    ),
  ];
}

export function mountLesson(root: HTMLElement, id: string): Screen {
  const level = ALL_LEVELS.find((l) => l.id === id) ?? ALL_LEVELS[0];
  const next = ALL_LEVELS[ALL_LEVELS.indexOf(level) + 1];
  const method = METHODS[level.method];

  // Test hooks ?autoshow=1 and ?unlock=1 skip the lock (headless checks).
  const q = new URLSearchParams(location.search);
  const testHook = q.get("autoshow") === "1" || q.get("unlock") === "1";
  if (!testHook && !isUnlocked(loadProgress(), LEVEL_IDS, level.id)) {
    const prev = ALL_LEVELS[ALL_LEVELS.indexOf(level) - 1];
    root.innerHTML = `
      <main class="lesson locked">
        <h2><span class="num">🔒</span> ${level.title}</h2>
        <p>Pass <strong>${prev.title}</strong> first to unlock this level.</p>
        <a class="button primary" href="#/level/${prev.id}">Go to ${prev.title}</a>
      </main>`;
    return { dispose() {} };
  }

  if (level.kind === "stage") return mountStageLesson(root, level, next);
  if (level.kind === "notation") return mountControlsLesson(root, level, next);

  root.innerHTML = `
    <main class="lesson">
      <section class="intro">
        <h2><span class="num">${level.number}</span> ${level.title}</h2>
        <p class="goal">${level.goal}</p>
        <details ${level.number <= 1 || level.number === 9 || level.kind === "full" ? "open" : ""}>
          <summary>How it works</summary>
          <ul>${level.teach.map((t) => `<li>${t}</li>`).join("")}</ul>
        </details>
        ${
          level.algs.length > 4
            ? `<details class="algs" ${level.kind === "full" ? "open" : ""}><summary>Sequences (${level.algs.length})</summary>${algList(level)}</details>`
            : algList(level)
        }
      </section>
      <div class="panel"></div>
      <div class="actions">
        <button id="hint">Hint</button><button id="show">Show me</button>
        <button id="undo">Undo</button>
        <button id="fresh">New cube</button>
      </div>
      <div class="passed" hidden>
        <p>Level passed! 🎉</p>
        <div class="reward"></div>
        ${next ? `<a class="button primary" href="#/level/${next.id}">Next: ${next.title}</a>` : `<a class="button primary" href="#/">Back to levels</a>`}
      </div>
    </main>`;

  const passedEl = root.querySelector<HTMLElement>(".passed")!;
  let done = false;
  let usedHelp = false;
  let started = Date.now();

  const check = (p: CubePanel) => {
    if (!done && passed(level, p)) {
      done = true;
      showPass(passedEl, level, {
        usedHelp,
        moves: p.history.length,
        seconds: Math.round((Date.now() - started) / 1000),
      });
      p.say("Passed!");
    }
  };

  const panel = mountCubePanel(root.querySelector(".panel")!, practicePosition(level), {
    turns: level.method === "cfop" ? "cfop" : "beginner",
    onMove: (m, p) => {
      hints.moved(m);
      p.say(`Moves: ${p.history.length}`);
      check(p);
    },
  });
  const hints = new HintArrows(panel.view);
  panel.say("Hold white on the bottom. Use Hint if you get stuck.");

  // Follow one plan while the player stays on it. Re-planning mid-way would go wrong
  // in the twist stage, where the bottom is meant to look broken until it's done.
  let plan: { at: string; step: GuideStep }[] = [];
  const nextStep = (): GuideStep | undefined => {
    const now = toString(panel.state);
    const k = plan.findIndex((p) => p.at === now);
    if (k >= 0) return plan[k].step;
    let s: CubeState = panel.state;
    const planOf = (x: CubeState) =>
      level.kind === "pll"
        ? pllSteps(x)
        : method.solve(x, level.kind === "full" ? undefined : level.stage);
    // Finish a sequence the player started, or turn back a stray move, when that's shorter.
    const steps = chooseHelp(level, s, panel.history, planOf);
    plan = steps.map((step) => {
      const at = toString(s);
      s = applyMoves(s, step.moves);
      return { at, step };
    });
    return plan[0]?.step;
  };

  onAlgTap(root.querySelector(".intro")!, (name, moves) => {
    hints.start(moves);
    panel.say(`${name}: follow the arrow.`);
  });

  root.querySelector("#hint")?.addEventListener("click", () => {
    usedHelp = true;
    const step = nextStep();
    panel.say(step ? `${step.say} Follow the arrow.` : "Already done!");
    if (step) hints.start(step.moves);
  });
  root.querySelector("#show")?.addEventListener("click", async () => {
    usedHelp = true;
    const step = nextStep();
    if (!step) return;
    hints.clear();
    panel.say(step.say);
    await panel.play(step.moves);
    check(panel);
  });
  root.querySelector("#undo")!.addEventListener("click", () => {
    hints.clear();
    panel.undo();
  });
  root.querySelector("#fresh")!.addEventListener("click", () => {
    panel.setState(practicePosition(level));
    hints.clear();
    done = false;
    usedHelp = false;
    started = Date.now();
    passedEl.hidden = true;
    panel.say("New cube. Hold white on the bottom.");
  });

  // Test hook: ?autoshow=1 applies every "Show me" step instantly until the level is passed.
  // Instant because headless browsers may not run animation frames.
  if (new URLSearchParams(location.search).get("autoshow") === "1") {
    usedHelp = true;
    for (let i = 0; i < 40 && !done; i++) {
      const step = nextStep();
      if (!step) break;
      panel.setState(applyMoves(panel.state, step.moves));
      check(panel);
    }
  }

  return panel;
}
