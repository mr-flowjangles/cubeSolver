// Home: rank and XP, the list of levels (locked / open / passed), badges, free play.

import { BADGES, isUnlocked, rankOf } from "../game/rules";
import { loadProgress } from "../game/storage";
import { BEGINNER_LEVELS } from "../lessons/beginner";
import type { Screen } from "./shell";

export function mountHome(root: HTMLElement): Screen {
  const p = loadProgress();
  const order = BEGINNER_LEVELS.map((l) => l.id);
  const rank = rankOf(p.xp);
  const badgeCount = Object.keys(p.badges).length;

  root.innerHTML = `
    <main class="home">
      <section class="me" aria-label="Your progress">
        <div class="me-top">
          <strong class="rank">${rank.name}</strong>
          <span class="xp-total">${p.xp} XP</span>
        </div>
        <div class="bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(rank.toNext * 100)}">
          <div class="bar-fill" style="width:${Math.round(rank.toNext * 100)}%"></div>
        </div>
        <div class="me-bottom">
          <span>${rank.next ? `${rank.xpToNext} XP to ${rank.next}` : "Top rank!"}</span>
          ${p.streak.days > 1 ? `<span>🔥 ${p.streak.days}-day streak</span>` : ""}
          <a href="#/badges">🏅 ${badgeCount} of ${BADGES.length} badges</a>
        </div>
      </section>
      <a class="level solve-mine-link" href="#/solve">
        <span class="num">📷</span>
        <span class="text"><strong>Solve my cube</strong><small>Enter your scrambled cube and get guided, move by move.</small></span>
      </a>
      <h2>Beginner method</h2>
      <ol class="levels">
        ${BEGINNER_LEVELS.map((l) => {
          const rec = p.levels[l.id];
          const open = isUnlocked(p, order, l.id);
          const state = rec?.passes ? "done" : open ? "open" : "locked";
          const mark =
            state === "done"
              ? rec!.noHelp
                ? "★"
                : "✓"
              : state === "locked"
                ? "🔒"
                : String(l.number);
          return `
          <li><a class="level ${state}" href="#/level/${l.id}" ${state === "locked" ? 'aria-disabled="true"' : ""}>
            <span class="num">${mark}</span>
            <span class="text"><strong>${l.title}</strong><small>${
              state === "done"
                ? `Passed ${rec!.passes}×${rec!.noHelp ? " · on your own" : ""}`
                : state === "locked"
                  ? "Pass the level before to unlock"
                  : l.goal
            }</small></span>
          </a></li>`;
        }).join("")}
      </ol>
      <a class="level free" href="#/play">
        <span class="num">∞</span>
        <span class="text"><strong>Free play</strong><small>Turn and scramble the cube however you like.</small></span>
      </a>
    </main>`;
  return { dispose() {} };
}
