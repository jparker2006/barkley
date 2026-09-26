"""Makes the night trailhead assets from Codex's night paintings (../barkley-v4-art-studies/night/).

    python tools/night.py

Writes, for wide ("vista") and tall ("vista-tall"):
  assets/world/<name>-night.webp         the night painting (with Barkley), for the page itself
  assets/world/<name>-night-base.webp    the night painting with the clean plate only around Barkley (arrival/depth)
  assets/world/<name>-night-barkley.webp moonlit Barkley, cut out in exactly the same frame as the day cutout
The night paintings sit ~1 px right of the day ones; they're shifted back so day and night crossfade cleanly.
Needs: pillow numpy scipy.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORLD = os.path.join(ROOT, 'assets', 'world')
NIGHT = os.path.join(ROOT, '..', 'barkley-v4-art-studies', 'night')

JOBS = {  # name: (codex file stem, day cutout, its top-left on the plate in px, box to search for Barkley)
    'vista': ('night-wide', 'vista-barkley.webp', (882, 562)),
    'vista-tall': ('night-tall', 'vista-tall-barkley.webp', (477, 898)),
}
SHIFT_X = -1


def load(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(float)
    return np.roll(a, SHIFT_X, axis=1) if SHIFT_X else a


def save(arr, name, q=82, mode='RGB'):
    Image.fromarray(arr.round().clip(0, 255).astype(np.uint8), mode).save(os.path.join(WORLD, name), 'WEBP', quality=q, method=6)
    print(name, os.path.getsize(os.path.join(WORLD, name)) // 1024, 'KB')


for name, (stem, day_cut, (x0, y0)) in JOBS.items():
    night = load(os.path.join(NIGHT, f'{stem}.png'))
    clean = load(os.path.join(NIGHT, f'{stem}-clean.png'))
    save(night, f'{name}-night.webp', 80)

    # Barkley = where the night painting differs from its clean plate, inside the day cutout's frame.
    cw, ch = Image.open(os.path.join(WORLD, day_cut)).size
    day_alpha = np.asarray(Image.open(os.path.join(WORLD, day_cut)).convert('RGBA'))[..., 3] / 255
    region = (slice(y0, y0 + ch), slice(x0, x0 + cw))
    diff = np.sqrt(((nd.gaussian_filter(night[region], (1.5, 1.5, 0)) - nd.gaussian_filter(clean[region], (1.5, 1.5, 0))) ** 2).sum(-1))
    m = diff > 34
    m = nd.binary_opening(m, iterations=2)
    m = nd.binary_closing(m, iterations=6)
    m = nd.binary_fill_holes(m)
    lab, n = nd.label(m)
    if n:
        sizes = nd.sum(m, lab, range(1, n + 1))
        m = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 0.02 * sizes.max()])
    m = nd.binary_dilation(m | (day_alpha > 0.5), iterations=2)   # never smaller than the day dog
    alpha = nd.gaussian_filter(m.astype(float), 2.2)
    save(np.dstack([night[region], alpha * 255]), f'{name}-night-barkley.webp', 88, 'RGBA')

    # Base for the canvas: the night painting, with the clean plate swapped in around Barkley's footprint.
    zone = np.zeros(night.shape[:2])
    zone[region] = alpha > 0.03
    zone = nd.gaussian_filter(nd.binary_dilation(zone > 0, iterations=18).astype(float), 5)[..., None]
    save(night * (1 - zone) + clean * zone, f'{name}-night-base.webp', 82)
