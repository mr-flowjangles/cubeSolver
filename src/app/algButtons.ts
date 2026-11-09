// A level's sequences as buttons. Tap one and the arrow walks the player through it on the cube,
// so nobody has to read the letters (docs/02-levels.md → Controls). Letters stay as a small caption.

import { parseMoves } from "../cube";
import type { Level } from "../lessons/beginner";

export function algButtonsHtml(algs: Level["algs"]): string {
  return algs
    .map(
      (a) =>
        `<button type="button" class="alg" data-moves="${a.moves}"><span>▶ ${a.name}</span><code>${a.moves}</code></button>`,
    )
    .join("");
}

/** Call `pick` with the sequence's name and moves when one of its buttons is tapped inside `root`. */
export function onAlgTap(root: HTMLElement, pick: (name: string, moves: string[]) => void) {
  root.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("button.alg");
    if (!b) return;
    pick(b.querySelector("span")!.textContent!.replace("▶ ", ""), parseMoves(b.dataset.moves!));
  });
}
