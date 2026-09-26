# Spec: the arrival (the painting paints itself, then opens into depth)

Status: approved by Jake, 2026-09-25. Build it, verify it, ship it to the Vercel site.

## The moment

When someone opens Barkley's page, the trailhead paints itself in about 1.8 seconds:

1. **Paper.** The first frame is warm cream paper. BARKLEY and the three buttons are already there, fully usable.
2. **Pencil.** A graphite underdrawing of the trailhead draws in. The strong contours (skyline, trail edges, arch, Barkley's outline) come first, then finer marks.
3. **Color bloom.** Watercolor pigment blooms outward from Barkley across the hills. A beat later, smaller blooms start at the arch and the poppies. The sky washes in last, rising from the horizon. The bloom's front has a wet, darker rim, and color behind it "dries" up to full strength.
4. **Sun.** A warm light swells from the top-right, where the painting's sun is, and settles into the existing sunlight layer.
5. **Depth.** The camera settles forward into the scene, and it becomes three-dimensional: near poppies slide past far hills and the city sits way back. Then the painting stays alive. The trailhead video keeps looping, and the depth follows the mouse on desktop and drifts slowly on phones.

Barkley never deforms. He is painted in with everything else, and in depth he moves only as one flat, rigid layer standing on the trail.

## Hard rules

These come from the page's real job: someone who found Barkley has to reach Carol immediately.

- **Buttons first.** From the very first frame, the h1 and the three hero buttons are visible and clickable, with unchanged `href`s. Nothing covers them, and nothing waits on JavaScript, WebGL or images.
- **No loading screen.** The arrival starts once its textures are ready. If they aren't ready 1200 ms after first paint, skip the arrival: fade the plain painting in over 300 ms, and start depth later once it's ready.
- **Short.** The whole arrival takes at most 2.0 s from when its textures are ready.
- **When it plays.** Only on the first page view in a browser session (`sessionStorage`); later views in the same session start at the finished state. Never with `prefers-reduced-motion: reduce`, never with `navigator.connection.saveData`, and never without WebGL2. Those visitors get exactly today's page, including today's reduced-motion behavior.
- **Rest state.** Once the arrival has finished and the pointer is centred, the render matches today's flat composition. The scroll camera's landmarks (`ARCH` in `world.js`), the Barkley cutout's placement and the later scenes must all keep working unchanged.
- **Design rules.** No night, no sparkles, no lens-flare rings, no new fantasy. It's the same sunlit morning, being painted.
- **Budget.** At most 900 KB of extra first-load bytes. The new JavaScript is at most 20 KB unminified, with no libraries (vanilla WebGL2), consistent with the rest of the site.
- **Rendering cost.** Render only when needed: during the arrival, when the pointer moves, and on new video frames (`requestVideoFrameCallback`, with a fallback). Stop entirely once the vista is scrolled past (`stage.is-past-vista`) or the tab is hidden. Cap the device pixel ratio at 2.

## Assets to make

Sources:
- Clean plates (the trailhead without Barkley), registered to the painting: `../barkley-v4-art-studies/depth-plates/vista-wide-clean.png` (1536×1024) and `vista-tall-clean.png` (1024×1536).
- Barkley cutouts already on the site: `assets/world/vista-barkley.webp` and `vista-tall-barkley.webp`, placed by `.plate .still-barkley` in `world.css`.

Make these, with a script in `tools/` so they're reproducible:

1. `assets/world/vista-clean.webp` and `vista-tall-clean.webp`: the clean plates as WebP, quality 80 or better.
2. `assets/world/vista-depth.webp` and `vista-tall-depth.webp`: 8-bit grayscale depth maps in full-plate coordinates, 0 = farthest (sky) and 255 = nearest. Half resolution is fine.
   - Preferred source: Depth Anything V2 (Small), run locally once in a Python venv in the scratchpad. Don't add it to the site.
   - Post-process: force the sky to 0 using a sky mask (see how `layers.py` found the skyline in the earlier depth work), smooth it with an edge-aware filter, and dilate near-depth edges by about 6 px so foreground silhouettes don't tear.
   - Fallback if the model can't run: build a synthetic depth from masks. Sky is 0, then a gradient that gets nearer toward the bottom, plus luminance and texture cues for the near poppies. It must still pass the parallax checks below.
3. Barkley's depth is the ground depth at his paws. Measure it from the depth map under the bottom of the cutout; the shader receives it as one number.

## How to build it

- **New file:** `arrival.js`, loaded with `defer` after `world.js`. Add it to the `code` list in `build.mjs` so it's versioned and its assets get copied.
- **Head script:** add a tiny synchronous check to the existing inline `<head>` script. If this is a first view, motion is allowed, WebGL2 exists and `saveData` is off, add `html.arrival`. In CSS, `html.arrival` hides the vista's painting and cutout (the `picture`, the video and `.still-barkley`) and shows the paper. Remove the class on completion, skip or error.
- **Canvas:** one `<canvas>` (`aria-hidden`, `pointer-events: none`) inside the vista `.plate`, `inset: 0`, placed above `.still-barkley` and below the clouds, bubble and bird. It then inherits the scroll camera's CSS transforms for free.
- **Shader:** one fragment shader composites:
  - **Base:** the clean still, then the trailhead video once it's playing. The video covers only part of the plate (wide: y ≥ 15.625%; tall: x ≥ 15.625%), so feather it into the clean still at that edge. Keep the `<video>` element playing, not `display:none`, so it keeps feeding frames. When the video starts, crossfade the base from still to video over 400 ms.
  - **Depth parallax:** offset the UV by `(depth − focus) × camera`, searching over 6–8 steps so there's no rubber-sheet stretching. At rest (`camera = 0`) the scale is exactly 1, with overscan growing only with `|camera|`, so no edge ever shows.
  - **Barkley:** composited on top from the cutout texture as a rigid plane with his single depth, never warped.
  - **Sketch:** graphite lines from a multi-scale edge detector (Sobel or difference-of-Gaussians) on the base's luminance, including Barkley's cutout. Use a warm graphite color (around `#5b5046`) on `--paper` (`#fffaf0`) with subtle paper grain. Tune the thresholds so it reads as a confident pencil underdrawing. If it looks like a Photoshop "find edges" filter or TV static, it has failed.
  - **Bloom:** a progress field of distance from the seeds, warped by fbm noise so the front is organic, never a circle. Primary seed at Barkley's chest (from the cutout's alpha centroid); secondary seeds at the arch (the `ARCH` landmark) and the bottom-left poppies. The sky washes in last, from the horizon upward. Give the front a thin rim that is darker and more saturated, then let color move from slightly desaturated to full over about 300 ms after the front passes.
  - **Sun:** a warm radial swell centred near (86%, 4%), matching `.sunlight` in `world.css`.
- **Timeline** (T = 0 when the textures are ready):
  - pencil 0–0.45 s
  - bloom 0.25–1.25 s, with the secondary seeds starting at +0.15 s and +0.25 s
  - sun 0.9–1.5 s
  - depth dolly settling to rest 0.9–1.8 s
  - hand-off at 1.8 s

  Use eased curves throughout.
- **After the arrival:**
  - Desktop (`pointer: fine`): the pointer sets the camera offset, eased. The near plane moves at most 1.2% of the plate width, and the sky barely moves.
  - Phones: a very slow automatic drift (about a 14 s period, at most 0.35%). Don't ask for gyroscope permission.
  - The scroll camera keeps working as it does today.
- **Other existing effects:**
  - On a first view with the arrival, skip `touches.js`'s dawn-grade sunrise (`is-waking`), because the arrival replaces it. When the arrival doesn't run, keep today's behavior.
  - Time the BARKLEY letter settle and the speech bubble's pop-in to land after the arrival: the bubble about 0.2 s after hand-off, never before.
  - The clock-based sky grade still applies on top.
- **Failure handling:** if WebGL context creation, a shader compile, a texture load or a context loss fails, remove `html.arrival`, remove the canvas, and fall back to today's page silently, with no console errors.
- **Debug and preview hooks** (document them in the README):
  - `?arrival=0.6` freezes the arrival at that point, from 0 to 1.
  - `?arrival=replay` forces it to play regardless of the session.
  - `?arrival=off` disables it.

## Done criteria

Every one must be green. Test in headless Chromium through Playwright. For real WebGL in headless mode, use SwiftShader, e.g. `--use-angle=swiftshader --enable-unsafe-swiftshader`. Keep test scripts in the scratchpad so the repo stays dependency-free. Record results and screenshots in `qa/arrival/`.

1. **Contact first:** at 390×844 and 1440×900, on the first frame after load, `document.elementFromPoint` at the centre of each hero button returns that button, and the `href`s are unchanged: `tel:+13107292115`, the existing `sms:` body, and `data-where`.
2. **Timeline frames:** frozen frames at `?arrival=` 0.05 / 0.3 / 0.55 / 0.8 / 1 at both sizes are saved as `qa/arrival/timeline-390.jpg` and `timeline-1440.jpg`, and they visibly show paper, then pencil, then bloom around Barkley, then mostly colored with the sun, then the finished scene. You must look at the frames and judge them honestly:
   - The pencil reads as drawing, not noise.
   - The bloom is organic, not radial.
   - There are no halos around Barkley, the skyline or the poppies.
3. **Rest fidelity:** the finished frame with the pointer centred differs from the `?arrival=off` render by a mean absolute difference of less than 4/255 at both sizes, ignoring the clouds, bubble and bird.
4. **Real timing:** with textures cached, the arrival finishes at most 2.0 s after its textures are ready, and at most 2.6 s after navigation at 1440×900 locally. With image requests delayed by 2 s through Playwright routing, the arrival is skipped and the plain painting is fully visible by 1.6 s, with no errors.
5. **Depth works:** at 1440×900, moving the pointer from the centre to a corner shifts near foreground content by 10 px or more and skyline content by 3 px or less (measure with patch cross-correlation). No frame-edge pixel ever shows paper, black or transparent. Barkley's patch moves rigidly: correlation of 0.98 or more against his rest patch, shifted.
6. **Barkley intact:** his pixels in the finished frame match the cutout, with a mean absolute difference of less than 6/255 inside his alpha mask.
7. **Cheap when idle:** a draw counter (`window.__arrivalDraws`) shows 0 draws per second after scrolling past the vista and while the tab is hidden, and no more than the video frame rate plus pointer events otherwise. Average frame time during the arrival is 16.7 ms or less on this Mac in headless mode.
8. **Opt-outs:** with reduced motion, with `saveData`, and with WebGL2 unavailable (stub `getContext` to return `null`):
   - no canvas is created
   - the page matches today's behavior
   - all existing reduced-motion checks pass: 0 running animations, no video load, crossfades only
   - 0 console errors
9. **Once per session:** a second navigation in the same browser context starts at the finished state, with no paper or pencil.
10. **No regressions:** all existing checks still pass:
    - call, text and location links, including location with permission allowed and denied
    - the print landing on `album#post-11` and the album viewer opening
    - no JavaScript and no images
    - sizes 320×568, 390×844, 768×1024, 844×390, 1440×900 and 1920×1080 with no horizontal overflow
    - the scroll walk to the climb and summit, with no painting edges showing
    - 0 console errors and 0 failed requests
11. **Weight:** extra first-load transfer is at most 900 KB, and `arrival.js` is at most 20 KB. Report the actual numbers.
12. **Video:** a Playwright screen recording of a real first visit at 390×844, converted to `qa/arrival/arrival-390.mp4` (H.264, at most 3 MB). Watch it frame by frame; it has to feel smooth and deliberate, not glitchy.
13. **Build and docs:**
    - `node build.mjs` succeeds, and `dist/Barkley` includes `arrival.js` and the new assets.
    - `README.md`, `DESIGN.md` and `qa/walk/VERIFICATION.md` describe the arrival and its opt-outs.
    - `tools/` contains the asset script.
14. **Shipped:**
    - Commit to `main` with a clear message and the required co-author line, then push.
    - Confirm the Vercel production deploy for that commit is Ready, and re-run checks 1, 4 (cached), 8 and 10 against https://barkley-one.vercel.app.
    - Do **not** move the `barkley-2026-09-25` tag and do not touch jeff-parker.com.

## Stop and ask Jake if

- The depth model can't run and the synthetic fallback can't pass check 5.
- The only way to meet the timing or budget is to drop the bloom or the depth.
- Anything would change the hero's text, buttons or `href`s.

## Report at the end

Send Jake `qa/arrival/arrival-390.mp4` and the two timeline sheets. Then give him:
- a short table of the done criteria with their measured numbers
- the live URL
- anything that fell short, stated plainly
