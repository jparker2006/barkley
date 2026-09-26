# Putting the new Barkley page on jeff-parker.com

**Jeff:** first, look at the new page on your phone: **https://barkley-one.vercel.app**. If you like it, open Claude Code in your jeff-parker.com website folder and paste everything below the line. Your agent will stage it and send you a preview link, and nothing goes live until you say yes.

---

I'm updating the Barkley page on my website, https://jeff-parker.com/Barkley/. It's the page Barkley's QR tag points to. My son Jake built a new version:

- Live copy: https://barkley-one.vercel.app
- Source code: the public GitHub repo https://github.com/jparker2006/barkley, tag `barkley-2026-09-25`

Please stage it for me to preview. Don't put it on the live site until I've looked at it and said yes.

Work in my jeff-parker.com website repo. It deploys to Cloudflare Pages, and the Barkley page lives in its `Barkley/` folder. If you're not in that repo, find it or ask me where it is.

1. **Get Jake's code.** Clone https://github.com/jparker2006/barkley into a temporary folder outside my repo, and check out the tag `barkley-2026-09-25`. Run `node build.mjs` there. It needs Node 18 or newer and has no dependencies. The build writes the finished site to `dist/Barkley/` (about 87 files), and that folder is the only thing to copy. Don't copy the rest of Jake's repo into mine.

2. **Make a new branch** called `barkley-redesign` from my production branch. Don't work on the production branch.

3. **Replace the contents of my `Barkley/` folder** with the contents of `dist/Barkley/`. Touch nothing outside `Barkley/` except the one header line in step 4.
   - Before deleting the old files, search the rest of my repo for links to files inside `/Barkley/` (for example `/Barkley/Barkley.jpg` or `/Barkley/media/...`). If anything outside the folder uses one, keep that file and tell me.
   - The new `sw.js` intentionally replaces the old service worker: it clears the old app's offline copy for returning visitors. The new `about.html`, `photos.html` and `offline.html` are small redirect pages for old links. Keep all of them.

4. **Allow location for the "Text Carol where I am" button.** Find where my site sets the `Permissions-Policy` header (probably the `_headers` file at the repo root). It currently has `geolocation=()`. Change only that part to `geolocation=(self)` and leave the rest of the line as it is. Don't add a separate `/Barkley/*` rule: Cloudflare joins duplicate headers, so the old value could still win. If the header isn't set anywhere in the repo, it's probably a Cloudflare dashboard setting. In that case don't guess; tell me what to change there.

5. **Commit, push the branch, and open a pull request** into my production branch titled "New Barkley page". Do not merge it.

6. **Get me a preview link.** Cloudflare Pages builds a preview for the branch and usually posts the link on the pull request. It will look like `https://barkley-redesign.<project>.pages.dev/Barkley/`. Wait for it, then check the preview:
   - `/Barkley/`, `/Barkley/album`, `/Barkley/photos` and `/Barkley/about` all load (the last two redirect).
   - The response headers include `geolocation=(self)`.
   - It matches https://barkley-one.vercel.app.

   If Pages doesn't build previews for branches, run the site locally with `npx wrangler pages dev .` from my repo root and give me that local link instead.

7. **Tell me** the preview link and what to try on my phone:
   - Tap **Call Carol**. It should dial (310) 729-2115. Hang up.
   - Tap **Text Carol where I am** and allow location. The text should include a Google Maps link. Don't send it.
   - Scroll to the bottom and open **More ways to reach my people**. It should show Carol, me, the vet and the home address.

   Also tell me whether you kept any old files, and exactly what changed in the header file.

8. **Wait for me.** Only when I say it looks good, merge the pull request so Cloudflare deploys it to production. Then confirm https://jeff-parker.com/Barkley/ serves the new page and the `geolocation=(self)` header, and tell me it's live. If I say no, leave the pull request open and don't touch production.
