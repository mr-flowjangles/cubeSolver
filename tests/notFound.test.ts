// The 404 page GitHub Pages shows for a wrong address: it must send the player to the app.
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../public/404.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];

/** Where the 404 page sends a browser that opened `url`. */
function lands(url: string): string {
  const u = new URL(url);
  let to = "";
  const location = {
    hostname: u.hostname,
    pathname: u.pathname,
    hash: u.hash,
    replace: (x: string) => (to = x),
  };
  runInNewContext(script, { location });
  return to;
}

describe("a wrong address opens the app (phone Chrome, v0.8.16)", () => {
  it("sends a wrong path under /cubeSolver/ to the app's start", () => {
    expect(lands("https://mr-flowjangles.github.io/cubeSolver/play")).toBe("/cubeSolver/");
    expect(lands("https://mr-flowjangles.github.io/cubeSolver/a/b/c")).toBe("/cubeSolver/");
  });

  it("keeps the #/ part of the address", () => {
    expect(lands("https://mr-flowjangles.github.io/cubeSolver/x#/level/cross")).toBe(
      "/cubeSolver/#/level/cross",
    );
  });

  it("goes to the site root when not on GitHub Pages", () => {
    expect(lands("http://localhost:4173/play")).toBe("/");
  });
});
