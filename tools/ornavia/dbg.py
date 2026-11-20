from PIL import Image, ImageDraw
import numpy as np
def draw(H, roads, cities, fn, WATER, extra=None, box=None):
    gx, gz = np.gradient(H, 20); sh = np.clip(0.6 + (gx - gz) * 1.5, 0, 1)
    col = np.stack([0.45 + H / 2000, 0.6 + H / 4000, 0.35 + H / 3000], -1); col[H > 1250] = 0.95
    img = col * sh[..., None]; img[WATER] = [0.2, 0.35, 0.6]
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype('uint8')); sc = 1 / 20
    if box:
        x0, z0, x1, z1 = box; im = Image.fromarray((np.clip(img, 0, 1) * 255).astype('uint8')).crop((int(x0 / 20), int(z0 / 20), int(x1 / 20), int(z1 / 20))).resize((1000, int(1000 * (z1 - z0) / (x1 - x0))))
        sc = 1000 / (x1 - x0)
    else: x0 = z0 = 0
    d = ImageDraw.Draw(im)
    colr = {0: (255, 190, 0), 1: (255, 120, 0), 4: (255, 255, 255), 5: (240, 70, 70), 6: (200, 60, 200), 7: (230, 230, 230), 9: (200, 200, 160)}
    for R in roads:
        P = [((x - x0) * sc, (z - z0) * sc) for x, z in R['P']]
        d.line(P, fill=colr.get(R['c'], (150, 150, 150)), width=2 if R['c'] < 7 else 1)
    if extra:
        for b in extra: d.polygon([((x - x0) * sc, (z - z0) * sc) for x, z in b], fill=(120, 60, 40))
    for C in cities: d.text(((C['u'] - x0) * sc, (C['v'] - z0) * sc), C['n'], fill=(0, 0, 0))
    im.save(fn)
