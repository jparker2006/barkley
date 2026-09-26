"""Makes the arrival's assets from the trailhead clean plates (the painting without Barkley).

    python tools/depth.py [--plates ../barkley-v4-art-studies/depth-plates]

Writes assets/world/vista-base.webp and vista-tall-base.webp (the original painting, with the clean plate
swapped in only around Barkley's footprint, so the canvas matches the painting everywhere but can still see
behind him as he leans), vista-depth.webp and vista-tall-depth.webp, then prints the numbers arrival.js
needs (Barkley's ground depth and his chest, in plate fractions).

Needs: pillow numpy scipy torch transformers (run it in a throwaway venv; nothing here ships).
Depth comes from Depth Anything V2 Small, which gives relative inverse depth: bigger is nearer.
"""
import argparse, json, os
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORLD = os.path.join(ROOT, 'assets', 'world')

# Where each Barkley cutout sits on its plate, in pixels (same numbers as .plate .still-barkley in world.css).
CUTOUT = {
    'vista-wide': ('vista-barkley.webp', (882, 562)),
    'vista-tall': ('vista-tall-barkley.webp', (477, 898)),
}
OUT = {'vista-wide': 'vista', 'vista-tall': 'vista-tall'}
ORIGINAL = {'vista-wide': 'desktop/morning-desktop-anchor.png', 'vista-tall': 'mobile/morning-mobile-anchor.png'}


def sky_mask(rgb):
    """Blue, low-texture pixels connected to the top edge are sky."""
    lum = rgb.mean(-1)
    tex = nd.gaussian_filter(np.abs(nd.laplace(nd.gaussian_filter(lum, 1.0))), 3)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    candidate = (((b > g - 6) & (b > r - 10)) | (lum > 200)) & (tex < 6)
    labels, _ = nd.label(candidate)
    top = set(np.unique(labels[0])) - {0}
    return np.isin(labels, list(top))


def depth_for(pipe, rgb_img):
    d = pipe(rgb_img)['predicted_depth'].squeeze().float().cpu().numpy()
    if d.shape != (rgb_img.height, rgb_img.width):
        d = np.asarray(Image.fromarray(d).resize(rgb_img.size, Image.BICUBIC))
    return d


def main():
    ap = argparse.ArgumentParser()
    studies = os.path.join(ROOT, '..', 'barkley-v4-art-studies')
    ap.add_argument('--plates', default=os.path.join(studies, 'depth-plates'))
    ap.add_argument('--originals', default=os.path.join(studies, 'morning-expansion'))
    args = ap.parse_args()

    from transformers import pipeline
    import torch
    device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf', device=device)

    report = {}
    for name, out in OUT.items():
        img = Image.open(os.path.join(args.plates, f'{name}-clean.png')).convert('RGB')
        rgb = np.asarray(img).astype(float)

        d = depth_for(pipe, img)
        lo, hi = np.percentile(d, 1), np.percentile(d, 99.7)
        d = np.clip((d - lo) / (hi - lo), 0, 1)
        d[sky_mask(rgb)] = 0
        d = nd.median_filter(d, 5)
        d = nd.grey_dilation(d, size=(13, 13))  # ~6 px: near silhouettes grow so they never tear
        d = nd.gaussian_filter(d, 2.0)
        dep = Image.fromarray((d * 255).round().astype(np.uint8), 'L')
        dep.resize((img.width // 2, img.height // 2), Image.LANCZOS).save(
            os.path.join(WORLD, f'{out}-depth.webp'), 'WEBP', quality=90, method=6)

        # Barkley: ground depth under his paws, and his chest (alpha centroid of the dog, not the shadow).
        file, (x0, y0) = CUTOUT[name]
        cut = np.asarray(Image.open(os.path.join(WORLD, file)).convert('RGBA')).astype(float)
        a = cut[..., 3] / 255

        # Base texture: the original painting, with the clean plate only in a feathered zone around his footprint.
        original = np.asarray(Image.open(os.path.join(args.originals, ORIGINAL[name])).convert('RGB')).astype(float)
        zone = np.zeros(rgb.shape[:2])
        zone[y0:y0 + a.shape[0], x0:x0 + a.shape[1]] = a > 0.03
        zone = nd.gaussian_filter(nd.binary_dilation(zone > 0, iterations=18).astype(float), 5)[..., None]
        base = original * (1 - zone) + rgb * zone
        Image.fromarray(base.round().clip(0, 255).astype(np.uint8)).save(
            os.path.join(WORLD, f'{out}-base.webp'), 'WEBP', quality=82, method=6)
        white = (cut[..., :3].min(-1) > 175) & (a > .5)          # fur, not the shadow on the trail
        ys, xs = np.nonzero(white)
        paw_y = np.percentile(ys, 99)
        paws = (ys > paw_y - 12)
        ground = [d[min(int(y0 + y + 6), img.height - 1), int(x0 + x)] for y, x in zip(ys[paws], xs[paws])]
        cy, cx = ys.mean(), xs.mean()
        report[out] = {
            'barkleyDepth': round(float(np.median(ground)), 3),
            'chest': [round((x0 + cx) / img.width, 4), round((y0 + cy) / img.height, 4)],
            'cutout': [round(x0 / img.width, 4), round(y0 / img.height, 4),
                       round(cut.shape[1] / img.width, 4), round(cut.shape[0] / img.height, 4)],
        }
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
