// "Ask Barkley": answers questions in Barkley's voice via OpenRouter (DeepSeek V4.1 Flash). How he talks is in
// barkley-prompt.md, what he knows is in barkley-facts.md. Shared by the Vercel Function (api/ask.js) and server.mjs.
import { readFileSync } from 'node:fs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const MODEL = 'deepseek/deepseek-v4.1-flash';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const CAROL = 'Carol at (310) 729-2115';

// The prompt file minus its leading note, with the facts filled in. Everything but the time at the very end stays the
// same between requests, so OpenRouter can cache it.
const PROMPT = read('barkley-prompt.md').replace(/^<!--[\s\S]*?-->\s*/, '').replace('{{facts}}', read('barkley-facts.md').trim());
const clock = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'long', hour: 'numeric', minute: '2-digit' });
const system = () => PROMPT.replace('{{now}}', clock.format(new Date()));

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, max);

// Small in-memory guard. Instances are reused, so this catches bursts; it isn't a hard quota.
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000, max = 30;
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

export async function askBarkley({ question, history, ip }) {
  const q = clean(question, 300);
  if (!q) return { status: 400, body: { error: 'Ask me something.' } };
  if (limited(ip || 'unknown')) {
    return { status: 429, body: { answer: `that's a lot of questions. i'm a dog. please text ${CAROL}.` } };
  }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { status: 503, body: { answer: `my talking brain isn't plugged in yet. please text ${CAROL}.` } };

  const past = (Array.isArray(history) ? history : []).slice(-6)
    .filter(m => m && (m.role === 'user' || m.role === 'assistant'))
    .map(m => ({ role: m.role, content: clean(m.content, 600) }))
    .filter(m => m.content);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://jeff-parker.com/Barkley/',
      'X-Title': 'Ask Barkley',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system() }, ...past, { role: 'user', content: q }],
      max_tokens: 400,
      temperature: 0.6,
      reasoning: { enabled: false },
    }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);

  if (!res || !res.ok) {
    return { status: 502, body: { answer: `i got distracted by a squirrel and lost my train of thought. please text ${CAROL}.` } };
  }
  const data = await res.json().catch(() => null);
  const choice = data?.choices?.[0];
  const answer = clean(choice?.message?.content, 600);
  console.log('ask', JSON.stringify({ finish: choice?.finish_reason, provider: data?.provider, usage: data?.usage, empty: !answer }));
  return { status: 200, body: { answer: answer || `i'm not sure. please text ${CAROL}.` } };
}
