# Deploying to jeff-parker.com/Barkley/

jeff-parker.com is served by **Cloudflare Pages** from a git repo that isn't on this Mac. The Barkley page lives in that repo's `Barkley/` folder.

## How it's set up

- **Code:** https://github.com/jparker2006/barkley (public).
- **Live copy:** https://barkley-one.vercel.app. Vercel builds `main` with `node build.mjs` and serves `dist/Barkley/` (see `vercel.json`). It already sends `geolocation=(self)`.
- **Destination:** jeff-parker.com is a separate Cloudflare Pages site from Jeff's own repo, and its `Barkley/` folder is what the QR tag opens.

## Shipping to jeff-parker.com

Send Jeff `FOR-JEFF.md`. He looks at the Vercel link first, then pastes the prompt into Claude Code in his website repo. His agent:
1. clones this repo at a tag and runs `node build.mjs`
2. puts `dist/Barkley/` into his `Barkley/` folder on a new branch
3. changes `geolocation=()` to `geolocation=(self)` in his `_headers`
4. opens a pull request and sends him the Cloudflare preview link
5. merges only when he says yes

When the site changes, commit, push, and move the tag (or make a new one and update the tag name in `FOR-JEFF.md`).

- The new `sw.js` intentionally replaces the old app's service worker. For people who visited the old app, it deletes the offline copies it cached, unregisters itself, and reloads them onto the new page.
- `about.html`, `photos.html` and `offline.html` are tiny redirect pages, so old links still land somewhere sensible.
- The header change matters: with `geolocation=()` the "Text Carol where I am" button still works but sends no map link. Don't add a separate `/Barkley/*` rule instead, because Pages joins duplicate headers with a comma and the old `()` could still win.

## Check it after it's live

```bash
curl -sI https://jeff-parker.com/Barkley/ | grep -i permissions-policy
```

It should show `geolocation=(self)`. Then, on a phone:

- Tapping Call Carol opens the dialer with (310) 729-2115; don't place the call.
- "Text Carol where I am" opens Messages with a Google Maps link; don't send it.
- "More ways to reach my people" at the bottom shows Carol, Jeff, the vet and the home address.
- Texting yourself the link shows the painted BARKLEY preview card. iMessage caches previews, so try a fresh thread.

## Tested locally

Before publishing, `dist/Barkley/` was served by a local stand-in for Pages at `/Barkley/`, with extensionless URLs, `.html` → 308 redirects and the live site's headers. Results:

- **Returning visitor with the old app's service worker:** before the switch, 1 registration and cache `barkley-v7-precache`. After, 0 registrations, no caches, and the new page loaded.
- **Location button:** with the live header it sends the plain message; with `geolocation=(self)` it sends the map link.
- **Links:** `/Barkley/photos` → `/Barkley/album` and `/Barkley/about` → `/Barkley/`. Print → `album#post-5` → viewer opens.
- **Full scroll + album:** 0 failed requests, 0 console errors.

**Live Vercel site (https://barkley-one.vercel.app):** the phone video plays, the location text includes the map link, the print lands on `/album#post-11`, and there are 0 failed requests and 0 console errors.
