import { describe, expect, it } from "vitest";
import { MAGIC_DID, NOTATION_STEPS } from "../src/lessons/beginner";
import { moveWords } from "../src/lessons/moveWords";

describe("moveWords", () => {
  it("says the same thing as level 0, which the arrows were checked against", () => {
    const steps = [...NOTATION_STEPS.map((s) => [s.move, s.did]), ...Object.entries(MAGIC_DID)];
    for (const [m, did] of steps.filter(([m]) => /^[RLUD]'?$/.test(m)))
      expect(moveWords(m).replace("goes", "went")).toBe(did);
  });
  it("has words for every move, half turns say twice", () => {
    for (const f of "RLUDFBMESxyz") {
      for (const m of [f, `${f}'`, `${f}2`])
        expect(moveWords(m)).not.toBe("Swipe where the arrow shows.");
    }
    expect(moveWords("R2")).toBe("The right side goes up, twice.");
    expect(moveWords("y'")).toBe("The whole cube turns right.");
  });
});
