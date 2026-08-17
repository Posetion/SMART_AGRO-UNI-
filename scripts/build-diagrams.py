"""Correct UML / ER / flow diagrams for Smart Agro Community."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.patches import (
    Circle,
    Ellipse,
    FancyArrowPatch,
    FancyBboxPatch,
    FancyBboxPatch as FB,
    Polygon,
    Rectangle,
    FancyBboxPatch,
)
from matplotlib.lines import Line2D
from matplotlib.patches import Arc

OUT = Path(r"d:\SMART-AGRO\docs\diagrams")
OUT.mkdir(parents=True, exist_ok=True)

CREAM = "#F7F4EA"
INK = "#1F2416"
OLIVE = "#3A4426"
MID = "#5A6340"
GOLD = "#B8954A"
WHITE = "#FFFEF8"
CARD = "#EFEBD6"
TEAL = "#355E52"
MUTED = "#6A6D58"
BLUE = "#3A5570"
RED = "#6A3A32"
GREEN = "#3F5530"


def fig_ax(w, h, title, subtitle="Smart Agro Community  ·  UCS Meiktila"):
    fig, ax = plt.subplots(figsize=(w, h), dpi=170)
    fig.patch.set_facecolor(CREAM)
    ax.set_facecolor(CREAM)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")
    ax.text(50, 97.2, title, ha="center", va="top", fontsize=15, color=OLIVE, fontweight="bold")
    ax.text(50, 93.6, subtitle, ha="center", va="top", fontsize=8, color=MUTED)
    return fig, ax


def save(fig, name):
    path = OUT / name
    fig.savefig(path, bbox_inches="tight", facecolor=fig.get_facecolor(), pad_inches=0.2)
    plt.close(fig)
    print("wrote", path)


def box(ax, x, y, w, h, fc=WHITE, ec=OLIVE, lw=1.2, r=0.4, z=2):
    p = FancyBboxPatch(
        (x, y), w, h, boxstyle=f"round,pad=0.12,rounding_size={r}",
        facecolor=fc, edgecolor=ec, linewidth=lw, zorder=z,
    )
    ax.add_patch(p)
    return p


def txt(ax, x, y, s, size=7.2, color=INK, w="normal", ha="center", va="center", z=6):
    ax.text(x, y, s, fontsize=size, color=color, fontweight=w, ha=ha, va=va, zorder=z)


def hline(ax, x1, x2, y, color=OLIVE, lw=1.15, ls="-"):
    ax.add_line(Line2D([x1, x2], [y, y], color=color, lw=lw, ls=ls, zorder=3, solid_capstyle="round"))


def vline(ax, x, y1, y2, color=OLIVE, lw=1.15, ls="-"):
    ax.add_line(Line2D([x, x], [y1, y2], color=color, lw=lw, ls=ls, zorder=3, solid_capstyle="round"))


def polyline(ax, pts, color=OLIVE, lw=1.15, ls="-"):
    xs, ys = zip(*pts)
    ax.add_line(Line2D(xs, ys, color=color, lw=lw, ls=ls, zorder=3, solid_capstyle="round"))


def arrow_end(ax, x1, y1, x2, y2, color=OLIVE, lw=1.15, dashed=False, style="-|>"):
    ax.add_patch(
        FancyArrowPatch(
            (x1, y1), (x2, y2),
            arrowstyle=style, mutation_scale=10, linewidth=lw, color=color,
            linestyle=(0, (3.5, 2.2)) if dashed else "solid", zorder=4,
        )
    )


def actor(ax, x, y, name, color=OLIVE):
    """Stick figure. y is the feet."""
    ax.add_patch(Circle((x, y + 7.4), 1.15, facecolor=WHITE, edgecolor=color, lw=1.5, zorder=5))
    vline(ax, x, y + 6.2, y + 3.1, color, 1.5)
    hline(ax, x - 1.7, x + 1.7, y + 5.2, color, 1.5)
    polyline(ax, [(x, y + 3.1), (x - 1.35, y)], color=color, lw=1.5)
    polyline(ax, [(x, y + 3.1), (x + 1.35, y)], color=color, lw=1.5)
    txt(ax, x, y - 1.5, name, 8, color, "bold")


def usecase(ax, x, y, w, h, label):
    e = Ellipse((x, y), w, h, facecolor=WHITE, edgecolor=OLIVE, lw=1.2, zorder=4)
    ax.add_patch(e)
    txt(ax, x, y, label, 6.6, INK, "normal")
    return x, y, w, h


def assoc(ax, x1, y1, x2, y2):
    """Solid association, no arrow (UML use-case association)."""
    ax.add_line(Line2D([x1, x2], [y1, y2], color=OLIVE, lw=1.05, zorder=3))


def generalize(ax, cx, cy, px, py):
    """Child (cx,cy) generalizes to parent (px,py). Hollow triangle at parent."""
    ax.add_line(Line2D([cx, px], [cy, py], color=OLIVE, lw=1.2, zorder=3))
    # triangle pointing to parent
    import math
    dx, dy = px - cx, py - cy
    L = max((dx * dx + dy * dy) ** 0.5, 0.01)
    ux, uy = dx / L, dy / L
    px2, py2 = px, py
    base_x, base_y = px2 - ux * 1.7, py2 - uy * 1.7
    pxp, pyp = -uy, ux
    p1 = (px2, py2)
    p2 = (base_x + pxp * 0.95, base_y + pyp * 0.95)
    p3 = (base_x - pxp * 0.95, base_y - pyp * 0.95)
    ax.add_patch(Polygon([p1, p2, p3], closed=True, facecolor=WHITE, edgecolor=OLIVE, lw=1.2, zorder=5))


def class_box(ax, x, y, w, h, name, attrs, methods, header=OLIVE):
    box(ax, x, y, w, h, WHITE, OLIVE, 1.15, 0.15)
    hh = 1.85
    ax.add_patch(Rectangle((x, y + h - hh), w, hh, facecolor=header, edgecolor=OLIVE, lw=0.8, zorder=3))
    txt(ax, x + w / 2, y + h - hh / 2, name, 7.3, WHITE, "bold")
    # divider 1
    attr_h = 0.95 * len(attrs) + 0.35
    ydiv1 = y + h - hh - attr_h
    hline(ax, x, x + w, ydiv1, OLIVE, 0.7)
    body = "\n".join(attrs)
    txt(ax, x + 0.4, y + h - hh - 0.25, body, 5.7, INK, ha="left", va="top")
    body2 = "\n".join(methods)
    txt(ax, x + 0.4, ydiv1 - 0.25, body2, 5.7, INK, ha="left", va="top")


def entity(ax, x, y, w, h, name, fields, header=OLIVE):
    box(ax, x, y, w, h, WHITE, OLIVE, 1.1, 0.12)
    ax.add_patch(Rectangle((x, y + h - 1.7), w, 1.7, facecolor=header, edgecolor=OLIVE, lw=0.7, zorder=3))
    txt(ax, x + w / 2, y + h - 0.85, name, 7.2, WHITE, "bold")
    txt(ax, x + 0.4, y + h - 2.05, "\n".join(fields), 5.6, INK, ha="left", va="top")


def crow(ax, x, y, facing="right", many=True):
    """Tiny crow's-foot at (x,y). facing = direction toward the MANY entity."""
    s = 0.85
    if facing == "right":
        pts = [(x, y), (x + s, y + s * 0.7), (x + s, y - s * 0.7)] if many else None
        if many:
            polyline(ax, [(x, y), (x + s, y + 0.65)], OLIVE, 1.05)
            polyline(ax, [(x, y), (x + s, y)], OLIVE, 1.05)
            polyline(ax, [(x, y), (x + s, y - 0.65)], OLIVE, 1.05)
        else:
            hline(ax, x, x + 0.55, y, OLIVE, 1.2)
            vline(ax, x + 0.55, y - 0.45, y + 0.45, OLIVE, 1.2)
    elif facing == "left":
        if many:
            polyline(ax, [(x, y), (x - s, y + 0.65)], OLIVE, 1.05)
            polyline(ax, [(x, y), (x - s, y)], OLIVE, 1.05)
            polyline(ax, [(x, y), (x - s, y - 0.65)], OLIVE, 1.05)
        else:
            hline(ax, x - 0.55, x, y, OLIVE, 1.2)
            vline(ax, x - 0.55, y - 0.45, y + 0.45, OLIVE, 1.2)
    elif facing == "down":
        if many:
            polyline(ax, [(x, y), (x + 0.65, y - s)], OLIVE, 1.05)
            polyline(ax, [(x, y), (x, y - s)], OLIVE, 1.05)
            polyline(ax, [(x, y), (x - 0.65, y - s)], OLIVE, 1.05)
        else:
            vline(ax, x, y - 0.55, y, OLIVE, 1.2)
            hline(ax, x - 0.45, x + 0.45, y - 0.55, OLIVE, 1.2)
    else:  # up
        if many:
            polyline(ax, [(x, y), (x + 0.65, y + s)], OLIVE, 1.05)
            polyline(ax, [(x, y), (x, y + s)], OLIVE, 1.05)
            polyline(ax, [(x, y), (x - 0.65, y + s)], OLIVE, 1.05)
        else:
            vline(ax, x, y, y + 0.55, OLIVE, 1.2)
            hline(ax, x - 0.45, x + 0.45, y + 0.55, OLIVE, 1.2)


def rel_h(ax, x1, y, x2, left_many=False, right_many=True, lcap="1", rcap="N", note=""):
    """Horizontal relationship with crow's foot."""
    hline(ax, x1, x2, y, OLIVE, 1.05)
    crow(ax, x1, y, "left", many=left_many)
    crow(ax, x2, y, "right", many=right_many)
    txt(ax, x1 + 1.1, y + 0.85, lcap, 5.5, MUTED)
    txt(ax, x2 - 1.1, y + 0.85, rcap, 5.5, MUTED)
    if note:
        txt(ax, (x1 + x2) / 2, y + 1.05, note, 5.4, MUTED)


def rel_v(ax, x, y1, y2, top_many=False, bot_many=True, tcap="1", bcap="N", note=""):
    vline(ax, x, y1, y2, OLIVE, 1.05)
    crow(ax, x, y1, "up", many=top_many)
    crow(ax, x, y2, "down", many=bot_many)
    txt(ax, x + 1.0, y1 - 0.7, tcap, 5.5, MUTED)
    txt(ax, x + 1.0, y2 + 0.7, bcap, 5.5, MUTED)
    if note:
        txt(ax, x + 2.4, (y1 + y2) / 2, note, 5.4, MUTED, ha="left")


# ---------------------------------------------------------------------------
# 1. USE CASE  (generalization + unique associations only)
# ---------------------------------------------------------------------------
def draw_use_case():
    fig, ax = fig_ax(17.4, 11.2, "UML Use Case Diagram")

    box(ax, 20, 10, 60, 76, "#F4F0E2", GOLD, 1.7, 0.2)
    txt(ax, 50, 84.6, "Smart Agro Community", 10, OLIVE, "bold")

    actor(ax, 8.5, 58, "Guest", MUTED)
    actor(ax, 8.5, 26, "Farmer", GREEN)
    generalize(ax, 8.5, 34.4, 8.5, 58)

    actor(ax, 91.5, 62, "Expert", BLUE)
    actor(ax, 91.5, 26, "Admin", RED)
    generalize(ax, 91.5, 34.4, 91.5, 62)

    g = [
        usecase(ax, 32, 74, 15.8, 6.0, "View weather"),
        usecase(ax, 32, 65, 15.8, 6.0, "View outbreak heatmap"),
        usecase(ax, 32, 56, 15.8, 6.0, "Read published knowledge"),
        usecase(ax, 32, 47, 15.8, 6.0, "Register / log in"),
    ]
    f = [
        usecase(ax, 50, 74, 15.8, 6.0, "Detect crop disease"),
        usecase(ax, 50, 65, 15.8, 6.0, "Download lab report"),
        usecase(ax, 50, 56, 15.8, 6.0, "Request expert review"),
        usecase(ax, 50, 47, 15.8, 6.0, "Ask BaGyi Pyoe"),
        usecase(ax, 50, 38, 15.8, 6.0, "Post to Community"),
        usecase(ax, 50, 29, 15.8, 6.0, "Message / friends"),
        usecase(ax, 50, 20, 15.8, 6.0, "Report a post"),
    ]
    e = [
        usecase(ax, 68, 74, 15.8, 6.0, "Review diagnosis queue"),
        usecase(ax, 68, 65, 15.8, 6.0, "Verify / correct AI"),
        usecase(ax, 68, 56, 15.8, 6.0, "Reject diagnosis"),
    ]
    a = [
        usecase(ax, 68, 38, 15.8, 6.0, "Moderate Community"),
        usecase(ax, 68, 29, 15.8, 6.0, "Manage knowledge"),
        usecase(ax, 68, 20, 15.8, 6.0, "Manage users / audit"),
    ]

    def spine(actor_x, actor_y, ucs, side="left"):
        ys = [u[1] for u in ucs]
        y0, y1 = min(ys), max(ys)
        if side == "left":
            sx = ucs[0][0] - ucs[0][2] / 2 - 0.55
            hline(ax, actor_x + 2.5, sx, actor_y + 5.0, OLIVE, 1.05)
            vline(ax, sx, y0, y1, OLIVE, 1.05)
            for ux, uy, uw, _ in ucs:
                hline(ax, sx, ux - uw / 2, uy, OLIVE, 1.05)
        else:
            sx = ucs[0][0] + ucs[0][2] / 2 + 0.55
            hline(ax, actor_x - 2.5, sx, actor_y + 5.0, OLIVE, 1.05)
            vline(ax, sx, y0, y1, OLIVE, 1.05)
            for ux, uy, uw, _ in ucs:
                hline(ax, ux + uw / 2, sx, uy, OLIVE, 1.05)

    spine(8.5, 58, g, "left")
    spine(8.5, 26, f, "left")
    spine(91.5, 62, e, "right")
    spine(91.5, 26, a, "right")

    polyline(ax, [(58.0, 56), (58.5, 56), (58.5, 74), (58.0, 74)], MUTED, 1.0, (0, (3.2, 2)))
    arrow_end(ax, 58.0, 74, 57.92, 74, MUTED, 0.9, dashed=True, style="->")
    txt(ax, 58.5, 65.2, "<<extend>>", 5.8, MUTED)

    txt(ax, 50, 7.2, "Farmer ▷ Guest     Admin ▷ Expert     Expert and Admin inherit Farmer use cases (not redrawn).", 7.0, MUTED)
    txt(ax, 50, 4.4, "Public: weather, heatmap, published knowledge.     JWT: Detect, BaGyi Pyoe, Community, Messages.", 6.6, MUTED)
    save(fig, "01-uml-use-case.png")


# ---------------------------------------------------------------------------
# 2. ER DIAGRAM
# ---------------------------------------------------------------------------
def draw_er():
    fig, ax = fig_ax(18.8, 12.6, "ER Diagram  —  MongoDB collections (crow’s foot)")

    entity(ax, 2, 72, 18, 18, "USER", [
        "_id  PK", "email  UK", "passwordHash", "fullName",
        "role {farmer, expert, admin}", "township, GPS", "crops[]  isGuest",
    ], GREEN)
    entity(ax, 28, 72, 20, 18, "DIAGNOSIS", [
        "_id  PK", "userId  FK", "imageUrl  cropType", "disease  severityIndex",
        "probabilities[]  GPS", "weatherConditions{}", "prediction{}  treatment",
        "reviewRequested  isVerified", "verifiedBy / rejectedBy FK",
    ], OLIVE)
    entity(ax, 56, 76, 18, 14, "DISEASE_LOCATION", [
        "_id  PK", "diagnosticId  FK", "township  disease",
        "severity  Point 2dsphere", "timestamp",
    ], MID)
    entity(ax, 80, 76, 18, 14, "TOWNSHIP", [
        "_id  PK", "nameEn  UK  nameMy", "region  isActive",
        "coordinates Point",
    ], GOLD)

    entity(ax, 2, 46, 18, 18, "POST", [
        "_id  PK", "userId  FK", "content  images[]",
        "diagnosticId  FK  (optional)", "likes[] → USER",
        "comments[] {userId, replies[]}", "isActive  moderatedBy",
    ], TEAL)
    entity(ax, 28, 48, 20, 16, "POST_REPORT", [
        "_id  PK", "postId  FK", "reporterId  FK",
        "reason  status", "{pending, approved, denied}",
        "reviewedBy  postSnapshot{}",
    ], RED)
    entity(ax, 56, 48, 18, 16, "KNOWLEDGE", [
        "_id  PK", "uploadedBy  FK", "title  category",
        "{Book, Article, Journal}", "fileUrl  isPublished", "version  views",
    ], BLUE)
    entity(ax, 80, 48, 18, 16, "CHATBOT_SESSION", [
        "_id  PK", "userId  FK", "sessionId  UK",
        "messages[] {sender, text,", "  imageUrls, attachments}", "isActive",
    ], BLUE)

    entity(ax, 2, 22, 18, 16, "CONVERSATION", [
        "_id  PK", "type {direct, group}", "participants[] → USER",
        "adminIds[]  inviteCode", "lastMessagePreview",
    ], TEAL)
    entity(ax, 28, 22, 20, 16, "MESSAGE", [
        "_id  PK", "conversationId  FK", "senderId  FK",
        "text  attachments[]", "replyTo  readBy[]",
    ], TEAL)
    entity(ax, 56, 22, 18, 16, "FRIENDSHIP", [
        "_id  PK", "fromUserId  FK", "toUserId  FK",
        "status {pending, accepted,", "         declined}", "UK (from, to)",
    ], GREEN)
    entity(ax, 80, 22, 18, 16, "NOTIFICATION", [
        "_id  PK", "userId  FK", "type  title  body",
        "link  fromUserId", "read",
    ], MID)

    entity(ax, 2, 4, 18, 12, "REFRESH_TOKEN", [
        "_id  PK", "userId  FK", "tokenHash  UK", "expiresAt TTL  revokedAt",
    ], MUTED)
    entity(ax, 28, 4, 20, 12, "AUDIT_LOG", [
        "_id  PK", "actorId  FK", "action  resourceType", "resourceId  ip",
    ], MUTED)
    entity(ax, 56, 4, 18, 12, "USER_BLOCK", [
        "_id  PK", "blockerId  FK", "blockedId  FK", "UK (blocker, blocked)",
    ], RED)
    entity(ax, 80, 4, 18, 12, "TOWNSHIP_BOUNDARY", [
        "_id  PK", "name + region UK", "geometry Polygon", "outbreakCount  riskLevel",
    ], GOLD)

    # relationships (only lines that do not cross boxes)
    rel_h(ax, 20, 81, 28, False, True, "1", "N", "creates")
    rel_h(ax, 48, 83, 56, False, False, "1", "0..1", "heatmap pin")
    rel_h(ax, 74, 83, 80, False, False, "N", "1", "nearest")
    rel_v(ax, 11, 72, 64, False, True, "1", "N")
    rel_h(ax, 20, 56, 28, False, True, "1", "N", "reports")
    rel_h(ax, 20, 30, 28, False, True, "1", "N")
    rel_v(ax, 11, 46, 38, False, True, "1", "N")
    rel_v(ax, 11, 22, 16, False, True, "1", "N")

    txt(ax, 50, 1.3,
        "Crow’s foot:  1 = one   N = many   0..1 = optional.  comments[] and messages[] are embedded documents, not separate collections.",
        6.6, MUTED)
    save(fig, "02-er-diagram.png")


# ---------------------------------------------------------------------------
# 3. ARCHITECTURE
# ---------------------------------------------------------------------------
def draw_architecture():
    fig, ax = fig_ax(16.4, 10.0, "System Architecture")

    box(ax, 4, 76, 92, 13, WHITE, GOLD, 1.4)
    txt(ax, 50, 86.8, "Client  —  React 19 PWA  ·  Vite  ·  TypeScript  ·  English / Myanmar", 8.2, OLIVE, "bold")
    mods = ["Detect", "BaGyi Pyoe", "Community", "Weather", "Heatmap", "Knowledge", "Messages", "Admin"]
    for i, m in enumerate(mods):
        x = 6.5 + i * 11.3
        box(ax, x, 77.4, 10.4, 6.2, CARD, MID)
        txt(ax, x + 5.2, 80.5, m, 6.8, OLIVE, "bold")

    arrow_end(ax, 50, 76, 50, 69.2, OLIVE, 1.2)

    box(ax, 16, 50, 68, 19, WHITE, OLIVE, 1.5)
    txt(ax, 50, 66.6, "API Gateway   Node.js + Express + TypeScript    /api/v1", 8.2, OLIVE, "bold")
    txt(ax, 50, 63.4, "Helmet · CORS · rate limit · Zod · JWT access/refresh · Multer magic-byte check", 6.4, MUTED)
    eps = ["/auth", "/detections", "/chatbot", "/social", "/messages",
           "/weather", "/heatmap", "/knowledge", "/admin", "/files"]
    for i, e in enumerate(eps):
        x = 18.4 + (i % 5) * 12.4
        y = 57.4 if i < 5 else 51.4
        box(ax, x, y, 11.6, 4.6, CARD, MID, 0.9, 0.25)
        txt(ax, x + 5.8, y + 2.3, e, 6.3, INK)

    cols = [
        (3, "MongoDB", ["Users, diagnoses, posts", "GridFS binaries", "2dsphere heatmap"], GREEN),
        (22.4, "Gemini", ["Vision + BaGyi Pyoe", "Key rotation", "Cursor SDK fallback"], BLUE),
        (41.8, "FastAPI :8000", ["Optional rice SVM", "HSV HOG LBP GLCM", "Private network only"], TEAL),
        (61.2, "Open-Meteo", ["Current + 7-day", "Myanmar geocoding", "No API key"], GOLD),
        (80.6, "Mail / files", ["Nodemailer", "Lab report .docx", "S3-ready storage"], RED),
    ]
    for x, title, lines, col in cols:
        arrow_end(ax, 50, 50, x + 8, 41.6, OLIVE, 0.95)
        entity(ax, x, 22, 16.6, 15.5, title, lines, col)

    txt(ax, 50, 16.4, "The browser calls only /api/v1. Gemini and FastAPI are never exposed to the client.", 7.2, MUTED)
    txt(ax, 50, 13.2, "Flow:  PWA  →  HTTPS  →  Express  →  MongoDB + AI + weather  →  JSON / GridFS.", 7.0, MUTED)
    save(fig, "03-system-architecture.png")


# ---------------------------------------------------------------------------
# 4. SYSTEM FLOW
# ---------------------------------------------------------------------------
def draw_flow():
    fig, ax = fig_ax(16.4, 10.4, "System Flow  —  photo to field action")

    steps = [
        (3, "1. Sign in", "Email + password\nor guest JWT"),
        (23, "2. Capture", "Leaf photo ≤ 5 MB\nTownship or GPS"),
        (43, "3. Diagnose", "POST /detections/analyze\nQuality gate + Gemini"),
        (63, "4. Decide", "Result card, DOA guide\nLab report .docx"),
        (83, "5. Act", "Treat · share\nwarn neighbours"),
    ]
    for i, (x, t, b) in enumerate(steps):
        box(ax, x, 74, 15.5, 14.5, WHITE, OLIVE, 1.25)
        ax.add_patch(Rectangle((x, 84.4), 15.5, 4.1, facecolor=OLIVE, zorder=3))
        txt(ax, x + 7.75, 86.45, t, 7.6, WHITE, "bold")
        txt(ax, x + 7.75, 79.2, b, 6.4, INK)
        if i < 4:
            arrow_end(ax, x + 15.5, 81.2, steps[i + 1][0], 81.2, OLIVE, 1.15)

    box(ax, 3, 16, 94, 53, "#F4F0E2", GOLD, 1.3, 0.25)
    txt(ax, 50, 66.2, "Inside Express after the photo is accepted", 8.6, OLIVE, "bold")

    inner = [
        (6, "Upload", "GridFS stores file\nreturns imageUrl"),
        (29, "AI detect", "Gemini (Cursor fallback)\noptional rice SVM\nreject non-crop"),
        (52, "Context", "Open-Meteo weather\nrisk prediction\nnearest township"),
        (75, "Persist", "Diagnosis document\nDiseaseLocation pin"),
    ]
    for i, (x, t, b) in enumerate(inner):
        box(ax, x, 46, 20, 15, WHITE, MID)
        txt(ax, x + 10, 57.6, t, 7.8, OLIVE, "bold")
        txt(ax, x + 10, 51.4, b, 6.3, INK)
        if i < 3:
            arrow_end(ax, x + 20, 53.5, inner[i + 1][0], 53.5, OLIVE, 1.05)

    outs = [
        (8, "Community", "Post can link diagnosis\nlike · comment · report"),
        (38, "Expert loop", "POST .../request-review\nverify / correct / reject\nnotification to farmer"),
        (68, "Heatmap", "Township choropleth\nheat layer of detections"),
    ]
    for x, t, b in outs:
        box(ax, x, 21, 25, 16, CARD, OLIVE)
        txt(ax, x + 12.5, 33.6, t, 7.8, OLIVE, "bold")
        txt(ax, x + 12.5, 26.8, b, 6.3, INK)
    arrow_end(ax, 16, 46, 20.5, 37, OLIVE, 0.95)
    arrow_end(ax, 50, 46, 50.5, 37, OLIVE, 0.95)
    arrow_end(ax, 85, 46, 80.5, 37, OLIVE, 0.95)

    txt(ax, 50, 10.8, "Quality.ok = false → HTTP 400, no Diagnosis row.  BaGyi Pyoe is a parallel path: chat + live township weather.", 6.8, MUTED)
    save(fig, "04-system-flow.png")


# ---------------------------------------------------------------------------
# 5. SEQUENCE  — correct endpoint, separate lifelines
# ---------------------------------------------------------------------------
def draw_sequence():
    fig, ax = fig_ax(17.2, 11.4, "UML Sequence Diagram  —  detect crop disease")

    lanes = [
        (8, "Farmer"),
        (26, "React PWA"),
        (44, "Express API"),
        (62, "Gemini"),
        (78, "Open-Meteo"),
        (93, "MongoDB"),
    ]
    top, bottom = 86, 14
    for x, name in lanes:
        box(ax, x - 6.4, 86.2, 12.8, 5.2, CARD, OLIVE)
        txt(ax, x, 88.8, name, 7.2, OLIVE, "bold")
        vline(ax, x, 86.2, bottom, MID, 0.85, (0, (2.5, 2)))

    def call(y, x1, x2, label, dashed=False):
        arrow_end(ax, x1, y, x2, y, OLIVE if not dashed else MUTED, 1.05, dashed=dashed)
        txt(ax, (x1 + x2) / 2, y + 1.35, label, 5.9, INK)

    def bar(x, y1, y2):
        ax.add_patch(Rectangle((x - 0.45, y2), 0.9, y1 - y2, facecolor=OLIVE, edgecolor=OLIVE, lw=0, zorder=4))

    bar(8, 82, 80)
    bar(26, 82, 20)
    bar(44, 76, 26)
    bar(62, 60, 54)
    bar(78, 48, 42)
    bar(93, 70, 32)

    call(82, 8, 26, "1. Choose photo + township / GPS")
    call(76, 26, 44, "2. POST /api/v1/detections/analyze")
    call(70, 44, 93, "3. GridFS upload")
    call(66, 93, 44, "4. imageUrl", True)
    call(60, 44, 62, "5. detectDisease(buffer)")
    call(56, 62, 44, "6. crop, disease, quality, treatment", True)

    box(ax, 40, 51.2, 28, 4.4, CARD, GOLD, 1.0, 0.2)
    txt(ax, 54, 53.4, "alt  [quality.ok = false] → HTTP 400, stop", 6.0, INK)

    call(48, 44, 78, "7. GET current weather(lat, lng)")
    call(44, 78, 44, "8. temp, humidity, rain", True)
    call(38, 44, 93, "9. insert Diagnosis + DiseaseLocation")
    call(34, 93, 44, "10. saved documents", True)
    call(28, 44, 26, "11. JSON result (Myanmar name first)", True)
    call(22, 26, 8, "12. Result card · lab report · share", True)

    save(fig, "05-uml-sequence-detect.png")


# ---------------------------------------------------------------------------
# 6. CLASS DIAGRAM
# ---------------------------------------------------------------------------
def draw_class():
    fig, ax = fig_ax(18.6, 12.2, "UML Class Diagram  —  domain model")

    class_box(ax, 2, 70, 18, 22, "User", [
        "− email: String",
        "− passwordHash: String",
        "− role: farmer|expert|admin",
        "− township: String",
        "− isGuest: Boolean",
    ], [
        "+ register()",
        "+ login()",
        "+ loginAsGuest()",
    ], GREEN)

    class_box(ax, 26, 68, 20, 24, "Diagnosis", [
        "− cropType: CropType",
        "− disease: String",
        "− severityIndex: Number",
        "− treatmentProtocol: String",
        "− reviewRequested: Boolean",
        "− isVerified: Boolean",
    ], [
        "+ analyze(image)",
        "+ requestReview()",
        "+ verify()",
        "+ reject(reason)",
    ], OLIVE)

    class_box(ax, 52, 74, 18, 18, "DiseaseLocation", [
        "− township: String",
        "− disease: String",
        "− severity: Number",
        "− location: GeoJSON",
    ], [
        "+ fromDiagnosis()",
    ], MID)

    class_box(ax, 76, 74, 21, 18, "Township", [
        "− nameEn: String",
        "− nameMy: String",
        "− region: String",
        "− coordinates: Point",
    ], [
        "+ nearest(lat, lng)",
    ], GOLD)

    class_box(ax, 2, 38, 18, 24, "Post", [
        "− content: String",
        "− images: String[]",
        "− isActive: Boolean",
        "− comments: Comment[]",
    ], [
        "+ create()",
        "+ comment()",
        "+ like()",
        "+ report()",
    ], TEAL)

    class_box(ax, 26, 40, 20, 22, "PostReport", [
        "− reason: String",
        "− status: pending|",
        "         approved|denied",
        "− postSnapshot: Object",
    ], [
        "+ review(approve|deny)",
    ], RED)

    class_box(ax, 52, 42, 18, 20, "Knowledge", [
        "− title: String",
        "− category: Book|",
        "            Article|Journal",
        "− isPublished: Boolean",
    ], [
        "+ publish()",
        "+ search()",
    ], BLUE)

    class_box(ax, 76, 42, 21, 20, "ChatbotSession", [
        "− sessionId: String",
        "− messages: Message[]",
        "− isActive: Boolean",
    ], [
        "+ send(text, weather)",
        "+ history()",
    ], BLUE)

    class_box(ax, 2, 8, 18, 22, "Conversation", [
        "− type: direct|group",
        "− participants: User[]",
        "− inviteCode: String",
    ], [
        "+ sendMessage()",
        "+ invite()",
    ], TEAL)

    class_box(ax, 26, 10, 20, 20, "ChatMessage", [
        "− text: String",
        "− attachments: Object[]",
        "− readBy: ObjectId[]",
    ], [
        "+ reply()",
        "+ deleteFor()",
    ], TEAL)

    class_box(ax, 52, 12, 18, 18, "Friendship", [
        "− status: pending|",
        "          accepted|declined",
    ], [
        "+ request()",
        "+ accept()",
    ], GREEN)

    class_box(ax, 76, 12, 21, 18, "Notification", [
        "− type: String",
        "− title: String",
        "− read: Boolean",
    ], [
        "+ markRead()",
    ], MID)

    def mlink(x1, y1, x2, y2, a="1", b="*", note=""):
        ax.add_line(Line2D([x1, x2], [y1, y2], color=OLIVE, lw=1.0, zorder=3))
        txt(ax, x1 + (x2 - x1) * 0.12, y1 + 0.9, a, 5.6, MUTED)
        txt(ax, x2 - (x2 - x1) * 0.12, y2 + 0.9, b, 5.6, MUTED)
        if note:
            txt(ax, (x1 + x2) / 2, (y1 + y2) / 2 + 1.1, note, 5.3, MUTED)

    mlink(20, 82, 26, 82, "1", "*")
    mlink(46, 84, 52, 84, "1", "0..1")
    mlink(11, 70, 11, 62, "1", "*")
    mlink(20, 50, 26, 50, "1", "*")
    mlink(20, 20, 26, 20, "1", "*")

    txt(ax, 50, 4.6, "Composition: Post contains Comment[]; ChatbotSession contains chat messages.  * = many.", 6.6, MUTED)
    save(fig, "06-uml-class-diagram.png")


# ---------------------------------------------------------------------------
# 7. ACTIVITY with swimlanes
# ---------------------------------------------------------------------------
def draw_activity():
    fig, ax = fig_ax(16.8, 11.0, "UML Activity Diagram  —  expert review")

    # swimlanes
    lanes = [(4, "Farmer", GREEN), (36, "System", OLIVE), (68, "Expert / Admin", BLUE)]
    for x, name, col in lanes:
        box(ax, x, 10, 28, 78, WHITE, col, 1.2, 0.15)
        ax.add_patch(Rectangle((x, 82), 28, 6, facecolor=col, zorder=3))
        txt(ax, x + 14, 85, name, 8.4, WHITE, "bold")

    def start(x, y):
        ax.add_patch(Circle((x, y), 0.85, facecolor=INK, zorder=5))

    def end(x, y):
        ax.add_patch(Circle((x, y), 1.15, facecolor=WHITE, edgecolor=INK, lw=1.4, zorder=5))
        ax.add_patch(Circle((x, y), 0.55, facecolor=INK, zorder=6))

    def act(x, y, w, h, s):
        box(ax, x, y, w, h, CARD, OLIVE, 1.05, 0.9)
        txt(ax, x + w / 2, y + h / 2, s, 6.5, INK)

    def diam(cx, cy, s):
        pts = [(cx, cy + 4.4), (cx + 7.2, cy), (cx, cy - 4.4), (cx - 7.2, cy)]
        ax.add_patch(Polygon(pts, closed=True, facecolor=WHITE, edgecolor=OLIVE, lw=1.15, zorder=4))
        txt(ax, cx, cy, s, 6.1, INK)

    start(18, 78)
    arrow_end(ax, 18, 77.1, 18, 73.2, OLIVE, 1.0)
    act(8, 66.5, 20, 6.5, "Receive AI result")
    arrow_end(ax, 18, 66.5, 18, 60.6, OLIVE, 1.0)
    diam(18, 55, "Request\nreview?")

    # no
    arrow_end(ax, 18, 50.6, 18, 36.4, OLIVE, 1.0)
    txt(ax, 14.2, 44, "[no]", 6, MUTED)
    act(8, 29.5, 20, 6.5, "Keep result private")
    arrow_end(ax, 18, 29.5, 18, 20.4, OLIVE, 1.0)
    end(18, 18.6)

    # yes to system
    arrow_end(ax, 25.2, 55, 40, 55, OLIVE, 1.0)
    txt(ax, 32, 57.2, "[yes]", 6, MUTED)
    act(40, 51.8, 20, 6.5, "Flag reviewRequested\nNotify expert queue")
    arrow_end(ax, 60, 55, 74, 55, OLIVE, 1.0)
    act(72, 51.8, 20, 6.5, "Open review queue")
    arrow_end(ax, 82, 51.8, 82, 44.2, OLIVE, 1.0)
    diam(82, 38.5, "Decision")

    # verify
    arrow_end(ax, 74.8, 38.5, 60, 38.5, OLIVE, 1.0)
    txt(ax, 67, 40.6, "[verify]", 6, MUTED)
    act(40, 35.2, 20, 6.5, "Set isVerified\nKeep aiDetectedDisease")
    arrow_end(ax, 50, 35.2, 50, 28.4, OLIVE, 1.0)
    act(40, 21.6, 20, 6.5, "Notify farmer\ndiagnosis_verified")
    arrow_end(ax, 50, 21.6, 50, 16.4, OLIVE, 1.0)
    end(50, 14.8)

    # reject
    arrow_end(ax, 82, 34.1, 82, 28.4, OLIVE, 1.0)
    txt(ax, 86.6, 31.4, "[reject]", 6, MUTED)
    act(72, 21.6, 20, 6.5, "Reject + reason\nNotify farmer")
    arrow_end(ax, 82, 21.6, 82, 16.4, OLIVE, 1.0)
    end(82, 14.8)

    txt(ax, 50, 6.6, "Routes: POST /detections/:id/request-review   ·   POST /detections/:id/verify   ·   POST /detections/:id/reject", 6.5, MUTED)
    save(fig, "07-uml-activity-expert-review.png")


def main():
    draw_use_case()
    draw_er()
    draw_architecture()
    draw_flow()
    draw_sequence()
    draw_class()
    draw_activity()
    # remove obsolete package diagram name if present
    old = OUT / "06-uml-class-packages.png"
    if old.exists():
        old.unlink()
    print("done", OUT)


if __name__ == "__main__":
    main()
