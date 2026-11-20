# Ornavia: terreno, acque, città (definizioni). Coordinate locali u (est), v (sud) in metri; mondo = (u+OX, v+OZ)
import numpy as np, math
from scipy import ndimage
OX = OZ = 8000.0
SZ = 22000.0
STEP = 20.0
N = int(SZ / STEP) + 1
rng = np.random.default_rng(11)
u = np.arange(N) * STEP; U, V = np.meshgrid(u, u)
def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
# rumore a valori con interpolazione morbida
_perm = rng.random((512, 512))
def vnoise(x, y):
    xi = np.floor(x).astype(int); yi = np.floor(y).astype(int); fx = x - xi; fy = y - yi
    sx = fx * fx * (3 - 2 * fx); sy = fy * fy * (3 - 2 * fy)
    a = _perm[xi & 511, yi & 511]; b = _perm[(xi + 1) & 511, yi & 511]; c = _perm[xi & 511, (yi + 1) & 511]; d = _perm[(xi + 1) & 511, (yi + 1) & 511]
    return (a * (1 - sx) + b * sx) * (1 - sy) + (c * (1 - sx) + d * sx) * sy
def fbm(x, y, o=5):
    s = 0; a = 0.5; f = 1.0; t = 0
    for k in range(o): s += a * vnoise(x * f + k * 17.3, y * f + k * 9.1); t += a; a *= 0.5; f *= 2.03
    return s / t
LV = 210.0   # livello del lago
def vcoast(uu): return 17700 + 650 * np.sin(uu / 2600 + 0.8) + 300 * np.sin(uu / 1100 + 2.0)
# asse del lago
LA = np.array([7100.0, 8900.0]); LB = np.array([3700.0, 5100.0])
def seg_dist(P, A, B):
    AB = B - A; t = np.clip(((P[..., 0] - A[0]) * AB[0] + (P[..., 1] - A[1]) * AB[1]) / (AB @ AB), 0, 1)
    return np.hypot(P[..., 0] - A[0] - t * AB[0], P[..., 1] - A[1] - t * AB[1]), t
CITIES = [  # nome, u, v, raggio, stile
    ('Valdorna', 11000, 11500, 1750, 'capitale'),
    ('Porto Calvino', 14450, 17350, 1050, 'porto'),
    ('Lido Serena', 6400, 17350, 800, 'lido'),
    ('Ravenzo', 7350, 9500, 750, 'lago'),
    ('Castellago', 4850, 5150, 480, 'lago2'),
    ('Montecastro', 17500, 9600, 420, 'borgo'),
    ('Pievalta', 9800, 3600, 480, 'alpino'),
    ('San Rocco Terme', 14100, 6700, 560, 'terme'),
    ('Ferrandina', 18700, 14300, 950, 'industria'),
    ('Collebruna', 3000, 12300, 800, 'arte'),
]
def make_terrain():
    P = np.stack([U, V], -1)
    dco = vcoast(U) - V
    h = 2.5 + 140 * sstep(0, 5200, dco) + (fbm(U / 900, V / 900, 4) - 0.5) * 14 * sstep(0, 900, dco)
    sea = -0.06 * np.maximum(0, -dco)
    h = np.where(dco > 0, h, 2.5 + np.maximum(sea, -36))
    # colline a ovest e a est
    for cu, cv, r, a in ((17300, 10000, 2700, 330), (1500, 9000, 2300, 160), (20500, 6500, 2600, 420)):
        d = np.hypot(U - cu, V - cv); h += a * np.exp(-(d / r) ** 2) * (0.65 + 0.7 * fbm(U / 1400 + 5, V / 1400, 4))
    # montagne a nord
    rid = 1 - np.abs(2 * fbm(U / 3400 + 3, V / 3400 + 1, 4) - 1)
    mf = sstep(8400, 2400, V)
    h += mf * (300 + 1000 * rid ** 1.5 * sstep(8400, 800, V))
    # valle del lago
    dax, tax = seg_dist(P, LA, LB)
    wl = 560 + 140 * np.sin(tax * 9) + 90 * np.sin(tax * 23 + 1)
    vall = sstep(2600, 500, dax)
    h = h * (1 - vall * 0.8) + vall * 0.8 * (LV + 30 + 0.12 * np.maximum(0, dax - wl))
    dd = dax - wl
    req = LV + 1.6 + 0.06 * np.clip(dd, 0, 400)
    wg = sstep(1500, 300, dd)
    h = np.where(dd < 0, LV - 3 - np.minimum(70, -dd * 0.3), np.maximum(h, req) * wg + h * (1 - wg))
    return ndimage.gaussian_filter(h, 1.5)
def flatten_sites(h, sites):
    sm = ndimage.gaussian_filter(h, 18)
    for (cu, cv, r, lvl) in sites:
        d = np.hypot(U - cu, V - cv); w = sstep(r * 1.25, r * 0.6, d)
        tgt = sm if lvl is None else lvl
        h[:] = h * (1 - w) + tgt * w if lvl is None else h * (1 - w) + lvl * w
    return h
