// The app speaks (docs/02-levels.md → The app speaks): the voice's rules and the one-line card.
import { describe, expect, it } from "vitest";
import { type Utterance, Voice, plain } from "../src/app/speech";
import { CardSteps } from "../src/app/line";

/** A fake phone voice: records what it was asked to say. */
class FakeSynth {
  said: string[] = [];
  cancels = 0;
  last: (Utterance & { text: string }) | null = null;
  speak(u: Utterance & { text: string }) {
    this.said.push(u.text);
    this.last = u;
  }
  cancel() {
    this.cancels++;
  }
}

/** A voice on the fake, with batches run by hand (`flush`) instead of after the tick. */
function setup(on = true) {
  const synth = new FakeSynth();
  let queued: (() => void) | null = null;
  const v = new Voice<Utterance & { text: string }>(
    synth,
    (text) => ({ text, onend: null, onerror: null }),
    () => on,
    (f) => (queued = f),
  );
  const flush = () => {
    queued?.();
    queued = null;
  };
  return { synth, v, flush };
}

describe("the app speaks (v0.8.17)", () => {
  it("says nothing before the first tap, then the newest lines right after it", () => {
    const { synth, v, flush } = setup();
    v.say("Old line.");
    flush();
    v.say("Goal.");
    v.say("How it works, line 1.");
    flush();
    expect(synth.said).toEqual([]);
    v.unlock();
    expect(synth.said).toEqual(["", "Goal.", "How it works, line 1."]);
  });

  it("reads lines from the same moment in order, and a newer batch cuts off the old", () => {
    const { synth, v, flush } = setup();
    v.unlock();
    v.say("Good!");
    v.say("Turn the top.");
    flush();
    expect(synth.said.slice(1)).toEqual(["Good!", "Turn the top."]);
    const before = synth.cancels;
    v.say("Next step.");
    flush();
    expect(synth.cancels).toBe(before + 1);
    expect(synth.said.at(-1)).toBe("Next step.");
  });

  it("is quiet with Read aloud off, but 🔊 still says the line", () => {
    const { synth, v, flush } = setup(false);
    v.unlock();
    v.say("Not read.");
    flush();
    expect(synth.said).toEqual([""]);
    v.replay("Read on tap.");
    expect(synth.said.at(-1)).toBe("Read on tap.");
  });

  it("finished() waits for the last line to end", async () => {
    const { synth, v, flush } = setup();
    v.unlock();
    v.say("Step words.");
    flush();
    let done = false;
    const p = v.finished(5000).then(() => (done = true));
    await Promise.resolve();
    expect(done).toBe(false);
    synth.last!.onend!(undefined as never);
    await p;
    expect(done).toBe(true);
  });

  it("finished() gives up after the cap if the phone never says it ended", async () => {
    const { v, flush } = setup();
    v.unlock();
    v.say("Never ends.");
    flush();
    await v.finished(10); // resolves, doesn't hang
  });

  it("says words, not tags, emoji, arrows or captions", () => {
    expect(plain("<strong>Hold it:</strong> white on the bottom.")).toBe(
      "Hold it: white on the bottom.",
    );
    expect(plain("Level passed! 🎉")).toBe("Level passed!");
    expect(plain("Walk through it →")).toBe("Walk through it");
    expect(plain("Swipe the top. <small>(2 of 13)</small>")).toBe("Swipe the top.");
    expect(plain("Red &amp; blue")).toBe("Red & blue");
  });
});

describe("the app speaks, with the real after-the-tick timing (v0.8.17)", () => {
  it("reads lines after the tick without throwing", async () => {
    const synth = new FakeSynth();
    const v = new Voice<Utterance & { text: string }>(
      synth,
      (text) => ({ text, onend: null, onerror: null }),
      () => true,
    );
    v.unlock();
    v.say("Goal.");
    v.say("Line 1.");
    await Promise.resolve();
    expect(synth.said).toEqual(["", "Goal.", "Line 1."]);
  });
});

describe("How it works, one line at a time (v0.8.17)", () => {
  it("Next and Back step through the lines and stop at the ends", () => {
    const c = new CardSteps(3);
    expect(c.first).toBe(true);
    expect(c.back()).toBe(false);
    expect(c.next()).toBe(true);
    expect(c.next()).toBe(true);
    expect(c.last).toBe(true);
    expect(c.next()).toBe(false);
    expect(c.at).toBe(2);
    expect(c.back()).toBe(true);
    expect(c.at).toBe(1);
  });
});
