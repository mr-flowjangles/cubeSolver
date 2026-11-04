// Timer solves: saved on the device, with best and average of 5.

export interface TimedSolve {
  seconds: number;
  scramble: string;
  date: string; // YYYY-MM-DD
}

const KEY = "cubesolver.times";
const KEEP = 200;
let memory: TimedSolve[] = [];

export function loadTimes(): TimedSolve[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as TimedSolve[];
  } catch {
    // fall through
  }
  return memory;
}

export function saveTimes(list: TimedSolve[]): void {
  memory = list.slice(-KEEP);
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // kept in memory for this visit
  }
}

/** Best time, and the usual speedcubing "average of 5": last 5, drop best and worst, mean of 3. */
export function stats(list: readonly TimedSolve[]) {
  const secs = list.map((t) => t.seconds);
  const best = secs.length ? Math.min(...secs) : undefined;
  let ao5: number | undefined;
  if (secs.length >= 5) {
    const last = secs.slice(-5).sort((a, b) => a - b);
    ao5 = (last[1] + last[2] + last[3]) / 3;
  }
  return { best, ao5, count: secs.length };
}

export function formatTime(s: number | undefined): string {
  if (s === undefined) return "—";
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(2).padStart(m ? 5 : 4, "0");
  return m ? `${m}:${rest}` : rest;
}
