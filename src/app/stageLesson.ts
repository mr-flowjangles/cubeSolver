// A stage level as a tutorial, in three parts:
//   1 Show it          the app does the stage on a demo cube, slowly, saying why each move is made
//   2 Walk through it  the player does the same moves; an arrow shows each swipe, wrong turns are undone
//   3 Try it           practice cubes on their own, easy first, with Hint and Show me
// See docs/02-levels.md → "Every level is a tutorial".

import { type CubeState, type Move, applyMoves, findPiece, slot, toString } from "../cube";
import type { Level } from "../lessons/beginner";
import { type GuideStep, METHODS, stageDoneAnyHold } from "../lessons/index";
import { moveWords } from "../lessons/moveWords";
import { PRACTICE_RAMP, practicePosition } from "../lessons/position";
import { type GuideMove, demoPosition, guideMoves, stageSteps } from "../lessons/walkthrough";
import { WHOLE_CUBE, reorient, stickerMap } from "../render/swipe";
import { algButtonsHtml, onAlgTap } from "./algButtons";
import { type CubePanel, mountCubePanel } from "./cubePanel";
import { HintArrows } from "./hintArrows";
import { showPass } from "./reward";
import type { Screen } from "./shell";

type Phase = "show" | "walk" | "try";

const PHASE_TITLE: Record<Phase, string> = {
  show: "1 · Show it",
  walk: "2 · Walk through it",
  try: "3 · Try it",
};
const PHASE_HELP: Record<Phase, string> = {
  show: "Watch the app do it. Lit squares are the piece being moved and where it goes.",
  walk: "Now you do it. Swipe where the arrow shows. Each move says why.",
  try: "On your own now. Three cubes: the first is nearly done, the last is fully mixed.",
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function mountStageLesson(root: HTMLElement, level: Level, next?: Level): Screen {
  const method = METHODS[level.method];
  const cfop = level.method === "cfop";
  const demo = demoPosition(level);
  const guide = guideMoves(stageSteps(level, demo));
  // White cross is built on top (the daisy), then shows on the bottom when done.
  const lookWork = ["corners", "f2l"].includes(level.stage!) ? "below" : "above";
  const lookDone = ["cross", "corners", "f2l"].includes(level.stage!) ? "below" : "above";

  root.innerHTML = `
    <main class="lesson">
      <section class="intro">
        <h2><span class="num">${level.number}</span> ${level.title}</h2>
        <p class="goal">${level.goal}</p>
        <details open>
          <summary>How it works</summary>
          <ul>${level.teach.map((t) => `<li>${t}</li>`).join("")}</ul>
        </details>
        ${algButtonsHtml(level.algs)}
      </section>
      <nav class="phases" aria-label="Lesson parts">
        ${(["show", "walk", "try"] as Phase[])
          .map((p) => `<button data-phase="${p}">${PHASE_TITLE[p]}</button>`)
          .join("")}
      </nav>
      <p class="phase-help"></p>
      <div class="guide" aria-live="polite">
        <p class="guide-part"></p>
        <p class="guide-say"></p>
        <p class="guide-move"></p>
      </div>
      <div class="panel"></div>
      <div class="actions"></div>
      <div class="passed" hidden>
        <p>Level passed! 🎉</p>
        <div class="reward"></div>
        ${next ? `<a class="button primary" href="#/level/${next.id}">Next: ${next.title}</a>` : `<a class="button primary" href="#/">Back to levels</a>`}
      </div>
    </main>`;

  const $ = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const actions = $(".actions");
  const guideEl = $(".guide");
  const passedEl = $(".passed");

  let phase: Phase = "show";
  let at = 0; // next guide move (show and walk)
  let playing = false;
  let practice = 0; // which practice cube (try)
  let usedHelp = false;
  let started = Date.now();
  let passed = false;
  let cubeDone = false;
  // Whole-cube turns the player made during Walk through it. The moves left are renamed
  // for the new front, so the player can turn the cube whenever they like.
  let turned: Move[] = [];
  const shown = (g: GuideMove) => reorient(g.move, turned);

  const light = (g: GuideMove | undefined, s: CubeState) => {
    if (!g?.piece) return panel.view.spotlight(null);
    const map = stickerMap(turned);
    const lit = [...findPiece(s, g.piece).stickers, ...(g.to ? slot(g.to).stickers.map(map) : [])];
    panel.view.spotlight(lit);
  };

  /** Say what the next guide move is, light its piece, point the arrow at the swipe. */
  const present = () => {
    const g = guide[at];
    guideEl.hidden = false;
    if (!g) {
      $(".guide-part").textContent = "";
      $(".guide-say").textContent = `Done: ${level.goal}`;
      $(".guide-move").textContent =
        phase === "show"
          ? "Now you do it: press Walk through it."
          : "You did it! Now press Try it.";
      panel.view.pointTo(null);
      panel.view.spotlight(null);
      panel.view.lookFrom(lookDone);
      return;
    }
    $(".guide-part").textContent = g.part
      ? `${g.part} · step ${g.step + 1} of ${g.steps}`
      : `Step ${g.step + 1} of ${g.steps}`;
    $(".guide-say").textContent = g.say;
    $(".guide-move").textContent = g.why ?? moveWords(shown(g));
    panel.view.pointTo(shown(g));
    light(g, panel.state);
  };

  const panel: CubePanel = mountCubePanel($(".panel"), demo, {
    turns: cfop ? "cfop" : "beginner",
    onMove: (m, p) => {
      if (phase === "show") {
        p.say("Just watch for now. Press Walk through it to do it yourself.");
        setTimeout(() => p.undo(), 250);
      } else if (phase === "walk") {
        const g = guide[at];
        if (g && m === shown(g)) {
          at++;
          p.say(at < guide.length ? "Good!" : "");
          present();
        } else if (WHOLE_CUBE.includes(m)) {
          turned.push(m);
          p.say("You turned the cube. The moves now match the new front.");
          present();
        } else {
          p.say("That wasn't the arrow's move. Undoing it — follow the arrow.");
          setTimeout(() => p.undo(), 250);
        }
      } else {
        hints.moved(m);
        p.say(`Moves: ${p.history.length}`);
        checkCube();
      }
    },
  });
  const hints = new HintArrows(panel.view);

  // ---- Show it ----
  const playShow = async () => {
    if (playing) {
      playing = false;
      return;
    }
    if (at >= guide.length) restartDemo();
    playing = true;
    setActions();
    while (playing && at < guide.length) {
      present();
      await wait(1400);
      if (!playing || phase !== "show") break;
      await panel.play([guide[at].move], 550);
      at++;
    }
    playing = false;
    if (phase === "show") {
      present();
      setActions();
    }
  };

  const restartDemo = () => {
    playing = false;
    at = 0;
    turned = [];
    panel.setState(demo);
    panel.view.lookFrom(lookWork);
    panel.say("");
    present();
  };

  // ---- Try it ----
  const newCube = () => {
    const left = PRACTICE_RAMP[Math.min(practice, PRACTICE_RAMP.length - 1)];
    panel.setState(practicePosition(level, Math.random, left));
    panel.view.lookFrom(lookWork);
    panel.view.spotlight(null);
    hints.clear();
    plan = [];
    cubeDone = false;
    started = Date.now();
    panel.say(
      practice === 0
        ? `Cube 1 of 3: almost done — one step left.`
        : practice === 1
          ? `Cube 2 of 3: a few steps left.`
          : `Cube 3 of 3: the whole step, from a mixed cube.`,
    );
    setActions();
  };

  const checkCube = () => {
    if (cubeDone || !stageDoneAnyHold(level, panel.state)) return;
    cubeDone = true;
    panel.view.lookFrom(lookDone);
    if (practice < PRACTICE_RAMP.length - 1) {
      panel.say(`Cube ${practice + 1} done! Press Next cube.`);
      setActions();
      return;
    }
    if (!passed) {
      passed = true;
      showPass(passedEl, level, {
        usedHelp,
        moves: panel.history.length,
        seconds: Math.round((Date.now() - started) / 1000),
      });
    }
    panel.say("Passed!");
    setActions();
  };

  // Follow one plan while the player stays on it (see lesson.ts).
  let plan: { at: string; step: GuideStep }[] = [];
  const nextStep = (): GuideStep | undefined => {
    const now = toString(panel.state);
    const k = plan.findIndex((p) => p.at === now);
    if (k >= 0) return plan[k].step;
    let s: CubeState = panel.state;
    plan = stageSteps(level, s).map((step) => {
      const at = toString(s);
      s = applyMoves(s, step.moves);
      return { at, step };
    });
    return plan[0]?.step;
  };

  // ---- Phase switching and buttons ----
  const setActions = () => {
    const b = (id: string, label: string, cls = "") =>
      `<button id="${id}" class="${cls}">${label}</button>`;
    if (phase === "show") {
      actions.className = "actions two";
      actions.innerHTML =
        b(
          "play",
          playing ? "⏸ Pause" : at >= guide.length ? "▶ Watch again" : "▶ Play",
          "primary",
        ) + b("walk", "Walk through it →");
    } else if (phase === "walk") {
      actions.className = "actions two";
      actions.innerHTML = b("restart", "Start over") + b("totry", "Try it →");
    } else {
      actions.className = "actions";
      const nextCube = cubeDone && practice < PRACTICE_RAMP.length - 1;
      actions.innerHTML =
        b("hint", "Hint") +
        b("show", "Show me") +
        b("undo", "Undo") +
        (nextCube ? b("nextcube", "Next cube →", "primary") : b("fresh", "New cube"));
    }
  };

  const setPhase = (p: Phase) => {
    playing = false;
    phase = p;
    root.querySelectorAll<HTMLElement>(".phases button").forEach((b) => {
      b.classList.toggle("current", b.dataset.phase === p);
      b.setAttribute("aria-current", String(b.dataset.phase === p));
    });
    $(".phase-help").textContent = PHASE_HELP[p];
    if (p === "try") {
      guideEl.hidden = true;
      practice = 0;
      newCube();
    } else {
      restartDemo();
      setActions();
    }
  };

  actions.addEventListener("click", async (e) => {
    const id = (e.target as HTMLElement).closest("button")?.id;
    if (id === "play") void playShow();
    else if (id === "walk") setPhase("walk");
    else if (id === "totry") setPhase("try");
    else if (id === "restart") restartDemo();
    else if (id === "nextcube") {
      practice++;
      newCube();
    } else if (id === "fresh") newCube();
    else if (id === "undo") {
      hints.clear();
      panel.undo();
    } else if (id === "hint") {
      usedHelp = true;
      const step = nextStep();
      panel.say(step ? `${step.say} Follow the arrow.` : "Already done!");
      if (step) hints.start(step.moves);
    } else if (id === "show") {
      usedHelp = true;
      const step = nextStep();
      if (!step) return;
      hints.clear();
      panel.say(step.say);
      await panel.play(step.moves);
      checkCube();
    }
  });
  // Tap a sequence: the arrow walks through it. Practice only, so the demo cube stays as shown.
  onAlgTap($(".intro"), (name, moves) => {
    if (phase !== "try")
      return panel.say("Press Try it, then tap a sequence to follow its arrows.");
    hints.start(moves);
    panel.say(`${name}: follow the arrow.`);
  });
  root.querySelector(".phases")!.addEventListener("click", (e) => {
    const p = (e.target as HTMLElement).closest<HTMLElement>("[data-phase]")?.dataset.phase;
    if (p) setPhase(p as Phase);
  });

  setPhase("show");

  // Test hook: ?autoshow=1 does every practice cube instantly with Show me's steps.
  if (new URLSearchParams(location.search).get("autoshow") === "1") {
    setPhase("try");
    usedHelp = true;
    for (let c = 0; c < PRACTICE_RAMP.length && !passed; c++) {
      if (c > 0) {
        practice = c;
        newCube();
      }
      for (const st of stageSteps(level, panel.state))
        panel.setState(applyMoves(panel.state, st.moves));
      checkCube();
    }
  }

  return {
    dispose() {
      playing = false;
      panel.dispose();
    },
  };
}
