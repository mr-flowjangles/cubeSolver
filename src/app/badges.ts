// Badges: every badge, earned ones in color with the date.

import { BADGES } from "../game/rules";
import { loadProgress } from "../game/storage";
import type { Screen } from "./shell";

export function mountBadges(root: HTMLElement): Screen {
  const p = loadProgress();
  root.innerHTML = `
    <main class="badges">
      <h2>Badges</h2>
      <ul class="badge-grid">
        ${BADGES.map((b) => {
          const when = p.badges[b.id];
          return `<li class="badge ${when ? "earned" : ""}">
            <span class="icon" aria-hidden="true">${b.icon}</span>
            <strong>${b.name}</strong>
            <small>${when ? `Earned ${when}` : b.how}</small>
          </li>`;
        }).join("")}
      </ul>
    </main>`;
  return { dispose() {} };
}
