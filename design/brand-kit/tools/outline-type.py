#!/usr/bin/env python3
"""Outline the brand-kit wordmark strings into SVG path data.

The lockup SVGs in design/brand-kit/logo/ must render the same on a printer's
machine that has never heard of Outfit, so their type ships as outlines rather
than <text>. This tool shapes each string with HarfBuzz (kerning included),
draws the glyphs from Outfit at a fixed weight, and writes the result to
design/brand-kit/type-paths.json, which scripts/render-brand-kit.mjs reads.

Rerun only when a lockup string or its weight changes:

    pip install fonttools uharfbuzz
    python design/brand-kit/tools/outline-type.py

Outfit is OFL; the variable font is fetched once into design/brand-kit/.cache/.
"""
import json
import urllib.request
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

KIT = Path(__file__).resolve().parent.parent
CACHE = KIT / ".cache"
FONT = CACHE / "Outfit.ttf"
FONT_URL = "https://github.com/google/fonts/raw/main/ofl/outfit/Outfit%5Bwght%5D.ttf"

# key: (text, weight, tracking in em). The name is set at 500, a step lighter
# than the site header, so it sits level with the monoline mark; the
# descriptor follows the site's label type (tracked caps).
STRINGS = {
    "name": ("Dr. Sumya Pervin", 500, -0.01),
    "descriptor": ("CONSULTANT DERMATOLOGIST", 500, 0.14),
}


def outline(font_bytes, weight, text, tracking):
    tt = instantiateVariableFont(TTFont(FONT), {"wght": weight})
    upm = tt["head"].unitsPerEm
    glyphs = tt.getGlyphSet()
    order = tt.getGlyphOrder()

    face = hb.Face(font_bytes)
    hbfont = hb.Font(face)
    hbfont.set_variations({"wght": weight})
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": True})

    pen = SVGPathPen(glyphs)
    x = 0.0
    track = tracking * upm
    infos, positions = buf.glyph_infos, buf.glyph_positions
    for i, (info, pos) in enumerate(zip(infos, positions)):
        name = order[info.codepoint]
        # Flip y: font units are y-up, SVG is y-down. Baseline sits at y = 0.
        glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, x + pos.x_offset, -pos.y_offset)))
        x += pos.x_advance + (track if i < len(infos) - 1 else 0)
    os2 = tt["OS/2"]
    return {
        "text": text,
        "weight": weight,
        "upm": upm,
        "d": pen.getCommands(),
        "advance": round(x, 2),
        "capHeight": os2.sCapHeight,
        "xHeight": os2.sxHeight,
    }


def main():
    CACHE.mkdir(exist_ok=True)
    if not FONT.exists():
        urllib.request.urlretrieve(FONT_URL, FONT)
    font_bytes = FONT.read_bytes()
    out = {k: outline(font_bytes, w, t, tr) for k, (t, w, tr) in STRINGS.items()}
    dest = KIT / "type-paths.json"
    dest.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {dest.relative_to(KIT.parent.parent)}")


if __name__ == "__main__":
    main()
