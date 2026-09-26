# Image-generation brief for Barkley’s Morning (the walk)

This brief is for Codex. The site already works with the approved art, so everything here is an upgrade. Items are in priority order. Please save each result as an **original PNG** in
`outputs/barkley-v4-art-studies/walk/` with an `ART-NOTES.md` (prompt, references used, one-paragraph review). Claude will convert, place and re-time them.

All paths below are relative to `outputs/`.

## What must stay consistent (every item)

- **World:** the approved sunlit Harper Monkey Trail at Runyon Canyon on a warm morning. Anchor: `barkley-v4-art-studies/sunlit/sunlit-canyon-study.png`.
- **Material:** painterly gouache with colored-pencil grain, honey morning light, pale turquoise sky, coral dusty trail, turquoise/olive chaparral, orange California poppies, small cream daisies, a hazy LA skyline. Match the existing assets exactly; no new style.
- **Fantasy level:** “extra-beautiful California morning”. No night, glow, portals, castles, sparkles or fantasy architecture. The dark fantasy direction was rejected.
- **Barkley (only where he appears):** use `barkleys-world/assets/art/references/real-barkley.jpg` and `real-harper-monkey-trail.jpg`. He is a short-coated scruffy white terrier mix with folded floppy ears, round dark eyes, a big black nose, a lean small build, a simple black harness and an upward-curving tail. His face must read as *him*, not a generic fluffy puppy. Keep the same calm, still, look-back pose as the approved anchor.
- **No text, lettering, UI, borders, watermarks or checkerboards** in any image.
- **Transparency:** where alpha is requested, it must be real alpha. If the tool can’t produce real alpha, use a flat pure **#FF00FF** background instead of a fake checkerboard, and Claude will key it out.

## 1-2. Done

The tennis-ball meadow and stash were dropped. Codex painted the climb and the summit (wide and tall) from `../barkley-v4-art-studies/summit-walk/BRIEF.md`, and they're on the page now. Items 3-4 below remain optional.

## 3. Done

The depth planes came from Codex's clean plates in `../barkley-v4-art-studies/depth-plates/`, then were separated in code. Item 4 is still optional.

## 4. A tiny hawk (nice to have)

- **File:** `hawk.png`, **512 × 256**, real alpha (or #FF00FF).
- **Placement:** high in the vista sky, displayed around 28–40 px wide, gliding slowly. It replaces a simple vector silhouette.
- **Content:** a red-tailed hawk seen from below, gliding with wings fully spread, in the same gouache style. Use a simple readable silhouette with a warm underside and a rusty tail. One bird, nothing else.

## Not needed

- New Barkley poses or animation frames. Barkley stays still by design.
- New UI mockups or any text in art.
- Replacements for the approved vista paintings themselves.

## Integration notes (for Claude, after delivery)

- Item 4: swap the `.bird` SVG for an `<img>` and keep the same `offset-path` glide.
