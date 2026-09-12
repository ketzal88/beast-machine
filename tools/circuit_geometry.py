"""
Limpieza geométrica de las polilíneas que salen del esqueleto.

El esqueleto reproduce el trazo pixel a pixel, así que sale tembloroso. Un circuito
real son rectas a 0, 45 y 90 grados, esquinas limpias y nodos circulares. Este módulo
hace ese trabajo:

  chain_at_junctions  une tramos que siguen derecho a través de una unión
  drop_spurs          descarta los pelitos que deja el adelgazado
  snap_angles         alinea cada segmento al múltiplo de 45° más cercano
  merge_collinear     funde segmentos casi rectos en uno
  fit_circle          reconoce arcos y los devuelve como círculo exacto
  stroke_width        mide el ancho real del trazo original
"""

import math

import numpy as np

SNAP_TOL = 11.0      # grados: hasta acá se considera que el segmento "quiso" ser recto
COLLINEAR_TOL = 7.0  # grados entre segmentos consecutivos para fundirlos
CHAIN_TOL = 42.0     # grados de desvío admitidos para seguir derecho en una unión
CIRCLE_RMS = 0.85    # error máximo (px) para aceptar que un arco es un círculo
CIRCLE_SPAN = 205.0  # grados mínimos de arco para cerrarlo como círculo


def _angle(p, q):
    return math.degrees(math.atan2(q[1] - p[1], q[0] - p[0]))


def _dist(p, q):
    return math.hypot(q[0] - p[0], q[1] - p[1])


def _tangent(path, at_start, span=6):
    """Dirección de la punta del tramo, mirando hacia afuera."""
    if at_start:
        a, b = path[0], path[min(span, len(path) - 1)]
    else:
        a, b = path[-1], path[max(-span - 1, -len(path))]
    return _angle(a, b)


def _delta(a, b):
    d = abs(a - b) % 360
    return d if d <= 180 else 360 - d


# ── uniones: seguir derecho ─────────────────────────────────────────────────

def chain_at_junctions(paths, min_len=4):
    """Une tramos que en una unión siguen prácticamente derecho.

    El esqueleto corta la traza en cada bifurcación; si no se vuelven a unir, una
    traza larga queda hecha pedazos y la chispa recorre sólo un fragmento.
    """
    paths = [p for p in paths if len(p) >= 2]
    ends = {}
    for i, p in enumerate(paths):
        ends.setdefault(p[0], []).append((i, True))
        ends.setdefault(p[-1], []).append((i, False))

    partner = {}
    for node, arms in ends.items():
        if len(arms) < 2:
            continue
        dirs = [(i, at_start, _tangent(paths[i], at_start)) for i, at_start in arms]
        used = set()
        pairs = []
        for a in range(len(dirs)):
            for b in range(a + 1, len(dirs)):
                # dos puntas siguen derecho si sus tangentes son casi opuestas
                pairs.append((abs(180 - _delta(dirs[a][2], dirs[b][2])), a, b))
        for dev, a, b in sorted(pairs):
            if dev > CHAIN_TOL or a in used or b in used:
                continue
            ia, sa, _ = dirs[a]
            ib, sb, _ = dirs[b]
            if ia == ib:
                continue
            used.add(a)
            used.add(b)
            partner[(ia, sa)] = (ib, sb)
            partner[(ib, sb)] = (ia, sa)

    out, done = [], set()
    for i in range(len(paths)):
        if i in done:
            continue
        chain = list(paths[i])
        done.add(i)
        # extender por las dos puntas
        for at_start in (False, True):
            cur, cur_start = i, at_start
            while True:
                nxt = partner.get((cur, cur_start))
                if nxt is None or nxt[0] in done:
                    break
                j, j_start = nxt
                piece = list(paths[j]) if j_start else list(reversed(paths[j]))
                if at_start:
                    chain = list(reversed(piece)) + chain
                else:
                    chain = chain + piece
                done.add(j)
                cur, cur_start = j, not j_start
        if len(chain) >= min_len:
            out.append(chain)
    return out


def drop_spurs(paths, all_paths, min_len=7.0):
    """Saca los tramos cortos que terminan en el aire (ruido del adelgazado)."""
    touch = {}
    for p in all_paths:
        for end in (p[0], p[-1]):
            touch[end] = touch.get(end, 0) + 1
    kept = []
    for p in paths:
        length = sum(_dist(p[k], p[k + 1]) for k in range(len(p) - 1))
        free_ends = sum(1 for end in (p[0], p[-1]) if touch.get(end, 0) <= 1)
        if free_ends == 2 and length < min_len * 2:
            continue
        if free_ends == 1 and length < min_len:
            continue
        kept.append(p)
    return kept


# ── enderezado ──────────────────────────────────────────────────────────────

def snap_angles(pts, tol=SNAP_TOL):
    """Lleva cada segmento al múltiplo de 45° más cercano si está cerca.

    Se reconstruye la polilínea encadenando las direcciones corregidas y después se
    la corre entera para que caiga sobre el trazo original (si no, el error se
    acumula y la traza se despega del dibujo).
    """
    if len(pts) < 2:
        return pts
    dirs = []
    for i in range(len(pts) - 1):
        ang = _angle(pts[i], pts[i + 1])
        length = _dist(pts[i], pts[i + 1])
        target = round(ang / 45.0) * 45.0
        if _delta(ang, target) <= tol:
            ang = target
        dirs.append((ang, length))

    out = [tuple(pts[0])]
    for ang, length in dirs:
        x, y = out[-1]
        out.append((x + length * math.cos(math.radians(ang)),
                    y + length * math.sin(math.radians(ang))))

    ox = sum(p[0] for p in pts) / len(pts) - sum(p[0] for p in out) / len(out)
    oy = sum(p[1] for p in pts) / len(pts) - sum(p[1] for p in out) / len(out)
    return [(p[0] + ox, p[1] + oy) for p in out]


def merge_collinear(pts, tol=COLLINEAR_TOL):
    """Funde segmentos consecutivos que ya son la misma recta."""
    if len(pts) < 3:
        return pts
    out = [pts[0]]
    for i in range(1, len(pts) - 1):
        a = _angle(out[-1], pts[i])
        b = _angle(pts[i], pts[i + 1])
        if _delta(a, b) > tol:
            out.append(pts[i])
    out.append(pts[-1])
    return out


# ── círculos ────────────────────────────────────────────────────────────────

def fit_circle(pts):
    """Ajuste algebraico (Kåsa). Devuelve (cx, cy, r, rms, span_grados)."""
    if len(pts) < 5:
        return None
    a = np.array(pts, float)
    x, y = a[:, 0], a[:, 1]
    A = np.column_stack([x, y, np.ones(len(a))])
    bvec = x ** 2 + y ** 2
    try:
        sol, *_ = np.linalg.lstsq(A, bvec, rcond=None)
    except np.linalg.LinAlgError:
        return None
    cx, cy = sol[0] / 2, sol[1] / 2
    rsq = sol[2] + cx ** 2 + cy ** 2
    if rsq <= 0.5:
        return None
    r = math.sqrt(rsq)
    if not (1.8 <= r <= 14.0):
        return None
    radii = np.hypot(x - cx, y - cy)
    rms = float(np.sqrt(((radii - r) ** 2).mean()))
    angs = np.degrees(np.arctan2(y - cy, x - cx)) % 360
    gaps = np.diff(np.sort(angs))
    span = 360.0 - float(max(gaps.max() if len(gaps) else 0.0,
                             360.0 - (angs.max() - angs.min())))
    return cx, cy, r, rms, span


def circles_from(paths, rms_tol=CIRCLE_RMS, span_tol=CIRCLE_SPAN):
    """Separa las polilíneas que en realidad son nodos circulares."""
    circles, rest = [], []
    for p in paths:
        fit = fit_circle(p)
        if fit and fit[3] <= rms_tol and fit[4] >= span_tol:
            circles.append((fit[0], fit[1], fit[2]))
        else:
            rest.append(p)

    merged = []
    for c in circles:
        for i, m in enumerate(merged):
            if _dist(c[:2], m[:2]) < 2.0 and abs(c[2] - m[2]) < 1.5:
                merged[i] = ((c[0] + m[0]) / 2, (c[1] + m[1]) / 2, (c[2] + m[2]) / 2)
                break
        else:
            merged.append(c)
    return merged, rest


# ── ancho de trazo ──────────────────────────────────────────────────────────

def stroke_width(pts, dist, default=4.2):
    """Ancho real del trazo, leído del mapa de distancias del original."""
    h, w = dist.shape
    samples = []
    for x, y in pts:
        xi, yi = int(round(x)), int(round(y))
        if 0 <= yi < h and 0 <= xi < w and dist[yi, xi] > 0:
            samples.append(dist[yi, xi])
    if len(samples) < 3:
        return default
    return max(3.0, min(6.8, 2.0 * float(np.median(samples)) + 1.1))
