// Record a level pass and show what it earned: XP, a new rank, new badges.

import { rankOf, recordPass } from "../game/rules";
import { loadProgress, saveProgress, today } from "../game/storage";
import type { Level } from "../lessons/beginner";
import { BEGINNER_IDS } from "../lessons/index";

export function showPass(
  el: HTMLElement,
  level: Level,
  run: { usedHelp: boolean; moves: number; seconds: number },
) {
  const before = loadProgress();
  const r = recordPass(before, BEGINNER_IDS, level.id, run, today());
  saveProgress(r.progress);
  const rankBefore = rankOf(before.xp).name;
  const rankNow = rankOf(r.progress.xp).name;
  el.querySelector(".reward")!.innerHTML = `
    <p class="xp">+${r.xpGained} XP${!run.usedHelp && level.kind !== "notation" ? " · no help!" : ""}</p>
    ${rankNow !== rankBefore ? `<p class="rankup">New rank: <strong>${rankNow}</strong></p>` : ""}
    ${r.newBadges.map((b) => `<p class="badge-new"><span>${b.icon}</span> Badge: <strong>${b.name}</strong></p>`).join("")}`;
  el.hidden = false;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
