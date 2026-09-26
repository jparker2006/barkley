// Barkley's arrival. On the first visit of a session the trailhead paints itself: paper, a pencil
// underdrawing, watercolor blooming out from Barkley, the sun. Then the painting opens into depth and,
// from then on, leans with the pointer (desktop) or drifts slowly (phones). One WebGL2 pass, no libraries.
// Barkley is a separate rigid plane: he is painted in, never warped. See specs/arrival.md.
(() => {
  'use strict';
  const root = document.documentElement;
  const stage = document.querySelector('.stage');
  const plate = stage && stage.querySelector('.vista .plate');
  if (!root.classList.contains('gl') || !plate) return;

  const video = plate.querySelector('.living');
  const tall = matchMedia('(max-aspect-ratio: 1/1)');
  const fine = matchMedia('(pointer: fine)').matches;
  const query = new URLSearchParams(location.search).get('arrival');
  const frozen = query !== null && query !== '' && !isNaN(query) ? Math.min(1, Math.max(0, +query)) : null;

  // Seconds from the moment the textures are ready.
  const END = 1.8, FOREGROUND_IN = 0.7, SKY_IN = 1.0;
  // Plate-fraction landmarks; Barkley numbers come from tools/depth.py.
  const SCENES = {
    wide: {
      base: 'assets/world/vista-base.webp', depth: 'assets/world/vista-depth.webp',
      sketch: 'assets/world/vista-sketch.webp', barkley: 'assets/world/vista-barkley.webp',
      cut: [0.5742, 0.5488, 0.3932, 0.4512], barkleyDepth: 0.558,
      chest: [0.7493, 0.6981], arch: [0.838, 0.478], poppies: [0.09, 0.86], horizon: 0.47,
      video: [0, 0.15625, 1, 0.84375], videoFeather: 1,
    },
    tall: {
      base: 'assets/world/vista-tall-base.webp', depth: 'assets/world/vista-tall-depth.webp',
      sketch: 'assets/world/vista-tall-sketch.webp', barkley: 'assets/world/vista-tall-barkley.webp',
      cut: [0.4658, 0.5846, 0.5342, 0.349], barkleyDepth: 0.456,
      chest: [0.7139, 0.6954], arch: [0.845, 0.44], poppies: [0.1, 0.88], horizon: 0.42,
      video: [0.15625, 0, 0.84375, 1], videoFeather: 0,
    },
  };

  const status = window.__arrival = { state: 'loading', readyAt: 0, startedAt: 0, doneAt: 0, frames: 0 };
  window.__arrivalDraws = 0;

  const VERT = `#version 300 es
  out vec2 vUv;
  void main() {
    vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
    vUv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
    gl_Position = vec4(p, 0.0, 1.0);
  }`;

  const FRAG = `#version 300 es
  precision highp float;
  in vec2 vUv;
  out vec4 outColor;
  uniform sampler2D uBase, uVideo, uDepth, uSketch, uBark;
  uniform vec4 uVideoRect, uCut;
  uniform float uVideoMix, uVideoFeather, uBd, uDolly, uT, uAspect, uHorizon;
  uniform vec2 uCam, uC, uChest, uArch, uPoppies;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; } return v; }

  // Where on the painting does this screen pixel come from? Far things are magnified by the dolly,
  // near things move with the camera. Solved by fixed-point iteration so near edges occlude cleanly.
  vec2 project(vec2 uv) {
    vec2 s = uv;
    for (int i = 0; i < 7; i++) {
      float d = texture(uDepth, s).r;
      s = uC + (uv - uC - uCam * d) / (1.0 + uDolly * (1.0 - d));
    }
    return s;
  }

  vec3 baseAt(vec2 s) {
    vec3 c = texture(uBase, s).rgb;
    if (uVideoMix > 0.0) {
      vec2 v = (s - uVideoRect.xy) / uVideoRect.zw;
      if (all(greaterThanEqual(v, vec2(0))) && all(lessThanEqual(v, vec2(1)))) {
        float edge = uVideoFeather > 0.5 ? v.y : v.x;       // the same 9% feather as the CSS mask
        c = mix(c, texture(uVideo, v).rgb, clamp(edge / 0.09, 0.0, 1.0) * uVideoMix);
      }
    }
    return c;
  }

  void main() {
    vec2 s = project(vUv);
    vec3 col = baseAt(s);
    float barkA = 0.0;

    // Barkley: one rigid plane at his own depth.
    vec2 sb = uC + (vUv - uC - uCam * uBd) / (1.0 + uDolly * (1.0 - uBd));
    vec2 b = (sb - uCut.xy) / uCut.zw;
    if (all(greaterThanEqual(b, vec2(0))) && all(lessThanEqual(b, vec2(1)))) {
      vec4 bk = texture(uBark, b);
      col = mix(col, bk.rgb, bk.a);
      barkA = bk.a;
    }

    if (uT >= 0.0) {
      vec2 q = vec2(vUv.x * uAspect, vUv.y);
      float n = fbm(q * 5.0), n2 = fbm(q * 23.0 + 7.3);
      float depth = texture(uDepth, s).r;

      // When does pigment reach this pixel? Three blooms on land, then the sky washes up from the horizon.
      // Domain-warped distance: pigment bleeds in lobes and tendrils, faster along the hillside than across it.
      vec2 qw = q + (vec2(fbm(q * 2.7), fbm(q * 2.7 + 5.2)) - 0.5) * 0.42;
      vec2 stretch = vec2(0.8, 1.2);
      float w = (n2 - 0.5) * 0.08;
      float land = min(min(
        0.25 + pow(max(length((qw - vec2(uChest.x * uAspect, uChest.y)) * stretch) + w, 0.0), 1.1) * 0.95,
        0.40 + pow(max(length((qw - vec2(uArch.x * uAspect, uArch.y)) * stretch) + w, 0.0), 1.1) * 0.95),
        0.50 + pow(max(length((qw - vec2(uPoppies.x * uAspect, uPoppies.y)) * stretch) + w, 0.0), 1.1) * 0.95);
      float skyness = 1.0 - smoothstep(0.02, 0.07, depth);
      float sky = 0.80 + max(uHorizon - vUv.y, 0.0) * 0.9 + (n - 0.5) * 0.12;
      float fringe = (fbm(q * 48.0 + 3.1) - 0.5) * 0.09;                  // feathery, cauliflower edge
      float ta = mix(land, sky, skyness) + fringe * (1.0 - skyness * 0.5);
      float front = mix(0.035, 0.12, skyness);

      float cover = smoothstep(ta, ta + front, uT);
      float rim = cover * (1.0 - smoothstep(ta + front, ta + front + 0.07, uT)) * (1.0 - skyness * 0.7);
      float dry = smoothstep(ta, ta + 0.3, uT);

      float grey = dot(col, vec3(0.299, 0.587, 0.114));
      vec3 wet = mix(vec3(grey), col, mix(0.62, 1.0, dry));
      wet *= 1.0 - (1.0 - dry) * 0.08 * (n2 - 0.35);                       // pigment granulation while wet
      wet = mix(wet, mix(vec3(grey), col, 1.35) * 0.8, rim * 0.55);          // darker, richer drying edge

      // Pencil: Barkley first, then strong contours, whole passages at a time (low-frequency order).
      float sk = texture(uSketch, s).r;
      float line = mix(pow(sk, 1.5), min(1.0, sk * 1.5), barkA);
      float order = (1.0 - sk) * 0.5 + n * 0.5 - barkA * 0.45;
      float drawn = smoothstep(order - 0.12, order + 0.02, clamp(uT / 0.45, 0.0, 1.0) * 1.1);
      vec3 paper = vec3(1.0, 0.980, 0.941) * (0.982 + 0.03 * n2);
      vec3 graphite = vec3(0.357, 0.314, 0.275);
      vec3 sheet = mix(paper, graphite, line * 0.8 * drawn);

      float lingering = 1.0 - smoothstep(1.0, 1.8, uT);                      // pencil still shows under fresh paint
      vec3 painted = wet * (1.0 - line * 0.3 * lingering);
      col = mix(sheet, painted, cover);

      float sun = smoothstep(0.9, 1.2, uT) * (1.0 - smoothstep(1.2, 1.6, uT));
      vec2 sq = q - vec2(0.86 * uAspect, 0.04);
      col += vec3(1.0, 0.82, 0.55) * (exp(-dot(sq, sq) * 3.5) * 0.32 + 0.035) * sun;
    }
    outColor = vec4(col, 1.0);
  }`;

  let gl, prog, canvas, U = {}, tex = {}, scene, sceneKey;
  let t0 = 0, arriving = false, done = false, queued = 0, lastDraw = 0, videoMix = 0, videoMixFrom = 0;
  let cam = [0, 0], camTarget = [0, 0], lean = ['0.00', '0.00'];
  const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

  function fail() {
    status.state = 'failed';
    if (canvas) canvas.remove();
    root.classList.remove('gl', 'arrival', 'arriving', 'arrival-fg', 'arrival-sky');
  }

  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader');
    return s;
  }

  function texture(unit, wrap) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 250, 240, 255]));
    return { t, unit };
  }

  function upload(tx, source, mips) {
    gl.activeTexture(gl.TEXTURE0 + tx.unit);
    gl.bindTexture(gl.TEXTURE_2D, tx.t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    if (mips) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
  }

  const loadImage = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(img));
    img.onerror = reject;
    img.src = src;
  });

  async function loadScene() {
    const key = tall.matches ? 'tall' : 'wide';
    const s = SCENES[key];
    const [base, depth, sketch, barkley] = await Promise.all([s.base, s.depth, s.sketch, s.barkley].map(loadImage));
    if (!gl) return;
    upload(tex.base, base, true);
    upload(tex.depth, depth, false);
    upload(tex.sketch, sketch, true);
    upload(tex.bark, barkley, true);
    scene = s; sceneKey = key;
    gl.uniform4fv(U.uVideoRect, s.video);
    gl.uniform1f(U.uVideoFeather, s.videoFeather);
    gl.uniform4fv(U.uCut, s.cut);
    gl.uniform1f(U.uBd, s.barkleyDepth);
    gl.uniform2fv(U.uChest, s.chest);
    gl.uniform2fv(U.uArch, s.arch);
    gl.uniform2fv(U.uPoppies, s.poppies);
    gl.uniform1f(U.uHorizon, s.horizon);
    gl.uniform2fv(U.uC, [0.5, s.horizon]);
  }

  function resize() {
    const w = plate.offsetWidth, h = plate.offsetHeight;
    if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const scale = Math.min(dpr, 2048 / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(U.uAspect, w / h);
    request();
  }

  const paused = () => document.hidden || stage.classList.contains('is-past-vista');

  function request() {
    if (!queued && gl && scene && !paused()) queued = requestAnimationFrame(draw);
  }

  function draw(now) {
    queued = 0;
    if (paused()) return;
    const dt = Math.min(0.1, (now - (lastDraw || now)) / 1000);
    lastDraw = now;
    let T = -1, more = false;

    if (frozen !== null) {
      T = frozen * END;
    } else if (arriving) {
      T = (now - t0) / 1000;
      status.frames++;
      if (T >= FOREGROUND_IN) root.classList.add('arrival-fg');
      if (T >= SKY_IN) root.classList.add('arrival-sky');
      if (T >= END) finish(now); else more = true;
    }

    // Camera: the arrival's dolly and sweep, then the pointer (desktop) or a slow drift (phones).
    let dolly = 0;
    if (T >= 0 && T < END) {
      const settle = ease((T - 0.9) / 0.9);
      dolly = 0.06 * (1 - settle);
      cam = [0.008 * (1 - settle), 0.004 * (1 - settle)];
    } else if (frozen === null) {
      if (!fine) {
        const t = now / 1000;
        camTarget = [0.0035 * Math.sin(t * 2 * Math.PI / 14), 0.002 * Math.sin(t * 2 * Math.PI / 9.8)];
      }
      const k = 1 - Math.exp(-dt * 6);
      cam = [cam[0] + (camTarget[0] - cam[0]) * k, cam[1] + (camTarget[1] - cam[1]) * k];
      if (Math.abs(camTarget[0] - cam[0]) + Math.abs(camTarget[1] - cam[1]) > 0.00005 && fine) more = true;
    }

    if (videoMix < 1 && videoMixFrom) {
      videoMix = Math.min(1, (now - videoMixFrom) / 400);
      if (videoMix < 1) more = true;
    }

    gl.uniform1f(U.uT, T >= END ? -1 : T);
    gl.uniform1f(U.uDolly, dolly);
    gl.uniform2fv(U.uCam, cam);
    // The speech bubble leans with Barkley's plane.
    const bx = (cam[0] * scene.barkleyDepth * plate.offsetWidth).toFixed(2), by = (cam[1] * scene.barkleyDepth * plate.offsetHeight).toFixed(2);
    if (bx !== lean[0] || by !== lean[1]) { plate.style.setProperty('--lean-x', bx + 'px'); plate.style.setProperty('--lean-y', by + 'px'); lean = [bx, by]; }
    gl.uniform1f(U.uVideoMix, videoMix);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    window.__arrivalDraws++;
    if (more) request();
  }

  function finish(now) {
    arriving = false;
    done = true;
    status.state = 'done';
    status.doneAt = now;
    root.classList.remove('arrival', 'arriving', 'arrival-fg', 'arrival-sky');
    root.classList.add('arrived');
  }

  // The looping trailhead video, fed in frame by frame once it's playing.
  function watchVideo() {
    if (!video) return;
    const push = () => {
      if (!gl || video.readyState < 2 || !scene) return;
      upload(tex.video, video, false);
      if (!videoMixFrom) videoMixFrom = performance.now();
      request();
    };
    if ('requestVideoFrameCallback' in video) {
      const onFrame = () => { push(); video.requestVideoFrameCallback(onFrame); };
      video.requestVideoFrameCallback(onFrame);
    } else {
      let timer = 0;
      video.addEventListener('playing', () => { clearInterval(timer); timer = setInterval(() => { if (!video.paused) push(); }, 42); });
      video.addEventListener('pause', () => clearInterval(timer));
    }
    video.addEventListener('seeked', push);
  }

  async function start() {
    canvas = document.createElement('canvas');
    canvas.className = 'depth';
    canvas.setAttribute('aria-hidden', 'true');
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
    if (!gl) return fail();
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; fail(); });

    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    gl.useProgram(prog);
    gl.bindVertexArray(gl.createVertexArray());
    for (const name of ['uBase', 'uVideo', 'uDepth', 'uSketch', 'uBark', 'uVideoRect', 'uCut', 'uVideoMix', 'uVideoFeather',
      'uBd', 'uDolly', 'uT', 'uAspect', 'uHorizon', 'uCam', 'uC', 'uChest', 'uArch', 'uPoppies']) U[name] = gl.getUniformLocation(prog, name);

    const M = gl.MIRRORED_REPEAT, C = gl.CLAMP_TO_EDGE;
    tex = { base: texture(0, M), video: texture(1, C), depth: texture(2, M), sketch: texture(3, M), bark: texture(4, C) };
    gl.uniform1i(U.uBase, 0); gl.uniform1i(U.uVideo, 1); gl.uniform1i(U.uDepth, 2); gl.uniform1i(U.uSketch, 3); gl.uniform1i(U.uBark, 4);
    gl.uniform1f(U.uT, -1);

    const barkley = plate.querySelector('.still-barkley');
    plate.insertBefore(canvas, barkley ? barkley.nextSibling : null);
    new ResizeObserver(resize).observe(plate);

    await loadScene();
    status.readyAt = performance.now();
    resize();

    if (frozen !== null) {
      status.state = 'frozen';
      root.classList.remove('arrival', 'arriving');
      if (frozen < 1) root.classList.add('arrival', 'arriving');
      root.classList.toggle('arrival-fg', frozen * END >= FOREGROUND_IN);
      root.classList.toggle('arrival-sky', frozen * END >= SKY_IN);
      if (frozen >= 1) root.classList.add('arrived');
      canvas.classList.add('is-live', 'is-instant');
    } else if (root.classList.contains('arrival')) {
      // Still bare paper: paint it.
      try { sessionStorage.setItem('barkley-arrived', '1'); } catch (e) {}
      root.classList.add('arriving');
      canvas.classList.add('is-live', 'is-instant');
      arriving = true;
      status.state = 'arriving';
      t0 = status.startedAt = performance.now();
    } else {
      // Returning visitor, or the painting was already shown while we loaded: just add depth.
      status.state = 'done';
      done = true;
      requestAnimationFrame(() => canvas.classList.add('is-live'));
    }

    watchVideo();
    if (fine && frozen === null) {
      addEventListener('pointermove', e => {
        camTarget = [-(e.clientX / innerWidth * 2 - 1) * 0.012, -(e.clientY / innerHeight * 2 - 1) * 0.008];
        if (done) request();
      }, { passive: true });
    }
    tall.addEventListener('change', () => loadScene().then(request).catch(fail));
    document.addEventListener('visibilitychange', request);
    new MutationObserver(request).observe(stage, { attributes: true, attributeFilter: ['class'] });
    request();
  }

  start().catch(fail);
})();
