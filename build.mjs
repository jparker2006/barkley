// Builds the deployable site into dist/Barkley/.
// Only files the pages actually reference are copied. Local CSS/JS get a content-hash ?v= so
// returning visitors never mix old and new files. Links use Cloudflare Pages' extensionless
// URLs (album, not album.html) to skip a redirect.
//
//   node build.mjs
import { readFile, writeFile, mkdir, rm, copyFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'dist', 'Barkley');
const pages = ['index.html', 'album.html', 'about.html', 'photos.html', 'offline.html'];
const code = ['world.css', 'sky.js', 'world.js', 'touches.js', 'arrival.js', 'ask.js', 'album.css', 'app.js', 'media.json', 'sw.js'];

const hash = async file => createHash('sha256').update(await readFile(path.join(root, file))).digest('hex').slice(0, 8);
const copy = async file => {
  await mkdir(path.dirname(path.join(out, file)), { recursive: true });
  await copyFile(path.join(root, file), path.join(out, file));
};

await rm(path.join(root, 'dist'), { recursive: true, force: true });
await mkdir(out, { recursive: true });

// Every assets/... path mentioned by a page, stylesheet, script or media.json.
const assets = new Set();
for (const file of [...pages, ...code]) {
  const text = await readFile(path.join(root, file), 'utf8');
  for (const [ref] of text.matchAll(/assets\/[\w\-./]+\.\w+/g)) assets.add(ref);
}
for (const file of assets) {
  try { await stat(path.join(root, file)); } catch { throw new Error(`Referenced but missing: ${file}`); }
  await copy(file);
}

const versions = Object.fromEntries(await Promise.all(code.map(async f => [f, await hash(f)])));
for (const file of code) await copy(file);
for (const file of pages) {
  let html = await readFile(path.join(root, file), 'utf8');
  for (const [name, v] of Object.entries(versions)) {
    if (!/\.(css|js)$/.test(name) || name === 'sw.js') continue;
    html = html.replaceAll(`href="${name}"`, `href="${name}?v=${v}"`).replaceAll(`src="${name}"`, `src="${name}?v=${v}"`);
  }
  html = html.replace(/(["'(])(\.\/)?album\.html/g, '$1$2album');
  await writeFile(path.join(out, file), html);
}

// Report.
const files = execFileSync('find', ['.', '-type', 'f'], { cwd: out, encoding: 'utf8' }).trim().split('\n').sort();
let total = 0, largest = ['', 0];
for (const f of files) {
  const { size } = await stat(path.join(out, f));
  total += size;
  if (size > largest[1]) largest = [f, size];
}
if (largest[1] > 25 * 1024 * 1024) throw new Error(`${largest[0]} is over Cloudflare Pages' 25 MiB file limit`);
console.log(`dist/Barkley: ${files.length} files, ${(total / 1048576).toFixed(1)} MB (largest ${largest[0]}, ${(largest[1] / 1048576).toFixed(1)} MB)`);
