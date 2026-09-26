// POST /api/ask  { question, history }  ->  { answer }
// Called from this site and from jeff-parker.com/Barkley/ (a static Cloudflare site), so CORS is open to those.
import { askBarkley } from './_barkley.js';

const ALLOWED = [
  /^https:\/\/(www\.)?jeff-parker\.com$/,
  /^https:\/\/barkley-[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.pages\.dev$/,
  /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/,
];

function cors(request) {
  const origin = request.headers.get('origin') || '';
  const ok = ALLOWED.some(r => r.test(origin));
  return {
    ...(ok ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export function OPTIONS(request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function POST(request) {
  const headers = { ...cors(request), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const body = await request.json().catch(() => ({}));
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip');
  const { status, body: out } = await askBarkley({ question: body.question, history: body.history, ip });
  return new Response(JSON.stringify(out), { status, headers });
}
