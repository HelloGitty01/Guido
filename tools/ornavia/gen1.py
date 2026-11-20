from terra import *
from scipy.spatial import cKDTree
def catmull(pts, closed=True, step=10.0):
    P = np.array(pts, float); n = len(P); out = []
    rngi = range(n) if closed else range(n - 1)
    for i in rngi:
        p0 = P[(i - 1) % n] if closed or i > 0 else P[0]; p1 = P[i]; p2 = P[(i + 1) % n]; p3 = P[(i + 2) % n] if closed or i + 2 < n else P[-1]
        L = np.hypot(*(p2 - p1)); k = max(2, int(L / step))
        for j in range(k):
            t = j / k; t2 = t * t; t3 = t2 * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    if not closed: out.append(P[-1])
    return np.array(out)
def resample(P, step):
    d = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))]); n = max(2, int(d[-1] / step) + 1); s = np.linspace(0, d[-1], n)
    return np.stack([np.interp(s, d, P[:, 0]), np.interp(s, d, P[:, 1])], 1)
def hat(h, x, y):  # quota del terreno (bilineare) in coordinate locali
    return ndimage.map_coordinates(h, [np.asarray(y) / STEP, np.asarray(x) / STEP], order=1, mode='nearest')
def build_terrain():
    h = make_terrain()
    # fiume Orna: dal lago al mare passando per Valdorna
    RIV = catmull([(7050, 8850), (7700, 9800), (8700, 10500), (10100, 11050), (11300, 11700), (11900, 12900), (12300, 14500), (12500, 16200), (12650, 18400)], closed=False, step=20)
    ht = ndimage.gaussian_filter1d(hat(h, RIV[:, 0], RIV[:, 1]), 6)
    bed = np.minimum.accumulate(np.minimum(ht - 2.8, np.r_[LV - 1.2, np.full(len(ht) - 1, 1e9)]))
    bed = np.minimum(bed, np.linspace(LV - 1.2, -3, len(bed)) + 400)  # solo monotonia
    tree = cKDTree(RIV); d, idx = tree.query(np.stack([U.ravel(), V.ravel()], 1), distance_upper_bound=140)
    m = np.isfinite(d); hf = h.ravel()
    hf[m] = np.minimum(hf[m], bed[idx[m]] + np.maximum(0, d[m] - 15) * 0.32)
    h = hf.reshape(h.shape)
    # porto di Porto Calvino: darsena scavata con banchine
    pu0, pu1, pv0 = 14150, 14780, 17520
    inb = (U > pu0) & (U < pu1) & (V > pv0)
    near = (U > pu0 - 90) & (U < pu1 + 90) & (V > pv0 - 90) & ~inb & (h > -2)
    h = np.where(near, np.maximum(h * 0 + 2.3, 2.3), h); h = np.where(inb, -7.0, h)
    # città: terreno più regolare
    for n, cu, cv, r, st in CITIES:
        sm = ndimage.gaussian_filter(h, 25 if st in ('alpino', 'borgo') else 40)
        dd = np.hypot(U - cu, V - cv); w = sstep(r * 1.3, r * 0.55, dd) * (h > 0.5) * (h > -1)
        if st in ('lago', 'lago2'): w = w * (h > LV + 0.3)
        hn = h * (1 - w) + sm * w
        if st in ('alpino', 'borgo', 'terme'):
            ii, jj = int(cv / STEP), int(cu / STEP); tgt = float(sm[ii, jj]); w2 = sstep(r * 1.4, r * 0.75, dd)
            hn = h * (1 - w2) + (tgt + (sm - tgt) * 0.25) * w2
        if st in ('lago', 'lago2'):
            Pq = np.stack([U, V], -1); dx_, _ = seg_dist(Pq, LA, LB); w2 = sstep(r * 1.4, r * 0.75, dd) * (h > LV + 0.3)
            hn = hn * (1 - w2) + (LV + 2.5 + 0.035 * np.maximum(0, dx_ - 560)) * w2
        if st in ('lago', 'lago2'): hn = np.where(h > LV + 0.3, np.maximum(hn, LV + 1.2), hn)
        if st in ('porto', 'lido'): hn = np.where(h > 0.5, np.maximum(hn, 1.8), hn)
        h = hn
    h = np.where(inb, -7.0, h)
    return h, RIV, bed, (pu0, pu1, pv0)
# autostrada ad anello
HWCP = [(1800, 14000), (1750, 12000), (2700, 10500), (4800, 10850), (6900, 10950), (9700, 9450), (12500, 8450), (14400, 8350), (15900, 9900), (16300, 11900), (18200, 12300), (19700, 12900), (20250, 14600), (19700, 16100), (17700, 16350), (16100, 16250), (14600, 15900), (12800, 15350), (11000, 14100), (9200, 15150), (7600, 15950), (6400, 15900), (4400, 15750), (2700, 15300)]
def highway(h):
    C = catmull(HWCP, closed=True, step=10)
    C = resample(np.vstack([C, C[:1]]), 10.0)[:-1]
    tt = hat(h, C[:, 0], C[:, 1])
    n = len(C); hp = ndimage.uniform_filter1d(np.r_[tt, tt, tt], 61)[n:2 * n]
    hp = np.maximum(hp, 3.0)
    for it in range(400):  # pendenza massima 4,5%
        g = 0.045 * 10
        a = hp.copy()
        for i in range(1, 2 * n):
            k = i % n; p = (i - 1) % n
            if a[k] > a[p] + g: a[k] = a[p] + g
            if a[k] < a[p] - g: a[k] = a[p] - g
        if np.allclose(a, hp, atol=1e-3): break
        hp = 0.5 * (a + ndimage.uniform_filter1d(np.r_[a, a, a], 9)[n:2 * n])
    return C, hp, tt
if __name__ == '__main__':
    import time; t = time.time()
    h, RIV, bed, port = build_terrain(); print('terreno', time.time() - t)
    C, hp, tt = highway(h); L = len(C) * 10
    print('autostrada km %.1f  min a 110: %.1f  ponti %d tunnel %d' % (L / 1000, L / 1000 / 110 * 60, ((hp - tt) > 6).sum(), ((tt - hp) > 9).sum()))
    np.save('/tmp/h.npy', h)
    from PIL import Image, ImageDraw
    gx, gz = np.gradient(h, 20); sh = np.clip(0.6 + (gx - gz) * 1.5, 0, 1)
    col = np.stack([0.45 + h / 2000, 0.6 + h / 4000, 0.35 + h / 3000], -1); col[h > 1250] = 0.95
    img = col * sh[..., None]
    from scipy import ndimage as nd
    P2 = np.stack([U, V], -1); dax, _ = seg_dist(P2, LA, LB); lk = (h < LV) & (dax < 1000)
    img[(h < 0.2) | lk] = [0.2, 0.35, 0.6]
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype('uint8')); d = ImageDraw.Draw(im)
    d.line([(x / 20, y / 20) for x, y in np.vstack([C, C[:1]])], fill=(255, 200, 0), width=3)
    d.line([(x / 20, y / 20) for x, y in RIV], fill=(60, 120, 255), width=2)
    for nm, cu, cv, r, st in CITIES: d.ellipse([(cu - r) / 20, (cv - r) / 20, (cu + r) / 20, (cv + r) / 20], outline=(220, 40, 40), width=2); d.text((cu / 20 - 20, cv / 20), nm, fill=(0, 0, 0))
    im.resize((900, 900)).save('/tmp/terra.png')
