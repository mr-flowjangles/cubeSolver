// What Hint and Show me say next. Follows one plan while the player stays on it, even partway
// through a step (one swipe into "turn the front twice", the next press says the second swipe).
// Re-planning mid-step would go wrong: from there, a fresh plan can undo the half-made move.

import { type CubeState, type Move, applyMoves, toString } from "../cube";
import type { GuideStep } from "../lessons/index";
import { swipesFor } from "../render/swipe";

export class HelpPlan {
  /** Every point of the plan, swipe by swipe, with the rest of its step from there. */
  private marks: { at: string; step: GuideStep }[] = [];

  constructor(private make: (s: CubeState, history: readonly Move[]) => GuideStep[]) {}

  next(state: CubeState, history: readonly Move[]): GuideStep | undefined {
    const now = toString(state);
    const hit = this.marks.find((m) => m.at === now);
    if (hit) return hit.step;
    this.marks = [];
    let s = state;
    for (const step of this.make(state, history)) {
      const sw = step.moves.flatMap((m) => swipesFor(m));
      sw.forEach((_, j) => {
        this.marks.push({
          at: toString(s),
          // From partway in, the rest of the step; its words still say what the step is for.
          step: j === 0 ? step : { ...step, moves: sw.slice(j), why: undefined },
        });
        s = applyMoves(s, [sw[j]]);
      });
    }
    return this.marks[0]?.step;
  }

  clear() {
    this.marks = [];
  }
}
