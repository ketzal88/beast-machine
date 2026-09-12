"""
Descompone el logo del hero en capas animables.

Entrada:  assets/img/logo-front-mark.png  (el logo recortado, con fondo transparente)
Salidas:  assets/img/logo-front-base.png|webp     ilustración sin los ojos
          assets/img/logo-front-eyes.png|webp     solo los ojos (para el parpadeo)
          assets/img/logo-front-circuits.svg      circuitos vectorizados y animados

El logo es un raster, así que los circuitos cyan se vectorizan en cuatro pasos:

  1. se aísla la capa cyan por color (el azul domina sobre el rojo),
  2. se adelgaza a un pixel de ancho (Zhang-Suen),
  3. el esqueleto se recorre como un grafo y cada tramo se simplifica (RDP),
  4. se emite un SVG con las animaciones CSS adentro (self-contained).

Los ojos se recortan por color dentro de dos cajas fijas (EYE_BOXES) y el hueco que
dejan se rellena con el color de alrededor, así al parpadear se ve la cuenca cerrada.

Uso:  python tools/build-logo-layers.py
Solo necesita numpy y Pillow. Correr de nuevo si cambia el logo.
"""

import json
import math
import os

import numpy as np
from PIL import Image, ImageFilter

import circuit_geometry as geo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
SRC = os.path.join(IMG, "logo-front-mark.png")
OUT = os.path.join(IMG, "logo-front-circuits.svg")
OUT_BASE = os.path.join(IMG, "logo-front-base")
OUT_EYES = os.path.join(IMG, "logo-front-eyes")

NL = chr(10)
STROKE = 4.2          # ancho de traza en el SVG
RDP_EPS = 1.35        # tolerancia de simplificación, en px
SPARKS = 22           # trazas con chispa viajera
FLOWING = 24          # trazas con guiones en movimiento
RIPPLES = 12          # nodos con onda expansiva
EYE_BOXES = [(150, 264, 208, 302), (302, 262, 366, 302)]  # x0,y0,x1,y1
N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
RING = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]


# ── 1. aislar la capa de circuitos ──────────────────────────────────────────

def circuit_mask(path):
    im = Image.open(path).convert("RGBA")
    a = np.array(im).astype(int)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    # el umbral alto deja solo el núcleo brillante de cada traza,
    # sin el halo antialias que ensucia el esqueleto
    cyan = (b - r > 85) & (b > 110) & (g > 90) & (al > 40)
    soft = Image.fromarray(np.where(cyan, 255, 0).astype(np.uint8), "L")
    soft = soft.filter(ImageFilter.GaussianBlur(0.4))
    return np.array(soft) > 90, im.size


# ── 2. adelgazado Zhang-Suen ────────────────────────────────────────────────

def _ring_arrays(P):
    p = np.pad(P, 1, constant_values=False)
    return (p[0:-2, 1:-1], p[0:-2, 2:], p[1:-1, 2:], p[2:, 2:],
            p[2:, 1:-1], p[2:, 0:-2], p[1:-1, 0:-2], p[0:-2, 0:-2])


def thin(mask, max_iter=80):
    I = mask.copy()
    for _ in range(max_iter):
        changed = False
        for step in (0, 1):
            P2, P3, P4, P5, P6, P7, P8, P9 = _ring_arrays(I)
            seq = [P2, P3, P4, P5, P6, P7, P8, P9, P2]
            B = sum(x.astype(np.uint8) for x in seq[:8])
            A = sum((((~seq[i]) & seq[i + 1]).astype(np.uint8)) for i in range(8))
            if step == 0:
                c1, c2 = ~(P2 & P4 & P6), ~(P4 & P6 & P8)
            else:
                c1, c2 = ~(P2 & P4 & P8), ~(P2 & P6 & P8)
            rem = I & (B >= 2) & (B <= 6) & (A == 1) & c1 & c2
            if rem.any():
                I &= ~rem
                changed = True
        if not changed:
            break
    return I


def distance(mask, limit=12):
    h, w = mask.shape
    dist = np.zeros((h, w), np.int16)
    cur = mask.copy()
    for k in range(1, limit + 1):
        p = np.pad(cur, 1, constant_values=False)
        nxt = cur.copy()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                nxt &= p[1 + dy:h + 1 + dy, 1 + dx:w + 1 + dx]
        cur = nxt
        if not cur.any():
            break
        dist[cur] = k
    return dist


# ── 3. esqueleto → polilíneas ───────────────────────────────────────────────

def trace_graph(skel):
    pts = set(zip(*np.nonzero(skel)))

    def nb(p):
        y, x = p
        return [(y + dy, x + dx) for dy, dx in N8 if (y + dy, x + dx) in pts]

    def crossing(p):
        y, x = p
        v = [1 if (y + dy, x + dx) in pts else 0 for dy, dx in RING]
        v.append(v[0])
        return sum(1 for i in range(8) if v[i] == 0 and v[i + 1] == 1)

    special = {p for p in pts if crossing(p) != 2}
    edges, paths = set(), []

    def walk(start, first):
        path, seen = [start, first], {start, first}
        prev, cur = start, first
        while cur not in special and len(path) < 4000:
            nxt = [q for q in nb(cur) if q != prev and q not in seen]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            path.append(cur)
            seen.add(cur)
        return path

    for s in list(special):
        for n in nb(s):
            if tuple(sorted([s, n])) in edges:
                continue
            p = walk(s, n)
            for i in range(len(p) - 1):
                edges.add(tuple(sorted([p[i], p[i + 1]])))
            paths.append(p)

    used = set()
    for p in paths:
        used.update(p)
    remaining, loops = pts - used, []
    while remaining:
        s = next(iter(remaining))
        loop, prev, cur = [s], None, s
        remaining.discard(s)
        while len(loop) < 4000:
            nxt = [q for q in nb(cur)
                   if q != prev and (q in remaining or (q == s and len(loop) > 4))]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            if cur == s:
                loop.append(s)
                break
            loop.append(cur)
            remaining.discard(cur)
        if len(loop) > 5:
            loops.append(loop)
    return paths, loops


def rdp(points, eps):
    if len(points) < 3:
        return points
    a = np.array(points, float)
    start, end = a[0], a[-1]
    d = end - start
    n = math.hypot(*d)
    if n < 1e-6:
        dists = np.hypot(*(a - start).T)
    else:
        rel = a - start
        dists = np.abs(d[0] * rel[:, 1] - d[1] * rel[:, 0]) / n
    i = int(np.argmax(dists))
    if dists[i] > eps:
        return rdp(points[:i + 1], eps)[:-1] + rdp(points[i:], eps)
    return [points[0], points[-1]]


def _dist2(a, b):
    return math.hypot(b[0] - a[0], b[1] - a[1])


def polyline_length(p):
    return sum(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1))


# ── 4. separar los ojos y tapar el hueco ────────────────────────────────────

def eye_mask(rgba):
    a = np.array(rgba).astype(int)
    h, w = a.shape[:2]
    r, b, al = a[..., 0], a[..., 2], a[..., 3]
    box = np.zeros((h, w), bool)
    for x0, y0, x1, y1 in EYE_BOXES:
        box[y0:y1, x0:x1] = True
    eye = (b > 150) & (b - r > 60) & (al > 100) & box
    grown = Image.fromarray((eye * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))
    return np.array(grown) > 0


def split_layers(rgba, circuits):
    """Devuelve (base sin ojos ni circuitos, capa de ojos).

    Los circuitos salen de la base porque los dibuja la capa vectorial encima: si
    quedaran en las dos, al moverse el pelaje se verian dobles. El halo de luz si
    se queda en la base, que es lo que le da el brillo al trazo.
    """
    arr = np.array(rgba)
    h, w = arr.shape[:2]
    mask = eye_mask(rgba)
    soft = np.array(Image.fromarray((mask * 255).astype(np.uint8))
                    .filter(ImageFilter.GaussianBlur(0.8)))

    eyes = arr.copy()
    eyes[..., 3] = (arr[..., 3].astype(int) * soft // 255).astype(np.uint8)

    # rellenar el hueco promediando los vecinos ya resueltos, capa por capa
    base = arr.astype(float)
    hole = mask | circuits
    opaque = arr[..., 3] > 0
    for _ in range(30):
        if not hole.any():
            break
        filled = ~hole & opaque
        acc = np.zeros((h, w, 3))
        cnt = np.zeros((h, w))
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dy == dx == 0:
                    continue
                acc += np.roll(np.roll(base[..., :3], dy, 0), dx, 1) *                     np.roll(np.roll(filled, dy, 0), dx, 1)[..., None]
                cnt += np.roll(np.roll(filled, dy, 0), dx, 1)
        can = hole & (cnt > 0)
        base[can, :3] = acc[can] / cnt[can][..., None]
        hole &= ~can

    patched = Image.fromarray(base.astype(np.uint8))
    blur = patched.filter(ImageFilter.GaussianBlur(1.5))
    edge = Image.fromarray(((mask | circuits) * 255).astype(np.uint8))         .filter(ImageFilter.GaussianBlur(1.1))
    patched = Image.composite(blur, patched, edge)
    return patched, Image.fromarray(eyes)


def save_layer(img, stem):
    # PNG con paleta: el arte es plano, asi que queda mas liviano que el webp
    q = img.convert("RGBA").quantize(colors=200, method=Image.FASTOCTREE, dither=Image.NONE)
    q.save(stem + ".png", optimize=True)
    return os.path.getsize(stem + ".png") // 1024


# ── 5. emitir SVG ───────────────────────────────────────────────────────────

STYLE = """
g{fill:none;stroke-linecap:round;stroke-linejoin:round}

/* halo: la misma traza mas ancha y translucida, como el glow del logo original */
.gl path{stroke:#1E9FD6;opacity:.17}

/* todas las trazas se dibujan al entrar y despues laten en ola hacia afuera */
.tr path{stroke:#3FCDF7;opacity:.85;
  stroke-dasharray:100;stroke-dashoffset:100;
  animation:draw 1.1s cubic-bezier(.2,.7,.3,1) forwards var(--d),
            wave 3.8s ease-in-out infinite calc(var(--d) * 1.7 + 1.1s)}

/* guiones corriendo sobre las trazas: el circuito "fluye" */
.fl path{stroke:#6FDCFF;stroke-dasharray:4 19;opacity:0;
  animation:fade .7s ease-out forwards calc(var(--d) + 1.2s),
            flow 1.9s linear infinite}

/* chispas: un guion corto que recorre la traza entera */
.sp path{stroke:#E8FAFF;stroke-dasharray:5 95;stroke-dashoffset:100;opacity:0;
  filter:url(#b);animation:run 2.9s linear infinite var(--d)}

.nd circle{stroke:#4FD8FF;stroke-width:3.2;opacity:0;
  animation:fade .8s ease-out forwards 1.1s,blink 3.4s ease-in-out infinite calc(var(--d) + 1.6s)}
.dt circle{fill:#5FDCFF;opacity:0;
  animation:fade .8s ease-out forwards 1.1s,blink 3s ease-in-out infinite calc(var(--d) + 1.6s)}

/* ondas expansivas saliendo de algunos nodos */
.rp circle{fill:none;stroke:#8FEAFF;stroke-width:1.6;opacity:0;
  animation:ripple 3.2s ease-out infinite var(--d)}

@keyframes draw{to{stroke-dashoffset:0}}
@keyframes fade{from{opacity:0}to{opacity:.42}}
@keyframes wave{0%,100%{opacity:.72}45%{opacity:1}}
@keyframes flow{to{stroke-dashoffset:-36}}
@keyframes blink{0%,100%{opacity:.65}50%{opacity:1}}
@keyframes run{0%{opacity:0}10%{opacity:1}90%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes ripple{0%{r:2;opacity:.75}75%,100%{r:15;opacity:0}}

@media (prefers-reduced-motion:reduce){
  .tr path,.nd circle,.dt circle{opacity:.9;stroke-dashoffset:0;animation:none}
  .sp,.fl,.rp{display:none}
}
""".replace("__SW__", str(STROKE))


def num(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")


def path_d(points, close=False):
    return "M" + " L".join(f"{num(x)} {num(y)}" for x, y in points) + (" Z" if close else "")


def in_eye(x, y):
    return any(x0 - 2 <= x <= x1 + 2 and y0 - 2 <= y <= y1 + 2
               for x0, y0, x1, y1 in EYE_BOXES)


def build():
    rgba = Image.open(SRC).convert("RGBA")
    mask, (W, H) = circuit_mask(SRC)
    dist = distance(mask)

    # --- capas raster -------------------------------------------------------
    grown = np.array(Image.fromarray((mask * 255).astype(np.uint8))
                     .filter(ImageFilter.MaxFilter(3))) > 0
    base_img, eyes_img = split_layers(rgba, grown)
    bp = save_layer(base_img, OUT_BASE)
    ep = save_layer(eyes_img, OUT_EYES)

    # --- capa vectorial -----------------------------------------------------
    skel = thin(mask)
    raw_paths, loops = trace_graph(skel)

    # nodos sólidos: manchas donde el trazo es más grueso que una traza
    cand = set(zip(*np.nonzero(dist >= 3)))
    discs = []
    while cand:
        seed = cand.pop()
        comp, stack = [seed], [seed]
        while stack:
            y, x = stack.pop()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    q = (y + dy, x + dx)
                    if q in cand:
                        cand.discard(q)
                        comp.append(q)
                        stack.append(q)
        if len(comp) < 3:
            continue
        cy = sum(p[0] for p in comp) / len(comp)
        cx = sum(p[1] for p in comp) / len(comp)
        r = max(dist[p] for p in comp) + 0.6
        if r <= 7.5 and not in_eye(cx, cy):
            discs.append((cx, cy, min(float(r), 5.4)))

    def in_disc(x, y):
        return any((x - cx) ** 2 + (y - cy) ** 2 <= (r * 0.9) ** 2 for cx, cy, r in discs)

    # pixeles (y,x) -> puntos (x,y)
    pix = [[(q[1], q[0]) for q in p] for p in raw_paths]
    pix += [[(q[1], q[0]) for q in l] for l in loops]

    pix = geo.drop_spurs(pix, pix)
    pix = geo.chain_at_junctions(pix)

    # los arcos que son nodos circulares salen como <circle>
    rings, pix = geo.circles_from(pix)
    rings = [c for c in rings if not in_eye(c[0], c[1])]

    items = []
    for p in pix:
        if geo.stroke_width(p, dist) < 2.7 and polyline_length(p) < 4.0:
            continue
        if all(in_eye(x, y) for x, y in p):
            continue
        if all(in_disc(x, y) for x, y in p):
            continue
        width = geo.stroke_width(p, dist)
        s = rdp(p, RDP_EPS)
        s = geo.snap_angles(s)
        s = geo.merge_collinear(s)
        if len(s) < 2 or polyline_length(s) < 3.0:
            continue
        closed = _dist2(s[0], s[-1]) < 2.0 and len(s) > 3
        items.append({"d": path_d(s[:-1] if closed else s, closed),
                      "len": polyline_length(s),
                      "x": min(q[0] for q in s),
                      "w": round(width, 1)})

    # el retardo crece hacia la derecha: la carga sale de la cara del lobo
    xs = [i["x"] for i in items]
    lo, hi = min(xs), max(xs)
    for i in items:
        i["delay"] = round(0.95 * (i["x"] - lo) / (hi - lo), 3)
    items.sort(key=lambda i: i["x"])

    by_length = sorted([i for i in items if i["len"] > 40], key=lambda i: -i["len"])
    sparks = by_length[:SPARKS]
    flowing = by_length[:FLOWING]

    out = ['<g class="gl">']
    for i in items:
        out.append(f'<path d="{i["d"]}" stroke-width="{round(i["w"] + 4.2, 1)}"/>')
    out.append("</g>")

    out.append('<g class="tr">')
    for i in items:
        out.append(f'<path d="{i["d"]}" pathLength="100" stroke-width="{i["w"]}" '
                   f'style="--d:{i["delay"]}s"/>')
    out.append("</g>")

    out.append('<g class="fl">')
    for i in flowing:
        out.append(f'<path d="{i["d"]}" stroke-width="{i["w"]}" style="--d:{i["delay"]}s"/>')
    out.append("</g>")

    out.append('<g class="sp">')
    for n, i in enumerate(sparks):
        out.append(f'<path d="{i["d"]}" pathLength="100" stroke-width="{round(i["w"] + 1.2, 1)}" '
                   f'style="--d:{round(n * 0.31, 2)}s"/>')
    out.append("</g>")

    out.append('<g class="nd">')
    for n, (cx, cy, r) in enumerate(rings):
        out.append(f'<circle cx="{num(cx)}" cy="{num(cy)}" r="{num(r)}" '
                   f'style="--d:{round((n % 7) * 0.31, 2)}s"/>')
    out.append("</g>")

    out.append('<g class="dt">')
    for n, (cx, cy, r) in enumerate(discs):
        out.append(f'<circle cx="{num(cx)}" cy="{num(cy)}" r="{num(r)}" '
                   f'style="--d:{round((n % 9) * 0.27, 2)}s"/>')
    out.append("</g>")

    ripple_nodes = sorted(discs, key=lambda d: -d[0])[:RIPPLES]
    out.append('<g class="rp">')
    for n, (cx, cy, r) in enumerate(ripple_nodes):
        out.append(f'<circle cx="{num(cx)}" cy="{num(cy)}" r="2" '
                   f'style="--d:{round(n * 0.47, 2)}s"/>')
    out.append("</g>")

    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
           f'width="{W}" height="{H}" role="presentation" '
           f'shape-rendering="geometricPrecision">' + NL +
           f'<style>{STYLE}</style>' + NL +
           '<defs><filter id="b" x="-40%" y="-40%" width="180%" height="180%">'
           '<feGaussianBlur stdDeviation="2.2" result="x"/>'
           '<feMerge><feMergeNode in="x"/><feMergeNode in="SourceGraphic"/></feMerge>'
           '</filter></defs>' + NL + "".join(out) + NL + '</svg>' + NL)

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(svg)

    print(f"base:      {OUT_BASE}.png  ({bp} KB)")
    print(f"ojos:      {OUT_EYES}.png  ({ep} KB)")
    print(f"circuitos: {OUT}  ({len(svg) // 1024} KB)")
    print(f"  trazas: {len(items)}  flujo: {len(flowing)}  chispas: {len(sparks)}  "
          f"nodos: {len(rings)}  puntos: {len(discs)}  ondas: {len(ripple_nodes)}")
    widths = sorted({i["w"] for i in items})
    print(f"  anchos: {widths}")


if __name__ == "__main__":
    build()
