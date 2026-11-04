// Saves progress on this device. Storage can be missing or blocked (private browsing),
// so every read and write is guarded and the game still works for the visit.

import { EMPTY, type Progress } from "./rules";

const KEY = "cubesolver.progress";
let memory: Progress | null = null; // fallback when storage is unavailable

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Progress>;
      return {
        xp: Number(p.xp) || 0,
        levels: p.levels ?? {},
        badges: p.badges ?? {},
        streak: p.streak ?? { ...EMPTY.streak },
      };
    }
  } catch {
    // fall through
  }
  return memory ?? structuredClone(EMPTY);
}

export function saveProgress(p: Progress): void {
  memory = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Not saved; kept in memory for this visit.
  }
}

/** Local date as YYYY-MM-DD (the player's own day, for streaks). */
export function today(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
