"""Add entrance animations + light transitions via PowerPoint COM."""
from __future__ import annotations

import shutil
from pathlib import Path

import win32com.client as win32

PPTX = Path(r"d:\SMART-AGRO\docs\Smart-Agro-Community-Presentation.pptx")
DOWNLOADS = Path(r"c:\Users\ASUS\Downloads\Smart-Agro-Community-Presentation.pptx")

# Office MsoAnimEffect
FADE = 10
WIPE = 22
FLY = 2
APPEAR = 1
ZOOM = 23
FLOAT = 30
RISE = 34
GROW_TURN = 31
PEEK = 12
SPLIT = 16
EXPAND = 50
FADED_ZOOM = 48
ASCEND = 39
GLIDE = 49
BOUNCE = 26
STRETCH = 17

# Triggers
ON_CLICK = 1
WITH_PREV = 2
AFTER_PREV = 3

CHROME = {
    "page 001", "page 002", "page 003", "page 004", "page 005",
    "page 006", "page 007", "page 008", "page 009", "page 010",
    "page 011", "page 012", "page 013", "page 014", "page 015",
    "smart agro", "community.", "ucs meiktila", "smart-agro-ucs.surge.sh",
    "smart agro community",
}


def shape_text(shape) -> str:
    try:
        tf = shape.TextFrame
        if tf is None:
            return ""
        return (tf.TextRange.Text or "").strip()
    except Exception:
        return ""


def first_line(shape) -> str:
    t = shape_text(shape)
    return t.splitlines()[0].strip() if t else ""


def is_chrome(shape) -> bool:
    name = (shape.Name or "").lower()
    if "freeform" in name:
        return True
    line = first_line(shape).lower()
    if line in CHROME:
        return True
    if line.startswith("page "):
        return True
    return False


def clear_anims(slide) -> None:
    seq = slide.TimeLine.MainSequence
    while seq.Count >= 1:
        seq.Item(1).Delete()


def add(slide, shape, effect, trigger=AFTER_PREV, by_para=False):
    level = 1 if by_para else 0  # msoAnimateTextByFirstLevel vs msoAnimateLevelNone
    eff = slide.TimeLine.MainSequence.AddEffect(shape, effect, level, trigger)
    try:
        eff.Timing.Duration = 0.55
        if trigger == AFTER_PREV:
            eff.Timing.TriggerDelayTime = 0.12
    except Exception:
        pass
    return eff


def animatable(slide):
    items = []
    for i in range(1, slide.Shapes.Count + 1):
        sh = slide.Shapes.Item(i)
        if is_chrome(sh):
            continue
        name = (sh.Name or "").lower()
        txt = shape_text(sh)
        # skip leftover empty boxes
        if not txt and "picture" not in name and "group" not in name and "rounded" not in name and "oval" not in name and "rectangle" not in name:
            continue
        items.append(sh)
    # top-to-bottom, then left-to-right
    items.sort(key=lambda s: (int(s.Top), int(s.Left)))
    return items


def animate_slide(slide, index: int) -> None:
    clear_anims(slide)
    shapes = animatable(slide)
    if not shapes:
        return

    # Light fade between slides
    try:
        slide.SlideShowTransition.EntryEffect = 3844  # ppEffectFade
        slide.SlideShowTransition.Duration = 0.45
        slide.SlideShowTransition.AdvanceOnClick = True
        slide.SlideShowTransition.AdvanceOnTime = False
    except Exception:
        pass

    # Per-slide effect palette so the deck does not feel identical
    palettes = {
        1: [FADE, FADED_ZOOM, RISE],
        2: [WIPE, FLOAT, APPEAR],
        3: [EXPAND, FLOAT, FADE],
        4: [WIPE, ASCEND, FADE],
        5: [FADE, WIPE, ZOOM],
        6: [PEEK, FLOAT, FADE],
        7: [WIPE, FADE, FADED_ZOOM],
        8: [SPLIT, WIPE, APPEAR],
        9: [STRETCH, FLOAT, FADE],
        10: [RISE, WIPE, FADE],
        11: [ZOOM, FADE, EXPAND],
        12: [GROW_TURN, FLOAT, APPEAR],
        13: [WIPE, ASCEND, FADE],
        14: [RISE, FLOAT, FADED_ZOOM],
        15: [FADE, FADED_ZOOM, GLIDE],
    }
    pal = palettes.get(index, [FADE, WIPE, FLOAT])

    first = True
    for i, sh in enumerate(shapes):
        name = (sh.Name or "").lower()
        txt = shape_text(sh)
        trigger = ON_CLICK if first else AFTER_PREV
        first = False

        bullets = txt.count("•") >= 2
        if "picture" in name:
            effect = pal[2] if len(pal) > 2 else ZOOM
        elif "oval" in name:
            effect = ZOOM
        elif "rounded" in name or "rectangle" in name:
            effect = pal[1] if len(pal) > 1 else FLOAT
        elif bullets:
            effect = pal[0]
        else:
            effect = pal[i % len(pal)]

        add(slide, sh, effect, trigger, by_para=bullets)


def main() -> None:
    ppt = win32.Dispatch("PowerPoint.Application")
    ppt.Visible = True
    pres = ppt.Presentations.Open(str(PPTX), WithWindow=True)
    try:
        for i in range(1, pres.Slides.Count + 1):
            animate_slide(pres.Slides.Item(i), i)
            print(f"animated slide {i} effects={pres.Slides.Item(i).TimeLine.MainSequence.Count}")
        pres.Save()
    finally:
        pres.Close()
        ppt.Quit()
    shutil.copy2(PPTX, DOWNLOADS)
    print("saved", PPTX)


if __name__ == "__main__":
    main()
