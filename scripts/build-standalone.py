#!/usr/bin/env python3
"""Mission Control → one self-contained HTML file.

`site/index.html` fetches `catalog.json` (and any SVGs under `site/img/`) at runtime, so it only works
behind `make site`. Opening it directly, or mailing it to someone, shows an error the
page itself explains. This flattens it: the catalog is inlined as a constant, the
diagrams are inlined as markup, and the result opens anywhere with no server.

It is a **snapshot**, and it says so. The live part of the page — the service probes —
describes a machine the reader does not have, so it is neutralised rather than left to
render red dots for services that were never theirs to run. A status
board that lies about someone else's machine is worse than one that admits it is a
picture.

The design is not touched. This is a transport change over the same page.

    python3 scripts/build-standalone.py [-o build/mission-control-standalone.html]

Standard library only; runs on plain system `python3`.
"""

from __future__ import annotations

import argparse
import base64
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
IMG = re.compile(r'<img src="img/([a-z-]+)\.svg"[^>]*>')
BOOTSTRAP = """fetch('catalog.json', { cache: 'no-store' })
  .then(r => r.json())
  .then(render)
  .catch(e => {
    document.querySelector('main').innerHTML =
      `<div class="loading">Could not load <code>catalog.json</code>: ${e}. ` +
      `Serve this directory with <code>make site</code> — opening the file directly blocks the fetch.</div>`;
  });"""


def inline_diagrams(html: str) -> tuple[str, int]:
    """Replace each `<img src="img/x.svg">` with the SVG itself.

    The alt text becomes the figure's accessible label — dropping it would take the one
    description a screen reader had of a diagram that is now a wall of paths.
    """
    count = 0

    def swap(match: re.Match[str]) -> str:
        nonlocal count
        path = SITE / "img" / f"{match.group(1)}.svg"
        if not path.exists():
            return match.group(0)
        alt = re.search(r'alt="([^"]*)"', match.group(0))
        svg = path.read_text()
        svg = svg[svg.index("<svg") :]
        svg = svg.replace(
            "<svg", f'<svg role="img" aria-label="{alt.group(1) if alt else ""}"', 1
        )
        count += 1
        return f'<div class="diagram-inline">{svg}</div>'

    return IMG.sub(swap, html), count


#: Any other reference to a diagram: the Home sections and the design docs name theirs in
#: `catalog.json`, and the page builds those `<img>` tags at runtime.
IMG_PATH = re.compile(r"img/([a-z0-9-]+)\.svg")


def inline_references(text: str) -> tuple[str, int]:
    """Point every remaining `img/x.svg` at the SVG itself, as a data URL."""
    count = 0

    def swap(match: re.Match[str]) -> str:
        nonlocal count
        path = SITE / "img" / f"{match.group(1)}.svg"
        if not path.exists():
            return match.group(0)
        count += 1
        return "data:image/svg+xml;base64," + base64.b64encode(path.read_bytes()).decode()

    return IMG_PATH.sub(swap, text), count


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("-o", "--out", default=str(ROOT / "build" / "mission-control-standalone.html"))
    parser.add_argument(
        "--artifact",
        action="store_true",
        help="Strip the outer document tags — the Artifact host supplies its own skeleton.",
    )
    args = parser.parse_args()

    html = (SITE / "index.html").read_text()
    catalog = json.loads((SITE / "catalog.json").read_text())
    stamped = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Services describe a machine the reader does not have. Say so rather than probing.
    for service in catalog.get("services", []):
        service["kind"] = "snapshot"

    html, diagrams = inline_diagrams(html)
    catalog = json.loads(inline_references(json.dumps(catalog, ensure_ascii=False))[0])
    html, more = inline_references(html)
    diagrams += more + json.dumps(catalog).count("data:image/svg+xml")

    boot = (
        "const CATALOG_DATA = "
        + json.dumps(catalog, indent=None, ensure_ascii=False)
        + ";\nrender(CATALOG_DATA);"
    )
    if BOOTSTRAP not in html:
        raise SystemExit("site/index.html no longer ends with the catalog fetch — update this script")
    html = html.replace(BOOTSTRAP, boot)

    # `probe` only fetches for kind === 'http'; every other kind short-circuits. Teaching
    # it one more kind is a smaller change than tearing the status board out.
    html = html.replace(
        "  if (svc.kind !== 'http') return svc.kind === 'dependency' ? 'external' : 'unknown';",
        "  if (svc.kind === 'snapshot') return 'snapshot';\n"
        "  if (svc.kind !== 'http') return svc.kind === 'dependency' ? 'external' : 'unknown';",
    )
    html = html.replace(
        "const STATE_LABEL = { up: 'running',",
        "const STATE_LABEL = { snapshot: 'not probed', up: 'running',",
    )
    html = html.replace(
        "`this page reads <code>site/catalog.json</code> · <code>make catalog</code> to refresh`",
        f"`snapshot of {stamped} · the live page is served by <code>make site</code>`",
    )
    html += (
        "\n<style>.diagram-inline{overflow-x:auto}"
        ".diagram-inline svg{max-width:100%;height:auto;display:block;margin:0 auto}</style>\n"
    )

    if args.artifact:
        # The Artifact host wraps the file in its own <!doctype>/<head>/<body>. Keeping
        # ours produces a nested document, so hand it the contents and nothing else.
        for tag in (
            "<!doctype html>",
            '<html lang="en">',
            "<head>",
            "</head>",
            "<body>",
            "</body>",
            "</html>",
            '<meta charset="utf-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
        ):
            html = html.replace(tag, "")
        html = "\n".join(line for line in html.splitlines() if line.strip() or True).lstrip()

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html)
    print(f"diagrams inlined : {diagrams}")
    print(f"catalog inlined  : {len(json.dumps(catalog))} bytes")
    print(f"wrote            : {out} ({out.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
