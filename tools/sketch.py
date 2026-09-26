"""Makes the pencil underdrawing the arrival draws in, from the trailhead paintings.

    python tools/sketch.py

Writes assets/world/vista-sketch.webp and vista-tall-sketch.webp: grayscale "graphite darkness"
(0 = bare paper, 255 = darkest line), at 1024 px on the long side. The arrival shader uses the same
value to order the drawing: the strongest contours appear first.

Method: XDoG (extended difference of Gaussians) on a softened luminance, which reads as a pencil
drawing rather than a raw edge filter. The sky's marks are lightened so it stays mostly open paper.
Needs: pillow numpy scipy.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORLD = os.path.join(ROOT, 'assets', 'world')


def xdog(lum, sigma=1.4, k=1.6, tau=0.98, eps=0.015, phi=25):
    d = nd.gaussian_filter(lum, sigma) - tau * nd.gaussian_filter(lum, sigma * k)
    return np.clip(np.where(d >= eps, 1.0, 1 + np.tanh(phi * (d - eps))), 0, 1)


def sky_weight(depth_file, size):
    """1 on land, fading to 0.35 in the sky (depth 0), from the arrival's depth map."""
    d = np.asarray(Image.open(os.path.join(WORLD, depth_file)).convert('L').resize(size, Image.BILINEAR)) / 255
    return 0.35 + 0.65 * np.clip(d / 0.06, 0, 1)


for src, depth, out in [('vista.webp', 'vista-depth.webp', 'vista-sketch.webp'),
                        ('vista-tall.webp', 'vista-tall-depth.webp', 'vista-tall-sketch.webp')]:
    img = Image.open(os.path.join(WORLD, src)).convert('RGB')
    scale = 1024 / max(img.size)
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    lum = np.asarray(img).astype(float) @ [0.299, 0.587, 0.114] / 255
    lum = nd.gaussian_filter(nd.median_filter(lum, 5), 0.75)
    dark = (1 - xdog(lum)) * sky_weight(depth, img.size)
    Image.fromarray((np.clip(dark * 1.15, 0, 1) * 255).round().astype(np.uint8), 'L').save(
        os.path.join(WORLD, out), 'WEBP', quality=80, method=6)
    print(out, img.size, os.path.getsize(os.path.join(WORLD, out)) // 1024, 'KB')
