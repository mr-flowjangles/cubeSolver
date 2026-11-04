// One level: what it teaches, a practice cube, Hint / Show me, and the pass check.

import { type CubeState, applyMoves, scramble, solved, toString } from "../cube";
import { BEGINNER_LEVELS, type Level, NOTATION_DRILL } from "../lessons/beginner";
import { practicePosition } from "../lessons/position";
import {
  STAGES,
  STAGE_DONE,
  type SolveStep,
  type StageId,
  solveBeginner,
  stateAfter,
} from "../solver/beginner";
import { type CubePanel, mountCubePanel } from "./cubePanel";
import type { Screen } from "./shell";

function passed(level: Level, p: CubePanel, drillIndex: number): boolean {
  if (level.kind === "notation") return drillIndex >= NOTATION_DRILL.length;
  const stage: StageId = level.kind === "full" ? "yellowCornersTwist" : level.stage!;
  return STAGE_DONE[stage](p.state);
}

export function mountLesson(root: HTMLElement, id: string): Screen {
  const level = BEGINNER_LEVELS.find((l) => l.id === id) ?? BEGINNER_LEVELS[0];
  const next = BEGINNER_LEVELS[BEGINNER_LEVELS.indexOf(level) + 1];
  const isDrill = level.kind === "notation";

  root.innerHTML = `
    <main class="lesson">
      <section class="intro">
        <h2><span class="num">${level.number}</span> ${level.title}</h2>
        <p class="goal">${level.goal}</p>
        <details ${level.number <= 1 ? "open" : ""}>
          <summary>How it works</summary>
          <ul>${level.teach.map((t) => `<li>${t}</li>`).join("")}</ul>
        </details>
        ${level.algs
          .map((a) => `<p class="alg"><span>${a.name}</span><code>${a.moves}</code></p>`)
          .join("")}
      </section>
      <div class="panel"></div>
      <div class="actions ${isDrill ? "two" : ""}">
        ${isDrill ? "" : `<button id="hint">Hint</button><button id="show">Show me</button>`}
        <button id="undo">Undo</button>
        <button id="fresh">${isDrill ? "Start over" : "New cube"}</button>
      </div>
      <div class="passed" hidden>
        <p>Level passed! 🎉</p>
        ${next ? `<a class="button primary" href="#/level/${next.id}">Next: ${next.title}</a>` : `<a class="button primary" href="#/">Back to levels</a>`}
      </div>
    </main>`;

  const passedEl = root.querySelector<HTMLElement>(".passed")!;
  let drill = 0;
  let done = false;

  const drillPrompt = () =>
    `Turn: ${NOTATION_DRILL[drill]}   (${drill + 1} of ${NOTATION_DRILL.length})`;

  const check = (p: CubePanel) => {
    if (!done && passed(level, p, drill)) {
      done = true;
      passedEl.hidden = false;
      p.say("Passed!");
      passedEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  const panel = mountCubePanel(root.querySelector(".panel")!, practicePosition(level), {
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
  // White cross and corners are on the bottom: look from below so the player can see them.
  if (level.stage === "cross" || level.stage === "corners") panel.view.lookFrom("below");

  // Follow one plan while the player stays on it. Re-planning mid-way would go wrong
  // in the twist stage, where the bottom is meant to look broken until it's done.
  let plan: { at: string; step: SolveStep }[] = [];
  const nextStep = (): SolveStep | undefined => {
    const now = toString(panel.state);
    const k = plan.findIndex((p) => p.at === now);
    if (k >= 0) return plan[k].step;
    const stage = level.kind === "full" ? undefined : level.stage;
    let s: CubeState = panel.state;
    plan = solveBeginner(s, stage).map((step) => {
      const at = toString(s);
      s = applyMoves(s, step.moves);
      return { at, step };
    });
    return plan[0]?.step;
  };

  root.querySelector("#hint")?.addEventListener("click", () => {
    const step = nextStep();
    panel.say(step ? `${step.say}  →  ${step.moves.join(" ")}` : "Already done!");
  });
  root.querySelector("#show")?.addEventListener("click", async () => {
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
    passedEl.hidden = true;
    panel.say(isDrill ? drillPrompt() : "New cube. Hold white on the bottom.");
  });

  // Test hook: ?autoshow=1 applies every "Show me" step instantly until the level is passed.
  // Instant because headless browsers may not run animation frames.
  if (new URLSearchParams(location.search).get("autoshow") === "1" && !isDrill) {
    for (let i = 0; i < 40 && !done; i++) {
      const step = nextStep();
      if (!step) break;
      panel.setState(applyMoves(panel.state, step.moves));
      check(panel);
    }
  }

  return panel;
}
