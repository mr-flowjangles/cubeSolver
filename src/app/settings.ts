// Player settings, saved on this device.
// Storage can be missing or blocked (private browsing), so every read and write is guarded.

export interface Settings {
  ada: boolean; // ADA support: shapes on sticker colors
}

const KEY = "cubesolver.settings";
const DEFAULTS: Settings = { ada: false };

export function loadSettings(): Settings {
  // Test hook: ?ada=1 turns ADA shapes on for this visit without saving.
  if (new URLSearchParams(location.search).get("ada") === "1") return { ada: true };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Not saved; the setting still applies for this visit.
  }
}
