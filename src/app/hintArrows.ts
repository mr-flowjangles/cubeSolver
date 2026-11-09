// Hint without letters: put the arrow on the cube for each move of a step, one at a time.
// The arrow moves on when the player makes that move, and goes away if they do something else.

import type { Move } from "../cube";
import type { CubeView } from "../render/cubeView";
import { swipesFor } from "../render/swipe";

export class HintArrows {
  private left: Move[] = [];

  constructor(private view: CubeView) {}

  /** Start pointing at the swipes that make these moves. */
  start(moves: readonly Move[]) {
    this.left = moves.flatMap(swipesFor);
    this.view.pointTo(this.left[0] ?? null);
  }

  /** Call on every move the player makes. */
  moved(m: Move) {
    if (!this.left.length) return;
    if (m === this.left[0]) this.left.shift();
    else this.left = [];
    this.view.pointTo(this.left[0] ?? null);
  }

  clear() {
    this.left = [];
    this.view.pointTo(null);
  }
}
