// Wandstark gate: 4-digit passcode in front of all static assets (run_worker_first).
// Secrets: PASSCODE (4 digits), SESSION_SECRET (random). Durable Object GUARD: exact brute-force lockout
// per IP (5 failures -> 15 min, doubling up to 24 h) and globally (20 failures / hour -> logins locked 1 h).
const COOKIE = 'ws_session', MAX_AGE = 30 * 24 * 3600, BASE = '/wandstark';
const PUBLIC = [/^\/wandstark\/privacy\/?$/, /^\/wandstark\/about\/?$/, /^\/wandstark\/fonts\//];
const enc = new TextEncoder();
async function hmac(env, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET + '|' + env.PASSCODE), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, c => ({ '+': '-', '/': '_', '=': '' }[c]));
}
function safeEqual(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
async function validSession(req, env) {
  const m = (req.headers.get('Cookie') || '').match(/(?:^|;\s*)ws_session=([^;]+)/); if (!m) return false;
  const [exp, sig] = m[1].split('.'); if (!exp || !sig || Date.now() / 1000 > Number(exp)) return false;
  return safeEqual(sig, await hmac(env, exp));
}
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };
function page(msg, status = 200) {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Wandstark – Zugang</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${BASE}/fonts/fonts.css">
<style>:root{--bg:#f2f4f5;--panel:#fff;--fg:#16202a;--muted:#5d6a75;--line:#dbe1e5;--accent:#1d5b86;--bad:#b0342a}
@media (prefers-color-scheme:dark){:root{--bg:#0f151a;--panel:#172027;--fg:#e3e9ed;--muted:#93a0aa;--line:#29343d;--accent:#70b1dd;--bad:#ee8277;color-scheme:dark}}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:15px "IBM Plex Sans",system-ui,sans-serif;padding:16px;box-sizing:border-box}
form{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:28px 24px;width:100%;max-width:340px;box-sizing:border-box;display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:22px} p{margin:0;color:var(--muted);font-size:14px}
input{font:600 28px "IBM Plex Mono",ui-monospace,monospace;letter-spacing:.5em;text-align:center;padding:12px 0 12px .5em;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg)}
input:focus{outline:2px solid var(--accent);outline-offset:2px}
button{font:inherit;font-weight:600;height:46px;border:0;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer}
.err{color:var(--bad);font-weight:500} a{color:var(--muted)}</style></head><body>
<form method="post" action="${BASE}/login"><h1>Wandstark</h1><p>Festigkeitsberechnung für Druckbehälter und Rohrleitungen nach AD 2000, EN 13445, EN 13480 und ASME: eine unabhängige Umsetzung der veröffentlichten Regelwerke, direkt im Browser. <a href="${BASE}/about/">Mehr über Wandstark</a></p><p>Bitte den 4-stelligen Zugangscode eingeben.</p>
<input name="code" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="one-time-code" required autofocus aria-label="Zugangscode">
${msg ? `<p class="err" role="alert">${msg}</p>` : ''}<button type="submit">Öffnen</button>
<p><a href="${BASE}/about/">Über Wandstark</a> · <a href="${BASE}/privacy/">Datenschutz</a> · <a href="/imprint/">Impressum</a></p></form></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...SEC } });
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname;
    if (!env.PASSCODE || !env.SESSION_SECRET) return new Response('Zugang nicht konfiguriert.', { status: 503, headers: SEC });
    if (PUBLIC.some(r => r.test(path))) return env.ASSETS.fetch(req);
    if (path === BASE + '/logout') return new Response(null, { status: 303, headers: { Location: BASE + '/', 'Set-Cookie': `${COOKIE}=; Path=${BASE}; Max-Age=0; HttpOnly; Secure; SameSite=Strict`, ...SEC } });
    if (path === BASE + '/login' && req.method === 'POST') {
      const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
      const guard = env.GUARD.get(env.GUARD.idFromName('global'));
      const pre = await (await guard.fetch('https://g/check?ip=' + encodeURIComponent(ip))).json();
      if (pre.locked) return page(`Zu viele Fehlversuche. Bitte in ${Math.ceil(pre.wait / 60)} Minuten erneut versuchen.`, 429);
      const code = String((await req.formData()).get('code') || '').trim();
      if (!/^\d{4}$/.test(code) || !safeEqual(code, String(env.PASSCODE))) {
        const r = await (await guard.fetch('https://g/fail?ip=' + encodeURIComponent(ip))).json();
        return page(r.locked ? `Zu viele Fehlversuche. Bitte in ${Math.ceil(r.wait / 60)} Minuten erneut versuchen.` : `Code falsch. Noch ${r.left} Versuch${r.left === 1 ? '' : 'e'}.`, r.locked ? 429 : 401);
      }
      await guard.fetch('https://g/ok?ip=' + encodeURIComponent(ip));
      const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
      return new Response(null, { status: 303, headers: { Location: BASE + '/', 'Set-Cookie': `${COOKIE}=${exp}.${await hmac(env, exp)}; Path=${BASE}; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`, ...SEC } });
    }
    if (!(await validSession(req, env))) return page('', 401);
    const res = await env.ASSETS.fetch(req), h = new Headers(res.headers);
    for (const [k, v] of Object.entries(SEC)) if (k !== 'Cache-Control' || /text\/html/.test(h.get('Content-Type') || '')) h.set(k, v);
    h.set('Cache-Control', /text\/html/.test(h.get('Content-Type') || '') ? 'no-store' : 'private, max-age=3600');
    return new Response(res.body, { status: res.status, headers: h });
  }
};

// Exact, strongly consistent attempt counter (single global instance).
export class Guard {
  constructor(state) { this.s = state.storage; }
  async fetch(req) {
    const u = new URL(req.url), ip = u.searchParams.get('ip') || 'unknown', now = Date.now();
    const PER_IP = 5, BASE_LOCK = 15 * 60e3, MAX_LOCK = 24 * 3600e3, G_LIMIT = 20, G_WIN = 3600e3, G_LOCK = 3600e3;
    const rec = (await this.s.get('ip:' + ip)) || { fails: 0, until: 0, strikes: 0 };
    const g = (await this.s.get('global')) || { fails: [], until: 0 };
    g.fails = g.fails.filter(t => now - t < G_WIN);
    const lockedFor = () => Math.max(rec.until - now, g.until - now, 0);
    const json = o => new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } });
    if (u.pathname === '/check') { const w = lockedFor(); return json({ locked: w > 0, wait: Math.ceil(w / 1000) }); }
    if (u.pathname === '/ok') { await this.s.delete('ip:' + ip); return json({ ok: true }); }
    if (u.pathname === '/fail') {
      rec.fails++; g.fails.push(now);
      if (rec.fails >= PER_IP) { rec.strikes++; rec.until = now + Math.min(BASE_LOCK * 2 ** (rec.strikes - 1), MAX_LOCK); rec.fails = 0; }
      if (g.fails.length >= G_LIMIT) { g.until = now + G_LOCK; g.fails = []; }
      await this.s.put('ip:' + ip, rec); await this.s.put('global', g);
      const w = lockedFor(); return json({ locked: w > 0, wait: Math.ceil(w / 1000), left: PER_IP - rec.fails });
    }
    return json({ error: 'unknown' });
  }
}
