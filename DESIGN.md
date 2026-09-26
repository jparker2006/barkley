# Design: the walk

## The idea

The previous edition cut from a painting to a flat green panel, so the world stopped at the first scroll. This version never leaves the world. The painting is a sticky stage behind the page, and scrolling moves a camera through three places Barkley actually visits:

    trailhead vista  →  (camera walks to the arch; the climb opens inside it)
    the climb        →  (over the crest: the view from the top rises in and pushes the climb away)
    top of the hill  →  photos, thanks and contacts, all in one card

The story reads without words: Barkley takes Jeff up Harper Monkey Trail, and Jeff needs a sit at the top. Jeff is labelled in both paintings he appears in. On the crest transition the two paintings only meet in the sky, so there is never a doubled Barkley.

## Hierarchy

The job comes first: a finder must be able to call Carol within a second of landing. So:

- The first line is BARKLEY in Bricolage Grotesque 800, sized to the full width of the viewport.
- Directly under it are two 60–64 px pill buttons. Call Carol is deep chaparral green; Text Carol is tennis-ball chartreuse. On a 390 × 844 phone they end 151 px from the top.
- Carol’s number is printed on the Call button itself, so it’s visible without cluttering the painting. Below come “Text Carol where I am” and the backup contacts in a native `<details>`.
- The same buttons return at the very end of the page.

Nothing sits above the name. There is no greeting, no pause control, and no hidden hotspots.

## Humour

It lives in the copy and in the storytelling, not in interactions:

- Barkley’s only line in the hero: “oh hi. i’m friendly. you’re not carol.”
- Profile: “Harper Monkey Trail regular. Most mornings I take Jeff to the top.” and “1 Jeff, walked daily · 0 squirrels caught”.
- Scene labels: “that’s jeff. he’s a little slow.” and “jeff needs a minute.”
- Post reactions are static text: “2.4k sniffs”, “311 re‑woofs”, “jake has not responded”, “jeff is still catching his breath”.
- The top: “made it to the top. Jeff needs a minute, so here are some photos.”
- Photo prints use his existing captions from `media.json`. I only chose real photos for the preview.

## Motion rules

- Barkley is never animated. The camera may pass him; he doesn’t move.
- Everything that moves has a physical reason. Clouds are cut from the approved painting, so they match. There’s one distant hawk, pollen in the sunbeam, and close poppies swaying on independent phases. Poppies dip out of frame as we leave the trailhead.
- Scroll motion uses only transforms, opacity and gradient masks. Scene scale is clamped so a painting’s edge can never show.
- Ambient loops pause once the vista is behind us and when the tab is hidden.
- `prefers-reduced-motion: reduce` turns off every animation and transform. Scenes switch by crossfade, silently.

## Wow, without adding clutter

The page adds exactly one control: "Text Carol where I am", because it genuinely helps a finder. Everything else happens on its own. There's the living trailhead video, depth planes that you walk into, light that follows the real hour in LA, a sunrise when the page opens, and a photo that grows into the album. None of it hides information or needs discovering.

## The arrival

The first visit starts on paper and watches the painting happen: pencil, then watercolor blooming from Barkley, then the sky and the sun. After that the painting has depth: near poppies slide past far hills when you move. Barkley is his own rigid plane, so he is painted in and leans with the scene but never warps. The name and the three buttons are never covered or delayed. Details and numbers: `specs/arrival.md`, `qa/arrival/RESULTS.md`.

## Ask Barkley

It's for the moment someone is holding a lost dog and has a question the buttons don't answer. It sits in the first card after the trailhead, so the top of the page stays name plus three buttons. Barkley answers in his voice, only from facts his people wrote, and never guesses about food, medicine or anything unknown. Every dead end points back to Carol.

## The real sky

The page shows Harper Monkey Trail as it is right now. The sun's real position drives dawn, golden hour, sunset and night. Night is a real painting, not a darkened day: the same composition with a moon, city lights and a moonlit Barkley. Weather stays gentle and physical: a marine layer sits over the basin, never over Barkley, and rain is fine slanted streaks. Reduced motion keeps the look but stops the movement.

## Palette and type

Tokens live on `:root` in `world.css`: sky `#a9dde2`, ink `#153a2f`, paper `#fffaf0`, tennis `#e2ef7e`, poppy `#e9731f`. Bricolage Grotesque (800/600) is the display face and Manrope (400/600) the text face, both self-hosted. The page is light-only on purpose: it is a sunlit morning, and the dark direction was rejected.

## Resilience

- **No JavaScript:** the vista stays as a sticky backdrop. All content, links and the details disclosure still work.
- **No images:** the stage paints a sky-to-hillside gradient, and the ink name and solid buttons stay legible.
- **Fonts late:** the fallback stack is Impact/system sans, and layout is sized in vw/svh, so nothing reflows around the buttons.
