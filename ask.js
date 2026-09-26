// Ask Barkley: a small chat that answers from barkley-facts.md (api/ask.js). Phone numbers and the home address
// in answers become tappable. If anything fails, Barkley points people to Carol instead.
(() => {
  'use strict';
  const card = document.getElementById('ask');
  if (!card) return;
  const chat = card.querySelector('.chat');
  const form = card.querySelector('.ask-form');
  const input = form.querySelector('input');
  const send = form.querySelector('button');
  const chips = card.querySelector('.chips');

  // Same-origin on Vercel and locally; jeff-parker.com is static, so it calls the Vercel endpoint.
  const host = location.hostname;
  const local = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app');
  const ENDPOINT = local ? '/api/ask' : 'https://barkley-one.vercel.app/api/ask';
  const FALLBACK = 'my talking brain is napping. please text Carol at (310) 729-2115.';

  const history = [];
  let busy = false;

  // Turn "(310) 729-2115" into a tel: link and the home address into a map link. Text only; never HTML.
  const LINKS = /(\(\d{3}\)\s?\d{3}-\d{4})|(611 Foothill Road(?:, Beverly Hills(?:, CA)?(?: 90210)?)?)/gi;
  function render(el, text) {
    let last = 0;
    for (const m of text.matchAll(LINKS)) {
      el.append(text.slice(last, m.index));
      const a = document.createElement('a');
      a.textContent = m[0];
      a.href = m[1] ? 'tel:+1' + m[1].replace(/\D/g, '') : 'https://maps.google.com/?q=611+Foothill+Road+Beverly+Hills+CA+90210';
      if (!m[1]) a.rel = 'noopener';
      el.append(a);
      last = m.index + m[0].length;
    }
    el.append(text.slice(last));
  }

  function bubble(who, text) {
    const p = document.createElement('p');
    p.className = 'msg msg-' + who;
    if (text) render(p, text);
    chat.append(p);
    p.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    return p;
  }

  async function ask(question) {
    question = question.trim().slice(0, 300);
    if (!question || busy) return;
    busy = true;
    send.disabled = true;
    input.value = '';
    bubble('you', question);
    const typing = bubble('barkley');
    typing.classList.add('msg-typing');
    typing.setAttribute('aria-label', 'Barkley is typing');
    typing.innerHTML = '<i></i><i></i><i></i>';

    let answer = FALLBACK;
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history: history.slice(-6) }),
        signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined,
      });
      const data = await res.json();
      if (data && data.answer) answer = data.answer;
    } catch (e) {}

    typing.remove();
    bubble('barkley', answer);
    history.push({ role: 'user', content: question }, { role: 'assistant', content: answer });
    busy = false;
    send.disabled = false;
  }

  form.addEventListener('submit', e => { e.preventDefault(); ask(input.value); });
  chips.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || busy) return;
    ask(b.textContent);
    b.remove();
  });
})();
