// What Hint and Show me say next. Follows one plan while the player stays on it, even partway
// through a step (one swipe into "turn the front twice", the next press says the second swipe).
// Re-planning mid-step would go wrong: from there, a fresh plan can undo the half-made move.

import { type CubeState, type Move, applyMoves, toString } from "../cube";
import type { GuideStep } from "../lessons/index";
import { swipesFor } from "../render/swipe";

export class HelpPlan {
  /** Every point of the plan, swipe by swipe, with the rest of its step from there. */
  private marks: { at: string; step: GuideStep }[] = [];
  /** Where in the plan Hint last pointed. Only points from here on count: a top turn can
   *  bring back the cube of an earlier point, and going back there would loop. */
  private at = 0;
  /** How many swipes the player had made when Hint last pointed. */
  private made = 0;

  constructor(private make: (s: CubeState, history: readonly Move[]) => GuideStep[]) {}

  next(state: CubeState, history: readonly Move[]): GuideStep | undefined {
    const now = toString(state);
    // 1. Where the player should be: the last point plus the swipes made since. A plan that turns
    //    and turns back ("F' F") comes back to an earlier cube, so matching the cube alone loops.
    const made = history.reduce((n, m) => n + swipesFor(m).length, 0); // Show me plays U2 as one move
    const want = this.at + (made - this.made);
    this.made = made;
    if (want >= this.at && this.marks[want]?.at === now) {
      this.at = want;
      return this.marks[want].step;
    }
    // 2. Else the furthest point on from there with this cube.
    let i = -1;
    for (let k = this.marks.length - 1; k >= this.at && i < 0; k--)
      if (this.marks[k].at === now) i = k;
    if (i >= 0) {
      this.at = i;
      return this.marks[i].step;
    }
    // 3. Off the plan: a new one.
    this.marks = [];
    this.at = 0;
    let s = state;
    for (const step of this.make(state, history)) {
      const sw = step.moves.flatMap((m) => swipesFor(m));
      sw.forEach((_, j) => {
        this.marks.push({
          at: toString(s),
          // From partway in, the rest of the step. Its own words would give the whole count
          // ("do Corner 5 times" with 4 left), so they say how many are left (kid test, round 12).
          step:
            j === 0
              ? step
              : { ...step, moves: sw.slice(j), why: undefined, say: keepGoing(sw.length - j) },
        });
        s = applyMoves(s, [sw[j]]);
      });
    }
    return this.marks[0]?.step;
  }

  clear() {
    this.marks = [];
    this.at = 0;
    this.made = 0;
  }
}

/** What Hint says partway into a step: how many swipes are left, as the arrows show them. */
function keepGoing(n: number): string {
  return `Keep going with this step: ${n} more ${n === 1 ? "move" : "moves"}.`;
}
