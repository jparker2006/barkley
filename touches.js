// Small touches on top of the walk: the sky follows the clock in Los Angeles, the page wakes up with a
// short sunrise, "Text Carol where I am" adds a map link, and a tapped photo grows into the album.
(() => {
  'use strict';
  const stage = document.querySelector('.stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- The sky follows the real time on Harper Monkey Trail. Always daytime-bright; no night. ---
  // [hour, top colour, bottom colour] for a soft-light tint over the paintings.
  const LIGHT = [
    [0, 'rgba(70,90,215,.85)', 'rgba(150,120,215,.55)'],   // blue hour
    [5, 'rgba(70,90,215,.85)', 'rgba(150,120,215,.55)'],
    [6.5, 'rgba(255,120,170,.9)', 'rgba(255,170,120,.6)'],  // dawn blush
    [8.5, 'rgba(255,240,210,0)', 'rgba(255,240,210,0)'],    // the painted morning, untouched
    [12.5, 'rgba(170,225,255,.55)', 'rgba(255,255,235,.2)'], // crisp midday
    [16.5, 'rgba(255,170,60,.85)', 'rgba(255,120,40,.6)'],   // golden hour
    [18.8, 'rgba(255,95,125,.95)', 'rgba(255,105,60,.7)'],   // sunset
    [20.5, 'rgba(70,90,215,.85)', 'rgba(150,120,215,.55)'],
    [24, 'rgba(70,90,215,.85)', 'rgba(150,120,215,.55)'],
  ];
  const rgba = c => c.match(/[\d.]+/g).map(Number);
  const mix = (a, b, t) => `rgba(${rgba(a).map((v, i) => i < 3 ? Math.round(v + (rgba(b)[i] - v) * t) : +(v + (rgba(b)[i] - v) * t).toFixed(3)).join(',')})`;

  function laHour() {
    const override = new URLSearchParams(location.search).get('hour'); // ?hour=17 to preview
    if (override !== null && !isNaN(+override)) return (+override % 24 + 24) % 24;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
    const get = type => +parts.find(p => p.type === type).value;
    return get('hour') + get('minute') / 60;
  }

  function paintSky() {
    if (!stage) return;
    const h = laHour();
    let i = 0;
    while (i < LIGHT.length - 2 && LIGHT[i + 1][0] <= h) i++;
    const [h0, top0, bot0] = LIGHT[i], [h1, top1, bot1] = LIGHT[i + 1];
    const t = (h - h0) / (h1 - h0 || 1);
    stage.style.setProperty('--g-top', mix(top0, top1, t));
    stage.style.setProperty('--g-bottom', mix(bot0, bot1, t));
  }
  paintSky();
  setInterval(paintSky, 5 * 60 * 1000);

  // --- Sunrise on arrival: the stage starts at dawn and warms into the current light. ---
  if (stage && !reduced) {
    stage.classList.add('is-waking');
    requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.remove('is-waking')));
  }

  // --- "Text Carol where I am": same text as the plain button, plus a map link if the finder allows it. ---
  const CAROL = 'sms:+13107292115?body=';
  const PLAIN = 'Hi, I found Barkley. Please get in touch.';
  document.querySelectorAll('[data-where]').forEach(button => {
    if (!('geolocation' in navigator)) return; // the plain link still works
    const label = button.querySelector('small');
    const original = label.textContent;
    button.addEventListener('click', event => {
      event.preventDefault();
      if (button.getAttribute('aria-busy') === 'true') return;
      button.setAttribute('aria-busy', 'true');
      label.textContent = 'finding you…';
      let sent = false;
      const send = body => {
        if (sent) return;
        sent = true;
        clearTimeout(timer);
        button.removeAttribute('aria-busy');
        label.textContent = original;
        location.href = CAROL + encodeURIComponent(body);
      };
      const timer = setTimeout(() => send(PLAIN), 9000);
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => send(`Hi, I found Barkley. He’s with me here: https://maps.google.com/?q=${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`),
        () => send(PLAIN),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
    });
  });

  // --- The tapped photo becomes the one the album opens on. ---
  document.querySelectorAll('.prints a').forEach(link => link.addEventListener('click', () => {
    document.querySelectorAll('.prints img').forEach(img => { img.style.viewTransitionName = ''; });
    link.querySelector('img').style.viewTransitionName = 'photo';
  }));
  addEventListener('pageshow', () => document.querySelectorAll('.prints img').forEach(img => { img.style.viewTransitionName = ''; }));
})();
