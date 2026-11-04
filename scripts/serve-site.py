#!/usr/bin/env python3
"""Serve Mission Control with caching turned off.

`python -m http.server` sends no cache headers at all, so browsers fall back to
a heuristic: re-serve from cache without asking the server. The practical
effect is that you edit the page, reload, and see the old one — which is worse
than a slow page, because it makes you doubt the edit rather than the cache.

This is the same server with `Cache-Control: no-store` on every response. It is
a local dev server for one static directory; there is nothing here worth
caching.
"""

from __future__ import annotations

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt: str, *args: object) -> None:
        """Quiet unless something failed."""
        status = str(args[1]) if len(args) > 1 else ""
        if status.startswith(("4", "5")):
            print(f"[site] {fmt % args}", flush=True)


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: serve-site.py PORT   (make site passes SITE_PORT)", file=sys.stderr)
        return 2
    port = int(sys.argv[1])
    handler = partial(Handler, directory=str(SITE))
    print(f"Mission Control on http://localhost:{port} (no-store)", flush=True)
    try:
        ThreadingHTTPServer(("127.0.0.1", port), handler).serve_forever()
    except KeyboardInterrupt:
        print("\nstopped", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
