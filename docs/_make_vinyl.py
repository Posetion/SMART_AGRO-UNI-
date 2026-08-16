"""Smart Agro Community vinyl — sample academic layout, green theme, 24 x 42 in."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "Smart-Agro-Community-Vinyl.png"
PREVIEW = ROOT / "vinyl-sample" / "smart-agro-preview.png"
CREST = ROOT / "vinyl-sample" / "crest.png"
PH = [
    ROOT / "vinyl-sample" / "placeholder-1.png",
    ROOT / "vinyl-sample" / "placeholder-2.png",
    ROOT / "vinyl-sample" / "placeholder-3.png",
]

DPI = 150
W, H = 24 * DPI, 42 * DPI  # 3600 x 6300
S = DPI / 72.0  # Publisher pt -> px

PADDY = (46, 125, 50)       # #2E7D32
FOREST = (27, 67, 50)       # #1B4332
LEAF = (76, 175, 80)        # #4CAF50
MINT = (232, 245, 233)
WHITE = (255, 255, 255)
PHOTO_BG = (236, 245, 237)


def pt(x: float, y: float, w: float, h: float) -> tuple[int, int, int, int]:
    return (round(x * S), round(y * S), round((x + w) * S), round((y + h) * S))


def font(name: str, size_pt: float) -> ImageFont.FreeTypeFont:
    px = max(8, int(size_pt * S))
    path = Path(r"C:\Windows\Fonts") / name
    if path.exists():
        return ImageFont.truetype(str(path), px)
    return ImageFont.load_default()


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt, max_w: int) -> list[str]:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textbbox((0, 0), trial, font=fnt)[2] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def line_h(draw: ImageDraw.ImageDraw, fnt) -> int:
    b = draw.textbbox((0, 0), "Hg", font=fnt)
    return b[3] - b[1] + 10


def fit_bullets(
    draw: ImageDraw.ImageDraw,
    items: list[str],
    box: tuple[int, int, int, int],
    start_pt: float,
    min_pt: float,
    color,
    heading: str | None = None,
) -> None:
    """Draw diamond bullets (optional heading) shrinking until the block fits."""
    x0, y0, x1, y1 = box
    pad = 36
    inner_w = x1 - x0 - pad * 2
    size = start_pt
    while size >= min_pt:
        body = font("times.ttf", size)
        head_f = font("timesbd.ttf", size + 2)
        diamond = font("timesbd.ttf", size)
        lh = line_h(draw, body)
        y = y0 + pad
        ok = True
        planned: list[tuple[object, int, int, str, tuple]] = []
        if heading:
            planned.append((head_f, x0 + pad, y, heading, color))
            y += lh + 8
        for item in items:
            dtxt = "◆"
            dw = draw.textbbox((0, 0), dtxt, font=diamond)[2]
            indent = dw + 18
            lines = wrap(draw, item, body, inner_w - indent)
            if y + lh * len(lines) > y1 - pad:
                ok = False
                break
            planned.append((diamond, x0 + pad, y, dtxt, PADDY))
            for i, line in enumerate(lines):
                planned.append((body, x0 + pad + indent, y, line, color))
                y += lh
            y += 10
        if ok and y <= y1 - pad + 8:
            for fnt, x, yy, txt, col in planned:
                draw.text((x, yy), txt, font=fnt, fill=col)
            return
        size -= 1.5
    # Last resort: draw at minimum size (should not overflow with current copy).
    print(f"warn: bullets did not fit at {min_pt}pt")


def bar(draw: ImageDraw.ImageDraw, box, label: str) -> None:
    draw.rectangle(box, fill=PADDY)
    fnt = font("timesbd.ttf", 56)
    x0, y0, x1, y1 = box
    b = draw.textbbox((0, 0), label, font=fnt)
    tw, th = b[2] - b[0], b[3] - b[1]
    draw.text(
        (x0 + (x1 - x0 - tw) // 2, y0 + (y1 - y0 - th) // 2 - 4),
        label,
        font=fnt,
        fill=WHITE,
    )


def title(draw: ImageDraw.ImageDraw, box, text: str, size_pt: float, fill=PADDY) -> None:
    lines = [ln for ln in text.split("\n") if ln]
    x0, y0, x1, y1 = box
    fnts = [font("timesbd.ttf", size_pt if i == 0 else max(18, size_pt - 10)) for i in range(len(lines))]
    heights = []
    widths = []
    for ln, fnt in zip(lines, fnts):
        b = draw.textbbox((0, 0), ln, font=fnt)
        widths.append(b[2] - b[0])
        heights.append(b[3] - b[1])
    gap = 8
    total_h = sum(heights) + gap * (len(lines) - 1)
    y = y0 + (y1 - y0 - total_h) // 2
    for ln, fnt, tw, th in zip(lines, fnts, widths, heights):
        draw.text((x0 + (x1 - x0 - tw) // 2, y), ln, font=fnt, fill=fill)
        y += th + gap


def framed(draw: ImageDraw.ImageDraw, box, width: int = 4) -> None:
    draw.rectangle(box, outline=PADDY, width=width)


def photo_slot(base: Image.Image, box: tuple[int, int, int, int], path: Path) -> None:
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    slot = Image.new("RGB", (w, h), PHOTO_BG)
    if path.exists():
        im = Image.open(path).convert("RGB")
        im = im.resize((w, h), Image.Resampling.LANCZOS)
        slot = im
    base.paste(slot, (x0, y0))
    ImageDraw.Draw(base).rectangle(box, outline=PADDY, width=5)


def main() -> None:
    img = Image.new("RGB", (W, H), WHITE)
    draw = ImageDraw.Draw(img)

    # Crest
    crest_box = pt(49.5, 73.3, 252.2, 229.1)
    if CREST.exists():
        crest = Image.open(CREST).convert("RGBA")
        cw = crest_box[2] - crest_box[0]
        ch = crest_box[3] - crest_box[1]
        crest = crest.resize((cw, ch), Image.Resampling.LANCZOS)
        img.paste(crest, (crest_box[0], crest_box[1]), crest if crest.mode == "RGBA" else None)
        draw = ImageDraw.Draw(img)

    title(draw, pt(65.4, 93.2, 1592.7, 117.2), "University of Computer Studies (Meiktila)", 40)
    title(draw, pt(188.7, 194.6, 1452.4, 134.8), "SMART AGRO Community\nSmart Tool for Myanmar Farmers", 48)

    # Objectives — official aims from the Nay Pyi Taw form
    bar(draw, pt(88.9, 384.8, 602.5, 140.3), "Objectives")
    obj_box = pt(40.2, 553.4, 1639.1, 541.8)
    framed(draw, obj_box)
    fit_bullets(
        draw,
        [
            "To identify crop diseases and pests with AI, then get treatment and prevention methods",
            "To obtain expert review and analysis of field cases",
            "To display regional plant and crop outbreaks on a heatmap",
            "To build a farmer-to-farmer community for sharing problems, experience and solutions",
            "To ask weather and farming advice in Myanmar through the AI advisor BaGyi Pyoe",
            "To increase digital knowledge for farmers with the help of AI",
        ],
        obj_box,
        start_pt=32,
        min_pt=24,
        color=FOREST,
    )

    # Functions
    bar(draw, pt(76.2, 1134.7, 585.6, 125.3), "Functions")
    photo_slot(img, pt(837.2, 1134.7, 854.8, 570.0), PH[0])
    draw = ImageDraw.Draw(img)

    farm_box = pt(40.2, 1305.5, 728.0, 365.9)
    framed(draw, farm_box)
    fit_bullets(
        draw,
        [
            "Identify crop diseases and pests with AI",
            "Ask BaGyi Pyoe for weather and farm advice",
            "Share problems and solutions with other farmers",
            "Study diseases and pests in the Knowledge Center",
        ],
        farm_box,
        start_pt=26,
        min_pt=20,
        color=FOREST,
        heading="For Farmers",
    )

    photo_slot(img, pt(40.2, 1730.1, 771.8, 565.8), PH[1])
    draw = ImageDraw.Draw(img)

    staff_box = pt(843.4, 1728.1, 840.2, 303.5)
    framed(draw, staff_box)
    fit_bullets(
        draw,
        [
            "Review and analyse farmer field cases",
            "Check regional outbreaks on the heatmap",
            "Support the farmer-to-farmer community",
        ],
        staff_box,
        start_pt=26,
        min_pt=20,
        color=FOREST,
        heading="For Experts and Admins",
    )

    photo_slot(img, pt(837.2, 2065.5, 854.8, 435.7), PH[2])
    draw = ImageDraw.Draw(img)

    # Benefits
    bar(draw, pt(94.5, 2368.4, 627.6, 124.8), "Benefits")
    ben_box = pt(40.2, 2532.8, 1643.4, 455.2)
    framed(draw, ben_box)
    fit_bullets(
        draw,
        [
            "An AI farming platform built for Myanmar farmers",
            "Expert Review so a specialist can check the result",
            "Heatmap of regional crop disease and pest outbreaks",
            "Knowledge Center and a Myanmar-language AI chatbot",
        ],
        ben_box,
        start_pt=34,
        min_pt=24,
        color=FOREST,
    )

    img.save(OUT, "PNG", dpi=(DPI, DPI))
    preview = img.resize((900, 1575), Image.Resampling.LANCZOS)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    preview.save(PREVIEW, "PNG")
    print(f"Wrote {OUT} {img.size}")
    print(f"Wrote {PREVIEW} {preview.size}")


if __name__ == "__main__":
    main()
