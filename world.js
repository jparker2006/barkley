// Barkley’s Morning: scrolling walks the camera up Harper Monkey Trail with Barkley and Jeff,
// through the flowered arch, up the climb, and over the crest to the top of the hill.
// Barkley himself never moves.
(() => {
  'use strict';
  const stage = document.querySelector('.stage');
  if (!stage) return;
  const vista = stage.querySelector('.vista');
  const climb = stage.querySelector('.climb');
  const summit = stage.querySelector('.summit');
  const fg = stage.querySelector('.foreground');
  const bubble = stage.querySelector('.bubble');
  const tagClimb = stage.querySelector('.tag-climb');
  const tagSummit = stage.querySelector('.tag-summit');
  const topSection = document.getElementById('top');
  const cam = el => el.querySelector('.cam');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const tall = matchMedia('(max-aspect-ratio: 1/1)');

  // Landmarks in each painting, as fractions of the image (r is a radius, as a fraction of width).
  const ARCH = { wide: { x: .838, y: .478, r: .026 }, tall: { x: .845, y: .44, r: .036 } };
  const CREST = { wide: { x: .70, y: .285, r: .03 }, tall: { x: .83, y: .21, r: .045 } };

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let g = null, frame = 0, last = '';

  function plateRect(scene, W, H) {
    const cs = getComputedStyle(scene.querySelector('.plate'));
    const ar = parseFloat(cs.getPropertyValue('--ar'));
    const fx = parseFloat(cs.getPropertyValue('--fx'));
    const fy = parseFloat(cs.getPropertyValue('--fy'));
    const w = Math.max(W, H * ar), h = Math.max(H, W / ar);
    return { left: (W - w) * fx, top: (H - h) * fy, w, h };
  }
  const at = (rect, p) => ({ x: rect.left + p.x * rect.w, y: rect.top + p.y * rect.h, r: p.r * rect.w });

  function measure() {
    const W = stage.clientWidth, H = stage.clientHeight;
    const shape = tall.matches ? 'tall' : 'wide';
    const v = plateRect(vista, W, H), c = plateRect(climb, W, H), s = plateRect(summit, W, H);
    g = {
      W, H, vistaRect: v, climbRect: c, summitRect: s,
      arch: at(v, ARCH[shape]),
      crest: at(c, CREST[shape]),
      aim1: { x: W * .5, y: H * (tall.matches ? .38 : .42) },
      far: Math.hypot(W, H),
      topStart: topSection.getBoundingClientRect().top + scrollY,
    };
    last = '';
    paint();
  }

  // Scale the scene by s around point `from`, and carry that point to `to`.
  const move = (from, to, s) => `translate3d(${to.x - from.x * s}px,${to.y - from.y * s}px,0) scale(${s})`;
  // Smallest scale at which a plate, with point p carried to `to`, still covers the whole frame.
  const cover = (rect, p, to) => Math.max(
    to.x / (p.x - rect.left), (g.W - to.x) / (rect.left + rect.w - p.x),
    to.y / (p.y - rect.top), (g.H - to.y) / (rect.top + rect.h - p.y));
  const mask = (el, value) => { el.style.webkitMaskImage = value; el.style.maskImage = value; };
  const show = (el, on) => { el.style.visibility = on ? '' : 'hidden'; };
  const reveal = (o, r) => `radial-gradient(ellipse ${r * .8}px ${r}px at ${o.x}px ${o.y}px,#000 62%,transparent 100%)`;

  function paint() {
    frame = 0;
    if (!g) return;
    const { H } = g;
    const y = scrollY;
    const t1 = clamp(y / (H * .9));
    const t2 = clamp((y - (g.topStart - H * .8)) / (H * .85));
    const key = reduced.matches + ':' + t1.toFixed(4) + ':' + t2.toFixed(4);
    if (key === last) return;
    last = key;

    stage.classList.toggle('is-past-vista', t1 >= 1);
    tagClimb.classList.toggle('is-on', t1 > .92 && t2 < .2);
    tagSummit.classList.toggle('is-on', t2 > .9);

    if (reduced.matches) {
      // Quiet version: the same three places, changing by a simple crossfade.
      for (const el of [vista, climb, summit]) { cam(el).style.transform = ''; mask(el, ''); show(el, true); }
      fg.style.transform = '';
      bubble.style.opacity = '';
      climb.style.opacity = t1 > .55 ? 1 : 0;
      summit.style.opacity = t2 > .45 ? 1 : 0;
      fg.style.opacity = t1 > .55 ? 0 : 1;
      return;
    }

    // 1. Up the trail: the arch drifts to the middle of the frame and the climb opens inside it.
    const e1 = ease(t1);
    const c1 = { x: lerp(g.arch.x, g.aim1.x, e1), y: lerp(g.arch.y, g.aim1.y, e1) };
    const vs = Math.max(1 + 2.4 * e1, cover(g.vistaRect, g.arch, c1));
    cam(vista).style.transform = move(g.arch, c1, vs);
    bubble.style.opacity = 1 - clamp(t1 * 6); // Barkley stops talking once we start walking.
    show(vista, t1 < 1);

    // 2. Up to the crest of the climb, and over it to the top of the hill.
    const e2 = ease(t2);
    if (t2 <= 0) {
      const r = g.arch.r * vs * Math.pow(g.far / (g.arch.r * 3.4), t1 * t1);
      cam(climb).style.transform = move(c1, c1, lerp(1.35, 1, e1));
      climb.style.opacity = clamp(t1 * 9);
      mask(climb, t1 >= 1 ? '' : reveal(c1, r));
    } else {
      // Stepping over the crest: the view from the top rises in and pushes the climb down and away,
      // so the two paintings only ever meet in the sky.
      const edge = lerp(-20, 125, e2);
      cam(climb).style.transform = `translate3d(0,${Math.max(0, edge - 22) / 100 * H}px,0)`;
      climb.style.opacity = 1;
      mask(climb, '');
    }
    show(climb, t1 > 0 && t2 < 1);

    // The top of the hill arrives far things first, the way it does on a real hill.
    const edge = lerp(-20, 125, e2);
    const settle = { x: g.W / 2, y: g.H * .35 };
    cam(summit).style.transform = `translate3d(0,${(1 - e2) * -H * .06}px,0) ` + move(settle, settle, lerp(1.1, 1, e2));
    summit.style.opacity = clamp(t2 * 8);
    mask(summit, t2 >= 1 || t2 <= 0 ? '' : `linear-gradient(180deg,#000 ${edge - 22}%,transparent ${edge}%)`);
    show(summit, t2 > 0);

    // While we linger in a scene, we keep walking forward into it.
    const docEnd = document.documentElement.scrollHeight - H;
    climb.style.setProperty('--walk', clamp((y - H * .9) / (g.topStart - H * 1.7)).toFixed(4));
    summit.style.setProperty('--walk', clamp((y - g.topStart) / Math.max(docEnd - g.topStart, 1)).toFixed(4));

    // Close poppies brush past as we leave the trailhead.
    const dip = Math.sin(Math.PI * Math.min(t1, .5));
    fg.style.transform = `translate3d(0,${dip * 60}%,0) scale(${1 + dip * .3})`;
    fg.style.opacity = 1;
    show(fg, dip < .999);
  }

  const request = () => { if (!frame) frame = requestAnimationFrame(paint); };

  // The living painting: only for people who haven't asked for less motion, and only while the trailhead is in view.
  const living = stage.querySelector('.living');
  const saveData = navigator.connection && navigator.connection.saveData;
  function runLiving() {
    if (!living) return;
    const dark = window.__sky && window.__sky.night >= 0.99;   // the night painting has no video
    const want = !reduced.matches && !saveData && !dark && !document.hidden && !stage.classList.contains('is-past-vista');
    const src = tall.matches ? living.dataset.tall : living.dataset.wide;
    if (!want) { living.pause(); return; }
    if (!living.src.endsWith(src)) { living.classList.remove('is-playing'); living.src = src; }
    living.play().catch(() => {});
  }
  if (living) {
    living.addEventListener('playing', () => living.classList.add('is-playing'));
    new MutationObserver(runLiving).observe(stage, { attributes: true, attributeFilter: ['class'] });
    addEventListener('load', runLiving);
    reduced.addEventListener('change', () => { if (reduced.matches) living.classList.remove('is-playing'); runLiving(); });
    tall.addEventListener('change', runLiving);
    addEventListener('skychange', runLiving);
  }

  // On desktop, the planes of the later scenes lean a little toward the mouse.
  if (matchMedia('(pointer: fine)').matches && !reduced.matches) {
    let tx = 0, ty = 0, mx = 0, my = 0, leaning = 0;
    const lean = () => {
      mx += (tx - mx) * .08; my += (ty - my) * .08;
      stage.style.setProperty('--mx', mx.toFixed(3));
      stage.style.setProperty('--my', my.toFixed(3));
      leaning = Math.abs(tx - mx) + Math.abs(ty - my) > .002 ? requestAnimationFrame(lean) : 0;
    };
    addEventListener('pointermove', e => {
      tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1;
      if (!leaning) leaning = requestAnimationFrame(lean);
    }, { passive: true });
  }
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => requestAnimationFrame(measure), { passive: true });
  reduced.addEventListener('change', measure);
  tall.addEventListener('change', measure);
  document.addEventListener('visibilitychange', () => stage.classList.toggle('is-hidden', document.hidden));
  if (document.fonts) document.fonts.ready.then(measure);
  addEventListener('load', measure);
  measure();
})();
