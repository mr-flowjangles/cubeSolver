// The app's voice: reads lesson lines out loud with the phone's own speech, and the 🔊 button
// beside each line that says it again. See docs/02-levels.md → The app speaks.

import { loadSettings } from "./settings";

/** The parts of the browser's speech the voice uses (window.speechSynthesis). */
export interface Synth<U extends Utterance = Utterance> {
  speak(u: U): void;
  cancel(): void;
  /** Saying something now, or lines waiting to be said. */
  readonly speaking: boolean;
  readonly pending: boolean;
}
/** One thing to say (a SpeechSynthesisUtterance). */
export interface Utterance {
  onend: ((ev: never) => unknown) | null;
  onerror: ((ev: never) => unknown) | null;
}

/** Words as the voice should say them: no tags, no emoji or arrows, entities decoded. */
export function plain(html: string): string {
  return html
    .replace(/<small[\s\S]*?<\/small>/g, " ") // captions are for reading, not saying
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[\p{Extended_Pictographic}←-⇿✀-➿▶⏸›‹️]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class Voice<U extends Utterance = Utterance> {
  /** Lines asked for in this tick: read together, in order. */
  private batch: string[] = [];
  private batched = false;
  /** Lines asked for before the first tap; read right after it. */
  private pending: string[] = [];
  private unlocked = false;
  /** Resolves when the lines being read are finished (or cut off). */
  private done: Promise<void> = Promise.resolve();
  private finish: () => void = () => {};
  /** Lines handed to the phone, kept so they aren't thrown away before they're said. */
  private live: U[] = [];

  constructor(
    private synth: Synth<U> | undefined,
    /** A line to say; `quiet` makes it silent (the first-tap start). */
    private make: (text: string, quiet?: boolean) => U,
    /** Whether Read aloud is on. */
    private on: () => boolean,
    /** Runs the batch after this tick's lines are in. */
    private defer: (f: () => void) => void = (f) => queueMicrotask(f), // called bare: queueMicrotask throws if called as a method
  ) {}

  /** Read a line that just appeared. Lines from the same tick are read in order. */
  say(html: string): void {
    const text = plain(html);
    if (!text || !this.synth || !this.on()) return;
    this.batch.push(text);
    if (this.batched) return;
    this.batched = true;
    this.defer(() => {
      this.batched = false;
      const lines = this.batch;
      this.batch = [];
      if (this.unlocked) this.read(lines);
      else this.pending = lines; // only the newest lines; older ones are out of date
    });
  }

  /** Say a line again now (a tap on 🔊), even with Read aloud off: the player asked for it. */
  replay(html: string): void {
    const text = plain(html);
    if (!text || !this.synth) return;
    this.unlocked = true;
    this.pending = [];
    this.read([text]);
  }

  /** The first tap: phones allow speech only from a tap, so start it here. */
  unlock(): void {
    if (this.unlocked || !this.synth) return;
    this.unlocked = true;
    const lines = this.pending;
    this.pending = [];
    // 1. Whatever appeared before the tap, said inside the tap.
    if (lines.length && this.on()) return this.read(lines);
    // 2. Nothing to say: a silent line, said inside the tap, lets later lines play.
    //    Not an empty one: an iPhone may never finish it and hold up every line after.
    const u = this.make(" ", true);
    this.live = [u];
    this.synth.speak(u);
  }

  /** Resolves when the lines being read finish, or after `cap` ms if the phone never says so. */
  finished(cap = 12000): Promise<void> {
    return Promise.race([this.done, new Promise<void>((r) => setTimeout(r, cap))]);
  }

  /** Stop talking (leaving a screen, Read aloud turned off). */
  stop(): void {
    this.batch = [];
    this.pending = [];
    if (this.synth && (this.synth.speaking || this.synth.pending)) this.synth.cancel();
    this.finish();
  }

  private read(lines: string[]): void {
    const synth = this.synth!;
    this.finish();
    this.done = new Promise((r) => (this.finish = r));
    const end = this.finish;
    const us = lines.map((line, i) => {
      const u = this.make(line);
      if (i === lines.length - 1) u.onend = u.onerror = () => end();
      return u;
    });
    this.live = us;
    const go = () => us.forEach((u) => synth.speak(u));
    // 1. Nothing being said: say it now, still inside the tap if there was one.
    if (!synth.speaking && !synth.pending) return go();
    // 2. A newer line cuts off one still being read. Lines handed over in the same moment
    //    as the cut-off can be dropped, so they go a moment later.
    synth.cancel();
    setTimeout(go, 50);
  }
}

/** The app's one voice, using the browser's speech. Missing speech (old browser) means silence. */
export const voice = new Voice<SpeechSynthesisUtterance>(
  typeof speechSynthesis === "undefined" ? undefined : speechSynthesis,
  (text, quiet) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; // a little slower than normal, for a kid
    if (quiet) u.volume = 0;
    debugWatch(u);
    return u;
  },
  () => loadSettings().readAloud,
);

// Test hook: ?speechdebug=1 shows what the phone's voice does, line by line, in a box at the
// bottom of the screen: each line handed over, and whether it started, ended or failed (and why).
const DEBUG =
  typeof location !== "undefined" &&
  new URLSearchParams(location.search).get("speechdebug") === "1";

/** Add a line to the debug box. */
function debugLog(text: string): void {
  if (!DEBUG) return;
  let box = document.getElementById("speech-debug");
  if (!box) {
    box = document.createElement("pre");
    box.id = "speech-debug";
    box.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;max-height:35vh;overflow:auto;margin:0;padding:6px;" +
      "font:11px/1.3 monospace;background:#000c;color:#0f0;z-index:9999;white-space:pre-wrap";
    document.body.append(box);
    const voices = () => speechSynthesis.getVoices().length;
    debugLog(`speech: ${typeof speechSynthesis}, voices: ${voices()}`);
    speechSynthesis.addEventListener?.("voiceschanged", () => debugLog(`voices now: ${voices()}`));
  }
  box.textContent += `${(performance.now() / 1000).toFixed(1)} ${text}\n`;
  box.scrollTop = box.scrollHeight;
}

/** Log a line's start, end and failure (with the phone's reason). */
function debugWatch(u: SpeechSynthesisUtterance): void {
  if (!DEBUG) return;
  const name = JSON.stringify(u.text.slice(0, 24));
  debugLog(`made ${name}`);
  u.addEventListener("start", () => debugLog(`start ${name}`));
  u.addEventListener("end", () => debugLog(`end ${name}`));
  u.addEventListener("error", (e) => debugLog(`ERROR ${name}: ${e.error}`));
}
if (DEBUG && typeof speechSynthesis !== "undefined") {
  const s = speechSynthesis;
  const speak = s.speak.bind(s);
  const cancel = s.cancel.bind(s);
  s.speak = (u) => {
    debugLog(
      `speak ${JSON.stringify(u.text.slice(0, 24))} (speaking ${s.speaking}, paused ${s.paused})`,
    );
    speak(u);
  };
  s.cancel = () => {
    debugLog("cancel");
    cancel();
  };
}
