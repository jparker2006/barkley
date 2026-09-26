# Deploying to jeff-parker.com/Barkley/

jeff-parker.com is served by **Cloudflare Pages** from a git repo that isn't on this Mac. The Barkley page lives in that repo's `Barkley/` folder.

## What's ready

- `dist/Barkley/`: the complete site (87 files, about 28 MB). Every file in it is used. Nothing from the old app is included.
- `dist/Barkley.zip`: the same folder, zipped.

To rebuild after any change, run `node build.mjs` in this folder. It copies only the files that are referenced and adds content-hash `?v=` versions to the CSS/JS. It also links to Pages' extensionless URLs (`album`, not `album.html`), which skips a redirect.

## Steps

1. **Replace the site's `Barkley/` folder** with the contents of `dist/Barkley/`. Git keeps the old version in history if you ever want it back.
   - The new `sw.js` intentionally replaces the old app's service worker. For people who visited the old app, it deletes the offline copies it cached, unregisters itself, and reloads them onto the new page.
   - `about.html`, `photos.html` and `offline.html` are tiny redirect pages, so old links still land somewhere sensible.
   - Optional: if anyone has direct links to old photo files (`/Barkley/Barkley.jpg`, `/Barkley/media/...`), keep the old `media/` folder and those two images alongside the new files. They don't conflict.

2. **Allow the location button.** The site currently sends `Permissions-Policy: geolocation=()`, which blocks location on every page. With it, "Text Carol where I am" still works but sends the plain text without a map link. In the repo's `_headers` file, change that one value:

   ```
   Permissions-Policy: geolocation=(self), microphone=(), camera=(), interest-cohort=()
   ```

   `(self)` lets only jeff-parker.com's own pages ask, and the browser still asks the visitor first. Don't add a separate `/Barkley/*` rule instead: Pages joins duplicate headers with a comma, and the old `()` could still win.

3. **Commit and push.** Pages deploys automatically.

## Check it after it's live

```bash
curl -sI https://jeff-parker.com/Barkley/ | grep -i permissions-policy
```

It should show `geolocation=(self)`. Then, on a phone:

- The page shows BARKLEY with the three buttons. Tapping Call Carol opens the dialer with (310) 729-2115; don't place the call.
- Tap "Text Carol where I am" and allow location. Messages should open with a Google Maps link in the text; don't send it.
- Scroll to the end and open "More ways to reach my people". Carol, Jeff, the vet and the home address should all be there.
- Text yourself the link. The painted BARKLEY preview card should appear. iMessage caches previews, so if the old one shows, try a fresh thread.

## Tested locally

`dist/Barkley/` was served by a local stand-in for Pages at `/Barkley/`, with extensionless URLs, `.html` → 308 redirects and the live site's headers. Results:

- **Returning visitor with the old app's service worker:** before the switch, 1 registration and cache `barkley-v7-precache`. After, 0 registrations, no caches, and the new page loaded.
- **Location button:** with the live header it sends the plain message; with `geolocation=(self)` it sends the map link.
- **Links:** `/Barkley/photos` → `/Barkley/album` and `/Barkley/about` → `/Barkley/`. Print → `album#post-5` → viewer opens.
- **Full scroll + album:** 0 failed requests, 0 console errors.
