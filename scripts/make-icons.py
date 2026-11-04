#!/usr/bin/env python3
"""Write the app icons (PNG + SVG) into public/. Standard library only.

A 3x3 cube face on a dark rounded square. Run: python3 scripts/make-icons.py
"""
import struct, zlib
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public"
BG = (21, 23, 28)
GRID = [  # a scrambled-looking face
    [(208, 18, 27), (255, 255, 255), (10, 155, 72)],
    [(255, 213, 0), (10, 155, 72), (255, 106, 0)],
    [(0, 70, 173), (208, 18, 27), (255, 255, 255)],
]


def png(size: int, pad_frac: float) -> bytes:
    pad = int(size * pad_frac)
    cell = (size - 2 * pad) / 3
    gap = max(1, int(cell * 0.08))
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            c = BG
            gx, gy = (x - pad) / cell, (y - pad) / cell
            if 0 <= gx < 3 and 0 <= gy < 3:
                ix, iy = int(gx), int(gy)
                lx, ly = x - pad - ix * cell, y - pad - iy * cell
                if gap <= lx < cell - gap and gap <= ly < cell - gap:
                    c = GRID[iy][ix]
            row += bytes(c)
        rows.append(bytes(row))
    raw = zlib.compress(b"".join(rows), 9)

    def chunk(t: bytes, d: bytes) -> bytes:
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")


def svg() -> str:
    cells = "".join(
        f'<rect x="{14 + c * 24}" y="{14 + r * 24}" width="20" height="20" rx="3" fill="rgb{GRID[r][c]}"/>'
        for r in range(3)
        for c in range(3)
    )
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="rgb{BG}"/>{cells}</svg>\n'


OUT.mkdir(exist_ok=True)
(OUT / "icon-192.png").write_bytes(png(192, 0.12))
(OUT / "icon-512.png").write_bytes(png(512, 0.12))
(OUT / "icon-maskable-512.png").write_bytes(png(512, 0.22))  # safe zone for round masks
(OUT / "apple-touch-icon.png").write_bytes(png(180, 0.12))
(OUT / "favicon.svg").write_text(svg())
print("icons written to", OUT)
