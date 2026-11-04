// One level: what it teaches, a practice cube, Hint / Show me, and the pass check.

import { type CubeState, applyMoves, isSolved, toString } from "../cube";
import { isUnlocked, rankOf, recordPass } from "../game/rules";
import { loadProgress, saveProgress, today } from "../game/storage";
import { type Level, NOTATION_DRILL } from "../lessons/beginner";
import { ALL_LEVELS, BEGINNER_IDS, type GuideStep, LEVEL_IDS, METHODS } from "../lessons/index";
import { practicePosition } from "../lessons/position";
import { solvePll } from "../solver/cfop";
import { CFOP_PAD, type CubePanel, mountCubePanel } from "./cubePanel";
import type { Screen } from "./shell";

const algList = (level: Level) =>
  level.algs
    .map((a) => `<p class="alg"><span>${a.name}</span><code>${a.moves}</code></p>`)
    .join("");

function passed(level: Level, p: CubePanel, drillIndex: number): boolean {
  if (level.kind === "notation") return drillIndex >= NOTATION_DRILL.length;
  if (level.kind === "full" || level.kind === "pll") return isSolved(p.state);
  return METHODS[level.method].done[level.stage!](p.state);
}

export function mountLesson(root: HTMLElement, id: string): Screen {
  const level = ALL_LEVELS.find((l) => l.id === id) ?? ALL_LEVELS[0];
  const next = ALL_LEVELS[ALL_LEVELS.indexOf(level) + 1];
  const isDrill = level.kind === "notation";
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

  root.innerHTML = `
    <main class="lesson">
      <section class="intro">
        <h2><span class="num">${level.number}</span> ${level.title}</h2>
        <p class="goal">${level.goal}</p>
        <details ${level.number <= 1 || level.number === 9 ? "open" : ""}>
          <summary>How it works</summary>
          <ul>${level.teach.map((t) => `<li>${t}</li>`).join("")}</ul>
        </details>
        ${
          level.algs.length > 4
            ? `<details class="algs"><summary>Sequences (${level.algs.length})</summary>${algList(level)}</details>`
            : algList(level)
        }
      </section>
      <div class="panel"></div>
      <div class="actions ${isDrill ? "two" : ""}">
        ${isDrill ? "" : `<button id="hint">Hint</button><button id="show">Show me</button>`}
        <button id="undo">Undo</button>
        <button id="fresh">${isDrill ? "Start over" : "New cube"}</button>
      </div>
      <div class="passed" hidden>
        <p>Level passed! 🎉</p>
        <div class="reward"></div>
        ${next ? `<a class="button primary" href="#/level/${next.id}">Next: ${next.title}</a>` : `<a class="button primary" href="#/">Back to levels</a>`}
      </div>
    </main>`;

  const passedEl = root.querySelector<HTMLElement>(".passed")!;
  let drill = 0;
  let done = false;
  let usedHelp = false;
  let started = Date.now();

  const drillPrompt = () =>
    `Turn: ${NOTATION_DRILL[drill]}   (${drill + 1} of ${NOTATION_DRILL.length})`;

  const check = (p: CubePanel) => {
    if (!done && passed(level, p, drill)) {
      done = true;
      const before = loadProgress();
      const r = recordPass(
        before,
        BEGINNER_IDS,
        level.id,
        {
          usedHelp,
          moves: p.history.length,
          seconds: Math.round((Date.now() - started) / 1000),
        },
        today(),
      );
      saveProgress(r.progress);
      const rankBefore = rankOf(before.xp).name;
      const rankNow = rankOf(r.progress.xp).name;
      passedEl.querySelector(".reward")!.innerHTML = `
        <p class="xp">+${r.xpGained} XP${!usedHelp && !isDrill ? " · no help!" : ""}</p>
        ${rankNow !== rankBefore ? `<p class="rankup">New rank: <strong>${rankNow}</strong></p>` : ""}
        ${r.newBadges.map((b) => `<p class="badge-new"><span>${b.icon}</span> Badge: <strong>${b.name}</strong></p>`).join("")}`;
      passedEl.hidden = false;
      p.say("Passed!");
      passedEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const panel = mountCubePanel(root.querySelector(".panel")!, practicePosition(level), {
    pad: level.method === "cfop" ? CFOP_PAD : undefined,
    onMove: (m, p) => {
      if (isDrill) {
        if (m === NOTATION_DRILL[drill]) {
          drill++;
          if (drill < NOTATION_DRILL.length) p.say(`Good! ${drillPrompt()}`);
        } else {
          p.say(`That was ${m}. Try ${NOTATION_DRILL[drill]}.`);
          setTimeout(() => p.undo(), 250);
        }
      } else {
        p.say(`Moves: ${p.history.length}`);
      }
      check(p);
    },
  });
  panel.say(isDrill ? drillPrompt() : "Hold white on the bottom. Use Hint if you get stuck.");
  // White cross and the first layer are on the bottom: look from below so the player can see them.
  if (["cross", "corners", "f2l"].includes(level.stage ?? "")) panel.view.lookFrom("below");

  // Follow one plan while the player stays on it. Re-planning mid-way would go wrong
  // in the twist stage, where the bottom is meant to look broken until it's done.
  let plan: { at: string; step: GuideStep }[] = [];
  const nextStep = (): GuideStep | undefined => {
    const now = toString(panel.state);
    const k = plan.findIndex((p) => p.at === now);
    if (k >= 0) return plan[k].step;
    let s: CubeState = panel.state;
    const steps =
      level.kind === "pll"
        ? solvePll(s)
        : method.solve(s, level.kind === "full" ? undefined : level.stage);
    plan = steps.map((step) => {
      const at = toString(s);
      s = applyMoves(s, step.moves);
      return { at, step };
    });
    return plan[0]?.step;
  };

  root.querySelector("#hint")?.addEventListener("click", () => {
    usedHelp = true;
    const step = nextStep();
    panel.say(step ? `${step.say}  →  ${step.moves.join(" ")}` : "Already done!");
  });
  root.querySelector("#show")?.addEventListener("click", async () => {
    usedHelp = true;
    const step = nextStep();
    if (!step) return;
    panel.say(`${step.say}  →  ${step.moves.join(" ")}`);
    await panel.play(step.moves);
    check(panel);
  });
  root.querySelector("#undo")!.addEventListener("click", () => {
    if (isDrill && drill > 0 && panel.history.length) drill--;
    panel.undo();
    if (isDrill) panel.say(drillPrompt());
  });
  root.querySelector("#fresh")!.addEventListener("click", () => {
    panel.setState(practicePosition(level));
    drill = 0;
    done = false;
    usedHelp = false;
    started = Date.now();
    passedEl.hidden = true;
    panel.say(isDrill ? drillPrompt() : "New cube. Hold white on the bottom.");
  });

  // Test hook: ?autoshow=1 applies every "Show me" step instantly until the level is passed.
  // Instant because headless browsers may not run animation frames.
  if (new URLSearchParams(location.search).get("autoshow") === "1" && !isDrill) {
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
