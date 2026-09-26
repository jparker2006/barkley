# The arrival: done criteria (specs/arrival.md)

Measured 2026-09-25 in headless Chromium (Playwright 1.63, WebGL2 via ANGLE on Metal, Apple M4) against `node server.mjs`.
Raw numbers are in `results.json`.

| # | Criterion | Measured | |
| --- | --- | --- | --- |
| 1 | Buttons first | At 390×844 and 1440×900, on the first frame `elementFromPoint` hits every hero button (3/3 at both sizes), `href`s are unchanged, and BARKLEY is at opacity 1 | ✅ |
| 2 | Timeline frames | `timeline-390.jpg` and `timeline-1440.jpg` show paper → pencil (Barkley first) → organic bloom from his chest → mostly painted with sun → finished. Judged: pencil reads as drawing; bloom edges are lobed and feathered, not a circle; no halo around Barkley, the skyline or poppies | ✅ |
| 3 | Rest fidelity | Mean abs diff vs `?arrival=off` (clouds, bubble and bird hidden, video frame 0 on both): **0.31** /255 at 1440 and **0.72** at 390. With the video paused so the still composites alone: 1.68 and 3.13 | ✅ (< 4) |
| 4 | Timing | Cached: finishes **1804 ms** after textures ready (1440) and **1812 ms** (390); done **2019 ms** / **2074 ms** after navigation. Textures delayed 2 s: arrival skipped, painting at opacity 0.98 by 1600 ms, depth added later, 0 errors | ✅ (≤ 2.0 s / ≤ 2.6 s) |
| 5 | Depth | Pointer centre → corner: near poppies shift **17.5 px**, skyline **0 px**. Barkley's fur moves rigidly **10.8 px**, masked NCC **0.980** / **0.983**. Edge pixels showing paper or black: **0** of 4680 in all 3 poses | ✅ |
| 6 | Barkley intact | Mean abs diff inside his fur mask vs the flat page: **2.52** (1440) and **3.95** (390) | ✅ (< 6) |
| 7 | Cheap when idle | Resting on the vista: **24** draws/s (= video frame rate). Past the vista: **0**. Tab hidden: **0**. Average arrival frame: **16.25 ms** (1440) and **16.32 ms** (390) | ✅ |
| 8 | Opt-outs | Reduced motion, `saveData`, no WebGL2 and a null `getContext` all produce no canvas and 0 errors, at both sizes. Reduced motion: 0 running animations, no video loaded | ✅ |
| 9 | Once per session | Second visit in the same session starts at the finished state (no paper, `html.arrival` absent) | ✅ |
| 10 | No regressions | Call/text links unchanged. Location allowed → map link; denied → plain text. Print → `album.html#post-11` → viewer opens with its caption. No-JS and no-images render with 0 page errors. Walk to climb and summit intact at 390 and 1440. 0 overflow at 320×568, 390×844, 768×1024, 844×390, 1440×900 and 1920×1080. 0 console errors, 0 failed requests | ✅ |
| 11 | Weight | Extra first load **377 KB** measured (`vista-base` 282 KB, `vista-sketch` 89 KB, `vista-depth` 6 KB), plus `arrival.js` **16.7 KB** (it loads either way) ≈ **394 KB** total | ✅ (≤ 900 KB / ≤ 20 KB) |
| 12 | Video | `arrival-390.mp4`: 4.6 s, H.264, 2.2 MB. Watched frame by frame: steady, deliberate, no flashes or tearing | ✅ |

## Notes and deviations

- **BARKLEY stays solid on a first visit.** The spec asked for the letter-settle animation to land after the arrival. Instead, the name is solid ink on the paper from the first frame and doesn't animate during the arrival. The hard rule ("the h1 is visible from the very first frame") wins. Without the arrival, today's letter settle still plays.
- **Colour matching.** The Gemini trailhead video had no colour tags, so Chrome's `<video>` and WebGL decoded it differently. `tools/video.sh` now tags it BT.709 / TV range / sRGB transfer, so both paths match the painting.
- **Base texture.** The canvas uses `vista-base.webp`: the original painting, with the clean plate only in a feathered zone around Barkley's footprint. This keeps rest fidelity high while still letting the camera see behind him as he leans.
- **Not tested:** physical iPhone Safari, and Safari's WebGL2 performance on older phones. The 1.2 s fail-safe and the opt-outs are there for those.
