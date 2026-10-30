#!/usr/bin/env python3
"""Rebuild shifted (5-prefixed) 3-stroke chord glyphs from their unshifted keymap partners.

For a 3-stroke shifted chord (5 + 2-stroke base):
- Stroke 1: Thumb start (#start at x="10")
- Stroke 2: Intermediate finger two-dot (#dot2 and #dot1 at base start position)
- Stroke 3: Final finger stop (#stop)

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

SHIFT_START = '        <use id="shift-start" href="#start" x="10" />\n'


def parse_chords(source: str) -> list[tuple[str, str]]:
    return re.findall(r'"key":\s*"((?:\\.|[^"\\\\])*)".*?"chordCode":\s*"([^"]+)"', source, re.S)


def convert_start_to_dots(match: re.Match[str]) -> str:
    x_str = match.group("x")
    if x_str == "42.5":
        dot1_x, dot2_x = "42", "46.5"
    else:
        x_val = float(x_str)
        dot1_x = str(int(x_val)) if x_val.is_integer() else str(x_val)
        dot2_x = str(int(x_val + 4)) if (x_val + 4).is_integer() else str(x_val + 4)
    return (
        f'<use id="dot2" href="#dot" x="{dot2_x}" fill="#0A0F">2</use>'
        f'<use id="dot1" href="#dot" x="{dot1_x}" fill="#0A0F" />'
    )


def make_shifted_svg(svg: str) -> str:
    thumb = re.search(r'<g id="thumb"[^>]*>.*?</g>', svg, re.S)
    if thumb is None:
        raise ValueError("no thumb group")
    block = thumb.group(0)
    if not re.search(r'href="#start"[^>]*x="10"', block):
        inner = block[:-4].rstrip()
        replaced = inner + "\n" + SHIFT_START + "    </g>"
        svg = svg[: thumb.start()] + replaced + svg[thumb.end() :]

    def replace_finger(m: re.Match[str]) -> str:
        finger_content = m.group("content")
        updated = re.sub(
            r'<use[^>]*href="#start"[^>]*x="(?P<x>[^"]+)"[^>]*>(?:</use>)?',
            convert_start_to_dots,
            finger_content,
        )
        return f'<g id="{m.group("finger")}"{m.group("attrs")}>{updated}</g>'

    svg = re.sub(
        r'<g id="(?P<finger>index|middle|ring|pinky)"(?P<attrs>[^>]*)>(?P<content>.*?)</g>',
        replace_finger,
        svg,
        flags=re.S,
    )
    return svg


def write(path: Path, content: str) -> None:
    if not path.exists() or path.read_text() != content:
        path.write_text(content)


def main() -> int:
    chords = parse_chords(ALL_CHORDS.read_text())

    refreshed = 0
    skipped: list[str] = []
    for key, code in chords:
        # Only 3-stroke shifted chords (5 + 2-stroke base) are rebuilt from base.
        # 2-char codes (51, 52, …) are 2-stroke chords (start on 5, stop on finger).
        # Multi-stroke chords (> 3 chars, e.g. 5101, 523278) have custom stroke progression.
        if not code.startswith("5") or len(code) != 3:
            continue
        unshifted = code[1:]
        src = SVG_DIR / f"{unshifted}.svg"
        dest = SVG_DIR / f"{code}.svg"
        if not src.exists():
            skipped.append(f"{key} {code} (missing {unshifted}.svg)")
            continue
        write(dest, make_shifted_svg(src.read_text()))
        refreshed += 1

    print(f"Refreshed {refreshed} chord SVGs in {SVG_DIR}")
    for item in skipped:
        print(f"  skipped {item}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
