import { describe, expect, it } from "vitest";
import { applyMoves, scramble, solved } from "../src/cube";
import { HintArrows } from "../src/app/hintArrows";
import { MAGIC_DID, NOTATION_STEPS } from "../src/lessons/beginner";
import { seeded } from "../src/lessons/walkthrough";
import type { CubeView } from "../src/render/cubeView";
import { solveBeginner } from "../src/solver/beginner";
import { solveCfop } from "../src/solver/cfop";

// A move letter in text: R' / U2 / "top: U" / "×3".
const LETTER = /\b[RULFDBMESxyz]['2](?![a-z])|: [RULFDBxyz]\b(?! shape)|×\d/;

describe("arrows only: no move letters in what the player reads", () => {
  it("level 0 sentences and printed lines", () => {
    for (const s of NOTATION_STEPS) {
      expect(s.say, s.say).not.toMatch(LETTER);
      expect(s.did, s.did).not.toMatch(LETTER);
    }
    for (const d of Object.values(MAGIC_DID)) expect(d).not.toMatch(LETTER);
  });

  it("hint sentences from both solvers", () => {
    const random = seeded(5);
    for (let k = 0; k < 20; k++) {
      const s = applyMoves(solved(), scramble(25, random));
      for (const st of [...solveBeginner(s), ...solveCfop(s)])
        expect(st.say, st.say).not.toMatch(LETTER);
    }
  }, 60_000);
});

describe("hint arrows", () => {
  const fakeView = () => {
    const shown: (string | null)[] = [];
    return { shown, view: { pointTo: (m: string | null) => shown.push(m) } as unknown as CubeView };
  };

  it("points at each swipe in turn, splitting half turns", () => {
    const { shown, view } = fakeView();
    const h = new HintArrows(view);
    h.start(["U2", "R"]);
    h.moved("U");
    h.moved("U");
    h.moved("R");
    expect(shown).toEqual(["U", "U", "R", null]);
  });

  it("goes away when the player does something else", () => {
    const { shown, view } = fakeView();
    const h = new HintArrows(view);
    h.start(["R", "U"]);
    h.moved("F");
    expect(shown).toEqual(["R", null]);
  });
});
