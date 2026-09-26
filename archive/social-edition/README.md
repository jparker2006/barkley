# Barkley’s Morning — social edition

Local preview: http://127.0.0.1:4383/?edition=social

A short, two-part redesign of Barkley’s QR-tag page. The big name leads into his latest fictional post and direct Call Carol / Text Carol links. A sunlit Runyon scene continues into two earlier posts and a compact Instagram-style preview of the family photo album.

## This iteration

- Removed the top greeting, visible pause control, secret hotspots, discovery dialogs and hidden-joke interactions.
- Used the three approved posts verbatim and in the agreed order: lost, Jake’s lunch, morning at Runyon.
- Added one new transparent imagegen foliage asset. Scrolling moves the foreground faster than the landscape for depth; Barkley stays in the same pose. A brief arrival breeze ends within five seconds. Reduced motion is honored automatically.
- Added visible paw-like interactions to the two earlier posts. Likes remain local to this browser and can be undone.
- Added six real photo previews in an Instagram-style profile. The standalone album includes all ten original images and five original videos, each with a Barkley caption. Clicking a photo opens its captioned viewer; videos do not autoplay.
- Added a quiet footer returning to the family contact block.

At 390 × 844 the page is 2015px tall, about 2.4 screens. The contact buttons end at 321px. Narrow phones, tablets and desktops also have contacts above the first fold and no horizontal overflow.

## Run

From this folder, run `node server.mjs` or `npm start`. The local server uses Node’s standard library; no package install is necessary. The website is static HTML, CSS, JavaScript, local fonts, images and videos.

## Verification

Current results are in `qa/social/verification.json` and current screenshots are in `qa/social/`. All 15 media items loaded successfully in Chrome. Checks also covered exact post copy/order, removal of the old UI, responsive contact placement, separate foreground/landscape movement, OS reduced motion, reversible likes, caption selection, keyboard navigation, Escape/focus restoration, and fallbacks with JavaScript and image/font requests disabled. No browser JavaScript errors were observed.

Older files elsewhere in `qa/` document the previous iteration. They are not the current acceptance evidence.

## Artwork

`assets/social/ART-NOTES.md` contains the final generated asset paths, exact prompt and review. It was produced with the built-in image generation tool. The existing approved morning paintings remain the environment. Media source files are preserved; new photo captions live in `media.json`.

The profile and posts are part of this local website; no external Instagram or Twitter account was created. No messages were sent, no calls were placed, and the public QR destination has not been deployed or replaced. Testing used desktop Chrome with simulated mobile viewports, not physical-device Safari.
