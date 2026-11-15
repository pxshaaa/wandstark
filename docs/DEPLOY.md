# Build and deploy

## Artifact / single page

```bash
python3 build.py        # → index.html (fonts from Google Fonts, PDF libraries from cdnjs)
```

`index.html` is a page fragment made for the claude.ai Artifact runtime (it uses the optional `downloads` capability for saving PDFs). It also opens directly in a browser.

## Self-hosted web app (Cloudflare Worker)

```bash
python3 build.py --standalone web/public/wandstark
cd web
npx wrangler@4 deploy          # needs CLOUDFLARE_API_TOKEN in the environment
```

- `web/wrangler.jsonc` — Worker `wandstark-web`, route `tinyjar.app/wandstark*`, static assets from `web/public`, Durable Object `Guard`. Change the route and zone for your own domain.
- `web/src/worker.js` — access gate. Secrets (never commit them):
  - `PASSCODE` — the 4-digit access code: `printf 1234 | npx wrangler@4 secret put PASSCODE` (changing it invalidates all sessions)
  - `SESSION_SECRET` — random string used to sign session cookies
- Brute-force protection: 5 wrong codes per IP → 15 min lockout (doubling up to 24 h); 20 wrong codes per hour globally → logins locked for 1 h.
- Public without code: `/wandstark/about/`, `/wandstark/privacy/`, `/wandstark/fonts/`.
- Gate tests: `node web/test-guard.mjs`.
- Rollback: remove the route, or `npx wrangler@4 delete`.

`web/public/wandstark/index.html` is generated and therefore not committed. The privacy page (`web/public/wandstark/privacy/`) contains the operator's legal contact details and is also not in the repository; add your own before deploying.

## Before deploying

1. `./run-tests.sh` → 0 failing.
2. Build both targets.
3. Open the built page and check the changed modules (all modules if shared files changed), the PDF preview and the access gate (expect 401 without a code).
