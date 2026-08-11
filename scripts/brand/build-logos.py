"""Build the CandorLens production SVG logo family.

The symbol is native SVG geometry. The wordmark is converted from the bundled
Manrope variable font to paths so every exported logo is self-contained.
"""

from __future__ import annotations

import math
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


ROOT = Path(__file__).resolve().parents[2]
BRAND_DIR = ROOT / "assets" / "brand"
FONT_PATH = BRAND_DIR / "type" / "Manrope-VariableFont_wght.ttf"

INK = "#16211F"
FOREST = "#173C36"
FOREST_ACTION = "#216B58"
MINT = "#67CFA8"
OFF_WHITE = "#F7FAF8"

LEFT_MARK = (
    "M10 7C7.8 6.3 6 8 6 10.5V38.5C6 42.1 8.9 45 12.5 45H16"
    "L12 56L30 47V21L36 16Z"
)
RIGHT_MARK = (
    "M54 11C56.2 10.3 58 12 58 14.5V42.5C58 46.1 55.1 49 51.5 49H48"
    "L52 60L34 51V25L28 20Z"
)


def svg_document(view_box: str, title: str, description: str, body: str) -> str:
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_box}" role="img" aria-labelledby="title desc">
  <title id="title">{title}</title>
  <desc id="desc">{description}</desc>
{body}
</svg>
'''


def mark_group(left: str, right: str, transform: str | None = None) -> str:
    transform_attr = f' transform="{transform}"' if transform else ""
    return (
        f'  <g{transform_attr} aria-hidden="true">\n'
        f'    <path d="{LEFT_MARK}" fill="{left}"/>\n'
        f'    <path d="{RIGHT_MARK}" fill="{right}"/>\n'
        "  </g>"
    )


def load_wordmark_font() -> TTFont:
    font = TTFont(FONT_PATH)
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": 700}, inplace=False)
    return font


def wordmark_paths(
    font: TTFont,
    *,
    x: float,
    baseline: float,
    font_size: float,
    candor_fill: str,
    lens_fill: str,
) -> tuple[str, float]:
    text = "CandorLens"
    cmap = font.getBestCmap()
    glyph_set = font.getGlyphSet()
    metrics = font["hmtx"].metrics
    units_per_em = font["head"].unitsPerEm
    scale = font_size / units_per_em
    tracking = -18
    cursor = 0.0
    paths: list[str] = []

    for index, character in enumerate(text):
        glyph_name = cmap[ord(character)]
        pen = SVGPathPen(glyph_set)
        glyph_set[glyph_name].draw(pen)
        commands = pen.getCommands()
        fill = candor_fill if index < 6 else lens_fill
        tx = x + cursor * scale
        paths.append(
            f'    <path d="{commands}" fill="{fill}" '
            f'transform="translate({tx:.3f} {baseline:.3f}) scale({scale:.6f} {-scale:.6f})"/>'
        )
        cursor += metrics[glyph_name][0] + tracking

    width = cursor * scale
    return "\n".join(paths), width


def write_logo_family() -> None:
    font = load_wordmark_font()

    mark = svg_document(
        "0 0 64 64",
        "CandorLens",
        "Two conversational ribbons form an open passage for clearer dialogue.",
        mark_group(FOREST, MINT),
    )
    (BRAND_DIR / "logo-mark.svg").write_text(mark, encoding="utf-8", newline="\n")

    mono = svg_document(
        "0 0 64 64",
        "CandorLens monochrome",
        "Single-color CandorLens open exchange mark.",
        mark_group(FOREST, FOREST),
    )
    (BRAND_DIR / "logo-monochrome.svg").write_text(mono, encoding="utf-8", newline="\n")

    wordmark, wordmark_width = wordmark_paths(
        font,
        x=74,
        baseline=46,
        font_size=40,
        candor_fill=INK,
        lens_fill=FOREST_ACTION,
    )
    horizontal_width = math.ceil(74 + wordmark_width + 8)
    horizontal_body = (
        mark_group(FOREST, MINT, "translate(2 2) scale(0.9375)")
        + '\n  <g aria-hidden="true">\n'
        + wordmark
        + "\n  </g>"
    )
    horizontal = svg_document(
        f"0 0 {horizontal_width} 64",
        "CandorLens",
        "CandorLens open exchange mark and vector wordmark.",
        horizontal_body,
    )
    (BRAND_DIR / "logo-horizontal.svg").write_text(horizontal, encoding="utf-8", newline="\n")

    reversed_wordmark, _ = wordmark_paths(
        font,
        x=74,
        baseline=46,
        font_size=40,
        candor_fill=OFF_WHITE,
        lens_fill=MINT,
    )
    reversed_body = (
        mark_group(OFF_WHITE, MINT, "translate(2 2) scale(0.9375)")
        + '\n  <g aria-hidden="true">\n'
        + reversed_wordmark
        + "\n  </g>"
    )
    reversed_logo = svg_document(
        f"0 0 {horizontal_width} 64",
        "CandorLens reversed",
        "CandorLens logo for deep forest and other dark backgrounds.",
        reversed_body,
    )
    (BRAND_DIR / "logo-reversed.svg").write_text(
        reversed_logo, encoding="utf-8", newline="\n"
    )

    standalone_wordmark, standalone_width = wordmark_paths(
        font,
        x=2,
        baseline=48,
        font_size=48,
        candor_fill=INK,
        lens_fill=FOREST_ACTION,
    )
    wordmark_logo = svg_document(
        f"0 0 {math.ceil(standalone_width + 4)} 64",
        "CandorLens wordmark",
        "Self-contained CandorLens vector wordmark.",
        '  <g aria-hidden="true">\n' + standalone_wordmark + "\n  </g>",
    )
    (BRAND_DIR / "logo-wordmark.svg").write_text(
        wordmark_logo, encoding="utf-8", newline="\n"
    )


if __name__ == "__main__":
    write_logo_family()
