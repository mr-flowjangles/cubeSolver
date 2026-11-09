// Level 0, the move letters, for a 10-year-old (docs/02-levels.md → Level 0).
//   Part 1  10 swipes, one letter each; the arrow shows where, one sentence says what it means
//   Part 2  the trick: R U R' U' six times takes a solved cube apart and back to solved
// Every move prints a line in a list under the cube.

import { type Move, isSolved, solved } from "../cube";
import { MAGIC, MAGIC_DID, MAGIC_ROUNDS, NOTATION_STEPS, type Level } from "../lessons/beginner";
import { mountCubePanel } from "./cubePanel";
import { showPass } from "./reward";
import type { Screen } from "./shell";

const LETTERS = NOTATION_STEPS.length;
const TRICK = MAGIC.length * MAGIC_ROUNDS;

export function mountLettersLesson(root: HTMLElement, level: Level, next?: Level): Screen {
  root.innerHTML = `
    <main class="lesson letters">
      <section class="intro">
        <h2><span class="num">${level.number}</span> ${level.title}</h2>
        <p class="goal">${level.goal}</p>
      </section>
      <p class="task" aria-live="polite"></p>
      <div class="panel"></div>
      <ol class="move-log" aria-label="Moves you made"></ol>
      <div class="actions two">
        <button id="undo">Undo</button>
        <button id="fresh">Start over</button>
      </div>
      <div class="passed" hidden>
        <p>Level passed! 🎉</p>
        <div class="reward"></div>
        ${next ? `<a class="button primary" href="#/level/${next.id}">Next: ${next.title}</a>` : `<a class="button primary" href="#/">Back to levels</a>`}
      </div>
    </main>`;

  const task = root.querySelector<HTMLElement>(".task")!;
  const log = root.querySelector<HTMLOListElement>(".move-log")!;
  const passedEl = root.querySelector<HTMLElement>(".passed")!;
  let at = 0; // 0..LETTERS-1: the letters; LETTERS..LETTERS+TRICK-1: the trick
  let started = Date.now();
  let done = false;

  /** The move asked for now. */
  const wanted = (): Move | undefined =>
    at < LETTERS
      ? NOTATION_STEPS[at].move
      : at < LETTERS + TRICK
        ? MAGIC[(at - LETTERS) % MAGIC.length]
        : undefined;

  const prompt = () => {
    const m = wanted();
    panel.view.highlight(m ?? null);
    panel.view.pointTo(m ?? null);
    if (at < LETTERS) {
      task.textContent = `${NOTATION_STEPS[at].say}  (${at + 1} of ${LETTERS})`;
    } else if (m) {
      const k = at - LETTERS;
      const round = Math.floor(k / MAGIC.length) + 1;
      task.textContent = `Trick, round ${round} of ${MAGIC_ROUNDS}: swipe ${m}. Keep going. Watch what happens!`;
    } else {
      task.textContent =
        "It's solved again! R U R' U' six times always brings the cube back. That's what a sequence is: moves you can count on.";
    }
  };

  const print = (text: string) => {
    const li = document.createElement("li");
    li.textContent = text;
    log.prepend(li);
  };

  const startTrick = () => {
    panel.setState(solved());
    print("Trick time: a fresh, solved cube.");
    panel.say("Now a trick. R U R' U' six times. The cube will get mixed up. Don't stop!");
  };

  const panel = mountCubePanel(root.querySelector(".panel")!, solved(), {
    turns: "beginner",
    onMove: (m, p) => {
      if (done) return;
      if (m !== wanted()) {
        p.say(`Oops, that was ${m}. Try again where the arrow shows.`);
        setTimeout(() => p.undo(), 250);
        return;
      }
      const did = at < LETTERS ? NOTATION_STEPS[at].did : MAGIC_DID[m];
      print(`${m}: ${did}`);
      at++;
      p.say(at < LETTERS + TRICK ? "Good!" : "");
      if (at === LETTERS) startTrick();
      else if (at > LETTERS && (at - LETTERS) % MAGIC.length === 0 && at < LETTERS + TRICK)
        print(`Round ${(at - LETTERS) / MAGIC.length} of ${MAGIC_ROUNDS} done.`);
      if (at === LETTERS + TRICK && isSolved(p.state)) {
        done = true;
        print("Solved again! 🎉");
        showPass(passedEl, level, {
          usedHelp: false,
          moves: LETTERS + TRICK,
          seconds: Math.round((Date.now() - started) / 1000),
        });
      }
      prompt();
    },
  });

  const restart = () => {
    at = 0;
    done = false;
    started = Date.now();
    log.innerHTML = "";
    passedEl.hidden = true;
    panel.setState(solved());
    panel.say("Swipe where the arrow shows.");
    prompt();
  };

  root.querySelector("#undo")!.addEventListener("click", () => {
    // Undo can't go back past the fresh cube at the start of the trick.
    if (done || at === 0 || at === LETTERS || !panel.history.length) return;
    panel.undo();
    at--;
    if (log.firstElementChild?.textContent?.startsWith("Round")) log.firstElementChild.remove();
    log.firstElementChild?.remove();
    prompt();
  });
  root.querySelector("#fresh")!.addEventListener("click", restart);

  restart();
  return panel;
}
