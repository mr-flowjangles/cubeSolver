import { describe, expect, it } from "vitest";
import {
  EMPTY,
  RANKS,
  XP,
  isUnlocked,
  rankOf,
  recordPass,
  recordTimedSolve,
} from "../src/game/rules";
import { formatTime, stats } from "../src/game/times";

const ORDER = ["meet", "cross", "corners", "middle", "full"];
const run = (usedHelp = true) => ({ usedHelp, moves: 30, seconds: 60 });

describe("unlocks", () => {
  it("first level is open, the rest open one at a time", () => {
    expect(isUnlocked(EMPTY, ORDER, "meet")).toBe(true);
    expect(isUnlocked(EMPTY, ORDER, "cross")).toBe(false);
    const p = recordPass(EMPTY, ORDER, "meet", run(), "2026-11-04").progress;
    expect(isUnlocked(p, ORDER, "cross")).toBe(true);
    expect(isUnlocked(p, ORDER, "corners")).toBe(false);
  });
});

describe("XP", () => {
  it("first pass 100, repeat 25, full solve 300 then 50", () => {
    const a = recordPass(EMPTY, ORDER, "cross", run(), "2026-11-04");
    expect(a.xpGained).toBe(XP.firstPass);
    expect(a.firstTime).toBe(true);
    const b = recordPass(a.progress, ORDER, "cross", run(), "2026-11-04");
    expect(b.xpGained).toBe(XP.repeatPass);
    const c = recordPass(b.progress, ORDER, "full", run(), "2026-11-04");
    expect(c.xpGained).toBe(XP.firstPassFull);
    const d = recordPass(c.progress, ORDER, "full", run(), "2026-11-04");
    expect(d.xpGained).toBe(XP.repeatPassFull);
    expect(d.progress.xp).toBe(100 + 25 + 300 + 50);
  });

  it("no-help bonus once per level, never for the notation level", () => {
    const a = recordPass(EMPTY, ORDER, "cross", run(false), "2026-11-04");
    expect(a.xpGained).toBe(XP.firstPass + XP.noHelpBonus);
    const b = recordPass(a.progress, ORDER, "cross", run(false), "2026-11-04");
    expect(b.xpGained).toBe(XP.repeatPass);
    expect(recordPass(EMPTY, ORDER, "meet", run(false), "2026-11-04").xpGained).toBe(XP.firstPass);
  });

  it("does not change the progress it was given", () => {
    const before = structuredClone(EMPTY);
    recordPass(before, ORDER, "cross", run(), "2026-11-04");
    expect(before).toEqual(EMPTY);
  });
});

describe("ranks", () => {
  it("climb with XP", () => {
    expect(rankOf(0).name).toBe(RANKS[0].name);
    expect(rankOf(199).name).toBe("Newcomer");
    expect(rankOf(200).name).toBe("Turner");
    expect(rankOf(350).toNext).toBeCloseTo(0.5);
    expect(rankOf(99999).next).toBeUndefined();
  });
});

describe("badges", () => {
  it("level badges once, no-help badge, best moves kept", () => {
    const a = recordPass(
      EMPTY,
      ORDER,
      "cross",
      { usedHelp: false, moves: 40, seconds: 90 },
      "2026-11-04",
    );
    expect(a.newBadges.map((b) => b.id).sort()).toEqual(["cross", "no-help"]);
    const b = recordPass(
      a.progress,
      ORDER,
      "cross",
      { usedHelp: true, moves: 20, seconds: 120 },
      "2026-11-04",
    );
    expect(b.newBadges).toEqual([]);
    expect(b.progress.levels.cross.bestMoves).toBe(20);
    expect(b.progress.levels.cross.bestSeconds).toBe(90);
  });

  it("streaks count consecutive days and reset after a gap", () => {
    let p = EMPTY;
    const days = ["2026-11-01", "2026-11-02", "2026-11-03"];
    let last;
    for (const d of days) {
      last = recordPass(p, ORDER, "meet", run(), d);
      p = last.progress;
    }
    expect(p.streak.days).toBe(3);
    expect(last!.newBadges.map((b) => b.id)).toContain("streak-3");
    p = recordPass(p, ORDER, "meet", run(), "2026-11-05").progress;
    expect(p.streak.days).toBe(1);
  });

  it("streak crosses a month end", () => {
    let p = recordPass(EMPTY, ORDER, "meet", run(), "2026-10-31").progress;
    p = recordPass(p, ORDER, "meet", run(), "2026-11-01").progress;
    expect(p.streak.days).toBe(2);
  });

  it("graduate badge when every level is passed", () => {
    let p = EMPTY;
    let r;
    for (const id of ORDER) {
      r = recordPass(p, ORDER, id, run(), "2026-11-04");
      p = r.progress;
    }
    expect(r!.newBadges.map((b) => b.id)).toContain("all-beginner");
  });
});

describe("timer", () => {
  const t = (seconds: number) => ({ seconds, scramble: "", date: "2026-11-04" });
  it("best and average of 5 (drop best and worst)", () => {
    expect(stats([])).toEqual({ best: undefined, ao5: undefined, count: 0 });
    const s = stats([t(50), t(40), t(30), t(60), t(45), t(35)]);
    expect(s.best).toBe(30);
    // last 5: 40 30 60 45 35 → drop 30 and 60 → (35+40+45)/3 = 40
    expect(s.ao5).toBeCloseTo(40);
  });
  it("formats times like a speedcubing timer", () => {
    expect(formatTime(7.5)).toBe("7.50");
    expect(formatTime(65.25)).toBe("1:05.25");
    expect(formatTime(undefined)).toBe("—");
  });
  it("time badges", () => {
    const a = recordTimedSolve(EMPTY, 45, "2026-11-04");
    expect(a.newBadges.map((b) => b.id)).toEqual(["sub-60"]);
    const b = recordTimedSolve(a.progress, 25, "2026-11-04");
    expect(b.newBadges.map((x) => x.id)).toEqual(["sub-30"]);
    expect(b.xpGained).toBe(0);
  });
});
