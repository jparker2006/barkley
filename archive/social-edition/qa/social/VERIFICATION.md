# Social-edition verification

Passed in local Chrome via Playwright, September 10, 2026.

- Exact approved post copy and chronological order.
- No greeting bar, visible motion-pause setting, Easter-egg controls or discovery dialogs.
- Call and Text links have the approved phone number and remain above the fold at 320, 390, 600, 601, 768, 1024, 1440 and 1920px widths. Minimum tested contact target height: 56px. No horizontal overflow.
- Initial load requests no archive videos, media manifest, or removed secret-scene artwork.
- At a 300px scroll, scenery translates +39px while the separate foreground translates −25.5px. The old saved pause setting has no effect.
- OS reduced motion disables those transforms and all automatic decorative animation.
- Paw likes toggle, persist locally across reload, and can be undone.
- All six main-page photo previews decode. All ten full images and five videos load, and all fifteen captions are present. Videos never autoplay.
- The selected thumbnail opens its matching caption. Arrow keys, next/previous buttons, Escape, close, media cleanup and focus restoration work.
- The standalone Instagram-style album has all fifteen captioned entries and functioning item viewers.
- No JavaScript errors during the flow.
- With JavaScript disabled and all image/font requests blocked, the call link, backup-contact disclosure and fifteen standalone media links still work.

Visual review covered phone, narrow phone, tablet, laptop and desktop compositions, the scrolled social section, and the captioned media viewer. These are viewport simulations, not physical-phone/Safari tests. No production deployment or real call/text test was performed.
