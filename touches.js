// Small touches on top of the walk (the sky itself is sky.js): the page wakes up with a short sunrise, "Text Carol where I am" adds a map link, and a tapped photo grows into the album.
(() => {
  'use strict';
  const stage = document.querySelector('.stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Sunrise on arrival: the stage starts at dawn and warms into the current light. ---
  if (stage && !reduced && !document.documentElement.classList.contains('arrival') && !document.documentElement.classList.contains('is-night')) {
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
