# Verification: the walk, with living painting, depth and touches (2026-09-25)

Checked in headless Chromium (Playwright) against `node server.mjs` on http://127.0.0.1:4383/.

| Check | Result |
| --- | --- |
| Name then Call/Text at the top | BARKLEY first; Call Carol and Text Carol are 60 px tall and end at y = 151 on a 390 × 844 phone. Nothing sits above the name. |
| Contact links | `tel:+13107292115` (hero, backup, footer); `sms:+13107292115?body=Hi%2C%20I%20found%20Barkley.%20Please%20get%20in%20touch.` (hero, footer), unchanged from before; Jeff `tel:+13107510462`; vet `tel:+13102750055`. |
| Album links | Six prints link to `album.html#post-11/5/12/10/7/8`, plus “All 15 photos & videos” to `album.html`. Clicking a print lands on the right post at both sizes, and the post opens the captioned viewer. No console errors. |
| Text Carol where I am | With permission, a simulated location at Runyon produced `sms:+13107292115?body=Hi, I found Barkley. He’s with me here: https://maps.google.com/?q=34.10563,-118.35012`. When denied, it sends the plain message. |
| Living painting | Plays `trailhead-wide.mp4` on desktop and `trailhead-tall.mp4` on phones. It pauses after scrolling past the trailhead, and with reduced motion no video is loaded at all. The Barkley cutout lines up with no seam. |
| Photo morph | Clicking a print ran a cross-document view transition into `album.html#post-5` (Chromium). |
| Clock sky | Previewed at 6:30, 9, 13, 17, 19 and 23 (`?hour=`). All stay daytime-bright. |
| Posts | Exact approved copy, newest first: lost → Jake’s lunch → morning at Runyon. |
| Reduced motion | `prefers-reduced-motion: reduce`: 0 running animations, all camera transforms `none`, scenes crossfade (vista → climb → summit) by opacity only. See `checks-output.txt`. |
| No JavaScript | Hero, feed and the top-of-the-hill card all render over the vista backdrop, and links and the details disclosure work. |
| No images | The stage gradient keeps the ink name and solid buttons legible. |
| Keyboard | Tab order: skip link → Call Carol → Text Carol → Text Carol where I am → photo prints → all photos → end-card buttons → backup contacts. Focus ring is visible on the painting. |
| Sizes | 320 × 568, 390 × 844, 768 × 1024, 844 × 390, 1024 × 768, 1440 × 900 and 1920 × 1080. No clipped name and no horizontal overflow. Buttons stay on one line at 320. |
| Scene edges | Camera scale is clamped to cover, and no painting edge appears during either transition at 390 or 1440. |
| Length | 3.4 screens at 1440 × 900 and 3.8 at 390 × 844 (down from 4.2 and 4.9). |
| Weight | About 3.2 MB transferred on first desktop load: paintings, layers and the 1.2 MB video loop. |

Not verified: physical iPhone Safari, real `tel:`/`sms:` handoff (no calls or messages were placed), and the public QR URL (not deployed).

## Screenshots

- `hero-390.png`, `hero-1440.png`: the first screen.
- `walk-phone-390.jpg`, `walk-desktop-1440.jpg`: frames through the whole scroll.
- `reduced-nojs-noimages-390.jpg`: reduced motion (4 frames), no JavaScript (2), images blocked (1).
- `album.jpg`: album page and viewer.
- `other-sizes.jpg`: 320 × 568 top and bottom, and 1440 at 5 pm golden hour.
