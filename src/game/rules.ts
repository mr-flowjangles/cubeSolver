// Game rules: XP, ranks, badges, unlocks. Pure functions over the saved progress.
// Numbers decided by Claude under Rob's standing go-ahead (2026-11-04); see docs/03-game.md.

export interface LevelRecord {
  passes: number;
  noHelp: boolean; // passed at least once without Hint or Show me
  bestMoves?: number;
  bestSeconds?: number;
}

export interface Progress {
  xp: number;
  levels: Record<string, LevelRecord>;
  badges: Record<string, string>; // badge id → date earned (YYYY-MM-DD)
  streak: { last: string; days: number }; // days in a row with a level passed
}

export const EMPTY: Progress = { xp: 0, levels: {}, badges: {}, streak: { last: "", days: 0 } };

export const XP = {
  firstPass: 100,
  firstPassFull: 300,
  repeatPass: 25,
  repeatPassFull: 50,
  noHelpBonus: 50,
} as const;

export const RANKS: { name: string; xp: number }[] = [
  { name: "Newcomer", xp: 0 },
  { name: "Turner", xp: 200 },
  { name: "Layer Builder", xp: 500 },
  { name: "Solver", xp: 1000 },
  { name: "Cube Master", xp: 2000 },
  { name: "Speedcuber", xp: 4000 },
];

export function rankOf(xp: number) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const next = RANKS[i + 1];
  return {
    name: RANKS[i].name,
    next: next?.name,
    /** 0..1 progress toward the next rank (1 at the top rank). */
    toNext: next ? (xp - RANKS[i].xp) / (next.xp - RANKS[i].xp) : 1,
    xpToNext: next ? next.xp - xp : 0,
  };
}

export interface Badge {
  id: string;
  name: string;
  how: string; // how to earn it, in plain words
  icon: string;
}

export const BADGES: Badge[] = [
  { id: "first-turns", name: "First Turns", how: "Finish Meet the cube.", icon: "🔄" },
  { id: "cross", name: "Cross Builder", how: "Pass White cross.", icon: "🎯" },
  { id: "first-layer", name: "First Layer", how: "Pass White corners.", icon: "🧱" },
  { id: "two-layers", name: "Two Layers", how: "Pass Middle edges.", icon: "🏗️" },
  { id: "yellow-cross", name: "Yellow Cross", how: "Pass Yellow cross.", icon: "✳️" },
  { id: "first-solve", name: "First Solve", how: "Pass Twist yellow corners.", icon: "🏆" },
  { id: "full-solve", name: "Full Solve", how: "Pass Full solve.", icon: "🎓" },
  { id: "no-help", name: "On My Own", how: "Pass any level without Hint or Show me.", icon: "🦉" },
  {
    id: "solo-solve",
    name: "Solo Solver",
    how: "Pass Full solve without Hint or Show me.",
    icon: "🌟",
  },
  { id: "five-solves", name: "Five Solves", how: "Pass Full solve 5 times.", icon: "🖐️" },
  { id: "streak-3", name: "3-Day Streak", how: "Pass a level 3 days in a row.", icon: "🔥" },
  { id: "streak-7", name: "7-Day Streak", how: "Pass a level 7 days in a row.", icon: "📅" },
  { id: "all-beginner", name: "Beginner Graduate", how: "Pass every beginner level.", icon: "🎒" },
];

const BADGE_FOR_LEVEL: Record<string, string> = {
  meet: "first-turns",
  cross: "cross",
  corners: "first-layer",
  middle: "two-layers",
  yellowCross: "yellow-cross",
  yellowCornersTwist: "first-solve",
  full: "full-solve",
};

/** Level ids in play order. A level unlocks when the one before it is passed. */
export function isUnlocked(p: Progress, order: readonly string[], id: string): boolean {
  const i = order.indexOf(id);
  if (i <= 0) return true;
  return (p.levels[order[i - 1]]?.passes ?? 0) > 0;
}

export interface PassResult {
  progress: Progress;
  xpGained: number;
  newBadges: Badge[];
  firstTime: boolean;
}

const dayBefore = (day: string) => {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** Record a level pass. `today` is YYYY-MM-DD in the player's own time zone. */
export function recordPass(
  before: Progress,
  order: readonly string[],
  id: string,
  run: { usedHelp: boolean; moves: number; seconds: number },
  today: string,
): PassResult {
  const p: Progress = structuredClone(before);
  const full = id === "full";
  const rec = p.levels[id] ?? { passes: 0, noHelp: false };
  const firstTime = rec.passes === 0;

  let xp = firstTime
    ? full
      ? XP.firstPassFull
      : XP.firstPass
    : full
      ? XP.repeatPassFull
      : XP.repeatPass;
  if (!run.usedHelp && !rec.noHelp && id !== "meet") xp += XP.noHelpBonus;

  rec.passes += 1;
  rec.noHelp ||= !run.usedHelp;
  if (run.moves > 0) rec.bestMoves = Math.min(rec.bestMoves ?? Infinity, run.moves);
  if (run.seconds > 0) rec.bestSeconds = Math.min(rec.bestSeconds ?? Infinity, run.seconds);
  p.levels[id] = rec;
  p.xp += xp;

  if (p.streak.last !== today) {
    p.streak = {
      last: today,
      days: p.streak.last === dayBefore(today) ? p.streak.days + 1 : 1,
    };
  }

  const earned = new Set<string>();
  if (BADGE_FOR_LEVEL[id]) earned.add(BADGE_FOR_LEVEL[id]);
  if (!run.usedHelp && id !== "meet") earned.add("no-help");
  if (full && !run.usedHelp) earned.add("solo-solve");
  if (full && rec.passes >= 5) earned.add("five-solves");
  if (p.streak.days >= 3) earned.add("streak-3");
  if (p.streak.days >= 7) earned.add("streak-7");
  if (order.every((l) => (p.levels[l]?.passes ?? 0) > 0)) earned.add("all-beginner");

  const newBadges = BADGES.filter((b) => earned.has(b.id) && !p.badges[b.id]);
  for (const b of newBadges) p.badges[b.id] = today;

  return { progress: p, xpGained: xp, newBadges, firstTime };
}
