import { describe, expect, it } from "vitest";
import {
  type CubeState,
  applyMoves,
  center,
  invertMoves,
  isSolved,
  parseMoves,
  scramble,
  slot,
  slotSolved,
  solved,
} from "../src/cube";
import {
  CFOP_DONE,
  CFOP_STAGES,
  CP_ALGS,
  EO_ALGS,
  EP_ALGS,
  F2L_TRIGGERS,
  OCLL_ALGS,
  PLL_ALGS,
  solveCfop,
  solvePll,
} from "../src/solver/cfop";

function seeded(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
}

// The cube model's solved cube has the "U" color on top, which is where last-layer
// sequences work; the bottom two layers must survive every last-layer sequence.
const F2L_SLOTS = ["DF", "DR", "DB", "DL", "DFR", "DRB", "DBL", "DLF", "FR", "FL", "BR", "BL"].map(
  slot,
);
const f2lIntact = (s: CubeState) => F2L_SLOTS.every((x) => slotSolved(s, x));
const topOneColor = (s: CubeState) => s.slice(0, 9).every((c) => c === center(s, "U"));
const caseOf = (alg: string) => applyMoves(solved(), invertMoves(parseMoves(alg)));

describe("taught sequences", () => {
  it.each([...EO_ALGS, ...OCLL_ALGS])("$name keeps the bottom two layers", ({ moves }) => {
    const c = caseOf(moves);
    expect(f2lIntact(c)).toBe(true);
    expect(topOneColor(c)).toBe(false); // it really is an OLL case
  });

  it.each([...CP_ALGS, ...EP_ALGS, ...PLL_ALGS])(
    "$name is a PLL: bottom kept, top stays one color",
    ({ moves }) => {
      const c = caseOf(moves);
      expect(f2lIntact(c)).toBe(true);
      expect(topOneColor(c)).toBe(true);
      expect(isSolved(c)).toBe(false);
    },
  );

  it("all 21 PLLs are different cases", () => {
    // Compare cases up to turning the top before and after.
    const canon = (alg: string) => {
      const keys: string[] = [];
      for (const a of ["", "U", "U2", "U'"])
        for (const b of ["", "U", "U2", "U'"]) {
          const s = applyMoves(solved(), [a, ...invertMoves(parseMoves(alg)), b].filter(Boolean));
          keys.push(s.join(""));
        }
      return keys.sort()[0];
    };
    const names = new Set(PLL_ALGS.map((p) => p.name));
    expect(names.size).toBe(PLL_ALGS.length - 0);
    const seen = new Map<string, string>();
    for (const p of PLL_ALGS) {
      const k = canon(p.moves);
      expect(seen.get(k), `${p.name} same as ${seen.get(k)}`).toBeUndefined();
      seen.set(k, p.name);
    }
    expect(seen.size).toBe(21);
  });

  it("F2L triggers are valid notation", () => {
    for (const t of F2L_TRIGGERS) expect(() => parseMoves(t.moves)).not.toThrow();
  });
});

describe("CFOP solver", () => {
  it("solves 100 random scrambles, stage by stage", () => {
    const random = seeded(77);
    let slowest = 0;
    let longest = 0;
    for (let n = 0; n < 100; n++) {
      const start = applyMoves(solved(), scramble(25, random));
      // CPU time of this test process, not the wall clock: other test files share the machine.
      const t0 = process.cpuUsage();
      const steps = solveCfop(start);
      const used = process.cpuUsage(t0);
      slowest = Math.max(slowest, (used.user + used.system) / 1000);
      let cur = start;
      let idx = 0;
      for (const st of steps) {
        const i = CFOP_STAGES.indexOf(st.stage);
        expect(i).toBeGreaterThanOrEqual(idx);
        if (i > idx) for (let k = 1; k < i; k++) expect(CFOP_DONE[CFOP_STAGES[k]](cur)).toBe(true);
        idx = i;
        cur = applyMoves(cur, st.moves);
      }
      expect(isSolved(cur)).toBe(true);
      longest = Math.max(longest, steps.flatMap((s) => s.moves).length);
    }
    console.log(`CFOP: longest ${longest} moves, slowest ${slowest.toFixed(0)} ms`);
    expect(slowest).toBeLessThan(3000);
  }, 300_000);

  it("full PLL solves every PLL case from any top turn", () => {
    for (const p of PLL_ALGS)
      for (const u of ["", "U", "U2", "U'"]) {
        const c = applyMoves(caseOf(p.moves), u ? [u] : []);
        expect(
          isSolved(
            applyMoves(
              c,
              solvePll(c).flatMap((s) => s.moves),
            ),
          ),
        ).toBe(true);
      }
  });
});
