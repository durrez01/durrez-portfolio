#!/usr/bin/env python3
"""Generate the portfolio artwork.

Every plate is drawn from code so the site ships without third-party imagery.
Compositions are deliberately spare: paper, ink, one accent, and a motif that
describes the system the study is about.

Run:  python3 tools/generate_art.py
Out:  assets/img/**
"""

import math
import os
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img")
FONTS = os.path.join(ROOT, "tools", "fonts")

# Site palette. PAPER/INK/MUTED/LINE are rebound per plate by `theme()` so a
# motif written once reads correctly on a light ground and on a dark one.
PAPER = LIGHT_PAPER = (239, 235, 227)
INK = LIGHT_INK = (34, 35, 31)
MUTED = LIGHT_MUTED = (114, 111, 102)
LINE = LIGHT_LINE = (211, 207, 197)
ACCENT = (200, 85, 43)

SS = 2  # supersampling factor

WORK = (940, 1672)
PRACTICE = (1122, 1402)
PORTRAIT = (1024, 1536)


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


def mono(size):
    return font("IBMPlexMono-400.ttf", size)


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def theme(kind, accent):
    """Rebind the drawing palette. 'paper' is ink on cream; 'dark' inverts it."""
    global PAPER, INK, MUTED, LINE
    if kind == "dark":
        PAPER = mix(LIGHT_INK, accent, 0.13)          # ground, and the fill of "unlit" shapes
        INK = (245, 241, 233)                          # strokes that used to be ink
        MUTED = mix(PAPER, (245, 241, 233), 0.62)
        LINE = mix(PAPER, (245, 241, 233), 0.40)
    else:
        PAPER, INK, MUTED, LINE = LIGHT_PAPER, LIGHT_INK, LIGHT_MUTED, LIGHT_LINE


def paper_base(size, accent, dark=False):
    """Ground with a soft off-centre warmth and a vignette.

    Built small and scaled up: a per-pixel loop at supersampled size cost ~20s
    a plate, and the gradient has no detail that survives the downsample anyway.
    """
    w, h = size
    sw, sh = 96, max(1, round(96 * h / w))
    small = Image.new("RGB", (sw, sh))
    px = small.load()
    cx, cy = sw * 0.5, sh * 0.40
    maxd = math.hypot(cx, cy)
    lift = mix(PAPER, accent, 0.22) if dark else (250, 246, 238)
    fall = mix(PAPER, LIGHT_INK, 0.35) if dark else (204, 198, 186)
    for y in range(sh):
        for x in range(sw):
            d = min(1.0, math.hypot(x - cx, y - cy) / maxd)
            px[x, y] = mix(mix(PAPER, lift, 0.45 * (1 - d)), fall, 0.32 * d * d if dark else 0.10 * d * d)
    return small.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(w / 240))


def grain(img, amount=7, seed=0):
    w, h = img.size
    rnd = random.Random(seed)
    noise = Image.new("L", (w // 2, h // 2))
    noise.putdata([rnd.randrange(256) for _ in range(noise.size[0] * noise.size[1])])
    noise = noise.resize(img.size, Image.BILINEAR).filter(ImageFilter.GaussianBlur(0.4))
    return Image.blend(img, Image.composite(Image.new("RGB", img.size, (255, 255, 255)),
                                            Image.new("RGB", img.size, (0, 0, 0)), noise),
                       amount / 255 * 2)


def shadow(layer, blur, offset, opacity=0.18):
    """Return an RGBA drop shadow for the alpha of `layer`."""
    a = layer.split()[3].filter(ImageFilter.GaussianBlur(blur))
    sh = Image.new("RGBA", layer.size, INK + (0,))
    sh.putalpha(a.point(lambda v: int(v * opacity)))
    return sh.transform(layer.size, Image.AFFINE, (1, 0, -offset[0], 0, 1, -offset[1]))


def plate(size, seed, accent, motif, caption=None, index=None, ground="paper"):
    """Compose one artwork plate at SS scale, then downsample."""
    theme(ground, accent)
    dark = ground == "dark"
    w, h = size[0] * SS, size[1] * SS
    base = paper_base((w, h), accent, dark)
    art = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(art)
    motif(d, w, h, accent, random.Random(seed))

    base = Image.alpha_composite(base.convert("RGBA"),
                                 shadow(art, 18 * SS, (0, 9 * SS), 0.22 if dark else 0.13))
    base = Image.alpha_composite(base, art)

    marks = ImageDraw.Draw(base)
    m = 62 * SS
    for (x, y, dx, dy) in ((m, m, 1, 1), (w - m, h - m, -1, -1)):
        marks.line([(x, y), (x + 26 * SS * dx, y)], fill=MUTED + (150,), width=max(1, SS))
        marks.line([(x, y), (x, y + 26 * SS * dy)], fill=MUTED + (150,), width=max(1, SS))
    if index:
        # top-left: the site's own index badge sits bottom-left of the plate
        marks.text((m, m + 26 * SS), index, font=mono(26 * SS), fill=MUTED + (210,))
    if caption:
        f = mono(26 * SS)
        tw = marks.textlength(caption, font=f)
        marks.text((w - m - tw, h - m - 74 * SS), caption, font=f, fill=accent + (235,))

    out = base.convert("RGB").resize(size, Image.LANCZOS)
    out = grain(out, 5, seed)
    theme("paper", ACCENT)
    return out


# --------------------------------------------------------------------- motifs

def m_camera_grid(d, w, h, accent, rnd):
    cols, rows = 4, 6
    pad = w * 0.14
    gap = w * 0.028
    cw = (w - pad * 2 - gap * (cols - 1)) / cols
    ch = cw * 0.72
    top = h * 0.5 - (rows * ch + (rows - 1) * gap) / 2
    live = {(1, 1), (2, 3), (0, 4), (3, 0), (2, 5)}
    for r in range(rows):
        for c in range(cols):
            x, y = pad + c * (cw + gap), top + r * (ch + gap)
            box = [x, y, x + cw, y + ch]
            on = (c, r) in live
            d.rounded_rectangle(box, radius=cw * 0.10,
                                fill=(mix(PAPER, accent, 0.34) if on else mix(PAPER, LINE, 0.55)) + (255,),
                                outline=(accent if on else MUTED) + ((255,) if on else (150,)),
                                width=max(1, int(1.6 * SS)))
            for i in range(4):
                yy = y + ch * (0.24 + i * 0.18)
                d.line([x + cw * 0.12, yy, x + cw * (0.40 + 0.42 * rnd.random()), yy],
                       fill=(accent if on else MUTED) + ((190,) if on else (110,)), width=max(1, int(1.4 * SS)))
            if on:
                d.ellipse([x + cw - 13 * SS, y + 7 * SS, x + cw - 5 * SS, y + 15 * SS], fill=accent + (235,))
    sweep = top + (rows * ch + (rows - 1) * gap) * 0.63
    d.line([pad - 18 * SS, sweep, w - pad + 18 * SS, sweep], fill=accent + (210,), width=max(1, int(2.4 * SS)))


def m_topology(d, w, h, accent, rnd):
    cx, cy = w * 0.5, h * 0.48
    for r in (0.30, 0.45, 0.62):
        rr = w * r
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=MUTED + (105,), width=max(1, int(1.4 * SS)))
    sites = []
    for i in range(7):
        a = -math.pi / 2 + i * (2 * math.pi / 7) + 0.18
        rr = w * (0.36 + 0.22 * ((i * 5) % 3) / 2)
        sites.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr * 1.18))
    for i, (x, y) in enumerate(sites):
        mx, my = (cx + x) / 2, (cy + y) / 2 - h * 0.035
        pts = []
        for t in [k / 24 for k in range(25)]:
            bx = (1 - t) ** 2 * cx + 2 * (1 - t) * t * mx + t * t * x
            by = (1 - t) ** 2 * cy + 2 * (1 - t) * t * my + t * t * y
            pts.append((bx, by))
        d.line(pts, fill=mix(MUTED, accent, 0.55) + (215,), width=max(1, int(2.6 * SS)), joint="curve")
        s = w * (0.030 if i % 2 else 0.038)
        d.rounded_rectangle([x - s, y - s * 0.78, x + s, y + s * 0.78], radius=s * 0.3,
                            fill=PAPER + (255,), outline=INK + (190,), width=max(1, int(1.6 * SS)))
        d.line([x - s * 0.5, y, x + s * 0.5, y], fill=accent + (200,), width=max(1, int(1.6 * SS)))
    hub = w * 0.085
    d.ellipse([cx - hub, cy - hub, cx + hub, cy + hub], fill=mix(PAPER, accent, 0.20) + (255,),
              outline=accent + (235,), width=max(1, int(2.6 * SS)))
    d.ellipse([cx - hub * 0.36, cy - hub * 0.36, cx + hub * 0.36, cy + hub * 0.36], fill=accent + (255,))


def m_transport(d, w, h, accent, rnd):
    pad = w * 0.15
    rows = 17
    top = h * 0.26
    step = (h * 0.40) / rows
    for i in range(rows):
        y = top + i * step
        seg = 0.30 + 0.62 * abs(math.sin(i * 0.7 + 0.4))
        d.line([pad, y, pad + (w - pad * 2) * seg, y],
               fill=mix(MUTED, accent, i / rows) + (215,), width=max(1, int(4.2 * SS)))
        if i % 4 == 2:
            d.line([pad + (w - pad * 2) * seg + 10 * SS, y, pad + (w - pad * 2) * seg + 26 * SS, y],
                   fill=accent + (220,), width=max(1, int(3.2 * SS)))
    # latency curve settling
    base = h * 0.80
    pts = []
    for i in range(121):
        t = i / 120
        val = math.exp(-3.1 * t) * (0.55 + 0.45 * math.cos(t * 13)) * 0.5 + 0.06
        pts.append((pad + (w - pad * 2) * t, base - h * 0.22 * val))
    d.line([pad, base, w - pad, base], fill=LINE + (200,), width=max(1, int(1.6 * SS)))
    d.line(pts, fill=accent + (245,), width=max(1, int(3.4 * SS)), joint="curve")
    d.line([pad, base - h * 0.028, w - pad, base - h * 0.028], fill=MUTED + (70,), width=max(1, SS))


def m_overlays(d, w, h, accent, rnd):
    # abstract scene
    d.rounded_rectangle([w * 0.12, h * 0.20, w * 0.88, h * 0.74], radius=w * 0.03,
                        fill=mix(PAPER, MUTED, 0.30) + (255,), outline=INK + (190,), width=max(1, int(2.4 * SS)))
    for i in range(6):
        x = w * (0.16 + i * 0.12)
        d.line([x, h * 0.20, x - w * 0.05, h * 0.74], fill=MUTED + (110,), width=max(1, int(1.6 * SS)))
    # detection boxes with corner brackets
    d.line([w * 0.12, h * 0.58, w * 0.88, h * 0.58], fill=INK + (90,), width=max(1, int(2 * SS)))
    for i, (bx, bh) in enumerate(((0.20, 0.26), (0.46, 0.34), (0.68, 0.22))):
        d.rounded_rectangle([w * bx, h * (0.58 - bh * 0.5), w * (bx + 0.10), h * 0.58],
                            radius=w * 0.012, fill=mix(PAPER, INK, 0.16 + i * 0.06) + (255,))
    boxes = [(0.22, 0.30, 0.44, 0.56), (0.52, 0.38, 0.70, 0.62), (0.62, 0.24, 0.80, 0.42)]
    for i, (x0, y0, x1, y1) in enumerate(boxes):
        bx = [w * x0, h * y0, w * x1, h * y1]
        col = accent if i == 0 else mix(accent, INK, 0.25)
        arm = (bx[2] - bx[0]) * 0.30
        wdt = max(1, int(7 * SS))
        for (cx, cy, dx, dy) in [(bx[0], bx[1], 1, 1), (bx[2], bx[1], -1, 1),
                                 (bx[0], bx[3], 1, -1), (bx[2], bx[3], -1, -1)]:
            d.line([cx, cy, cx + arm * dx, cy], fill=col + (255,), width=wdt)
            d.line([cx, cy, cx, cy + arm * dy], fill=col + (255,), width=wdt)
        d.rectangle([bx[0], bx[1] - 26 * SS, bx[0] + 96 * SS, bx[1] - 4 * SS], fill=col + (235,))
    # confidence bars
    for i in range(4):
        y = h * (0.80 + i * 0.035)
        d.line([w * 0.14, y, w * (0.22 + 0.5 * abs(math.cos(i * 1.3))), y],
               fill=mix(MUTED, accent, 0.4 + i * 0.2) + (230,), width=max(1, int(4.4 * SS)))


def m_pipeline(d, w, h, accent, rnd):
    # events raining into a queue, queue draining into a store
    for i in range(46):
        x = w * (0.16 + 0.68 * rnd.random())
        y = h * (0.16 + 0.22 * rnd.random())
        s = w * (0.008 + 0.010 * rnd.random())
        d.rectangle([x, y, x + s, y + s], fill=mix(MUTED, accent, rnd.random()) + (190,))
    # funnel
    d.polygon([(w * 0.18, h * 0.46), (w * 0.82, h * 0.46), (w * 0.57, h * 0.63), (w * 0.43, h * 0.63)],
              fill=mix(PAPER, accent, 0.26) + (255,), outline=accent + (255,), width=max(1, int(2.4 * SS)))
    for i in range(7):
        x = w * (0.22 + i * 0.093)
        d.line([x, h * 0.46, w * 0.5 + (x - w * 0.5) * 0.28, h * 0.63], fill=MUTED + (130,), width=max(1, int(1.4 * SS)))
    # lane
    d.line([w * 0.5, h * 0.63, w * 0.5, h * 0.71], fill=accent + (230,), width=max(1, int(3.4 * SS)))
    # store cylinder
    cx, cy, rx, ry, dh = w * 0.5, h * 0.80, w * 0.24, w * 0.062, h * 0.09
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=mix(PAPER, LINE, 0.62) + (255,),
              outline=INK + (220,), width=max(1, int(2.6 * SS)))
    d.rectangle([cx - rx, cy, cx + rx, cy + dh], fill=mix(PAPER, LINE, 0.62) + (255,))
    d.line([cx - rx, cy, cx - rx, cy + dh], fill=INK + (190,), width=max(1, int(2 * SS)))
    d.line([cx + rx, cy, cx + rx, cy + dh], fill=INK + (190,), width=max(1, int(2 * SS)))
    d.arc([cx - rx, cy + dh - ry, cx + rx, cy + dh + ry], 0, 180, fill=INK + (190,), width=max(1, int(2 * SS)))
    for i in range(2):
        yy = cy + dh * (0.34 + i * 0.32)
        d.arc([cx - rx, yy - ry, cx + rx, yy + ry], 0, 180, fill=MUTED + (110,), width=max(1, SS))


def m_stack(d, w, h, accent, rnd):
    layers = 6
    cx, cy = w * 0.5, h * 0.50
    for i in range(layers):
        t = i / (layers - 1)
        rw = w * (0.36 - 0.03 * i)
        rh = h * 0.055
        y = cy + (i - layers / 2) * h * 0.082
        off = (i - layers / 2) * w * 0.035
        d.polygon([(cx - rw + off, y), (cx + rw + off, y),
                   (cx + rw * 0.86 + off + w * 0.05, y + rh), (cx - rw * 0.86 + off + w * 0.05, y + rh)],
                  fill=mix(PAPER, accent if i in (1, 4) else LINE, 0.46 if i in (1, 4) else 0.62) + (255,),
                  outline=(accent if i in (1, 4) else MUTED) + (190,))
        d.line([cx - rw + off, y, cx - rw * 0.86 + off + w * 0.05, y + rh], fill=MUTED + (120,), width=max(1, SS))
    for i in range(4):
        y = h * (0.16 + i * 0.022)
        d.line([w * 0.30, y, w * (0.40 + 0.22 * rnd.random()), y], fill=MUTED + (120,), width=max(1, int(2 * SS)))


def m_schedule(d, w, h, accent, rnd):
    cols, rows = 7, 9
    pad = w * 0.13
    cw = (w - pad * 2) / cols
    ch = cw * 0.86
    top = h * 0.5 - rows * ch / 2
    repeat = {(1, 0), (1, 2), (1, 4), (1, 6), (1, 8), (4, 1), (4, 4), (4, 7)}
    for r in range(rows):
        for c in range(cols):
            x, y = pad + c * cw, top + r * ch
            d.rectangle([x, y, x + cw, y + ch], outline=mix(LINE, MUTED, 0.55) + (255,), width=max(1, int(1.4 * SS)))
            if (c, r) in repeat:
                d.rounded_rectangle([x + cw * 0.14, y + ch * 0.18, x + cw * 0.86, y + ch * 0.82],
                                    radius=cw * 0.12, fill=mix(PAPER, accent, 0.72) + (255,))
    for c, group in ((1, [0, 2, 4, 6, 8]), (4, [1, 4, 7])):
        for a, b in zip(group, group[1:]):
            x = pad + c * cw + cw * (0.92 if c == 1 else 0.08)
            y0, y1 = top + a * ch + ch / 2, top + b * ch + ch / 2
            bulge = cw * (0.5 if c == 1 else -0.5)
            pts = []
            for t in [k / 20 for k in range(21)]:
                px = x + math.sin(t * math.pi) * bulge
                pts.append((px, y0 + (y1 - y0) * t))
            d.line(pts, fill=accent + (245,), width=max(1, int(3.2 * SS)), joint="curve")
    d.line([pad, top - ch * 0.42, w - pad, top - ch * 0.42], fill=INK + (210,), width=max(1, int(3 * SS)))


def m_badge(d, w, h, accent, rnd):
    cx, cy = w * 0.5, h * 0.44
    r = w * 0.27

    def hexagon(radius, rot=math.pi / 6):
        return [(cx + math.cos(rot + i * math.pi / 3) * radius,
                 cy + math.sin(rot + i * math.pi / 3) * radius) for i in range(6)]

    d.polygon(hexagon(r * 1.12), fill=mix(PAPER, LINE, 0.35) + (255,), outline=MUTED + (120,))
    d.polygon(hexagon(r), fill=mix(PAPER, accent, 0.18) + (255,), outline=accent + (230,))
    d.polygon(hexagon(r * 0.72), outline=accent + (150,))
    # check
    d.line([cx - r * 0.34, cy + r * 0.02, cx - r * 0.08, cy + r * 0.28, cx + r * 0.38, cy - r * 0.30],
           fill=accent + (255,), width=max(1, int(7 * SS)), joint="curve")
    # certificate rules
    for i in range(5):
        y = h * (0.76 + i * 0.030)
        span = 0.54 if i else 0.34
        d.line([w * 0.5 - w * span / 2, y, w * 0.5 + w * span / 2, y],
               fill=(INK if i == 0 else MUTED) + ((200,) if i == 0 else (110,)),
               width=max(1, int((3.4 if i == 0 else 2) * SS)))


def m_sockets(d, w, h, accent, rnd):
    lanes = 5
    pad = w * 0.12
    for i in range(lanes):
        y = h * (0.26 + i * 0.12)
        d.line([pad, y, w - pad, y], fill=LINE + (200,), width=max(1, int(1.6 * SS)))
        for k in range(9):
            t = (k + (i * 0.37)) % 9 / 9
            x = pad + (w - pad * 2) * t
            s = w * 0.014
            live = (k + i) % 4 == 0
            d.rounded_rectangle([x - s, y - s * 0.7, x + s, y + s * 0.7], radius=s * 0.35,
                                fill=(accent if live else mix(PAPER, MUTED, 0.35)) + (235,))
        d.ellipse([pad - w * 0.022, y - w * 0.022, pad + w * 0.022, y + w * 0.022],
                  fill=PAPER + (255,), outline=INK + (180,), width=max(1, int(2 * SS)))
        d.ellipse([w - pad - w * 0.022, y - w * 0.022, w - pad + w * 0.022, y + w * 0.022],
                  fill=PAPER + (255,), outline=accent + (210,), width=max(1, int(2 * SS)))


def m_containers(d, w, h, accent, rnd):
    cols, rows = 3, 4
    pad = w * 0.16
    cw = (w - pad * 2) / cols
    ch = cw * 1.05
    top = h * 0.5 - rows * ch / 2
    for r in range(rows):
        for c in range(cols):
            x, y = pad + c * cw, top + r * ch
            inset = cw * 0.08
            on = (c + r) % 3 == 0
            d.rounded_rectangle([x + inset, y + inset, x + cw - inset, y + ch - inset], radius=cw * 0.08,
                                fill=(mix(PAPER, accent, 0.14) if on else PAPER) + (255,),
                                outline=(accent if on else MUTED) + ((190,) if on else (90,)),
                                width=max(1, int(1.8 * SS)))
            for i in range(3):
                yy = y + inset + (ch - inset * 2) * (0.28 + i * 0.22)
                d.line([x + inset * 2.2, yy, x + cw - inset * (2.2 + 2.4 * rnd.random()), yy],
                       fill=MUTED + (90,), width=max(1, SS))


def m_schema(d, w, h, accent, rnd):
    tables = [(0.14, 0.18, 0.44, 0.40), (0.54, 0.30, 0.86, 0.54), (0.20, 0.58, 0.52, 0.82)]
    for i, (x0, y0, x1, y1) in enumerate(tables):
        b = [w * x0, h * y0, w * x1, h * y1]
        d.rounded_rectangle(b, radius=w * 0.018, fill=PAPER + (255,), outline=INK + (170,),
                            width=max(1, int(2 * SS)))
        d.rectangle([b[0], b[1], b[2], b[1] + (b[3] - b[1]) * 0.22],
                    fill=mix(PAPER, accent, 0.22 if i == 0 else 0.10) + (255,))
        d.line([b[0], b[1] + (b[3] - b[1]) * 0.22, b[2], b[1] + (b[3] - b[1]) * 0.22],
               fill=INK + (140,), width=max(1, SS))
        for k in range(4):
            yy = b[1] + (b[3] - b[1]) * (0.35 + k * 0.16)
            d.line([b[0] + w * 0.02, yy, b[0] + w * (0.06 + 0.16 * rnd.random()), yy],
                   fill=MUTED + (120,), width=max(1, int(2 * SS)))
    joins = [((0.44, 0.28), (0.54, 0.38)), ((0.36, 0.40), (0.34, 0.58)), ((0.52, 0.70), (0.70, 0.54))]
    for (ax, ay), (bx, by) in joins:
        d.line([w * ax, h * ay, w * bx, h * by], fill=accent + (210,), width=max(1, int(2.4 * SS)))
        d.ellipse([w * ax - 7 * SS, h * ay - 7 * SS, w * ax + 7 * SS, h * ay + 7 * SS], fill=accent + (255,))
        d.ellipse([w * bx - 7 * SS, h * by - 7 * SS, w * bx + 7 * SS, h * by + 7 * SS], fill=accent + (255,))


def m_cache(d, w, h, accent, rnd):
    cx, cy = w * 0.5, h * 0.48
    for ring in range(4):
        r = w * (0.12 + ring * 0.085)
        n = 6 + ring * 6
        for i in range(n):
            a = i * 2 * math.pi / n + ring * 0.3
            x, y = cx + math.cos(a) * r, cy + math.sin(a) * r
            s = w * 0.016
            hot = (i + ring) % 5 == 0
            d.rounded_rectangle([x - s, y - s, x + s, y + s], radius=s * 0.3,
                                fill=(accent if hot else mix(PAPER, MUTED, 0.28)) + (225,))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=LINE + (140,), width=max(1, SS))
    d.ellipse([cx - w * 0.05, cy - w * 0.05, cx + w * 0.05, cy + w * 0.05],
              fill=mix(PAPER, accent, 0.30) + (255,), outline=accent + (235,), width=max(1, int(2.4 * SS)))


def m_waveform(d, w, h, accent, rnd):
    mid = h * 0.5
    bars = 54
    pad = w * 0.12
    bw = (w - pad * 2) / bars
    for i in range(bars):
        t = i / bars
        amp = (0.10 + 0.42 * abs(math.sin(t * 9.1)) * (0.4 + 0.6 * abs(math.cos(t * 2.3)))) * h * 0.5
        x = pad + i * bw
        col = accent if (i % 7 == 0) else mix(MUTED, accent, 0.25)
        d.rounded_rectangle([x + bw * 0.22, mid - amp, x + bw * 0.78, mid + amp],
                            radius=bw * 0.28, fill=col + (215,))
    d.line([pad, mid, w - pad, mid], fill=PAPER + (220,), width=max(1, int(1.4 * SS)))


def m_deploy(d, w, h, accent, rnd):
    steps = 5
    pad = w * 0.15
    for i in range(steps):
        y = h * (0.22 + i * 0.14)
        bw = w * 0.22
        x = pad + (i % 2) * (w - pad * 2 - bw) * 0.5 + (w - pad * 2 - bw) * 0.25 * (i % 3) * 0.6
        d.rounded_rectangle([x, y, x + bw, y + h * 0.07], radius=w * 0.014,
                            fill=(mix(PAPER, accent, 0.16) if i in (1, 3) else PAPER) + (255,),
                            outline=(accent if i in (1, 3) else INK) + (200,), width=max(1, int(2 * SS)))
        d.line([x + bw * 0.12, y + h * 0.035, x + bw * 0.62, y + h * 0.035],
               fill=MUTED + (140,), width=max(1, int(2 * SS)))
        if i < steps - 1:
            ny = h * (0.22 + (i + 1) * 0.14)
            d.line([x + bw * 0.5, y + h * 0.07, x + bw * 0.5, ny], fill=mix(MUTED, accent, 0.5) + (190,),
                   width=max(1, int(2.2 * SS)))
            d.polygon([(x + bw * 0.5 - 8 * SS, ny - 14 * SS), (x + bw * 0.5 + 8 * SS, ny - 14 * SS),
                       (x + bw * 0.5, ny)], fill=mix(MUTED, accent, 0.5) + (210,))


def m_protocols(d, w, h, accent, rnd):
    labels = 4
    pad = w * 0.13
    for i in range(labels):
        y = h * (0.24 + i * 0.16)
        d.rounded_rectangle([pad, y, pad + w * 0.20, y + h * 0.055], radius=w * 0.01,
                            fill=mix(PAPER, accent, 0.10 + 0.08 * i) + (255,), outline=accent + (170,),
                            width=max(1, int(1.8 * SS)))
        pts = []
        for k in range(41):
            t = k / 40
            pts.append((pad + w * 0.20 + (w - pad * 2 - w * 0.20) * t,
                        y + h * 0.0275 + math.sin(t * math.pi * (1 + i)) * h * 0.030))
        d.line(pts, fill=mix(MUTED, accent, 0.3 + i * 0.2) + (200,), width=max(1, int(2.6 * SS)), joint="curve")
        d.ellipse([w - pad - 10 * SS, y + h * 0.0275 - 10 * SS, w - pad + 10 * SS, y + h * 0.0275 + 10 * SS],
                  fill=accent + (235,))


def m_dashboard(d, w, h, accent, rnd):
    pad = w * 0.12
    d.rounded_rectangle([pad, h * 0.18, w - pad, h * 0.44], radius=w * 0.02,
                        fill=PAPER + (255,), outline=MUTED + (110,), width=max(1, int(1.8 * SS)))
    base = h * 0.42
    n = 14
    bw = (w - pad * 2 - w * 0.08) / n
    for i in range(n):
        v = (0.15 + 0.8 * abs(math.sin(i * 0.9 + 0.3))) * h * 0.20
        x = pad + w * 0.04 + i * bw
        d.rectangle([x, base - v, x + bw * 0.6, base], fill=mix(MUTED, accent, i / n) + (225,))
    for row in range(2):
        for col in range(2):
            x0 = pad + col * (w - pad * 2) * 0.52
            y0 = h * (0.50 + row * 0.20)
            d.rounded_rectangle([x0, y0, x0 + (w - pad * 2) * 0.48, y0 + h * 0.16], radius=w * 0.02,
                                fill=(mix(PAPER, accent, 0.10) if (row + col) % 2 == 0 else PAPER) + (255,),
                                outline=MUTED + (110,), width=max(1, int(1.8 * SS)))
            d.line([x0 + w * 0.04, y0 + h * 0.10, x0 + w * 0.04 + (w - pad * 2) * 0.22, y0 + h * 0.10],
                   fill=INK + (170,), width=max(1, int(3 * SS)))
            d.line([x0 + w * 0.04, y0 + h * 0.13, x0 + w * 0.04 + (w - pad * 2) * 0.14, y0 + h * 0.13],
                   fill=MUTED + (120,), width=max(1, int(2 * SS)))


# ------------------------------------------------------------------ portrait

def portrait_columns():
    """The standing object the studio panel reveals: a signal rack.

    A narrow head unit, a wide body, a plinth, and two rails that give the
    silhouette a spine. The contour SVG traces exactly these rectangles.
    """
    w, h = PORTRAIT
    cx = w * 0.5
    top, bottom = h * 0.09, h * 0.90
    n = 9
    gap = (bottom - top) / n
    widest = w * 0.40
    blocks = []
    for i in range(n):
        t = i / (n - 1)
        # narrow at the head, widest just above centre, tapering to the base
        profile = 0.34 + 0.66 * math.sin(math.pi * min(1.0, t ** 0.78))
        bw = widest * max(0.30, profile)
        y = top + i * gap
        blocks.append((cx - bw, y, cx + bw, y + gap * (0.58 if i == 0 else 0.72)))
    rail = w * 0.020
    blocks.append((cx - widest * 1.16 - rail, top + gap * 0.9, cx - widest * 1.16 + rail, bottom))
    blocks.append((cx + widest * 1.16 - rail, top + gap * 0.9, cx + widest * 1.16 + rail, bottom))
    blocks.append((cx - widest * 1.30, h * 0.925, cx + widest * 1.30, h * 0.955))
    return blocks


def build_portrait():
    w, h = PORTRAIT[0] * SS, PORTRAIT[1] * SS
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rnd = random.Random(99)
    for i, (x0, y0, x1, y1) in enumerate(portrait_columns()):
        b = [x0 * SS, y0 * SS, x1 * SS, y1 * SS]
        on = i in (2, 4, 7)
        d.rounded_rectangle(b, radius=18 * SS,
                            fill=(mix(PAPER, ACCENT, 0.18) if on else mix(PAPER, LINE, 0.30)) + (255,),
                            outline=(ACCENT if on else INK) + (220,), width=max(1, int(3 * SS)))
        for k in range(4):
            yy = b[1] + (b[3] - b[1]) * (0.22 + k * 0.20)
            d.line([b[0] + 34 * SS, yy, b[0] + 34 * SS + (b[2] - b[0] - 90 * SS) * (0.3 + 0.6 * rnd.random()), yy],
                   fill=(ACCENT if on else MUTED) + (130,), width=max(1, int(2 * SS)))
        d.ellipse([b[2] - 40 * SS, b[1] + 22 * SS, b[2] - 18 * SS, b[1] + 44 * SS],
                  fill=(ACCENT if on else MUTED) + (230,))
    # cable runs: vertical, hugging the rails, the way a real rack is wired
    for side, sign in ((0.29, 1), (0.71, -1)):
        for c in range(3):
            x = w * side + sign * c * w * 0.012
            pts = []
            for k in range(41):
                t = k / 40
                pts.append((x + math.sin(t * 5 + c) * w * 0.008,
                            h * (0.13 + 0.74 * t)))
            d.line(pts, fill=mix(MUTED, ACCENT, 0.2 + c * 0.25) + (95,),
                   width=max(1, int(2.4 * SS)), joint="curve")
    return img.resize(PORTRAIT, Image.LANCZOS)


def build_contour_svg():
    """Outline paths the studio panel draws stroke by stroke."""
    w, h = PORTRAIT
    parts = []
    for (x0, y0, x1, y1) in portrait_columns():
        r = 18
        parts.append(
            f"M{x0 + r:.1f} {y0:.1f} H{x1 - r:.1f} A{r} {r} 0 0 1 {x1:.1f} {y0 + r:.1f} "
            f"V{y1 - r:.1f} A{r} {r} 0 0 1 {x1 - r:.1f} {y1:.1f} H{x0 + r:.1f} "
            f"A{r} {r} 0 0 1 {x0:.1f} {y1 - r:.1f} V{y0 + r:.1f} A{r} {r} 0 0 1 {x0 + r:.1f} {y0:.1f} Z")
    paths = "\n".join(
        f'<path class="portrait-selected" pathLength="1" d="{p}" stroke="currentColor" stroke-width="2.65" '
        f'fill="none" stroke-linecap="round" stroke-linejoin="round"/>' for p in parts)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none">\n'
            f'<g id="portrait-selected-lines">\n{paths}\n</g>\n</svg>\n')


def build_signature():
    w, h = 2037, 772
    img = Image.new("RGBA", (w * 1, h * 1), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font("Bricolage-200 800.ttf", 300)
    text = "Durrez Ahmed"
    tw = d.textlength(text, font=f)
    d.text(((w - tw) / 2, h * 0.24), text, font=f, fill=INK + (240,))
    d.line([w * 0.18, h * 0.80, w * 0.82, h * 0.80], fill=ACCENT + (220,), width=7)
    return img.rotate(-1.6, resample=Image.BICUBIC, expand=False)


def build_guide(size, seed, accent):
    """Decorative marginal mark used where the original had a guide photo."""
    w, h = size
    img = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rnd = random.Random(seed)
    for i in range(9):
        x = w * SS * (0.2 + 0.6 * rnd.random())
        y = h * SS * (0.15 + 0.7 * rnd.random())
        r = w * SS * (0.03 + 0.09 * rnd.random())
        d.ellipse([x - r, y - r, x + r, y + r], outline=accent + (70,), width=max(1, int(2 * SS)))
    return img.resize(size, Image.LANCZOS)


# ---------------------------------------------------------------------- build

WORK_PLATES = [
    # motif, accent, caption, index, ground — grounds alternate so the carousel has rhythm
    (m_camera_grid, (214, 122, 74), "500+ streams", "Study 01", "dark"),
    (m_topology, (73, 98, 107), "multi-site", "Study 02", "paper"),
    (m_transport, (122, 164, 224), "-40% latency", "Study 03", "dark"),
    (m_overlays, (146, 112, 61), "inference", "Study 04", "paper"),
    (m_pipeline, (226, 126, 96), "redis / bullmq", "Study 05", "dark"),
    (m_stack, (100, 104, 86), "rest api", "Study 06", "paper"),
    (m_schedule, (123, 88, 122), "recurrence", "Study 07", "paper"),
    (m_badge, (238, 128, 60), "aws certified", "Study 08", "dark"),
]

PRACTICE_PLATES = [
    (m_sockets, (73, 98, 107), "webrtc", "paper"),
    (m_waveform, (226, 126, 96), "rtsp / hls", "dark"),
    (m_cache, (152, 86, 66), "redis", "paper"),
    (m_schema, (122, 164, 224), "postgresql", "dark"),
    (m_containers, (100, 104, 86), "docker", "paper"),
    (m_deploy, (226, 172, 106), "ci / cd", "dark"),
    (m_protocols, (123, 88, 122), "openapi", "paper"),
    (m_dashboard, (238, 128, 60), "analytics", "dark"),
    (m_stack, (90, 96, 112), "keycloak", "paper"),
    (m_pipeline, (132, 96, 70), "s3 / storage", "paper"),
]


def main():
    for sub in ("work", "practice", "portrait", "identity", "guide"):
        os.makedirs(os.path.join(OUT, sub), exist_ok=True)

    for i, (motif, accent, caption, index, ground) in enumerate(WORK_PLATES, 1):
        p = plate(WORK, 1000 + i, accent, motif, caption, index, ground)
        p.save(os.path.join(OUT, "work", f"{i:02d}.jpg"), quality=88, optimize=True, progressive=True)
        print("work", i)

    for i, (motif, accent, caption, ground) in enumerate(PRACTICE_PLATES, 1):
        p = plate(PRACTICE, 2000 + i, accent, motif, caption, f"{i:02d}", ground)
        p.save(os.path.join(OUT, "practice", f"{i:02d}.jpg"), quality=88, optimize=True, progressive=True)
        print("practice", i)

    build_portrait().save(os.path.join(OUT, "portrait", "figure.png"), optimize=True)
    open(os.path.join(OUT, "portrait", "contour.svg"), "w").write(build_contour_svg())
    build_signature().save(os.path.join(OUT, "identity", "signature.png"), optimize=True)
    build_guide((1024, 1536), 7, ACCENT).save(os.path.join(OUT, "guide", "practice-guide.png"), optimize=True)
    build_guide((1024, 1536), 8, (73, 98, 107)).save(os.path.join(OUT, "guide", "works-guide.png"), optimize=True)
    build_guide((1024, 1536), 9, (152, 86, 66)).save(os.path.join(OUT, "guide", "contact-right.png"), optimize=True)
    print("portrait, signature, guides")


if __name__ == "__main__":
    main()
