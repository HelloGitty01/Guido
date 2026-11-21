# Ornavia: rete stradale, città, paesi, campagna -> mondo nel formato del gioco
import json, gzip, base64, heapq, math, time, sys
from gen1 import *
from skimage.graph import MCP_Geometric
from PIL import Image, ImageDraw
R0 = np.random.default_rng(5)
T0 = time.time()
def log(*a): print('[%5.1fs]' % (time.time() - T0), *a, flush=True)
h0 = make_terrain()
H, RIV, BED, PORT = build_terrain()
HC, HP, HT = highway(H)
log('terreno e autostrada')
NHW = len(HC)
def hw_dir(i): a = HC[(i - 1) % NHW]; b = HC[(i + 1) % NHW]; d = b - a; return d / np.hypot(*d)
hwtree = cKDTree(HC)
rivtree = cKDTree(RIV)
P2 = np.stack([U, V], -1); DAX, TAX = seg_dist(P2, LA, LB)
WL = 560 + 140 * np.sin(TAX * 9) + 90 * np.sin(TAX * 23 + 1)
LAKE = (DAX < WL) & (H < LV)
SEA = H < 0.8
WATER = LAKE | SEA
def gidx(x, z): return int(np.clip(round(z / STEP), 0, N - 1)), int(np.clip(round(x / STEP), 0, N - 1))
def is_water(x, z): i, j = gidx(x, z); return bool(WATER[i, j])
GX, GZ = np.gradient(ndimage.gaussian_filter(H, 1.0), STEP); SLOPE = np.hypot(GX, GZ)
def slope_at(x, z): i, j = gidx(x, z); return float(SLOPE[i, j])
waterdist = ndimage.distance_transform_edt(~WATER) * STEP
# ------------------------------------------------------------------ strade
roads = []
def add_road(P, c, w, name='', o=0, ms=0, ref='', tag=''):
    R = {'P': [tuple(map(float, p)) for p in P], 'c': c, 'w': w, 'n': name, 'o': o, 'ms': ms, 'r': ref, 'tag': tag, 'b': 0, 't': 0}
    roads.append(R); return R
NOMI_VIE = ['Via Garibaldi', 'Via Mazzini', 'Via Cavour', 'Via Roma', 'Via Dante', 'Via Manzoni', 'Via Verdi', 'Via Marconi', 'Via Volta', 'Via Galilei', 'Via Leopardi', 'Via Carducci', 'Via Pascoli', 'Via Foscolo', 'Via Petrarca',
    'Via dei Mille', 'Via XX Settembre', 'Via IV Novembre', 'Via Matteotti', 'Via Gramsci', 'Via Kennedy', 'Via Colombo', 'Via Vespucci', 'Via Diaz', 'Via Battisti', 'Via Oberdan', 'Via Solferino', 'Via Magenta', 'Via Montebello',
    'Via delle Rose', 'Via dei Tigli', 'Via degli Ulivi', 'Via dei Platani', 'Via del Mulino', 'Via della Fonte', 'Via del Castello', 'Via della Chiesa', 'Via del Borgo', 'Via del Porto', 'Via del Faro', 'Via della Stazione',
    'Via San Francesco', 'Via Santa Chiara', 'Via San Marco', 'Via San Giorgio', 'Via Sant\'Anna', 'Via San Pietro', 'Via Bixio', 'Via Pisacane', 'Via Settembrini', 'Via Tasso', 'Via Ariosto', 'Via Boccaccio', 'Via Giotto',
    'Via Raffaello', 'Via Tiziano', 'Via Canova', 'Via Bellini', 'Via Rossini', 'Via Puccini', 'Via Donizetti', 'Via Paganini', 'Via Vivaldi', 'Via Fermi', 'Via Meucci', 'Via Avogadro', 'Via Spallanzani', 'Via Morgagni',
    'Via dei Fabbri', 'Via dei Mercanti', 'Via degli Orefici', 'Via dei Tessitori', 'Via delle Erbe', 'Via del Pozzo', 'Via del Sole', 'Via della Luna', 'Via delle Stelle', 'Via dei Gelsi', 'Via dei Pini', 'Via delle Querce']
CORSI = ['Corso della Repubblica', 'Corso Italia', 'Viale della Libertà', 'Corso Vittorio', 'Viale Europa', 'Corso Ornavia', 'Viale dei Giardini', 'Corso del Popolo', 'Viale Lungolago', 'Lungomare Serena', 'Viale delle Terme', 'Corso Mameli']
# ------------------------------------------------------------------ città: griglie stradali
STY = {  # passo, jitter, larghezza viale, larghezza via, sottrazioni
    'capitale': (92, 7, 13, 7.5, 0.04), 'porto': (78, 9, 11, 7, 0.06), 'lido': (84, 6, 12, 7, 0.05), 'lago': (66, 10, 9, 6.2, 0.08), 'lago2': (58, 10, 8, 5.8, 0.1),
    'borgo': (46, 9, 6.5, 5.2, 0.14), 'alpino': (62, 14, 7, 5.6, 0.18), 'terme': (80, 8, 11, 6.8, 0.06), 'industria': (110, 6, 12, 7.5, 0.05), 'arte': (68, 6, 10, 6.5, 0.07)}
cities = []
def city_ok(x, z, C, strict=True):
    if x < 60 or z < 60 or x > SZ - 60 or z > SZ - 60: return False
    i, j = gidx(x, z)
    if WATER[i, j] or waterdist[i, j] < 18: return False
    if H[i, j] < 1.5: return False
    if PORT[0] - 40 < x < PORT[1] + 40 and z > PORT[2] - 40: return False
    if SLOPE[i, j] > (0.24 if C['st'] in ('borgo', 'alpino') else 0.16): return False
    d, _ = hwtree.query([x, z]);
    if d < 48: return False
    return True
def segx(a, b, c, d):
    def cr(o, p, q): return (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0])
    d1 = cr(c, d, a); d2 = cr(c, d, b); d3 = cr(a, b, c); d4 = cr(a, b, d)
    if ((d1 > 0) != (d2 > 0)) and ((d3 > 0) != (d4 > 0)) and d1 != d2 and d3 != d4:
        t = d1 / (d1 - d2); return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t), t
    return None
def crosses_hw(a, b):
    m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); L = math.dist(a, b)
    for k in hwtree.query_ball_point(m, L / 2 + 15):
        if segx(a, b, HC[k], HC[(k + 1) % NHW]): return True
    return False
ni = 0
for ci, (nm, cu, cv, r, st) in enumerate(CITIES):
    sp, jit, wv, ws, drop = STY[st]
    C = {'n': nm, 'u': cu, 'v': cv, 'r': r, 'st': st, 'sp': sp}
    rot = R0.uniform(-0.5, 0.5) if st not in ('lido', 'porto') else R0.uniform(-0.08, 0.08)
    if st == 'borgo': rot = 0.3
    C['rot'] = rot; ca, sa = math.cos(rot), math.sin(rot)
    M = int(r / sp) + 2; nodes = {}
    ph = R0.uniform(0, 6.28, 3)
    for i in range(-M, M + 1):
        for j in range(-M, M + 1):
            jx = R0.uniform(-jit, jit) if (i and j) else 0; jz = R0.uniform(-jit, jit) if (i and j) else 0
            a, b = i * sp + jx, j * sp + jz
            x, z = cu + a * ca - b * sa, cv + a * sa + b * ca
            ang = math.atan2(z - cv, x - cu); rb = r * (0.86 + 0.1 * math.sin(ang * 3 + ph[0]) + 0.07 * math.sin(ang * 5 + ph[1]))
            if math.hypot(x - cu, z - cv) > rb: continue
            if not city_ok(x, z, C): continue
            nodes[(i, j)] = (round(x, 2), round(z, 2))
    C['nodes'] = nodes
    # vie: righe e colonne della griglia, spezzate dove mancano nodi o si toglie un tratto
    lines = []
    for axis in (0, 1):
        for k in range(-M, M + 1):
            cur = []
            for t in range(-M, M + 2):
                key = (t, k) if axis == 0 else (k, t); nxt = (t + 1, k) if axis == 0 else (k, t + 1)
                if key in nodes:
                    cur.append(nodes[key])
                    ok = nxt in nodes and not crosses_hw(nodes[key], nodes[nxt]) and not (k != 0 and R0.random() < drop)
                    if st in ('lago', 'lago2', 'lido', 'porto') and nxt in nodes:
                        mx = (nodes[key][0] + nodes[nxt][0]) / 2; mz = (nodes[key][1] + nodes[nxt][1]) / 2
                        if is_water(mx, mz): ok = False
                    if not ok:
                        if len(cur) >= 2: lines.append((axis, k, cur))
                        cur = []
                else:
                    if len(cur) >= 2: lines.append((axis, k, cur))
                    cur = []
    names = list(NOMI_VIE); R0.shuffle(names); cor = list(CORSI); R0.shuffle(cor); nmi = 0
    C['roads'] = []
    for axis, k, pts in lines:
        main = k == 0 and st not in ('borgo', 'alpino', 'lago2')
        third = (k % 4 == 2) and st in ('capitale', 'industria', 'porto', 'terme')
        c, w = (4, wv) if main else ((6, ws + 1) if third else (7, ws))
        if st in ('borgo', 'alpino') and k == 0: c, w = 6, ws + 0.8
        nmx = cor[(axis + 2 * ci) % len(cor)] if main else names[nmi % len(names)]; nmi += 1
        # punti intermedi ogni ~12 m per seguire il terreno
        P = []
        for q in range(len(pts) - 1):
            a, b = np.array(pts[q]), np.array(pts[q + 1]); n = max(1, int(np.hypot(*(b - a)) / 12))
            for s in range(n): P.append(tuple(a + (b - a) * s / n))
        P.append(pts[-1])
        R = add_road(P, c, w, nmx, tag='city%d' % ci); R['city'] = ci; R['main'] = main; C['roads'].append(R)
    cities.append(C)
log('città', [(c['n'], len(c['nodes'])) for c in cities])
# ------------------------------------------------------------------ rotatorie e semafori negli incroci delle città
islands = []; tls = []
NRB = {'capitale': 5, 'porto': 2, 'lido': 2, 'lago': 1, 'terme': 1, 'industria': 3, 'arte': 1, 'lago2': 0, 'borgo': 0, 'alpino': 0}
NTL = {'capitale': 30, 'porto': 8, 'lido': 5, 'lago': 3, 'terme': 3, 'industria': 8, 'arte': 6, 'lago2': 0, 'borgo': 0, 'alpino': 0}
for C in cities:
    C['rb'] = set(); inc = {}
    for R in C['roads']:
        for q, p in enumerate(R['P']):
            if p in C['nodes'].values(): inc.setdefault(p, []).append((R, q))
    cand = [p for p, l in inc.items() if len(l) == 2 and all(0 < q < len(R['P']) - 1 for R, q in l) and any(R['c'] <= 6 for R, q in l)]
    R0.shuffle(cand); ctr = C['nodes'].get((0, 0))
    done = []
    for p in cand:
        if len(done) >= NRB[C['st']]: break
        if ctr and math.dist(p, ctr) < C['sp'] * 1.6: continue
        if any(math.dist(p, d) < C['sp'] * 2.5 for d in done): continue
        main = any(R['c'] <= 5 for R, q in inc[p]); rr = 17.0 if main else 14.0
        ends = []
        for R, q in inc[p]:
            P = R['P']; A = P[:q]; B = P[q + 1:]
            A = [a for a in A if math.dist(a, p) > rr + 1]; B = [b for b in B if math.dist(b, p) > rr + 1]
            if not A or not B: continue
            ea = tuple(np.round(np.array(p) + (np.array(A[-1]) - p) / math.dist(A[-1], p) * rr, 3)); eb = tuple(np.round(np.array(p) + (np.array(B[0]) - p) / math.dist(B[0], p) * rr, 3))
            R['P'] = A + [ea]
            R2 = add_road([eb] + B, R['c'], R['w'], R['n'], tag=R['tag']); R2['city'] = R.get('city'); R2['main'] = R.get('main'); C['roads'].append(R2)
            ends += [ea, eb]
        if len(ends) < 3: continue
        ang = lambda e: math.atan2(-(e[1] - p[1]), e[0] - p[0])
        ends.sort(key=ang); ring = []
        for k in range(len(ends)):
            a0 = ang(ends[k]); a1 = ang(ends[(k + 1) % len(ends)])
            if a1 <= a0: a1 += 2 * math.pi
            ring.append(ends[k])
            for t in np.arange(a0 + 0.2, a1 - 0.1, 0.2): ring.append((p[0] + math.cos(t) * rr, p[1] - math.sin(t) * rr))
        ring.append(ends[0])
        add_road(ring, 6, 7.5, 'Rotatoria ' + R0.choice(['della Fontana', 'dei Mille', 'Europa', 'del Mercato', 'della Pace', 'San Giorgio']), o=1, tag='rb')
        islands.append((p, rr - 4.4)); C['rb'].add(p); done.append(p)
    tl = [p for p in cand if p not in C['rb'] and not any(math.dist(p, d) < rr + 30 for d, rr in islands)]
    R0.shuffle(tl)
    for p in tl[:NTL[C['st']]]: tls.append((p, C['rot']))
log('rotatorie', len(islands), 'semafori', len(tls))
# ------------------------------------------------------------------ autostrada: due carreggiate e svincoli
def offset_line(C, off):
    out = []
    for i in range(len(C)):
        d = hw_dir(i); out.append(C[i] + off * np.array([-d[1], d[0]]))
    return np.array(out)
HWO = 6.6
CA = offset_line(HC, HWO); CB = offset_line(HC, -HWO)
# la carreggiata A va in avanti (lato destro), la B all'indietro
hwA = add_road([tuple(p) for p in np.vstack([CA, CA[:1]])], 0, 10.2, 'Autostrada A1 Anello di Ornavia', o=1, ms=130, ref='A1', tag='hw')
hwB = add_road([tuple(p) for p in np.vstack([CB, CB[:1]])[::-1]], 0, 10.2, 'Autostrada A1 Anello di Ornavia', o=1, ms=130, ref='A1', tag='hw')
FIX = {}  # quote imposte per chiave di vertice
def K(p): return (int(round(p[0] * 10)), int(round(p[1] * 10)))
for i in range(NHW):
    FIX[K(CA[i])] = HP[i] + 0.0; FIX[K(CB[i])] = HP[i] + 0.0
FIX[K(hwA['P'][-1])] = HP[0]; FIX[K(hwB['P'][-1])] = HP[0]
def bez(p0, p1, p2, p3, step=10):
    p0, p1, p2, p3 = map(np.array, (p0, p1, p2, p3)); L = np.hypot(*(p3 - p0)) + 1; n = max(4, int(L / step))
    t = np.linspace(0, 1, n + 1)[:, None]
    return [tuple(p) for p in ((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3)]
def nearest_city_node(C, x, z, maxd=1e9):
    best = None
    for p in C['nodes'].values():
        if p in C.get('rb', ()): continue
        d = math.hypot(p[0] - x, p[1] - z)
        if d < maxd and (best is None or d < best[0]): best = (d, p)
    return best[1] if best else None
exits = []; exinfo = []
CN0 = {c['n']: c for c in cities}
def interchange(C, label, pt=None):
    ccen = np.array([C['u'], C['v']])
    d, i = hwtree.query(ccen if pt is None else pt)
    # punto dell'autostrada più vicino, lontano dagli altri svincoli
    if any(min(abs(i - e), NHW - abs(i - e)) < 80 for e in exits): print('svincolo troppo vicino', C['n']); return
    if abs(HP[i] - HT[i]) > 4: # cerca un punto vicino a raso
        cand = [k % NHW for k in range(i - 150, i + 151) if abs(HP[k % NHW] - HT[k % NHW]) < 4.5]
        if not cand: return
        i = min(cand, key=lambda k: min(abs(k - i), NHW - abs(k - i)))
    exits.append(i); exinfo.append((i, C['n']))
    Hp = HC[i]; dn = hw_dir(i); r = np.array([-dn[1], dn[0]]); s = 1 if (ccen - Hp) @ r > 0 else -1
    near, far = (CA, CB) if s > 0 else (CB, CA)
    sgn = 1 if s > 0 else -1  # la carreggiata vicina va nel verso dn se s>0
    dv = dn * sgn
    Jn = Hp + s * r * 72; Jf = Hp - s * r * 72
    k1 = (i - 25 * sgn) % NHW; k2 = (i + 25 * sgn) % NHW
    A0, A1 = near[k1], near[k2]; B0, B1 = far[k2], far[k1]
    hh = HP[i]
    nm = 'Uscita ' + C['n']
    R1 = add_road(bez(A0, A0 + dv * 110, Jn - dv * 60, Jn), 1, 6.0, nm, o=1, ms=60, tag='ramp')
    R2 = add_road(bez(Jn, Jn + dv * 60, A1 - dv * 110, A1), 1, 6.0, 'Ingresso A1', o=1, ms=60, tag='ramp')
    R3 = add_road(bez(B0, B0 - dv * 110, Jf + dv * 60, Jf), 1, 6.0, nm, o=1, ms=60, tag='ramp')
    R4 = add_road(bez(Jf, Jf - dv * 60, B1 + dv * 110, B1), 1, 6.0, 'Ingresso A1', o=1, ms=60, tag='ramp')
    # cavalcavia
    cr = [tuple(Jf + (Jn - Jf) * t) for t in np.linspace(0, 1, 15)]
    R5 = add_road(cr, 5, 8.0, 'Svincolo di ' + C['n'], tag='over')
    for p in cr:
        off = math.hypot(p[0] - Hp[0], p[1] - Hp[1]); FIX[K(p)] = hh + 7.2 * (1 - float(sstep(28, 150, off)))
    R5['b_rng'] = (0, 0)
    for R in (R1, R2, R3, R4):
        a, b = FIX.get(K(R['P'][0])), FIX.get(K(R['P'][-1])); n = len(R['P'])
        for q, p in enumerate(R['P']):
            if K(p) not in FIX: FIX[K(p)] = a + (b - a) * q / (n - 1)
    # raccordo verso la città
    tgt = nearest_city_node(C, *(Jn + s * r * 300))
    return (tuple(Jn), tgt, C)
links = []
for C in cities:
    d, i = hwtree.query([C['u'], C['v']])
    if d < C['r'] + 2600:
        q = interchange(C, '')
        if q: links.append(q)
        else: print('niente svincolo', C['n'])
for pt in ((11000, 14100), (10300, 9200)):
    q = interchange(CN0['Valdorna'], '', np.array(pt))
    if q: links.append(q)
log('svincoli', len(exits))
# ------------------------------------------------------------------ strade statali: percorsi di costo minimo
CS = 2  # griglia di calcolo a 40 m
Hc = H[::CS, ::CS]; Sc = SLOPE[::CS, ::CS]; Wc = WATER[::CS, ::CS]; WDc = waterdist[::CS, ::CS]
hwmask = np.zeros_like(Hc, bool)
for p in HC[::2]: i, j = int(p[1] / (STEP * CS)), int(p[0] / (STEP * CS)); hwmask[max(0, i - 1):i + 2, max(0, j - 1):j + 2] = True
rivmask = np.zeros_like(Hc, bool)
for p in RIV[::2]: i, j = int(p[1] / (STEP * CS)), int(p[0] / (STEP * CS)); rivmask[max(0, i - 1):i + 2, max(0, j - 1):j + 2] = True
citymask = np.zeros_like(Hc, float)
Uc, Vc = U[::CS, ::CS], V[::CS, ::CS]
for C in cities: citymask = np.maximum(citymask, (np.hypot(Uc - C['u'], Vc - C['v']) < C['r'] * 0.85) * 1.0)
def cost_grid(shore=False, mount=False):
    c = 1 + 30 * Sc ** 2 + np.maximum(0, Sc - 0.10) * 140
    if mount: c = 1 + 12 * Sc ** 2 + np.maximum(0, Sc - 0.13) * 90
    c = c + hwmask * 60 + rivmask * 25 + citymask * 6
    if shore: c = c * np.where((WDc > 45) & (WDc < 170), 0.3, 1.0)
    c[Wc] = 1e5
    c[(Hc < 1.5)] = 1e5
    return c
def chaikin(P, it=3):
    P = np.array(P)
    for _ in range(it):
        Q = [P[0]]
        for a, b in zip(P[:-1], P[1:]): Q += [0.75 * a + 0.25 * b, 0.25 * a + 0.75 * b]
        Q.append(P[-1]); P = np.array(Q)
    return P
def dp(P, tol):
    P = np.array(P); keep = [0, len(P) - 1]; st = [(0, len(P) - 1)]
    while st:
        i, j = st.pop(); a, b = P[i], P[j]; e = b - a; l = np.hypot(*e) or 1e-9
        if j <= i + 1: continue
        d = np.abs((P[i + 1:j, 0] - a[0]) * e[1] - (P[i + 1:j, 1] - a[1]) * e[0]) / l; k = int(np.argmax(d))
        if d[k] > tol: k += i + 1; keep.append(k); st += [(i, k), (k, j)]
    return P[sorted(set(keep))]
def route(a, b, shore=False, mount=False):
    cg = cost_grid(shore, mount); m = MCP_Geometric(cg, fully_connected=True)
    sa = (int(round(a[1] / (STEP * CS))), int(round(a[0] / (STEP * CS)))); sb = (int(round(b[1] / (STEP * CS))), int(round(b[0] / (STEP * CS))))
    cg[sa] = 1; cg[sb] = 1
    m = MCP_Geometric(cg, fully_connected=True); m.find_costs([sa], [sb]); path = m.traceback(sb)
    P = np.array([(j * STEP * CS, i * STEP * CS) for i, j in path], float)
    P = dp(P, 18); P = chaikin(P, 3); P = resample(P, 12.0)
    P[0] = a; P[-1] = b
    return P
def exit_node(C, toward):
    d = np.array(toward) - [C['u'], C['v']]; d = d / np.hypot(*d); best = None
    for p in C['nodes'].values():
        if p in C.get('rb', ()): continue
        v = np.array(p) - [C['u'], C['v']]; sc = v @ d - 0.6 * abs(v[0] * d[1] - v[1] * d[0])
        if best is None or sc > best[0]: best = (sc, p)
    return best[1]
CN = {c['n']: c for c in cities}
CONN = [('Ravenzo', 'Castellago', 'Strada del Lago', 1, 0), ('Castellago', 'Pievalta', 'Passo del Gallo', 0, 1), ('Pievalta', 'San Rocco Terme', 'Strada delle Malghe', 0, 1),
        ('San Rocco Terme', 'Montecastro', 'Strada dei Colli', 0, 1), ('Montecastro', 'Ferrandina', 'Strada della Rocca', 0, 1), ('Ferrandina', 'Porto Calvino', 'Strada Statale 12', 0, 0),
        ('Porto Calvino', 'Lido Serena', 'Strada Litoranea', 1, 0), ('Lido Serena', 'Collebruna', 'Strada Statale 7', 0, 0), ('Collebruna', 'Ravenzo', 'Strada Statale 9', 0, 0),
        ('Valdorna', 'Ravenzo', 'Strada Statale 1', 0, 0), ('Valdorna', 'San Rocco Terme', 'Strada Statale 3', 0, 0), ('Valdorna', 'Porto Calvino', 'Strada Statale 2', 0, 0),
        ('Valdorna', 'Collebruna', 'Strada Statale 4', 0, 0), ('Valdorna', 'Montecastro', 'Strada Statale 5', 0, 0), ('Castellago', 'Collebruna', 'Strada Panoramica Ovest', 1, 1)]
statali = []
for a, b, nm, shore, mount in CONN:
    A, B = CN[a], CN[b]
    pa = exit_node(A, (B['u'], B['v'])); pb = exit_node(B, (A['u'], A['v']))
    P = route(pa, pb, shore, mount)
    R = add_road([tuple(p) for p in P], 6 if mount else 5, 7.0 if mount else 7.5, nm, tag='stat'); statali.append(R)
for Jn, tgt, C in links:
    P = route(Jn, tgt); R = add_road([tuple(p) for p in P], 5, 7.5, 'Raccordo di ' + C['n'], tag='link'); statali.append(R)
log('statali', len(statali), 'km %.0f' % (sum(np.hypot(*np.diff(np.array(R['P']), axis=0).T).sum() for R in statali) / 1000))
if 'dbg' in sys.argv:
    from dbg import draw; draw(H, roads, cities, '/tmp/rete.png', WATER)
# ------------------------------------------------------------------ paesi e cascine lungo le statali
VILL = ['Borgofreddo', 'Casalvento', 'Rivalta Bassa', 'Mulinetto', 'Sorbara Alta', 'Prato Lungo', 'Fontanile', 'Roccabruna', 'Vallescura', 'San Lucio', 'Torricella', 'Campodolce', 'Pianello']
villages = []; farms = []
def far_from_all(x, z, dmin_city, dmin_v):
    for C in cities:
        if math.hypot(x - C['u'], z - C['v']) < C['r'] + dmin_city: return False
    for vv in villages:
        if math.hypot(x - vv['u'], z - vv['v']) < dmin_v: return False
    return True
cand = []
for R in statali:
    P = R['P']
    for k in range(20, len(P) - 20, 6): cand.append((R0.random(), R, k))
cand.sort(key=lambda t: t[0])
for _, R, k in cand:
    if len(villages) >= len(VILL): break
    x, z = R['P'][k]
    if not far_from_all(x, z, 900, 1700) or slope_at(x, z) > 0.12 or waterdist[gidx(x, z)] < 80: continue
    if hwtree.query([x, z])[0] < 250: continue
    vv = {'n': VILL[len(villages)], 'u': x, 'v': z, 'r': 230, 'st': 'alpino' if H[gidx(x, z)] > 650 else 'paese', 'road': R, 'k': k, 'roads': [], 'nodes': {}}
    villages.append(vv)
    P = R['P']; d = np.array(P[min(k + 1, len(P) - 1)]) - np.array(P[k - 1]); d /= np.hypot(*d); nrm = np.array([-d[1], d[0]])
    for q, kk in enumerate((k - 8, k, k + 9)):
        if kk < 2 or kk > len(P) - 3: continue
        sd = 1 if q % 2 == 0 else -1; L = R0.uniform(90, 160); a = np.array(P[kk])
        pts = [tuple(a)]; ok = True
        for t in np.arange(12, L, 12):
            p = a + nrm * sd * t
            if waterdist[gidx(*p)] < 25 or slope_at(*p) > 0.2 or hwtree.query(p)[0] < 60: break
            pts.append(tuple(p))
        if len(pts) >= 4:
            S2 = add_road(pts, 7, 5.6, ['Via della Chiesa', 'Via del Pozzo', 'Via dei Campi', 'Via del Mulino'][q], tag='vill'); vv['roads'].append(S2)
log('paesi', [v['n'] for v in villages])
for R in statali:
    P = R['P']
    for k in range(15, len(P) - 15, 55):
        if R0.random() > 0.55: continue
        x, z = P[k]; hh = H[gidx(x, z)]
        if not far_from_all(x, z, 300, 450) or slope_at(x, z) > 0.1 or waterdist[gidx(x, z)] < 90: continue
        if any(math.hypot(x - f['u'], z - f['v']) < 500 for f in farms): continue
        d = np.array(P[k + 1]) - np.array(P[k - 1]); d /= np.hypot(*d); sd = 1 if R0.random() < 0.5 else -1; nrm = np.array([-d[1], d[0]]) * sd
        L = R0.uniform(45, 75); a = np.array(P[k]); b = a + nrm * L
        if waterdist[gidx(*b)] < 60 or slope_at(*b) > 0.12 or hwtree.query(b)[0] < 80: continue
        Rf = add_road([tuple(a + (b - a) * t) for t in np.linspace(0, 1, max(2, int(L / 12) + 1))], 8, 4.0, 'Strada vicinale', tag='farm')
        farms.append({'u': b[0], 'v': b[1], 'd': nrm, 'alp': hh > 700, 'road': Rf})
log('cascine', len(farms))
# ------------------------------------------------------------------ casa di Guido: villetta con garage in collina, vista lago
HOME = None
def place_home():
    global HOME
    lakeD = ndimage.distance_transform_edt(~LAKE) * STEP
    RP = [(p, ri) for ri, R in enumerate(roads) if R['tag'] != 'hw' and R['c'] <= 8 for p in R['P']]
    RT = cKDTree([p for p, _ in RP])
    vx, vz = 11000.0, 11500.0  # Valdorna
    best = None
    for i in range(10, N - 10, 2):
        for j in range(10, N - 10, 2):
            ld = lakeD[i, j]
            if ld < 220 or ld > 1300: continue
            x, z = j * STEP, i * STEP; h = H[i, j]
            if not (25 < h - LV < 120) or WATER[i, j]: continue
            blk = H[i - 3:i + 4, j - 3:j + 4]
            if blk.max() - blk.min() > 10: continue
            if not far_from_all(x, z, 250, 450) or hwtree.query([x, z])[0] < 220: continue
            if any(math.hypot(x - f['u'], z - f['v']) < 300 for f in farms): continue
            d, k = RT.query([x, z])
            if d < 70 or d > 280: continue
            # direzione verso il lago (in discesa) e vista libera
            gy, gx = np.gradient(lakeD[i - 2:i + 3, j - 2:j + 3])
            a = -np.array([gx[2, 2], gy[2, 2]]); n = np.hypot(*a)
            if n < 1e-6: continue
            a /= n
            ok = True
            for t in range(60, int(ld), 60):
                ii, jj = gidx(x + a[0] * t, z + a[1] * t)
                if H[ii, jj] > h - 3 - t * 0.02: ok = False; break
            if not ok: continue
            sc = -abs(h - LV - 55) * 2 - math.hypot(x - vx, z - vz) / 60 - d / 5 - (blk.max() - blk.min()) * 3
            if best is None or sc > best[0]: best = (sc, x, z, a, k)
    if not best: print('casa di Guido: nessun posto'); return
    _, x, z, al, k = best
    q, ri = RP[k]; Q = np.array(q)
    a = np.array([x, z]) - Q; a /= np.hypot(*a)  # asse del lotto: dalla strada verso l'interno (la vista sul lago è alle spalle dell'ingresso)
    b = np.array([-a[1], a[0]])
    P0 = np.array([x, z]); E0 = P0 - a * 25
    h0 = float(np.median(H[gidx(x, z)[0] - 1:gidx(x, z)[0] + 2, gidx(x, z)[1] - 1:gidx(x, z)[1] + 2]))
    # spiana il lotto con raccordo morbido
    for ii in range(N):
        zz = ii * STEP
        if abs(zz - z) > 170: continue
        for jj in range(N):
            xx = jj * STEP
            if abs(xx - x) > 170: continue
            d = np.array([xx - x, zz - z]); u = d @ a; v = d @ b
            eu = max(0, u - 34, -u - 64); ev = max(0, abs(v) - 42); e = math.hypot(eu, ev)
            w = 1.0 if e <= 0 else max(0.0, 1 - e / 60) ** 2 * (3 - 2 * max(0.0, 1 - e / 60)) if e < 60 else 0.0
            if w > 0: H[ii, jj] = H[ii, jj] * (1 - w) + h0 * w
    # vialetto: dalla strada all'ingresso, poi dentro fino al piazzale
    dq = E0 - Q; L = np.hypot(*dq)
    t0 = (Q + dq / L * min(30, L / 3))
    pts = bez(Q, t0, E0 - a * min(30, L / 3), E0) + [tuple(E0 + a * 7), tuple(E0 + a * 14)]
    seen = []; [seen.append(p) for p in pts if not seen or math.hypot(p[0] - seen[-1][0], p[1] - seen[-1][1]) > 2]
    seen[0] = tuple(q)
    add_road(seen, 8, 6.5, 'Vialetto di Casa Guido', ms=20, tag='home')
    HOME = {'x': float(x), 'z': float(z), 'a': float(math.atan2(a[1], a[0])), 'h': h0}
    log('casa di Guido', round(x), round(z), 'quota', round(h0), 'sul lago', round(h0 - LV), 'vialetto', round(L))
place_home()
# ------------------------------------------------------------------ aree di servizio (autostrada) e distributori (statali)
FUEL = []  # (x, z, rot, nome, tipo)
def hw_flat(i, span):
    return all(abs(HP[k % NHW] - HT[k % NHW]) < 2.2 and not is_water(*HC[k % NHW]) for k in range(i - span, i + span + 1))
SA_NAMES = ['Area di servizio Colle Verde', 'Area di servizio Le Querce', 'Area di servizio Belvedere']
sa_done = []
RPT = cKDTree([p for R in roads if R['tag'] != 'hw' for p in R['P']])
def sa_clear(i):
    dn = hw_dir(i); r = np.array([-dn[1], dn[0]])
    return all(RPT.query(HC[k % NHW] + r * sg * 36)[0] > 45 for k in range(i - 34, i + 35, 4) for sg in (1, -1))
for frac, nm in zip((0.12, 0.45, 0.78), SA_NAMES):
    i0 = int(frac * NHW); best = None
    for i in range(i0 - 500, i0 + 501, 5):
        i %= NHW
        if any(min(abs(i - e), NHW - abs(i - e)) < 75 for e in exits + sa_done): continue
        if not hw_flat(i, 34) or not sa_clear(i): continue
        dd = min(min(abs(i - e), NHW - abs(i - e)) for e in exits) if exits else 999
        sc = -abs(i - i0)
        if best is None or sc > best[0]: best = (sc, i)
    if not best: print('niente area di servizio', nm); continue
    i = best[1]; sa_done.append(i)
    for car, sgn in ((CA, 1), (CB, -1)):
        dn = hw_dir(i); r = np.array([-dn[1], dn[0]]); dv = dn * sgn; out = r * sgn
        ks = list(range(i - 30, i + 31)); 
        if sgn < 0: ks = ks[::-1]
        k1, k2 = ks[0] % NHW, ks[-1] % NHW
        A0, A1 = car[k1], car[k2]
        lane = [car[k % NHW] + out * 30 for k in ks[16:-16]]
        P = bez(A0, A0 + dv * 70, lane[0] - dv * 50, lane[0])[:-1] + [tuple(p) for p in lane] + bez(lane[-1], lane[-1] + dv * 50, A1 - dv * 70, A1)[1:]
        R = add_road(P, 5, 7.0, nm, o=1, ms=50, tag='ramp')
        hh = HP[i]
        for q, p in enumerate(R['P']):
            if K(p) not in FIX: FIX[K(p)] = hh + (HP[k1] - hh) * max(0, 1 - q / 8) + (HP[k2] - hh) * max(0, 1 - (len(R['P']) - 1 - q) / 8)
        c = car[i % NHW] + out * 30
        FUEL.append((float(c[0]), float(c[1]), float(math.atan2(dv[1], dv[0])), nm, 'hw'))
nst = 0
for R in sorted(statali, key=lambda R: -len(R['P'])):
    if nst >= 7: break
    P = R['P']; n = len(P)
    for k in list(range(n // 2, n - 30, 7)) + list(range(n // 2, 30, -7)):
        x, z = P[k]
        if not far_from_all(x, z, 250, 350) or slope_at(x, z) > 0.07 or waterdist[gidx(x, z)] < 80 or hwtree.query([x, z])[0] < 150: continue
        if any(math.hypot(x - f['u'], z - f['v']) < 200 for f in farms): continue
        if any(math.hypot(x - f[0], z - f[1]) < 2500 for f in FUEL): continue
        d = np.array(P[k + 8]) - np.array(P[k]); d /= np.hypot(*d)
        v4 = np.array(P[k + 4]) - P[k]
        if abs(v4[0] * d[1] - v4[1] * d[0]) > 3: continue  # tratto quasi dritto
        nrm = np.array([-d[1], d[0]])
        if any(slope_at(*(np.array(P[j]) + nrm * 14)) > 0.08 or is_water(*(np.array(P[j]) + nrm * 14)) for j in range(k, k + 9)): continue
        offs = [0, 5, 10.5, 12, 12, 12, 10.5, 5, 0]
        pts = [tuple(P[k])] + [tuple(np.array(P[k + j]) + nrm * offs[j]) for j in range(1, 8)] + [tuple(P[k + 8])]
        add_road(pts, 7, 6.0, 'Distributore ' + R['n'], ms=30, tag='fuel')
        c = np.array(P[k + 4]) + nrm * 12
        FUEL.append((float(c[0]), float(c[1]), float(math.atan2(d[1], d[0])), 'Distributore', 'st')); nst += 1
        break
log('aree di servizio', len(sa_done), 'distributori', nst)
# ------------------------------------------------------------------ incroci: inserisce i vertici comuni dove le strade si incrociano
def node_roads():
    NR = [R for R in roads if R['tag'] not in ('hw',)]
    CELL = 60.0; grid = {}
    for ri, R in enumerate(NR):
        P = R['P']
        for i in range(len(P) - 1):
            a, b = P[i], P[i + 1]
            for gx in range(int(min(a[0], b[0]) // CELL), int(max(a[0], b[0]) // CELL) + 1):
                for gz in range(int(min(a[1], b[1]) // CELL), int(max(a[1], b[1]) // CELL) + 1):
                    grid.setdefault((gx, gz), []).append((ri, i))
    ins = {}  # (ri, i) -> [(t, p)]
    seen = set(); n = 0
    for cell, lst in grid.items():
        for x in range(len(lst)):
            for y in range(x + 1, len(lst)):
                (r1, i1), (r2, i2) = lst[x], lst[y]
                if r1 == r2 and abs(i1 - i2) <= 1: continue
                key = (r1, i1, r2, i2)
                if key in seen: continue
                seen.add(key)
                A, B = NR[r1], NR[r2]
                if (A['tag'] in ('over', 'ramp')) != (B['tag'] in ('over', 'ramp')) and (A['tag'] == 'over' or B['tag'] == 'over'): continue
                a, b, c, d = A['P'][i1], A['P'][i1 + 1], B['P'][i2], B['P'][i2 + 1]
                if a in (c, d) or b in (c, d): continue
                q = segx(a, b, c, d)
                if not q: continue
                p, t = q
                # punto comune: se vicino a un vertice esistente si usa quello
                for v in (a, b, c, d):
                    if math.dist(v, p) < 1.5: p = v; break
                p = (round(p[0], 3), round(p[1], 3)) if p not in (a, b, c, d) else p
                ins.setdefault((r1, i1), []).append(p); ins.setdefault((r2, i2), []).append(p); n += 1
    for ri, R in enumerate(NR):
        P = R['P']; out = [P[0]]
        for i in range(len(P) - 1):
            extra = ins.get((ri, i), [])
            a = P[i]
            for p in sorted(set(extra), key=lambda p: math.dist(p, a)):
                if math.dist(p, out[-1]) < 0.01: continue
                if math.dist(p, P[i + 1]) < 1.5 and p != P[i + 1]: continue
                if math.dist(p, a) < 1.5 and p != a: continue
                out.append(p)
            if math.dist(P[i + 1], out[-1]) > 0.01: out.append(P[i + 1])
        R['P'] = out
    return n
log('incroci inseriti', node_roads())
# ------------------------------------------------------------------ quote delle strade
band = np.zeros_like(H, bool)
d_r, _ = rivtree.query(np.stack([U.ravel(), V.ravel()], 1), distance_upper_bound=70); band = np.isfinite(d_r).reshape(H.shape)
HR = np.where(band, ndimage.grey_dilation(H, size=(11, 11)), H)
HR = np.where(LAKE, LV + 1.0, HR); HR = np.where(SEA, 2.0, HR)
def hr_at(P): P = np.array(P); return hat(HR, P[:, 0], P[:, 1])
cross_pts = []
for R in roads:
    if R['tag'] in ('hw', 'ramp', 'over'): continue
    P = R['P']; out = [P[0]]; flags = []
    for i in range(len(P) - 1):
        a, b = P[i], P[i + 1]; m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        for k in hwtree.query_ball_point(m, math.dist(a, b) / 2 + 12):
            q = segx(a, b, tuple(HC[k]), tuple(HC[(k + 1) % NHW]))
            if q: out.append(q[0]); flags.append((len(out) - 1, HP[k]))
        out.append(b)
    R['P'] = out; R['hwx'] = flags
for R in roads:
    P = np.array(R['P']); n = len(P)
    if R['tag'] == 'hw' or R['tag'] in ('ramp', 'over'):
        R['h'] = np.array([FIX.get(K(p), np.nan) for p in R['P']])
        if np.isnan(R['h']).any():
            idx = np.arange(n); ok = ~np.isnan(R['h']); R['h'] = np.interp(idx, idx[ok], R['h'][ok])
        continue
    cum = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))])
    hb = hr_at(P)
    hs = hb.copy()
    for q in range(n): m = np.abs(cum - cum[q]) < (35 if R['c'] >= 6 else 55); hs[q] = hb[m].mean()
    # estremi agganciati a quote imposte (svincoli)
    for end in (0, n - 1):
        f = FIX.get(K(R['P'][end]))
        if f is not None:
            dd = np.abs(cum - cum[end]); w = 1 - np.clip(dd / 160, 0, 1); hs = hs + (f - hs[end]) * w
    # cavalcavia sopra l'autostrada
    for qi, hh in R.get('hwx', []):
        dd = np.abs(cum - cum[qi]); tgt = hh + 7.4; w = 1 - sstep(25, 175, dd); hs = np.maximum(hs, hs * (1 - w) + tgt * w)
    R['h'] = hs
# stessa quota agli incroci
acc = {}
for R in roads:
    for p, hh in zip(R['P'], R['h']): acc.setdefault(K(p), []).append(hh)
for R in roads:
    R['h'] = np.array([FIX[K(p)] if K(p) in FIX else float(np.mean(acc[K(p)])) for p in R['P']])
log('quote')
# ------------------------------------------------------------------ ponti e gallerie: pezzi separati
pieces = []
for R in roads:
    P = R['P']; hh = R['h']; n = len(P); fl = []
    for i in range(n - 1):
        m = ((P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2); hm = (hh[i] + hh[i + 1]) / 2; g = float(hat(H, [m[0]], [m[1]])[0])
        cross = False
        for kk in rivtree.query_ball_point(m, math.dist(P[i], P[i + 1]) / 2 + 30):
            if kk + 1 < len(RIV) and segx(P[i], P[i + 1], tuple(RIV[kk]), tuple(RIV[kk + 1])): cross = True; break
        br = 1 if (hm - g > 5.5 or cross or any(abs(i - qi) <= 2 for qi, _ in R.get('hwx', []))) else 0
        if R['tag'] == 'over':
            off = hwtree.query(m)[0]; br = 1 if off < 26 else 0
        tu = 1 if (R['c'] <= 1 and g - hm > 9) else 0
        fl.append((br, tu))
    for i in range(len(fl)):
        if fl[i][0] == 0 and ((i > 0 and fl[i - 1][0] and fl[i - 1][1] == 0 and R.get('_rx', {}).get(i - 1)) or False): pass
    s0 = 0
    for i in range(1, n):
        if i == n - 1 or fl[i] != fl[s0]:
            e = i if i == n - 1 else i
            seg = dict(R); seg['P'] = P[s0:e + 1]; seg['h'] = hh[s0:e + 1]; seg['b'], seg['t'] = fl[s0]
            pieces.append(seg); s0 = i
log('pezzi', len(pieces), 'ponti', sum(p['b'] for p in pieces), 'gallerie', sum(p['t'] for p in pieces))
# ------------------------------------------------------------------ edifici
blds = []; areas = []; trees = []; lms = []
PAL = {
    'hist': [0xe9d3a6, 0xdcb07c, 0xe7c48e, 0xc8875e, 0xe3cdb0, 0xd9a067, 0xefe0c0, 0xcf9d76, 0xb97a55, 0xe4b88f],
    'pastel': [0xf0c987, 0xe89f7e, 0xf3e1a6, 0xb9d3c7, 0xe9b3b0, 0xf2d4a8, 0xd0e0b5, 0xf6efe0, 0xe8a55c, 0xa9c6d9],
    'mod': [0xeeeae2, 0xdcd6cb, 0xc9c2b7, 0xe2d2b9, 0xb7b2aa, 0xd8c7ad, 0xf2f0ea, 0xc8b8a2],
    'glass': [0xc8d6e0, 0xa9bccb, 0xd8e2e6, 0x9eb4c4, 0xb8c9b9, 0xcfc6b0],
    'ind': [0xb9b6ae, 0xa7a49c, 0xc6c1b4, 0x9c9a94, 0xb0a48e, 0x8f9aa0],
    'stone': [0xc9bba3, 0xb8a88d, 0xd6c8ae, 0xa89a82],
    'wood': [0xffffff, 0xf2e6d8, 0xe6d6c0],
}
def pick(a): return a[int(R0.random() * len(a))]
# tipi: 0 storico persiane verdi, 1 moderno balconi, 2 vetro, 3 capannone, 4 storico persiane marroni, 5 basso/box, 7 chalet, 8 storico chiaro, 9 moderno chiaro, 10 pietra
def spec(st, f, x, z, C):
    """ -> (larghezza, profondità, distacco, altezza, tipo, negozi, tetto, colore) """
    rr = R0.random()
    if st == 'capitale':
        ang = math.atan2(z - C['v'], x - C['u'])
        if f > 0.55 and abs(math.atan2(math.sin(ang - 0.1), math.cos(ang - 0.1))) < 0.62: return 'ind'
        if f < 0.26 and rr < 0.42: return (R0.uniform(26, 40), R0.uniform(24, 38), 9, R0.uniform(60, 200) * (1.15 - f), 2, 0, 0, pick(PAL['glass']))
        if f < 0.45: return (R0.uniform(14, 26), R0.uniform(14, 20), 0, R0.uniform(19, 28), pick([0, 4, 8, 1]), 1, 0 if rr < 0.6 else 1, pick(PAL['hist']))
        if f < 0.75: return (R0.uniform(16, 30), R0.uniform(13, 18), R0.choice([0, 0, 5]), R0.uniform(15, 30), pick([1, 9, 1, 8]), 1 if rr < 0.6 else 0, 0, pick(PAL['mod']))
        return (R0.uniform(18, 34), R0.uniform(12, 16), 7, R0.uniform(12, 36), pick([1, 9]), 1 if rr < 0.25 else 0, 0, pick(PAL['mod']))
    if st == 'industria':
        ang = math.atan2(z - C['v'], x - C['u'])
        if f > 0.3 and math.cos(ang - 0.6) > 0.15: return 'ind'
        if f < 0.35: return (R0.uniform(14, 24), R0.uniform(12, 16), 0, R0.uniform(14, 24), pick([1, 9, 8]), 1, 0, pick(PAL['mod']))
        return (R0.uniform(18, 30), R0.uniform(11, 15), 8, R0.uniform(15, 33), pick([1, 9]), 0, 0, pick(PAL['ind'] + PAL['mod']))
    if st == 'porto':
        if z > PORT[2] - 330 and PORT[0] - 420 < x < PORT[1] + 420: return 'ind'
        if f < 0.6: return (R0.uniform(9, 16), R0.uniform(11, 15), 0, R0.uniform(11, 19), pick([0, 4, 8]), 1, 1 if rr < 0.55 else 0, pick(PAL['pastel']))
        return (R0.uniform(14, 26), R0.uniform(11, 15), 6, R0.uniform(12, 24), pick([1, 9]), 1 if rr < 0.3 else 0, 0, pick(PAL['mod']))
    if st == 'lido':
        wd = waterdist[gidx(x, z)]
        if wd < 260: return (R0.uniform(22, 36), R0.uniform(14, 18), 8, R0.uniform(18, 32), pick([1, 9]), 1, 0, pick([0xffffff, 0xf4efe6, 0xf3e4c8, 0xe9f1f2]))
        return (R0.uniform(10, 15), R0.uniform(9, 12), 6, R0.uniform(6.5, 10), pick([0, 4, 8]), 1 if rr < 0.2 else 0, 1, pick(PAL['pastel']))
    if st in ('lago', 'lago2'):
        return (R0.uniform(9, 15), R0.uniform(10, 14), 0 if f < 0.6 else 5, R0.uniform(9, 16), pick([0, 4, 8]), 1 if f < 0.55 else 0, 1 if rr < 0.8 else 0, pick(PAL['pastel']))
    if st == 'borgo':
        return (R0.uniform(8, 13), R0.uniform(9, 13), 0, R0.uniform(7, 13), 10, 1 if f < 0.4 and rr < 0.5 else 0, 1, pick(PAL['stone']))
    if st == 'alpino':
        return (R0.uniform(10, 14), R0.uniform(9, 12), 7, R0.uniform(6.5, 10), 7, 1 if f < 0.3 and rr < 0.4 else 0, 2, pick(PAL['wood']))
    if st == 'terme':
        if f < 0.5: return (R0.uniform(20, 34), R0.uniform(14, 18), 4, R0.uniform(15, 22), pick([0, 8, 4]), 1, 0 if rr < 0.5 else 1, pick(PAL['hist']))
        return (R0.uniform(11, 15), R0.uniform(10, 13), 9, R0.uniform(7, 11), pick([0, 4]), 0, 1, pick(PAL['pastel']))
    if st == 'arte':
        return (R0.uniform(10, 20), R0.uniform(12, 17), 0, R0.uniform(12, 22), pick([0, 4, 8]), 1 if f < 0.7 else 0, 1 if rr < 0.7 else 0, pick(PAL['hist']))
    if st == 'paese':
        return (R0.uniform(9, 14), R0.uniform(9, 12), 5, R0.uniform(6.5, 10), pick([0, 4, 8]), 1 if rr < 0.15 else 0, 1, pick(PAL['pastel'] + PAL['hist']))
    return (12, 10, 5, 8, 4, 0, 1, 0xe0d0b0)
class Raster:
    def __init__(s, cx, cz, R):
        s.x0 = cx - R; s.z0 = cz - R; s.n = int(2 * R) + 1
        s.im = Image.new('L', (s.n, s.n), 0); s.dr = ImageDraw.Draw(s.im); s.a = None
    def line(s, P, w, v=255):
        Q = [(x - s.x0, z - s.z0) for x, z in P]; s.dr.line(Q, fill=v, width=max(1, int(round(w))))
        for q in Q: s.dr.ellipse([q[0] - w / 2, q[1] - w / 2, q[0] + w / 2, q[1] + w / 2], fill=v)
    def poly(s, P, v=255): s.dr.polygon([(x - s.x0, z - s.z0) for x, z in P], fill=v)
    def arr(s): s.a = np.asarray(s.im); return s.a
    def free(s, P):
        P = np.array(P); mn = P.min(0); mx = P.max(0)
        i0, j0 = int(mn[1] - s.z0), int(mn[0] - s.x0); i1, j1 = int(mx[1] - s.z0) + 1, int(mx[0] - s.x0) + 1
        if i0 < 0 or j0 < 0 or i1 >= s.n or j1 >= s.n: return False
        sub = Image.new('L', (j1 - j0 + 1, i1 - i0 + 1), 0); ImageDraw.Draw(sub).polygon([(x - s.x0 - j0, z - s.z0 - i0) for x, z in P], fill=1)
        m = np.asarray(sub).astype(bool); blk = np.asarray(s.im.crop((j0, i0, j1 + 1, i1 + 1)))
        return not (blk[m] > 0).any()
def roads_near(cx, cz, R):
    out = []
    for Rd in pieces:
        P = np.array(Rd['P'])
        if (np.abs(P[:, 0] - cx) < R).any() and (np.abs(P[:, 1] - cz) < R).any(): out.append(Rd)
    return out
def gnd_of(ring):
    P = np.array(ring); return float(hat(H, P[:, 0], P[:, 1]).min()) - 0.2
def add_bld(ring, h, kind, shop, roof, col, church=0, mh=0.0):
    blds.append([round(h, 1), int(col), round(gnd_of(ring), 2), [round(v, 2) for p in ring for v in p], church, [], mh, kind + (16 if shop else 0), roof])
def place_lots(area, rs, st, sw, center, rad, C, extra_check=None, maxn=100000):
    n0 = len(blds)
    for Rd in rs:
        if Rd['c'] <= 1 or Rd['t'] or Rd['b']: continue
        P = np.array(Rd['P']); L = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))])
        if L[-1] < 10: continue
        for side in (1, -1):
            s = R0.uniform(0, 6)
            while s < L[-1] - 4 and len(blds) - n0 < maxn:
                k = min(int(np.searchsorted(L, s, side='right')) - 1, len(P) - 2)
                t = P[k + 1] - P[k]; t = t / (np.hypot(*t) or 1); nrm = np.array([-t[1], t[0]]) * side
                pt = P[k] + t * (s - L[k])
                f = math.hypot(pt[0] - center[0], pt[1] - center[1]) / rad
                if f > 1.08: s += 15; continue
                sp_ = spec(st, f, pt[0], pt[1], C)
                if sp_ == 'ind':
                    wl, dp_, gap, hh, kind, shop, roof, col = R0.uniform(30, 60), R0.uniform(22, 42), 8, R0.uniform(8, 15), 3, 0, 0, pick(PAL['ind'])
                    if R0.random() < 0.12: kind = 5; hh = R0.uniform(5, 7)
                else: wl, dp_, gap, hh, kind, shop, roof, col = sp_
                done = False
                for sc in (1.0, 0.75, 0.55):
                    w2 = wl * sc
                    if s + w2 > L[-1]: continue
                    a = pt + nrm * (Rd['w'] / 2 + sw + 1.0 + gap * 0.3); b = a + t * w2; c = b + nrm * dp_; d = a + nrm * dp_
                    ring = [tuple(a), tuple(b), tuple(c), tuple(d)]
                    if side < 0: ring = [tuple(b), tuple(a), tuple(d), tuple(c)]
                    chk = ring if not gap else [tuple(np.array(p) + (np.array(p) - (a + b + c + d) / 4) / np.hypot(*(np.array(p) - (a + b + c + d) / 4)) * gap * 0.5) for p in ring]
                    if not area.free(chk): continue
                    mid = (a + c) / 2
                    if waterdist[gidx(*mid)] < 6 or slope_at(*mid) > 0.3: continue
                    if extra_check and not extra_check(mid): continue
                    area.poly(chk); add_bld(ring, hh if kind != 2 else max(hh, 40), kind, shop and hh > 6, roof if (roof != 1 or w2 < 40) else 0, col)
                    if sp_ == 'ind' and R0.random() < 0.18: lms.append(['chim', round(float(mid[0]), 1), round(float(mid[1]), 1), round(float(R0.uniform(30, 65)), 1), round(gnd_of(ring), 1)])
                    s += w2 + (gap if gap else R0.uniform(0, 0.4)); done = True; break
                if not done: s += 4
    return len(blds) - n0
allv = np.array([p for Rd in pieces for p in Rd['P']]); roadtree = cKDTree(allv)
def shrink(poly, d):
    P = np.array(poly); c = P.mean(0); out = []
    for p in P: v = p - c; l = np.hypot(*v); out.append(tuple(c + v * max(0.1, (l - d)) / l))
    return out
def grid_cell(C, i, j):
    ks = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
    if all(k in C['nodes'] for k in ks): return [C['nodes'][k] for k in ks]
    return None
def church(x, z, rot, w, l, h):
    lms.append(['church', round(x, 1), round(z, 1), round(rot, 3), round(w, 1), round(l, 1), round(h, 1), round(float(hat(H, [x], [z])[0]) - 0.3, 2)])
def city_build(C):
    st = C['st']; cx, cz, r = C['u'], C['v'], C['r']; RR = r * 1.25 + 60
    occ = Raster(cx, cz, RR); carr = Raster(cx, cz, RR)
    rs = roads_near(cx, cz, RR)
    sw = 1.8 if st in ('borgo',) else 3.2 if st not in ('alpino',) else 2.5
    for Rd in rs:
        occ.line(Rd['P'], Rd['w'] + 2 * sw + (30 if Rd['c'] == 0 else 0)); carr.line(Rd['P'], Rd['w'])
    # acqua bloccata
    ii0, jj0 = int((cz - RR) / STEP), int((cx - RR) / STEP)
    for i in range(max(0, ii0), min(N, ii0 + int(2 * RR / STEP) + 2)):
        for j in range(max(0, jj0), min(N, jj0 + int(2 * RR / STEP) + 2)):
            if WATER[i, j] or waterdist[i, j] < 12: occ.dr.rectangle([j * STEP - occ.x0 - 10, i * STEP - occ.z0 - 10, j * STEP - occ.x0 + 10, i * STEP - occ.z0 + 10], fill=255)
    for (p, r_) in islands:
        if math.dist(p, (cx, cz)) < RR: occ.dr.ellipse([p[0] - occ.x0 - r_ - 5, p[1] - occ.z0 - r_ - 5, p[0] - occ.x0 + r_ + 5, p[1] - occ.z0 + r_ + 5], fill=255)
    rot = C.get('rot', 0)
    # piazza centrale (e Duomo per la città d'arte)
    pz = grid_cell(C, 0, 0)
    if pz and st not in ('alpino',):
        inner = shrink(pz, (7 if st != 'borgo' else 5) * 1.41); occ.poly(inner); areas.append([1, inner])
        m = np.mean(np.array(inner), 0)
        if st == 'borgo': lms.append(['tower', round(m[0], 1), round(m[1], 1), 34.0, 7.5, round(float(hat(H, [m[0]], [m[1]])[0]) - 0.3, 2)])
        elif st == 'arte':
            dc = grid_cell(C, 0, -1)
            if dc:
                dm = np.mean(np.array(dc), 0); ex = np.array([math.cos(rot), math.sin(rot)]); ez = np.array([-math.sin(rot), math.cos(rot)])
                L2, W2, TW, TL = 26, 9.5, 17, 6
                loc = [(-L2, -W2), (6, -W2), (6, -TW), (6 + 2 * TL, -TW), (6 + 2 * TL, -W2), (L2, -W2), (L2, W2), (6 + 2 * TL, W2), (6 + 2 * TL, TW), (6, TW), (6, W2), (-L2, W2)]
                ring = [tuple(dm + ex * a + ez * b) for a, b in loc]
                occ.poly(shrink(dc, 6)); lms.append(['duomo', [round(v, 1) for p in ring for v in p], round(gnd_of(ring), 2)])
        else:
            sz = min(np.hypot(*(np.array(inner[1]) - inner[0])), np.hypot(*(np.array(inner[2]) - inner[1])))
            lms.append(['monu', round(m[0], 1), round(m[1], 1), round(rot, 3), round(sz * 0.62, 1), round(float(hat(H, [m[0]], [m[1]])[0]), 2)])
    if st in ('alpino', 'lago2', 'lago', 'terme', 'porto', 'lido'):
        c2 = grid_cell(C, -1, 0) or grid_cell(C, 0, -1)
        if c2:
            m = np.mean(np.array(c2), 0); occ.poly(shrink(c2, 9)); church(m[0], m[1], rot, 14, 30, 13)
    # parchi
    cells = [(i, j) for (i, j) in C['nodes'] if (i, j) != (0, 0) and abs(i) + abs(j) > 1]
    R0.shuffle(cells); npk = {'capitale': 9, 'porto': 3, 'lido': 2, 'lago': 2, 'terme': 3, 'industria': 2, 'arte': 2}.get(st, 1)
    for (i, j) in cells:
        if npk <= 0: break
        cl = grid_cell(C, i, j)
        if not cl: continue
        inner = shrink(cl, 8 * 1.41)
        if not occ.free(inner): continue
        occ.poly(inner); areas.append([0, inner]); npk -= 1
        P = np.array(inner); mn, mx = P.min(0), P.max(0)
        ar = abs((P[1] - P[0])[0] * (P[3] - P[0])[1] - (P[1] - P[0])[1] * (P[3] - P[0])[0])
        for q in range(int(ar / 140)):
            p = mn + R0.random(2) * (mx - mn)
            if Path(inner).contains_point(p): trees.append((p[0], p[1]))
    # alberi dei viali
    occ.arr(); ca = carr.arr()
    for Rd in rs:
        if Rd['c'] != 4 or Rd['b']: continue
        P = np.array(Rd['P']); L = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))])
        for s in np.arange(5, L[-1], 11):
            k = min(int(np.searchsorted(L, s, side='right')) - 1, len(P) - 2); t = P[k + 1] - P[k]; t /= (np.hypot(*t) or 1); nr = np.array([-t[1], t[0]])
            for sd in (1, -1):
                p = P[k] + t * (s - L[k]) + nr * sd * (Rd['w'] / 2 + 1.6); jj, ii = int(p[0] - carr.x0), int(p[1] - carr.z0)
                if 0 <= ii < carr.n and 0 <= jj < carr.n and ca[ii, jj] == 0 and math.hypot(p[0] - cx, p[1] - cz) < r: trees.append((p[0], p[1]))
    n = place_lots(occ, rs, st, sw, (cx, cz), r, C)
    if st in ('capitale', 'industria', 'porto'):
        ang = {'capitale': 0.1, 'industria': 0.6, 'porto': 1.57}[st]
        zc = (cx + math.cos(ang) * r * 0.8, cz + math.sin(ang) * r * 0.8) if st != 'porto' else ((PORT[0] + PORT[1]) / 2, PORT[2] - 150)
        lms.append(['smog', round(zc[0], 1), round(zc[1], 1), round(r * 0.55 if st != 'porto' else 420, 1)])
    return n
from matplotlib.path import Path
for C in cities:
    n = city_build(C); log('edifici', C['n'], n)
for vv in villages:
    cx, cz = vv['u'], vv['v']; occ = Raster(cx, cz, 320)
    rs = roads_near(cx, cz, 320)
    for Rd in rs: occ.line(Rd['P'], Rd['w'] + 5)
    R = vv['road']; P = R['P']; k = vv['k']; d = np.array(P[k + 1]) - np.array(P[k - 1]); d /= np.hypot(*d); nr = np.array([-d[1], d[0]])
    cpos = np.array(P[k]) + nr * 22 + d * 25; rotc = math.atan2(d[1], d[0])
    chk = [tuple(cpos + d * a + nr * b) for a, b in ((-18, -9), (18, -9), (18, 9), (-18, 9))]
    if occ.free(chk): occ.poly(chk); church(cpos[0], cpos[1], rotc, 11, 24, 10)
    n = place_lots(occ, rs, vv['st'], 3, (cx, cz), 230, vv, maxn=55)
log('paesi costruiti', len(blds))
for f in farms:
    a = np.array([f['u'], f['v']]); d = f['d']; t = np.array([-d[1], d[0]])
    def rect(c, w, l, dd, tt): return [tuple(c + tt * -w / 2 + dd * -l / 2), tuple(c + tt * w / 2 + dd * -l / 2), tuple(c + tt * w / 2 + dd * l / 2), tuple(c + tt * -w / 2 + dd * l / 2)]
    if f['alp']:
        add_bld(rect(a + d * 9, 11, 9, d, t), 7.5, 7, 0, 2, 0xffffff)
    else:
        add_bld(rect(a + d * 10 - t * 9, 14, 10, d, t), 8.5, pick([4, 0, 8]), 0, 1, pick(PAL['pastel'] + PAL['hist']))
        add_bld(rect(a + d * 12 + t * 14, 22, 12, d, t), 7.0, 7, 0, 2, 0xe8d8c0)
    for tr in range(30):
        p = a + d * R0.uniform(50, 110) + t * R0.uniform(-80, 80)
        if waterdist[gidx(*p)] > 40 and roadtree.query(p)[0] > 30 and slope_at(*p) < 0.15 and hwtree.query(p)[0] > 60:
            lms.append(['cows', round(p[0], 1), round(p[1], 1), int(R0.integers(3, 8)), round(float(hat(H, [p[0]], [p[1]])[0]), 2)]); break
log('cascine costruite', len(blds))
# filari di alberi lungo le statali di pianura
for Rd in pieces:
    if Rd['tag'] != 'stat' or Rd['b'] or Rd['t']: continue
    P = np.array(Rd['P']); L = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))])
    s = 0
    while s < L[-1]:
        run = R0.uniform(150, 400)
        if R0.random() < 0.35:
            sd = 1 if R0.random() < 0.5 else -1
            for q in np.arange(s, min(L[-1], s + run), 12):
                k = min(int(np.searchsorted(L, q, side='right')) - 1, len(P) - 2); t = P[k + 1] - P[k]; t /= (np.hypot(*t) or 1)
                p = P[k] + t * (q - L[k]) + np.array([-t[1], t[0]]) * sd * (Rd['w'] / 2 + 3.5)
                if H[gidx(*p)] < 550 and waterdist[gidx(*p)] > 15 and all(math.hypot(p[0] - C['u'], p[1] - C['v']) > C['r'] for C in cities) and roadtree.query(p)[0] > Rd['w'] / 2 + 2.5:
                    trees.append((p[0], p[1]))
        s += run + R0.uniform(100, 300)
log('alberi', len(trees))
if 'dbg' in sys.argv:
    from dbg import draw
    polys = [[(b[3][q], b[3][q + 1]) for q in range(0, len(b[3]), 2)] for b in blds]
    for nm, box in (('val', (9000, 9600, 13000, 13400)), ('pie', (8800, 2800, 10800, 4400)), ('rav', (6200, 8400, 8400, 10600))):
        draw(H, pieces, cities, '/tmp/c_%s.png' % nm, WATER, polys, box)
# ------------------------------------------------------------------ porto, spiagge, barche
pu0, pu1, pv0 = PORT
coastv = vcoast(np.array([pu0, pu1]))
lms.append(['quay', [round(v, 1) for p in [(pu0, float(vcoast(pu0)) + 40), (pu0, pv0), (pu1, pv0), (pu1, float(vcoast(pu1)) + 40)] for v in p], 2.3])
for k, x in enumerate(np.linspace(pu0 + 90, pu1 - 120, 3)):
    lms.append(['ship', round(float(x), 1), round(pv0 + 95 + k % 2 * 120, 1), round(math.pi / 2 + 0.02 * k, 3), round(float(R0.uniform(90, 140)), 1), k % 3])
lms.append(['ship', round(pu1 + 900, 1), round(float(vcoast(pu1 + 900)) + 900, 1), 0.3, 160.0, 1])
lms.append(['ship', round(pu0 - 1400, 1), round(float(vcoast(pu0 - 1400)) + 1300, 1), 2.8, 120.0, 0])
for x in np.linspace(pu0 + 60, pu1 - 60, 4): lms.append(['crane', round(float(x), 1), round(pv0 - 14, 1), 0.0, 2.3])
# ombrelloni a Lido Serena
um = []
CL = CN['Lido Serena']
for x in np.arange(CL['u'] - 1300, CL['u'] + 1300, 7.0):
    zc = float(vcoast(x))
    for zz in np.arange(zc - 70, zc - 12, 8.0):
        i, j = gidx(x, zz)
        if 0.6 < H[i, j] < 4.5 and 15 < waterdist[i, j] < 70 and roadtree.query((x, zz))[0] > 14: um.append((round(float(x), 1), round(float(zz), 1)))
lms.append(['umbr', [v for p in um for v in p]])
# barche: lago e mare
for q in range(9):
    t = 0.12 + 0.76 * q / 8; c = LA + (LB - LA) * t; w = 560 + 140 * math.sin(t * 9) + 90 * math.sin(t * 23 + 1)
    lms.append(['boat', round(float(c[0]), 1), round(float(c[1]), 1), round(w * 0.45, 1), round(float(R0.uniform(120, 300)), 1), round(float(R0.uniform(0, 6.28)), 2), round(float(R0.uniform(0.012, 0.03)), 4), q % 2, LV])
for q in range(10):
    x = float(R0.uniform(2000, 20000)); zc = float(vcoast(x))
    lms.append(['boat', round(x, 1), round(zc + R0.uniform(500, 1400), 1), round(float(R0.uniform(150, 400)), 1), round(float(R0.uniform(80, 250)), 1), round(float(R0.uniform(0, 6.28)), 2), round(float(R0.uniform(0.008, 0.02)), 4), 1 if q % 3 else 0, 0.0])
for (p, r_) in islands: lms.append(['island', round(p[0], 2), round(p[1], 2), round(r_, 2), round(float(hat(H, [p[0]], [p[1]])[0]), 2)])
for (p, rot) in tls: lms.append(['tl', round(p[0], 2), round(p[1], 2), round(rot, 4)])
# ------------------------------------------------------------------ cartelli: autostrada, raccordi, statali; cartelloni pubblicitari
def kmtxt(m): return ('%d km' % round(m / 1000)) if m >= 1500 else ('%d m' % (round(m / 100) * 100))
EX = sorted(exinfo)
for i in sa_done:
    nmx = [f[3] for f in FUEL if f[4] == 'hw'][sa_done.index(i) * 2].replace('Area di servizio ', '')
    for car, sg in ((CA, 1), (CB, -1)):
        for back, kind in ((110, 'hw1'), (45, 'hw2')):
            k = (i - sg * back) % NHW; d = hw_dir(k) * sg; rr = np.array([-d[1], d[0]]); p = car[k] + rr * 8.4
            lms.append(['sign', round(p[0], 1), round(p[1], 1), round(math.atan2(d[1], d[0]), 4), kind, ['AREA DI SERVIZIO', nmx, kmtxt(back * 10 - 300) if kind == 'hw1' else '']])
for i, nm in EX:
    for car, sg in ((CA, 1), (CB, -1)):
        for back, kind in ((95, 'hw1'), (32, 'hw2')):
            k = (i - sg * back) % NHW; d = hw_dir(k) * sg; rr = np.array([-d[1], d[0]]); p = car[k] + rr * 8.4
            lms.append(['sign', round(p[0], 1), round(p[1], 1), round(math.atan2(d[1], d[0]), 4), kind, ['USCITA', nm, kmtxt(back * 10 - 250) if kind == 'hw1' else '']])
        # dopo lo svincolo: prossime uscite e distanze
        k = (i + sg * 45) % NHW; d = hw_dir(k) * sg; rr = np.array([-d[1], d[0]]); p = car[k] + rr * 8.4
        nxt = []
        for step in range(1, len(EX)):
            j, n2 = EX[(EX.index((i, nm)) + sg * step) % len(EX)]
            dist = ((j - i) * sg) % NHW * 10.0
            if n2 != nm and n2 not in [x[0] for x in nxt]: nxt.append((n2, dist))
            if len(nxt) == 3: break
        lms.append(['sign', round(p[0], 1), round(p[1], 1), round(math.atan2(d[1], d[0]), 4), 'hwd', [n2 + '  ' + kmtxt(dd) for n2, dd in nxt]])
for R in statali:
    P = R['P']
    if len(P) < 12: continue
    if R['tag'] == 'link':
        a = np.array(P[-5]); b = np.array(P[-6]); d = (b - a) / np.hypot(*(b - a)); rr = np.array([-d[1], d[0]]); p = a + rr * (R['w'] / 2 + 2.2)
        lms.append(['sign', round(p[0], 1), round(p[1], 1), round(math.atan2(d[1], d[0]), 4), 'a1', ['A1', 'Autostrada']])
        continue
    for end, nb in ((0, 1), (-1, -1)):
        k = 5 if end == 0 else len(P) - 6; a = np.array(P[k]); b = np.array(P[k + nb]); d = (b - a) / np.hypot(*(b - a)); rr = np.array([-d[1], d[0]]); p = a + rr * (R['w'] / 2 + 2.2)
        far = P[-1] if end == 0 else P[0]; tgt = min(cities, key=lambda C: math.dist((C['u'], C['v']), far))
        L = float(np.hypot(*np.diff(np.array(P), axis=0).T).sum())
        lms.append(['sign', round(p[0], 1), round(p[1], 1), round(math.atan2(d[1], d[0]), 4), 'st', [tgt['n'], kmtxt(L)]])
ADS = 12; nb_ = 0
for R in statali:
    P = np.array(R['P'])
    for k in range(30, len(P) - 30, 90):
        if R0.random() < 0.45: continue
        a = P[k]; d = P[k + 1] - P[k - 1]; d /= np.hypot(*d); sd = 1 if R0.random() < 0.5 else -1; rr = np.array([-d[1], d[0]]) * sd; p = a + rr * (R['w'] / 2 + 9)
        if waterdist[gidx(*p)] < 20 or roadtree.query(p)[0] < 7 or hwtree.query(p)[0] < 25 or any(math.dist(p, (C['u'], C['v'])) < C['r'] * 0.9 for C in cities): continue
        lms.append(['bill', round(p[0], 1), round(p[1], 1), round(math.atan2(rr[1], rr[0]), 4), int(R0.integers(0, ADS)), round(float(hat(H, [p[0]], [p[1]])[0]), 2)]); nb_ += 1
for k in range(0, NHW, 160):
    sd = 1 if (k // 160) % 2 else -1; d = hw_dir(k); rr = np.array([-d[1], d[0]]) * sd; p = HC[k] + rr * 32
    if waterdist[gidx(*p)] < 20 or roadtree.query(p)[0] < 12: continue
    lms.append(['bill', round(p[0], 1), round(p[1], 1), round(math.atan2(-rr[1], -rr[0]) + math.pi, 4), int(R0.integers(0, ADS)), round(float(hat(H, [p[0]], [p[1]])[0]), 2)]); nb_ += 1
log('cartelli', sum(1 for L in lms if L[0] == 'sign'), 'cartelloni', nb_)
log('extra', len(lms))
# ------------------------------------------------------------------ acque: lago e mare come poligoni
from skimage import measure
def water_poly(mask):
    m = np.pad(mask.astype(float), 1, mode='edge')
    cs = measure.find_contours(m, 0.5); c = max(cs, key=len)
    P = np.array([((j - 1) * STEP, (i - 1) * STEP) for i, j in c]); h2 = len(P) // 2; P = np.vstack([dp(P[:h2 + 1], 5.0)[:-1], dp(P[h2:], 5.0)[:-1]])
    return [tuple(p) for p in P]
lake_ring = water_poly(LAKE | ((H < LV + 0.7) & (DAX < WL + 80)))
sea_ring = water_poly(H < 0.7)
WM = np.zeros_like(H, np.uint8); WM[(H < LV + 0.2) & (DAX < WL + 60)] = 1; WM[H < 0.3] = 2
log('acque', len(lake_ring), len(sea_ring))
# ------------------------------------------------------------------ grafo del navigatore e uscita
W = lambda p: (p[0] + OX, p[1] + OZ)
deg = {}
for R in pieces:
    if R['c'] > 8: continue
    for i, p in enumerate(R['P']): k = K(p); deg[k] = deg.get(k, 0) + (1 if i in (0, len(R['P']) - 1) else 2)
nodes = {}; edges = []
def nid(k, p):
    if k not in nodes: nodes[k] = (len(nodes), W(p))
    return nodes[k][0]
for ri, R in enumerate(pieces):
    if R['c'] > 8: continue
    P = R['P']; last = 0
    for i in range(1, len(P)):
        k = K(P[i])
        if i == len(P) - 1 or deg.get(k, 0) > 2:
            edges.append([ri, last, i, nid(K(P[last]), P[last]), nid(k, P[i]), R['o']]); last = i
log('grafo', len(nodes), len(edges))
def enc(a, st):
    q = np.round(np.asarray(a, float) * 10).astype(np.int64).reshape(-1, st); d = q.copy(); d[1:] = q[1:] - q[:-1]; return d.ravel().tolist()
def wring(ring): return [round(v, 1) for p in ring for v in W(p)]
allc = cities + villages
starts = []
for C in cities:
    best = None
    for R in C['roads']:
        P = R['P']
        for i in range(len(P) - 1):
            d = math.hypot((P[i][0] + P[i + 1][0]) / 2 - C['u'], (P[i][1] + P[i + 1][1]) / 2 - C['v'])
            if math.dist(P[i], P[i + 1]) > 8 and (best is None or d < best[0]) and d > 40: best = (d, P[i], P[i + 1])
    if best:
        _, a, b = best; off = 1.8; t = np.array(b) - a; t /= np.hypot(*t); p = np.array(a) + np.array([-t[1], t[0]]) * off
        starts.append([C['n'], round(p[0] + OX, 1), round(p[1] + OZ, 1), round(math.atan2(-t[1], t[0]), 4)])
if HOME:
    ha = np.array([math.cos(HOME['a']), math.sin(HOME['a'])]); hp = np.array([HOME['x'], HOME['z']]) - ha * 11
    starts.insert(0, ['Casa di Guido', round(hp[0] + OX, 1), round(hp[1] + OZ, 1), round(math.atan2(-ha[1], ha[0]), 4)])
out = {'meta': {'S': 1, 'SV': 1, 'OX': OX, 'OZ': OZ, 'grid': [OX, OZ, STEP, N, N], 'enc': 1, 'nation': 'Ornavia',
                'cities': [{'n': C['n'], 'lon': 0, 'lat': 0, 'wx': C['u'] + OX, 'wz': C['v'] + OZ, 'R': C['r'] * 1.15, 'r1': C['r'] * 1.15, 'st': C['st'], 'v': 1 if C in villages else 0} for C in allc],
                'rho': [0, 20], 'rstep': 20, 'full': 1},
       'roads': [[R['c'], R['o'], round(R['w'], 1), R['ms'], R['n'], R['r'], R['b'], R['t'], enc([v for p, hh in zip(R['P'], R['h']) for v in (W(p)[0], W(p)[1], float(hh))], 3)] for R in pieces],
       'lakes': [['Lago di Ravenzo', LV, enc(wring(lake_ring), 2), []], ['Mare di Ornavia', 0.0, enc(wring(sea_ring), 2), []]],
       'rivers': [[24, 'Fiume Orna', enc([v for p in RIV for v in W(p)], 2)]],
       'blds': [[b[0], b[1], b[2], enc([v + (OX if q % 2 == 0 else OZ) for q, v in enumerate(b[3])], 2), b[4], [], b[6], b[7], b[8]] for b in blds],
       'areas': [[a[0], enc(wring(a[1]), 2)] for a in areas], 'places': [[C['n'], 0 if C in cities else 2, round(C['u'] + OX, 1), round(C['v'] + OZ, 1), 50000 if C in cities else 800, 1] for C in allc],
       'trees': [], 'rails': [], 'lms': [],
       'nodes': enc([v for k, (i, p) in sorted(nodes.items(), key=lambda t: t[1][0]) for v in p], 2), 'edges': edges, 'starts': starts}
FT = cKDTree([(f[0], f[1]) for f in FUEL]) if FUEL else None
if FT is not None: trees = [p for p in trees if FT.query(p)[0] > 45]
if HOME: trees = [p for p in trees if math.hypot(p[0] - HOME['x'], p[1] - HOME['z']) > 95]
tr = np.array([W(p) for p in trees]); tr = tr[np.lexsort((tr[:, 0], tr[:, 1] // 200))]; out['trees'] = enc(tr.ravel(), 2)
def wl(L):
    k = L[0]
    if k in ('monu', 'tower', 'chim', 'ship', 'crane', 'cows', 'church', 'smog', 'boat', 'island', 'tl', 'sign', 'bill'):
        L = list(L); L[1] = round(L[1] + OX, 1); L[2] = round(L[2] + OZ, 1); return L
    if k == 'duomo': return [k, [round(v + (OX if q % 2 == 0 else OZ), 1) for q, v in enumerate(L[1])], L[2]]
    if k in ('quay',): return [k, [round(v + (OX if q % 2 == 0 else OZ), 1) for q, v in enumerate(L[1])], L[2]]
    if k == 'umbr': return [k, [round(v + (OX if q % 2 == 0 else OZ), 1) for q, v in enumerate(L[1])]]
    return L
out['lms'] = [wl(L) for L in lms]
if HOME: out['meta']['home'] = {'x': round(HOME['x'] + OX, 2), 'z': round(HOME['z'] + OZ, 2), 'a': round(HOME['a'], 5), 'h': round(HOME['h'], 2)}
out['lms'] += [['fuel', round(x + OX, 1), round(z + OZ, 1), round(r, 4), nm, kd] for x, z, r, nm, kd in FUEL]
out['meta']['ring'] = [[round(CA[k][0] + OX, 1), round(CA[k][1] + OZ, 1)] for k in range(0, NHW, 150)]
k0 = NHW - 15; d0 = hw_dir(k0); out['meta']['ringStart'] = [round(CA[k0][0] + OX, 1), round(CA[k0][1] + OZ, 1), round(math.atan2(-d0[1], d0[0]), 4)]
js = json.dumps(out, separators=(',', ':')).encode()
HMq = np.clip(np.round(H * 10), -32000, 32000).astype(np.int16); hmd = np.diff(HMq.astype(np.int32), axis=1, prepend=0).astype(np.int16)
blob = {'gz': base64.b64encode(gzip.compress(js, 9)).decode(), 'hm': base64.b64encode(gzip.compress(hmd.tobytes(), 9)).decode(), 'lm': base64.b64encode(gzip.compress(WM.tobytes(), 9)).decode()}
json.dump(blob, open('ornavia.json', 'w'))
log('json %.1f MB  gz %.1f MB  hm %.1f MB' % (len(js) / 1e6, len(blob['gz']) / 1e6, len(blob['hm']) / 1e6), 'partenze', [s[0] for s in starts])
