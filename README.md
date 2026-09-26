# Barkley’s Morning: the walk

Barkley’s QR-tag page, redesigned as one continuous walk up Harper Monkey Trail.

Local preview: `node server.mjs` (or `npm start`), then open http://127.0.0.1:4383/

## What’s on the page

1. **The trailhead.** An oversized BARKLEY, then exactly three buttons: Call Carol (with her number printed on it), Text Carol, and Text Carol where I am. They work before images or JavaScript load. Barkley stands on the trail and says one thing: “oh hi. i’m friendly. you’re not carol.” There's no scroll button; the painting fills the screen and invites scrolling on its own. “More ways to reach my people” (Carol, Jeff, the vet) is on the end card.
2. **The climb.** Scrolling walks the camera up the trail. The flowered arch drifts to the centre of the frame, and through it you see Barkley and Jeff climbing the ridge, labelled “that’s jeff. he’s a little slow.” His fictional feed sits here, with the three approved posts, newest first.
3. **The top of the hill.** Stepping over the crest, the view from the top rises in and pushes the climb away. Jeff rests on a bench (“jeff needs a minute.”) while Barkley stands proudly on a rock. A single card holds six real photos as captioned prints (each linking to its post in `album.html`), a link to all 15, and “Thanks for looking out for me.” with Call/Text Carol again.

Jeff is named everywhere he appears. Barkley never moves. The environment does:
- **The living painting.** The trailhead is a real video loop: poppies sway, clouds drift and haze shimmers. A still cutout of Barkley is laid exactly on top.
- **Real depth.** The climb and the top of the hill are split into sky, land and figure planes. Scrolling walks you into the scene, and on desktop the planes lean slightly toward the mouse.
- **The sky follows the clock in Los Angeles.** It shows a dawn blush, the painted morning, crisp midday, golden hour and a sunset pink, and never goes to night. Preview any hour with `?hour=17`.
- **Sunrise on arrival.** The page opens in dawn light that warms up over about 2 s, while the letters of BARKLEY settle into place. The contacts work the whole time.
- **Text Carol where I am.** A third button asks the finder's phone for its location and adds a map link to the text. If the finder says no, or it takes longer than 9 s, the plain message goes instead.
- **Photo to album morph.** A tapped photo print grows into its place in the album (Chrome/Safari view transitions; other browsers just load the page).
- **Painted link preview.** Texting the link shows `assets/og.jpg`, a painted Barkley card, not a blank box. Note: the preview tags point at `https://jeff-parker.com/Barkley/`, so they only work once it's deployed there.

Also: clouds drift behind the name, a hawk circles far off, pollen floats in the sunlight, close poppies sway, and Barkley's speech bubble pops in once.

## Files

| File | Role |
| --- | --- |
| `index.html` | The landing page |
| `world.css` | Styles for the landing page |
| `world.js` | Scroll camera, depth planes, living-painting playback (no dependencies) |
| `touches.js` | Clock sky, sunrise, location text, photo morph |
| `album.html` + `album.css` + `app.js` | Full 15-item album and its captioned viewer |
| `assets/world/` | The walk: vista paintings plus Barkley cutouts, trailhead video loops, climb/summit sky, land and figure layers (each with a `-tall` phone version), cloud, poppies |
| `assets/og.jpg` | Link preview card |
| `sw.js`, `about.html`, `photos.html`, `offline.html` | Retire the old app: the service worker clears its caches and removes itself, and the pages redirect old links |
| `assets/icons/` | Favicon and home-screen icon (Barkley's face) |
| `build.mjs` → `dist/Barkley/`, `dist/Barkley.zip` | Deployable bundle; see `DEPLOY.md` |
| `media.json` | The 15 photos/videos and captions (unchanged) |
| `DESIGN.md` | Design rationale for this version |
| `IMAGE-BRIEF.md` | Optional new artwork to request from Codex, with specs |
| `qa/walk/` | Screenshots and checks for this version |
| `archive/social-edition/` | Everything from the previous edition: pages, CSS/JS, docs, old art, `facts.json` and old QA screenshots |

Art sources live in `../barkley-v4-art-studies/`. Codex painted `summit-walk/` (climb and top of the hill) and `depth-plates/` (clean plates with the figures removed). Gemini made `living-painting/` (the trailhead video). Every folder has its brief or notes.

Every file left outside `archive/` is used by the site, apart from the docs and `qa/walk/`.

## Reduced motion

With the OS setting on, nothing zooms, pans, sways, drifts or pops. The video never loads, there's no sunrise or letter animation, and the three places switch with a plain crossfade as you scroll. There is no on-page control. The video is also skipped when the phone's data saver is on, and it pauses once you've walked past the trailhead.

## Not done

The public QR destination (`https://jeff-parker.com/Barkley/`) has not been changed. `DEPLOY.md` has the steps. Testing used Chromium with emulated phone viewports, not a physical iPhone.
