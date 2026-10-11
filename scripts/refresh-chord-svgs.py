#!/usr/bin/env python3
"""Rebuild shifted (5-prefixed) chord glyphs from their unshifted keymap partners.

Shifted SVGs were stored with dots where the unshifted start arrow belongs.
`chars` loads `public/images/svgs/{chordCode}.svg` as-is; there is no runtime
generator. Re-run this script after changing a base (unshifted) glyph.

Usage:
    python3 scripts/refresh-chord-svgs.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG_DIR = ROOT / "public" / "images" / "svgs"
ALL_CHORDS = ROOT / "src" / "allChords.ts"

SHIFT_START = '      <use id="shift-start" href="#start" x="10" />\n'


def parse_chords(source: str) -> list[tuple[str, str]]:
    return re.findall(r'"key":\s*"((?:\\.|[^"\\\\])*)".*?"chordCode":\s*"([^"]+)"', source, re.S)


def add_shift_start(svg: str) -> str:
    thumb = re.search(r'<g id="thumb">.*?</g>', svg, re.S)
    if thumb is None:
        raise ValueError("no thumb group")
    block = thumb.group(0)
    if re.search(r'href="#start"[^>]*x="10"', block):
        return svg
    replaced = block[:-4] + SHIFT_START + "    </g>"
    return svg[: thumb.start()] + replaced + svg[thumb.end() :]


def write(path: Path, content: str) -> None:
    if not path.exists() or path.read_text() != content:
        path.write_text(content)


def main() -> int:
    chords = parse_chords(ALL_CHORDS.read_text())

    refreshed = 0
    skipped: list[str] = []
    for key, code in chords:
        # 2-char codes (54, 51, …) are already start-on-5 / stop-on-X.
        # Copying the unshifted tap would restore start-stop on X.
        if not code.startswith("5") or len(code) < 3:
            continue
        unshifted = code[1:]
        src = SVG_DIR / f"{unshifted}.svg"
        dest = SVG_DIR / f"{code}.svg"
        if not src.exists():
            skipped.append(f"{key} {code} (missing {unshifted}.svg)")
            continue
        write(dest, add_shift_start(src.read_text()))
        refreshed += 1

    print(f"Refreshed {refreshed} chord SVGs in {SVG_DIR}")
    for item in skipped:
        print(f"  skipped {item}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
