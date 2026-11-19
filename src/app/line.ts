// Spoken lines: a line of words with a 🔊 button beside it that says it again, and "How it works"
// shown one line at a time. See docs/02-levels.md → The app speaks.

import { voice } from "./speech";

/** A line's markup: its words, then the 🔊 button (hidden while the line is empty). */
export function lineHtml(cls: string, html = ""): string {
  return `<p class="line ${cls}"><span class="words">${html}</span><button class="replay" aria-label="Say it again"${html ? "" : " hidden"}>🔊</button></p>`;
}

/**
 * Show new words on a line.
 * 1. `speak: "changed"` (the default) reads them only if they differ from what was shown,
 *    so a step's words aren't read again on every move of that step.
 * 2. `speak: "always"` reads them every time (feedback such as Hint).
 * 3. `speak: "never"` only shows them (the move counter).
 */
export function setLine(
  el: HTMLElement,
  html: string,
  speak: "changed" | "always" | "never" = "changed",
): void {
  const words = el.querySelector<HTMLElement>(".words")!;
  // Compared with the words as given: the page may write them back differently (&amp;).
  const changed = el.dataset.words !== html;
  el.dataset.words = html;
  words.innerHTML = html;
  el.querySelector<HTMLElement>(".replay")!.hidden = !html;
  if (speak === "always" || (speak === "changed" && changed)) voice.say(html);
}

/** Every 🔊 under `root` says its own line again. */
export function onReplay(root: HTMLElement): void {
  root.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest(".replay");
    const words = b?.parentElement?.querySelector(".words");
    if (words) voice.replay(words.innerHTML);
  });
}

/** Which line of a card is shown, and what Back and Next do. Kept apart from the page for tests. */
export class CardSteps {
  at = 0;
  constructor(readonly count: number) {}
  get first() {
    return this.at === 0;
  }
  get last() {
    return this.at >= this.count - 1;
  }
  next(): boolean {
    if (this.last) return false;
    this.at++;
    return true;
  }
  back(): boolean {
    if (this.first) return false;
    this.at--;
    return true;
  }
}

/** "How it works", one line at a time: "1 of 6", the line with 🔊, Back and Next. */
export function cardHtml(): string {
  return `
    <section class="howto" aria-label="How it works">
      <p class="howto-count"></p>
      ${lineHtml("howto-line")}
      <div class="howto-nav">
        <button class="howto-back">‹ Back</button>
        <button class="howto-next primary">Next ›</button>
      </div>
    </section>`;
}

/** Fill the card under `root` with `lines`. Shows line 1 without reading it (the caller does). */
export function mountCard(root: HTMLElement, lines: string[]): { first: string } {
  const card = root.querySelector<HTMLElement>(".howto")!;
  if (!lines.length) {
    card.hidden = true;
    return { first: "" };
  }
  const steps = new CardSteps(lines.length);
  const line = card.querySelector<HTMLElement>(".howto-line")!;
  const back = card.querySelector<HTMLButtonElement>(".howto-back")!;
  const next = card.querySelector<HTMLButtonElement>(".howto-next")!;
  const show = (speak: boolean) => {
    card.querySelector(".howto-count")!.textContent =
      `How it works · ${steps.at + 1} of ${steps.count}`;
    setLine(line, lines[steps.at], speak ? "always" : "never");
    back.disabled = steps.first;
    next.disabled = steps.last;
  };
  back.addEventListener("click", () => steps.back() && show(true));
  next.addEventListener("click", () => steps.next() && show(true));
  show(false);
  return { first: lines[0] };
}
