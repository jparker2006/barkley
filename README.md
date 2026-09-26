# Barkley’s Morning: the walk

Barkley’s QR-tag page, redesigned as one continuous walk up Harper Monkey Trail.

- **Live on Vercel:** https://barkley-one.vercel.app (every push to `main` redeploys)
- **Destination:** https://jeff-parker.com/Barkley/, where the QR tag points. See `DEPLOY.md` and `FOR-JEFF.md`.
- **Local preview:** `node server.mjs` (or `npm start`), then open http://127.0.0.1:4383/

## What’s on the page

1. **The trailhead.** An oversized BARKLEY, then exactly three buttons: Call Carol (with her number printed on it), Text Carol, and Text Carol where I am. They work before images or JavaScript load. Barkley stands on the trail and says one thing: “oh hi. i’m friendly. you’re not carol.” There's no scroll button; the painting fills the screen and invites scrolling on its own. “More ways to reach my people” (Carol, Jeff, the vet) is on the end card.
2. **The climb.** Scrolling walks the camera up the trail. The flowered arch drifts to the centre of the frame, and through it you see Barkley and Jeff climbing the ridge, labelled “that’s jeff. he’s a little slow.” His fictional feed sits here, with the three approved posts, newest first.
3. **The top of the hill.** Stepping over the crest, the view from the top rises in and pushes the climb away. Jeff rests on a bench (“jeff needs a minute.”) while Barkley stands proudly on a rock. A single card holds six real photos as captioned prints (each linking to its post in `album.html`), a link to all 15, and “Thanks for looking out for me.” with Call/Text Carol again.

**The arrival.** On the first visit of a session the trailhead paints itself in 1.8 s: bare paper, a pencil underdrawing (Barkley first), watercolor blooming out from his chest, the sky washing up last and a swell of sun. Then the painting opens into real depth, leaning with the mouse on desktop and drifting slowly on phones. BARKLEY and the three buttons are there and tappable from the first frame. It's skipped with reduced motion, data saver or no WebGL2, and after 1.2 s if the art hasn't loaded. Preview hooks: `?arrival=0.4` freezes it at that point, `?arrival=replay` plays it again, and `?arrival=off` turns it off. Spec: `specs/arrival.md`. Results: `qa/arrival/RESULTS.md`.

**Ask Barkley.** The first card after the trailhead: "ask me anything." Finders can ask things like "where do you live?" or "i found you. what do i do?" and Barkley answers in his own voice, only from `barkley-facts.md`. If he doesn't know, he says so and points them to Carol. Phone numbers and the address in answers are tappable. It runs on OpenRouter (`deepseek/deepseek-v4.1-flash`, about $0.0001 per question) through `api/ask.js`, a Vercel Function. jeff-parker.com calls the same endpoint, and CORS allows it. It needs `OPENROUTER_API_KEY` set in the Vercel project. Without the key, or if anything fails, Barkley just says to text Carol.

His voice and rules live in the prompt in `api/_barkley.js`: steps first when someone has found him, no jokes when he's hurt, never a guess about food, age or behavior, no-for-every-dog foods (chocolate, grapes…) said plainly, nothing about the household beyond the facts, honest that he's a website, and he gets the current LA time. After changing the prompt or the facts, run `node tools/ask-eval.mjs` (30 questions, including injection attempts, a forged earlier answer, Spanish and a short chat) and read the answers. To test before it goes live: `vercel deploy --prod --skip-domain`, then `node tools/ask-eval.mjs --deployment <that url>`.

**The real sky.** `sky.js` works out where the sun actually is over Harper Monkey Trail right now: dawn blush, the painted morning, golden hour and sunset happen when they happen in LA. After dusk the trailhead crossfades into Codex's night painting (moon, city lights, moonlit Barkley), the walk scenes get a moonlit wash, and BARKLEY turns cream. Live weather comes from Open-Meteo (no key needed): extra clouds, an overcast grey sky, a marine layer over the basin, or rain, and the wind speed sets how fast the poppies sway and the clouds drift. Preview any moment with `?time=19:40`, `?weather=fog|rain|overcast|cloudy|clear` and `?wind=30`.

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
| `sky.js` | Real sun position and live weather (runs in `<head>`) |
| `touches.js` | Sunrise wake-up, location text, photo morph |
| `ask.js`, `api/ask.js`, `api/_barkley.js` | Ask Barkley: the chat card, the Vercel Function, the prompt |
| `barkley-facts.md` | Everything Barkley knows. Edit it in plain English |
| `tools/ask-eval.mjs` | Puts Ask Barkley through 30 questions and checks the rules a script can check |
| `arrival.js` | The arrival and depth: one WebGL2 shader, no libraries |
| `tools/` | Asset scripts: `depth.py` (depth maps and base texture, via Depth Anything V2), `sketch.py` (pencil underdrawing), `video.sh` (trailhead loops), `night.py` (night assets) |
| `album.html` + `album.css` + `app.js` | Full 15-item album and its captioned viewer |
| `assets/world/` | The walk: vista paintings plus Barkley cutouts, trailhead video loops, climb/summit sky, land and figure layers (each with a `-tall` phone version), cloud, poppies |
| `assets/og.jpg` | Link preview card |
| `sw.js`, `about.html`, `photos.html`, `offline.html` | Retire the old app: the service worker clears its caches and removes itself, and the pages redirect old links |
| `assets/icons/` | Favicon and home-screen icon (Barkley's face) |
| `build.mjs` → `dist/Barkley/` | Deployable build (Vercel runs it too; config in `vercel.json`) |
| `DEPLOY.md`, `FOR-JEFF.md` | How it ships to jeff-parker.com, and the prompt Jeff gives his Claude Code |
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

The public QR destination (`https://jeff-parker.com/Barkley/`) has not been changed yet; `FOR-JEFF.md` has the handoff. Testing used Chromium with emulated phone viewports, not a physical iPhone.
