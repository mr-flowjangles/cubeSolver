// Home: the list of levels, plus free play.

import { BEGINNER_LEVELS } from "../lessons/beginner";
import type { Screen } from "./shell";

export function mountHome(root: HTMLElement): Screen {
  root.innerHTML = `
    <main class="home">
      <p class="lede">Learn to solve a Rubik's cube, one level at a time.</p>
      <h2>Beginner method</h2>
      <ol class="levels">
        ${BEGINNER_LEVELS.map(
          (l) => `
          <li><a class="level" href="#/level/${l.id}">
            <span class="num">${l.number}</span>
            <span class="text"><strong>${l.title}</strong><small>${l.goal}</small></span>
          </a></li>`,
        ).join("")}
      </ol>
      <a class="level free" href="#/play">
        <span class="num">∞</span>
        <span class="text"><strong>Free play</strong><small>Turn and scramble the cube however you like.</small></span>
      </a>
    </main>`;
  return { dispose() {} };
}
