// The app's voice: reads lesson lines out loud with the phone's own speech, and the 🔊 button
// beside each line that says it again. See docs/02-levels.md → The app speaks.

import { loadSettings } from "./settings";

/** The parts of the browser's speech the voice uses (window.speechSynthesis). */
export interface Synth<U extends Utterance = Utterance> {
  speak(u: U): void;
  cancel(): void;
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

  constructor(
    private synth: Synth<U> | undefined,
    private make: (text: string) => U,
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
    // 1. An empty line, said inside the tap, is what lets later lines play.
    this.synth.speak(this.make(""));
    // 2. Then whatever appeared before the tap.
    if (lines.length && this.on()) this.read(lines);
  }

  /** Resolves when the lines being read finish, or after `cap` ms if the phone never says so. */
  finished(cap = 12000): Promise<void> {
    return Promise.race([this.done, new Promise<void>((r) => setTimeout(r, cap))]);
  }

  /** Stop talking (leaving a screen, Read aloud turned off). */
  stop(): void {
    this.batch = [];
    this.pending = [];
    this.synth?.cancel();
    this.finish();
  }

  private read(lines: string[]): void {
    const synth = this.synth!;
    // 1. A newer line cuts off one still being read.
    synth.cancel();
    this.finish();
    this.done = new Promise((r) => (this.finish = r));
    const end = this.finish;
    // 2. Queue the lines; the last one's end means all are said.
    lines.forEach((line, i) => {
      const u = this.make(line);
      if (i === lines.length - 1) u.onend = u.onerror = () => end();
      synth.speak(u);
    });
  }
}

/** The app's one voice, using the browser's speech. Missing speech (old browser) means silence. */
export const voice = new Voice<SpeechSynthesisUtterance>(
  typeof speechSynthesis === "undefined" ? undefined : speechSynthesis,
  (text) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95; // a little slower than normal, for a kid
    return u;
  },
  () => loadSettings().readAloud,
);
